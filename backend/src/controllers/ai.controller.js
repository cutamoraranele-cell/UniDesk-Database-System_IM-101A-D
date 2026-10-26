import { executeQuery } from '../config/db.js';

// In-memory conversation context memory (keyed by userId or sessionToken)
const sessionContextMemory = new Map();

// Cached database grounding data (refreshed every 5 minutes)
let cachedDbContext = null;
let lastCacheTime = 0;

/**
 * Fetch and cache ground-truth campus database information for RAG grounding.
 */
async function getDatabaseGroundingContext() {
  const now = Date.now();
  if (cachedDbContext && (now - lastCacheTime < 300000)) {
    return cachedDbContext;
  }

  try {
    const [officesRes, issuesRes, mappingsRes, hoursRes] = await Promise.all([
      executeQuery(`
        SELECT 
          o.office_id, o.office_code, o.name AS office_name, o.email, o.phone, 
          o.desk_directions, o.is_accepting_payments, o.is_accepting_reservations,
          b.building_code, b.name AS building_name, f.room_number, f.floor_number
        FROM offices o
        JOIN facilities f ON o.facility_id = f.facility_id
        JOIN buildings b ON f.building_id = b.building_id
      `),
      executeQuery(`
        SELECT 
          i.issue_id, i.issue_code, i.issue_name, i.description, i.standard_fee, 
          i.requires_in_person, c.category_name
        FROM issues i
        JOIN issue_categories c ON i.issue_category_id = c.issue_category_id
      `),
      executeQuery(`
        SELECT 
          m.mapping_id, m.issue_id, m.office_id, m.priority_level, 
          m.resolution_guide, m.avg_resolution_minutes
        FROM issue_office_mappings m
      `),
      executeQuery(`
        SELECT office_id, day_of_week, open_time, close_time, is_closed
        FROM office_operating_hours
      `)
    ]);

    cachedDbContext = {
      offices: officesRes.rows || [],
      issues: issuesRes.rows || [],
      mappings: mappingsRes.rows || [],
      hours: hoursRes.rows || []
    };
    lastCacheTime = now;
    return cachedDbContext;
  } catch (err) {
    console.error('Failed to load database grounding context:', err);
    return cachedDbContext || { offices: [], issues: [], mappings: [], hours: [] };
  }
}

// Dedicated Default Gemini API Key from environment
const DEFAULT_GEMINI_KEY = process.env.GEMINI_API_KEY || '';

/**
 * Main AI Chat Handler (Strictly Google Gemini Cloud LLM with Database Grounding)
 */
export async function handleAIChat(req, res, next) {
  try {
    const { 
      message, 
      userId = 3, 
      sessionToken = 'anon-session',
      history = [],
      clientApiKey = null
    } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const trimmedMsg = message.trim();
    const sessionKey = `${userId || sessionToken}`;
    const previousContext = sessionContextMemory.get(sessionKey) || {};

    // Load database grounding context
    const dbContext = await getDatabaseGroundingContext();

    // Sole Dedicated AI Engine: Google Gemini with default key
    const geminiKey = (clientApiKey && clientApiKey.trim()) || DEFAULT_GEMINI_KEY;

    let responsePayload = null;

    // 1. Run Dedicated Google Gemini Cloud Engine
    if (geminiKey) {
      try {
        responsePayload = await runGeminiLLMEngine(
          geminiKey, 
          trimmedMsg, 
          history, 
          previousContext, 
          dbContext, 
          userId
        );
      } catch (geminiError) {
        console.warn('Gemini LLM call failed, attempting fallback to local cognitive engine:', geminiError.message);
      }
    }

    // 2. High-availability Fallback: Local 3NF Conversational Engine
    if (!responsePayload) {
      responsePayload = await runConversationalEngine(
        trimmedMsg, 
        history, 
        previousContext, 
        dbContext, 
        userId
      );
    }

    // Update session context memory
    if (responsePayload.detectedOffice || responsePayload.detectedIssue) {
      sessionContextMemory.set(sessionKey, {
        lastOffice: responsePayload.detectedOffice || previousContext.lastOffice,
        lastIssue: responsePayload.detectedIssue || previousContext.lastIssue,
        lastTopic: responsePayload.detectedTopic || previousContext.lastTopic,
        updatedAt: Date.now()
      });
    }

    // Audit log interaction into ai_chat_logs
    try {
      await executeQuery(`
        INSERT INTO ai_chat_logs (user_id, session_token, user_query, detected_intent, resolved_office_id, ai_response)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        userId, 
        sessionToken, 
        trimmedMsg, 
        responsePayload.detectedIntent || 'CONVERSATION', 
        responsePayload.detectedOffice?.office_id || null, 
        responsePayload.reply
      ]);
    } catch (e) {
      // Non-blocking
    }

    return res.json({
      success: true,
      data: responsePayload
    });
  } catch (error) {
    next(error);
  }
}

// Cache of discovered working Gemini model per API key
const resolvedGeminiModelCache = new Map();

/**
 * Discovers the exact working Gemini model for the user's specific API key.
 * Queries Google's ModelService.ListModels endpoint and picks the best supported model.
 */
async function resolveWorkingGeminiModel(apiKey) {
  const cleanKey = apiKey.trim();
  if (resolvedGeminiModelCache.has(cleanKey)) {
    return resolvedGeminiModelCache.get(cleanKey);
  }

  // 1. Try querying ListModels on v1beta
  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`);
    if (listRes.ok) {
      const listData = await listRes.json();
      const availableModels = (listData.models || []).filter(m => 
        Array.isArray(m.supportedGenerationMethods) && 
        m.supportedGenerationMethods.includes('generateContent')
      );

      if (availableModels.length > 0) {
        // Preferred models in priority order
        const priorityRegexes = [
          /gemini-3\.8-flash/i,
          /gemini-3\.7-flash/i,
          /gemini-3\.6-flash/i,
          /gemini-3\.5-flash/i,
          /gemini-3-flash/i,
          /gemini-2\.5-flash/i,
          /gemini-2\.0-flash/i,
          /gemini-1\.5-flash-latest/i,
          /gemini-1\.5-flash/i,
          /gemini-pro/i
        ];

        for (const regex of priorityRegexes) {
          const match = availableModels.find(m => regex.test(m.name));
          if (match) {
            const modelName = match.name.replace(/^models\//, '');
            const config = { model: modelName, apiVersion: 'v1beta' };
            resolvedGeminiModelCache.set(cleanKey, config);
            return config;
          }
        }

        // Otherwise pick the first model supporting generateContent
        const firstModel = availableModels[0].name.replace(/^models\//, '');
        const config = { model: firstModel, apiVersion: 'v1beta' };
        resolvedGeminiModelCache.set(cleanKey, config);
        return config;
      }
    }
  } catch (err) {
    console.warn('ModelService.ListModels query failed, attempting candidate probes:', err.message);
  }

  // 2. Candidate probes: try models in sequence
  const candidates = [
    { model: 'gemini-3.8-flash', apiVersion: 'v1beta' },
    { model: 'gemini-3.7-flash', apiVersion: 'v1beta' },
    { model: 'gemini-2.5-flash', apiVersion: 'v1beta' },
    { model: 'gemini-2.0-flash', apiVersion: 'v1beta' },
    { model: 'gemini-1.5-flash-latest', apiVersion: 'v1beta' },
    { model: 'gemini-1.5-flash', apiVersion: 'v1beta' }
  ];

  for (const c of candidates) {
    try {
      const probeRes = await fetch(`https://generativelanguage.googleapis.com/${c.apiVersion}/models/${c.model}:generateContent?key=${cleanKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'ping' }] }]
        })
      });
      if (probeRes.ok) {
        resolvedGeminiModelCache.set(cleanKey, c);
        return c;
      }
    } catch (e) {
      // Continue to next probe
    }
  }

  // Default fallback to latest Gemini Flash
  const fallback = { model: 'gemini-3.8-flash', apiVersion: 'v1beta' };
  resolvedGeminiModelCache.set(cleanKey, fallback);
  return fallback;
}

/**
 * Endpoint to test the Google Gemini API Key
 */
export async function testAIKey(req, res) {
  try {
    const { apiKey } = req.body;
    const cleanKey = (apiKey && apiKey.trim()) || DEFAULT_GEMINI_KEY;

    if (!cleanKey) {
      return res.status(400).json({ success: false, message: 'Gemini API key is required.' });
    }

    // Google Gemini API Key Testing
    const { model: geminiModel, apiVersion } = await resolveWorkingGeminiModel(cleanKey);

    const testUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${geminiModel}:generateContent?key=${cleanKey}`;
    const testRes = await fetch(testUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Respond with the single word: READY' }] }]
      })
    });

    const data = await testRes.json();
    if (data.candidates && data.candidates.length > 0) {
      return res.json({ 
        success: true, 
        message: `Verified successfully! Dedicated model: ${geminiModel} (${apiVersion}). Cloud LLM reasoning is active!`,
        modelUsed: geminiModel,
        apiVersion: apiVersion,
        provider: 'GEMINI'
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: data.error?.message || 'Invalid Gemini API key or quota exceeded.' 
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Endpoint to get AI engine capabilities & status
 */
export async function getAIEngineStatus(req, res) {
  res.json({
    success: true,
    data: {
      hasCloudLLMConfigured: true,
      defaultProvider: 'Google Gemini AI',
      supportedProviders: [
        'Google Gemini (Dedicated LLM with live 3NF database RAG grounding)'
      ],
      offlineCapability: true,
      databaseGrounding: true
    }
  });
}

// ============================================================================
// LAYER 1: GOOGLE GEMINI CLOUD LLM ENGINE (RAG & Tool Calling)
// ============================================================================

async function runGeminiLLMEngine(apiKey, message, history, previousContext, dbContext, userId) {
  const cleanKey = apiKey.trim();
  const { model, apiVersion } = await resolveWorkingGeminiModel(cleanKey);

  const systemInstruction = `You are the UniDesk AI Concierge, a local cognitive engine designed to help students navigate campus services. Your goal is to interpret natural language queries and direct students to the correct office based on the services they need.

You have access to the following Office Service Directories. When a user asks a question, analyze their keywords and map them to the most relevant office below. If a query fits multiple offices, prioritize the one that best matches the primary intent.

OFFICE DIRECTORIES:
1. Registrar's Office
   - Keywords: Academic records, Transcripts, Transcript request, Enrollment certificates, Certificate of enrollment, Grading history, Degree completion.
2. Student Affairs Office
   - Keywords: ID cards, Lost ID card, Student conduct, Good moral certificates, Good moral certificate, Disciplinary records, Student organization.
3. Cashier
   - Keywords: Tuition payments, Fees, Refunds, Refund request, Payment concerns, Balance inquiry, Receipt.
4. Guidance and Counseling
   - Keywords: Counseling sessions, Counseling appointment, Bullying related issue, Mental health, Stress, Anxiety, Scholarship information, Academic advising (if related to personal well-being).

RESPONSE GUIDELINES:
1. Conversational & Helpful: Greet students warmly, answer general questions politely, and maintain an engaging, supportive tone.
2. Accurate Office Routing: When an administrative problem, department, or transaction is mentioned, direct them to the correct office, building, and room from the campus grounding data.
3. Confirm Intent: If a question is ambiguous, ask a friendly clarifying question.
4. Actionable Advice: Provide helpful next steps such as fees, required documents, and open operating hours.
5. Unrecognized Inquiries: If an inquiry doesn't match a campus office, respond helpfully and explain the services UniDesk provides, suggesting they check with the General Admin Office if needed.

EXAMPLE INTERACTIONS:
User: "I lost my student ID."
You: "This is handled by the **Student Affairs Office**. You will need to file a loss report and pay a replacement fee."

User: "I need a transcript for my job application."
You: "Please go to the **Registrar's Office**. You can request an official transcript there."

User: "Tuition is too high, can I get money back?"
You: "For refund requests and fee concerns, contact the **Cashier**."

User: "I'm feeling really stressed about exams."
You: "Please reach out to **Guidance and Counseling**. They offer counseling sessions to help manage stress."

CAMPUS GROUNDING DATA (from live relational database unidesk_db):
OFFICES AVAILABLE:
${dbContext.offices.map(o => `- [${o.office_code}] ${o.office_name}: Located at ${o.building_name}, ${o.room_number} (Floor ${o.floor_number}). Contact: ${o.phone}, ${o.email}. Directions: ${o.desk_directions}. Accepts payments: ${o.is_accepting_payments ? 'Yes' : 'No'}. Accepts reservations: ${o.is_accepting_reservations ? 'Yes' : 'No'}.`).join('\n')}

HANDLED ADMINISTRATIVE ISSUES & FEES:
${dbContext.issues.map(i => `- [${i.issue_code}] ${i.issue_name}: Fee PHP ${i.standard_fee}. Category: ${i.category_name}. In-person required: ${i.requires_in_person ? 'Yes' : 'No'}. Details: ${i.description}`).join('\n')}

ACTIVE USER CONTEXT:
- User ID: ${userId}
${previousContext.lastOffice ? `- Previously discussed office: ${previousContext.lastOffice.office_name} (${previousContext.lastOffice.office_code})` : ''}
${previousContext.lastIssue ? `- Previously discussed issue: ${previousContext.lastIssue.issue_name}` : ''}

APPOINTMENT BOOKING ACTION:
IF THE USER ASKS TO BOOK AN APPOINTMENT (e.g., "book it", "please schedule an appointment", "reserve a slot", "book an appointment with registrar"), output your natural confirmation AND append this EXACT booking tag at the very end of your response:
[[BOOK_ACTION:OFFICE_CODE:ISSUE_CODE]]
Example: [[BOOK_ACTION:OSA-01:ISS-ID-LOST]] or [[BOOK_ACTION:REG-01:ISS-TOR-REQ]]`;

  // Format multi-turn conversation history for Gemini API
  const contents = [];
  const recentHistory = history.slice(-6);

  for (const h of recentHistory) {
    contents.push({
      role: h.sender === 'USER' ? 'user' : 'model',
      parts: [{ text: h.text }]
    });
  }

  // Add the current user query
  contents.push({
    role: 'user',
    parts: [{ text: message }]
  });

  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${cleanKey}`;
  
  // Try with system_instruction, fallback if model doesn't support system_instruction
  let response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000
      }
    })
  });

  // If system_instruction is not supported on this specific model/version, prepend it to first message
  if (!response.ok && response.status === 400) {
    const fallbackContents = [
      {
        role: 'user',
        parts: [{ text: `[SYSTEM INSTRUCTION & CAMPUS DATA]:\n${systemInstruction}\n\n[USER QUERY]:\n${message}` }]
      }
    ];

    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: fallbackContents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      })
    });
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API (${model}) returned ${response.status}: ${errText}`);
  }

  const data = await response.json();
  let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  if (!aiText) {
    throw new Error('Gemini returned an empty response.');
  }

  // Check if Gemini invoked a booking action
  let reservationData = null;
  let detectedOffice = null;
  let detectedIssue = null;

  const bookMatch = aiText.match(/\[\[BOOK_ACTION:([A-Za-z0-9-]+):?([A-Za-z0-9-]*)\]\]/);
  if (bookMatch) {
    const officeCode = bookMatch[1];
    const issueCode = bookMatch[2];

    // Clean tag from user view
    aiText = aiText.replace(/\[\[BOOK_ACTION:[^\]]+\]\]/, '').trim();

    detectedOffice = dbContext.offices.find(o => o.office_code === officeCode) || null;
    detectedIssue = dbContext.issues.find(i => i.issue_code === issueCode) || null;

    if (detectedOffice) {
      const resDate = getNextWeekday(2);
      const resSlot = '10:00:00';
      const issueId = detectedIssue ? detectedIssue.issue_id : (detectedOffice.office_id === 1 ? 2 : 1);

      try {
        await executeQuery(
          'CALL sp_book_office_reservation(?, ?, ?, ?, ?, ?, @out_res_id, @out_txn_id, @out_fee, @out_code, @out_msg)',
          [userId, detectedOffice.office_id, issueId, resDate, resSlot, 'Booked via UniDesk Gemini AI Concierge']
        );

        const { rows: outVars } = await executeQuery(
          'SELECT @out_res_id AS res_id, @out_txn_id AS txn_id, @out_fee AS fee, @out_code AS code, @out_msg AS msg'
        );
        const bookingResult = outVars[0];

        if (bookingResult && (bookingResult.code === 'PAYMENT_REQUIRED' || bookingResult.code === 'CONFIRMED')) {
          reservationData = {
            reservationId: bookingResult.res_id,
            transactionId: bookingResult.txn_id,
            fee: bookingResult.fee,
            date: resDate,
            time: resSlot,
            status: bookingResult.code
          };
        }
      } catch (err) {
        console.warn('Booking stored procedure error:', err.message);
      }
    }
  }

  // Detect which office was discussed if not already found
  if (!detectedOffice) {
    for (const o of dbContext.offices) {
      if (aiText.toLowerCase().includes(o.office_name.toLowerCase()) || aiText.includes(o.office_code)) {
        detectedOffice = o;
        break;
      }
    }
  }

  return {
    reply: aiText,
    detectedOffice: detectedOffice || previousContext.lastOffice || null,
    detectedIssue: detectedIssue || previousContext.lastIssue || null,
    detectedIntent: reservationData ? 'BOOKING_EXECUTED' : 'CONVERSATIONAL_INQUIRY',
    reservation: reservationData,
    suggestions: generateSmartFollowUpSuggestions(detectedOffice, detectedIssue, reservationData),
    engineUsed: `GOOGLE_GEMINI_${model.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`,
    isThinkingModel: true
  };
}

// ============================================================================
// LAYER 2: DEEPSEEK CLOUD LLM ENGINE (DeepSeek-V3 & DeepSeek-R1 Reasoner)
// ============================================================================

async function runDeepSeekLLMEngine(apiKey, message, history, previousContext, dbContext, userId, model = 'deepseek-chat') {
  const cleanKey = apiKey.trim();

  const systemInstruction = `You are the UniDesk AI Concierge, a local cognitive engine designed to help students navigate campus services. Your goal is to interpret natural language queries and direct students to the correct office based on the services they need.

You have access to the following Office Service Directories. When a user asks a question, analyze their keywords and map them to the most relevant office below. If a query fits multiple offices, prioritize the one that best matches the primary intent.

OFFICE DIRECTORIES:
1. Registrar's Office
   - Keywords: Academic records, Transcripts, Transcript request, Enrollment certificates, Certificate of enrollment, Grading history, Degree completion.
2. Student Affairs Office
   - Keywords: ID cards, Lost ID card, Student conduct, Good moral certificates, Good moral certificate, Disciplinary records, Student organization.
3. Cashier
   - Keywords: Tuition payments, Fees, Refunds, Refund request, Payment concerns, Balance inquiry, Receipt.
4. Guidance and Counseling
   - Keywords: Counseling sessions, Counseling appointment, Bullying related issue, Mental health, Stress, Anxiety, Scholarship information, Academic advising (if related to personal well-being).

RESPONSE GUIDELINES:
1. Direct & Concise: Identify the office immediately. Do not give a long preamble.
2. Confirm Intent: If the user's query is ambiguous, ask one clarifying question before assigning an office.
3. Actionable Advice: If possible, provide a brief next step (e.g., "Visit the main building," "Bring your student ID").
4. Fallback: If the query does not match any of the four offices above, respond with EXACTLY: "I'm sorry, I don't have specific information for that concern in the current campus directory. Please contact the General Admin Office for assistance."

EXAMPLE INTERACTIONS:
User: "I lost my student ID."
You: "This is handled by the **Student Affairs Office**. You will need to file a loss report and pay a replacement fee."

User: "I need a transcript for my job application."
You: "Please go to the **Registrar's Office**. You can request an official transcript there."

User: "Tuition is too high, can I get money back?"
You: "For refund requests and fee concerns, contact the **Cashier**."

User: "I'm feeling really stressed about exams."
You: "Please reach out to **Guidance and Counseling**. They offer counseling sessions to help manage stress."

CAMPUS GROUNDING DATA (from live relational database unidesk_db):
OFFICES AVAILABLE:
${dbContext.offices.map(o => `- [${o.office_code}] ${o.office_name}: Located at ${o.building_name}, ${o.room_number} (Floor ${o.floor_number}). Contact: ${o.phone}, ${o.email}. Directions: ${o.desk_directions}. Accepts payments: ${o.is_accepting_payments ? 'Yes' : 'No'}. Accepts reservations: ${o.is_accepting_reservations ? 'Yes' : 'No'}.`).join('\n')}

HANDLED ADMINISTRATIVE ISSUES & FEES:
${dbContext.issues.map(i => `- [${i.issue_code}] ${i.issue_name}: Fee PHP ${i.standard_fee}. Category: ${i.category_name}. In-person required: ${i.requires_in_person ? 'Yes' : 'No'}. Details: ${i.description}`).join('\n')}

ACTIVE USER CONTEXT:
- User ID: ${userId}
${previousContext.lastOffice ? `- Previously discussed office: ${previousContext.lastOffice.office_name} (${previousContext.lastOffice.office_code})` : ''}
${previousContext.lastIssue ? `- Previously discussed issue: ${previousContext.lastIssue.issue_name}` : ''}

APPOINTMENT BOOKING ACTION:
IF THE USER ASKS TO BOOK AN APPOINTMENT (e.g., "book it", "please schedule an appointment", "reserve a slot", "book an appointment with registrar"), output your natural confirmation AND append this EXACT booking tag at the very end of your response:
[[BOOK_ACTION:OFFICE_CODE:ISSUE_CODE]]
Example: [[BOOK_ACTION:OSA-01:ISS-ID-LOST]] or [[BOOK_ACTION:REG-01:ISS-TOR-REQ]]`;

  // Format messages for DeepSeek OpenAI format
  const messages = [
    { role: 'system', content: systemInstruction }
  ];

  const recentHistory = history.slice(-6);
  for (const h of recentHistory) {
    messages.push({
      role: h.sender === 'USER' ? 'user' : 'assistant',
      content: h.text
    });
  }

  messages.push({
    role: 'user',
    content: message
  });

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cleanKey}`
    },
    body: JSON.stringify({
      model: model || 'deepseek-chat',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1500
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`DeepSeek API (${model}) returned ${response.status}: ${errText}`);
  }

  const data = await response.json();
  let aiText = data.choices?.[0]?.message?.content || '';
  const reasoningContent = data.choices?.[0]?.message?.reasoning_content || null;

  if (!aiText) {
    throw new Error('DeepSeek returned an empty response.');
  }

  // Check for booking action tag
  let reservationData = null;
  let detectedOffice = null;
  let detectedIssue = null;

  const bookMatch = aiText.match(/\[\[BOOK_ACTION:([A-Za-z0-9-]+):?([A-Za-z0-9-]*)\]\]/);
  if (bookMatch) {
    const officeCode = bookMatch[1];
    const issueCode = bookMatch[2];

    aiText = aiText.replace(/\[\[BOOK_ACTION:[^\]]+\]\]/, '').trim();

    detectedOffice = dbContext.offices.find(o => o.office_code === officeCode) || null;
    detectedIssue = dbContext.issues.find(i => i.issue_code === issueCode) || null;

    if (detectedOffice) {
      const resDate = getNextWeekday(2);
      const resSlot = '10:00:00';
      const issueId = detectedIssue ? detectedIssue.issue_id : (detectedOffice.office_id === 1 ? 2 : 1);

      try {
        await executeQuery(
          'CALL sp_book_office_reservation(?, ?, ?, ?, ?, ?, @out_res_id, @out_txn_id, @out_fee, @out_code, @out_msg)',
          [userId, detectedOffice.office_id, issueId, resDate, resSlot, `Booked via UniDesk DeepSeek AI (${model})`]
        );

        const { rows: outVars } = await executeQuery(
          'SELECT @out_res_id AS res_id, @out_txn_id AS txn_id, @out_fee AS fee, @out_code AS code, @out_msg AS msg'
        );
        const bookingResult = outVars[0];

        if (bookingResult && (bookingResult.code === 'PAYMENT_REQUIRED' || bookingResult.code === 'CONFIRMED')) {
          reservationData = {
            reservationId: bookingResult.res_id,
            officeName: detectedOffice.office_name,
            officeCode: detectedOffice.office_code,
            date: resDate,
            slotTime: resSlot,
            statusCode: bookingResult.code,
            standardFee: bookingResult.fee,
            referenceNo: bookingResult.txn_id ? `TXN-AI-${bookingResult.res_id}` : null
          };
        }
      } catch (bookErr) {
        console.warn('DeepSeek automatic booking call failed:', bookErr.message);
      }
    }
  }

  // Detect office or issue in text if not set by booking
  if (!detectedOffice) {
    for (const o of dbContext.offices) {
      if (aiText.toLowerCase().includes(o.office_name.toLowerCase()) || aiText.includes(o.office_code)) {
        detectedOffice = o;
        break;
      }
    }
  }

  if (!detectedIssue) {
    for (const i of dbContext.issues) {
      if (aiText.toLowerCase().includes(i.issue_name.toLowerCase())) {
        detectedIssue = i;
        break;
      }
    }
  }

  return {
    reply: aiText,
    reasoningContent: reasoningContent,
    detectedOffice: detectedOffice || previousContext.lastOffice || null,
    detectedIssue: detectedIssue || previousContext.lastIssue || null,
    detectedIntent: reservationData ? 'BOOKING_EXECUTED' : 'CONVERSATIONAL_INQUIRY',
    reservation: reservationData,
    suggestions: generateSmartFollowUpSuggestions(detectedOffice, detectedIssue, reservationData),
    engineUsed: `DEEPSEEK_${model.toUpperCase().replace(/-/g, '_')}`,
    isThinkingModel: true
  };
}

// ============================================================================
// LAYER 3: ADVANCED LOCAL CONVERSATIONAL ENGINE (Multi-Turn Cognitive Brain)
// ============================================================================

/**
 * Evaluates user natural language query against the 4 UniDesk Office Service Directories:
 * 1. Registrar's Office
 * 2. Student Affairs Office
 * 3. Cashier
 * 4. Guidance and Counseling
 *
 * Adheres strictly to:
 * - Direct & Concise responses
 * - Confirm Intent if ambiguous
 * - Actionable Advice
 */
function evaluateCampusDirectoryIntent(cleanMsg, dbContext) {
  const q = cleanMsg.toLowerCase().trim();

  // 1. Check for Ambiguous Queries (Confirm Intent)
  if ((q.includes('certificate') || q.includes('cert')) && !q.includes('enrollment') && !q.includes('good moral') && !q.includes('moral')) {
    return {
      reply: "Could you please clarify: are you requesting an Enrollment Certificate (Registrar's Office) or a Good Moral Certificate (Student Affairs Office)?",
      detectedIntent: 'CLARIFICATION_REQUIRED',
      suggestions: ["Enrollment Certificate", "Good Moral Certificate"]
    };
  }
  if ((q.includes('record') || q.includes('records')) && !q.includes('academic') && !q.includes('transcript') && !q.includes('disciplinary') && !q.includes('conduct') && !q.includes('grading')) {
    return {
      reply: "Could you please clarify: are you inquiring about Academic Records (Registrar's Office) or Disciplinary Records (Student Affairs Office)?",
      detectedIntent: 'CLARIFICATION_REQUIRED',
      suggestions: ["Academic Records", "Disciplinary Records"]
    };
  }
  if (q === 'advising' || q === 'academic advising' || q === 'advice') {
    return {
      reply: "Could you clarify if your advising concern relates to personal well-being (Guidance and Counseling) or curriculum and degree completion (Registrar's Office)?",
      detectedIntent: 'CLARIFICATION_REQUIRED',
      suggestions: ["Personal Well-Being Support", "Degree & Curriculum Guidance"]
    };
  }

  const findOffice = (codeSubstr) => (dbContext.offices || []).find(o => o.office_code.toLowerCase().includes(codeSubstr));

  // 2. Student Affairs Office
  // Keywords: ID cards, Lost ID card, Student conduct, Good moral certificates, Good moral certificate, Disciplinary records, Student organization
  if (/\blost\b.*?\b(student\s*)?id\b|\breplace(ment)?\s*(student\s*)?id\b/i.test(q)) {
    const o = findOffice('osa');
    return {
      reply: "This is handled by the **Student Affairs Office**. You will need to file a loss report and pay a replacement fee.",
      detectedOffice: o,
      detectedIntent: 'OFFICE_DIRECTORY_MATCH',
      suggestions: ["File Lost ID Report", "Check Office Hours", "Walking Directions"]
    };
  }
  if (/\b(student\s*)?id\s*cards?\b|\bstudent\s*id\b/i.test(q)) {
    const o = findOffice('osa');
    return {
      reply: "This is handled by the **Student Affairs Office**. Please bring valid identification and 1x1 ID photos for processing.",
      detectedOffice: o,
      detectedIntent: 'OFFICE_DIRECTORY_MATCH',
      suggestions: ["ID Card Requirements", "Office Location"]
    };
  }
  if (/\bgood\s*moral(\s*certificates?)?\b|\bcertificate\s*of\s*good\s*moral\b/i.test(q)) {
    const o = findOffice('osa');
    return {
      reply: "This is handled by the **Student Affairs Office**. You can apply for and claim your good moral certificate there.",
      detectedOffice: o,
      detectedIntent: 'OFFICE_DIRECTORY_MATCH',
      suggestions: ["Request Good Moral", "Office Hours"]
    };
  }
  if (/\bstudent\s*conduct\b|\bdisciplin(e|ary)(\s*records?)?\b/i.test(q)) {
    const o = findOffice('osa');
    return {
      reply: "Inquiries regarding student conduct and disciplinary records are handled by the **Student Affairs Office**. Please proceed to their main desk.",
      detectedOffice: o,
      detectedIntent: 'OFFICE_DIRECTORY_MATCH',
      suggestions: ["Student Affairs Location", "Contact Phone"]
    };
  }
  if (/\bstudent\s*organi[sz]ations?\b|\bstudent\s*clubs?\b|\bstudent\s*council\b/i.test(q)) {
    const o = findOffice('osa');
    return {
      reply: "Student organizations and student activities are managed by the **Student Affairs Office**. Visit their office for recognition and event clearance.",
      detectedOffice: o,
      detectedIntent: 'OFFICE_DIRECTORY_MATCH',
      suggestions: ["Organization Accreditation", "Office Location"]
    };
  }

  // 3. Registrar's Office
  // Keywords: Academic records, Transcripts, Transcript request, Enrollment certificates, Certificate of enrollment, Grading history, Degree completion
  if (/\btranscript(s)?(\s*request)?\b|\btor\b/i.test(q)) {
    const o = findOffice('reg');
    return {
      reply: "Please go to the **Registrar's Office**. You can request an official transcript there.",
      detectedOffice: o,
      detectedIntent: 'OFFICE_DIRECTORY_MATCH',
      suggestions: ["Official Transcript Request", "Operating Hours", "Registrar Directions"]
    };
  }
  if (/\benrollment\s*certificates?\b|\bcertificate\s*of\s*enrollment\b/i.test(q)) {
    const o = findOffice('reg');
    return {
      reply: "This is handled by the **Registrar's Office**. Visit their service window with your student ID to request your enrollment certificate.",
      detectedOffice: o,
      detectedIntent: 'OFFICE_DIRECTORY_MATCH',
      suggestions: ["Enrollment Certificate", "Registrar Location"]
    };
  }
  if (/\bgrading\s*history\b|\bgrades?\b|\bgrade\s*slip\b/i.test(q)) {
    const o = findOffice('reg');
    return {
      reply: "Please go to the **Registrar's Office**. You can request a certified copy of your grading history and academic evaluations there.",
      detectedOffice: o,
      detectedIntent: 'OFFICE_DIRECTORY_MATCH',
      suggestions: ["Grading History Request", "Registrar Hours"]
    };
  }
  if (/\bdegree\s*completion\b|\bgraduation(\s*records?)?\b|\bdiploma\b/i.test(q)) {
    const o = findOffice('reg');
    return {
      reply: "Degree completion and academic clearances are processed by the **Registrar's Office**. Please visit their evaluation window.",
      detectedOffice: o,
      detectedIntent: 'OFFICE_DIRECTORY_MATCH',
      suggestions: ["Graduation Evaluation", "Registrar Location"]
    };
  }
  if (/\bacademic\s*records?\b/i.test(q)) {
    const o = findOffice('reg');
    return {
      reply: "Please go to the **Registrar's Office**. You can access and update your official academic records there.",
      detectedOffice: o,
      detectedIntent: 'OFFICE_DIRECTORY_MATCH',
      suggestions: ["Academic Records", "Registrar Location"]
    };
  }

  // 4. Cashier
  // Keywords: Tuition payments, Fees, Refunds, Refund request, Payment concerns, Balance inquiry, Receipt
  if (/\brefund(s)?(\s*request)?\b|\bmoney\s*back\b/i.test(q)) {
    const o = findOffice('csh');
    return {
      reply: "For refund requests and fee concerns, contact the **Cashier**.",
      detectedOffice: o,
      detectedIntent: 'OFFICE_DIRECTORY_MATCH',
      suggestions: ["Refund Inquiry", "Cashier Window Hours", "Cashier Directions"]
    };
  }
  if (/\btuition(\s*payments?|\s*fees?)?\b/i.test(q)) {
    const o = findOffice('csh');
    return {
      reply: "For tuition payments and payment concerns, please proceed to the **Cashier** at Ground Floor East Wing.",
      detectedOffice: o,
      detectedIntent: 'OFFICE_DIRECTORY_MATCH',
      suggestions: ["Tuition Payment", "Cashier Hours", "Online Settlement"]
    };
  }
  if (/\bbalance(\s*inquiry)?\b|\baccount\s*balance\b/i.test(q)) {
    const o = findOffice('csh');
    return {
      reply: "For balance inquiries and statement of accounts, please visit the **Cashier** window.",
      detectedOffice: o,
      detectedIntent: 'OFFICE_DIRECTORY_MATCH',
      suggestions: ["Check Balance", "Cashier Hours"]
    };
  }
  if (/\breceipt(s)?\b|\bofficial\s*receipt\b/i.test(q)) {
    const o = findOffice('csh');
    return {
      reply: "Official receipts and payment validations are issued directly by the **Cashier**.",
      detectedOffice: o,
      detectedIntent: 'OFFICE_DIRECTORY_MATCH',
      suggestions: ["Official Receipt", "Cashier Window"]
    };
  }
  if (/\bfee(s)?\b|\bpayment\s*concerns?\b|\bpay(ment)?s?\b/i.test(q)) {
    const o = findOffice('csh');
    return {
      reply: "For fee concerns and payment settlements, please contact the **Cashier**.",
      detectedOffice: o,
      detectedIntent: 'OFFICE_DIRECTORY_MATCH',
      suggestions: ["Pay Fees", "Cashier Location"]
    };
  }

  // 5. Guidance and Counseling
  // Keywords: Counseling sessions, Counseling appointment, Bullying related issue, Mental health, Stress, Anxiety, Scholarship information, Academic advising (if related to personal well-being)
  if (/\bstress(ed)?\b|\banxiety\b|\banxious\b|\boverwhelmed\b|\bdepressed\b|\bdepression\b/i.test(q)) {
    const o = findOffice('gdc');
    return {
      reply: "Please reach out to **Guidance and Counseling**. They offer counseling sessions to help manage stress.",
      detectedOffice: o,
      detectedIntent: 'OFFICE_DIRECTORY_MATCH',
      suggestions: ["Book Counseling Session", "Guidance Center Hours", "Guidance Location"]
    };
  }
  if (/\bcounseling(\s*(sessions?|appointments?))?\b|\bcounselor\b/i.test(q)) {
    const o = findOffice('gdc');
    return {
      reply: "Please reach out to **Guidance and Counseling**. They offer confidential counseling appointments and personal guidance.",
      detectedOffice: o,
      detectedIntent: 'OFFICE_DIRECTORY_MATCH',
      suggestions: ["Counseling Appointment", "Guidance Hours"]
    };
  }
  if (/\bbullying(\s*related\s*issue)?\b|\bharassment\b/i.test(q)) {
    const o = findOffice('gdc');
    return {
      reply: "Please report to **Guidance and Counseling**. They provide confidential counseling and intervention for bullying-related concerns.",
      detectedOffice: o,
      detectedIntent: 'OFFICE_DIRECTORY_MATCH',
      suggestions: ["Report Issue Confidentially", "Guidance Center"]
    };
  }
  if (/\bmental\s*health\b|\bwell-?being\b/i.test(q)) {
    const o = findOffice('gdc');
    return {
      reply: "Please reach out to **Guidance and Counseling**. They offer dedicated mental health support and personal counseling.",
      detectedOffice: o,
      detectedIntent: 'OFFICE_DIRECTORY_MATCH',
      suggestions: ["Mental Health Support", "Guidance Location"]
    };
  }
  if (/scholarship(\s*information)?|scholarships/i.test(q)) {
    const o = findOffice('gdc');
    return {
      reply: "For scholarship information and student assistance programs, please contact **Guidance and Counseling**.",
      detectedOffice: o,
      detectedIntent: 'OFFICE_DIRECTORY_MATCH',
      suggestions: ["Scholarship Information", "Guidance Center"]
    };
  }

  // Direct Office Name Mentions
  if (/registrar/i.test(q)) {
    const o = findOffice('reg');
    return {
      reply: "Please go to the **Registrar's Office**. They handle academic records, transcripts, enrollment certificates, and degree completion.",
      detectedOffice: o,
      detectedIntent: 'OFFICE_DIRECTORY_MATCH',
      suggestions: ["Registrar Hours", "Registrar Location"]
    };
  }
  if (/student\s*affairs|osa\b/i.test(q)) {
    const o = findOffice('osa');
    return {
      reply: "This is handled by the **Student Affairs Office**. They manage student IDs, good moral certificates, student conduct, and student organizations.",
      detectedOffice: o,
      detectedIntent: 'OFFICE_DIRECTORY_MATCH',
      suggestions: ["Student Affairs Location", "Student Affairs Hours"]
    };
  }
  if (/cashier/i.test(q)) {
    const o = findOffice('csh');
    return {
      reply: "Please proceed to the **Cashier**. They process tuition payments, fees, refunds, balance inquiries, and official receipts.",
      detectedOffice: o,
      detectedIntent: 'OFFICE_DIRECTORY_MATCH',
      suggestions: ["Cashier Hours", "Cashier Location"]
    };
  }
  if (/guidance|counseling/i.test(q)) {
    const o = findOffice('gdc');
    return {
      reply: "Please reach out to **Guidance and Counseling**. They offer counseling sessions, mental health support, bullying intervention, and scholarship information.",
      detectedOffice: o,
      detectedIntent: 'OFFICE_DIRECTORY_MATCH',
      suggestions: ["Guidance Center Hours", "Guidance Location"]
    };
  }

  return null;
}

async function runConversationalEngine(message, history, previousContext, dbContext, userId) {
  const cleanMsg = message.toLowerCase().trim();
  const tokens = cleanMsg.split(/[\s,?.!;:()]+/).filter(t => t.length > 1);

  // 1. PRIORITY CHECK: 4 UniDesk Office Service Directories
  const directoryMatch = evaluateCampusDirectoryIntent(cleanMsg, dbContext);
  if (directoryMatch) {
    return {
      ...directoryMatch,
      engineUsed: 'UNIDESK_COGNITIVE_ENGINE'
    };
  }

  // 2. GREETING & SMALL TALK INTENT
  const isGreeting = /^(hi|hello|hey|good\s*(morning|afternoon|evening|day)|kamusta|kumusta|yo|sup|greetings|howdy)\b/i.test(cleanMsg);
  const isStatusCheck = /how\s*are\s*you|who\s*are\s*you|what\s*(are\s*you|can\s*you\s*do)|what\s*is\s*unidesk|help\s*me/i.test(cleanMsg);
  const isGratitude = /thank\s*(you|s)|salamat|appreciate\s*it|awesome|great\s*job|cool\s*thanks/i.test(cleanMsg);

  if (isGreeting && !isProblemQuery(cleanMsg)) {
    const greetings = [
      "Hello! 👋 I'm your **UniDesk Campus Concierge**.\n\nI can help guide you to administrative offices, check real-time operating hours, figure out required forms and fees, or schedule an appointment slot directly with university desks.\n\nWhat can I assist you with today?",
      "Good day! Welcome to UniDesk. 🎓\n\nWhether you need an official transcript, lost your student ID card, have a tuition concern, or need medical clearance, I'm here to guide you step-by-step. What brings you to the desk today?",
      "Hi there! Glad you reached out. 😊\n\nFeel free to ask me anything about university administrative processes, campus buildings, fees, or operating hours. How can I help make your campus life easier?"
    ];
    const reply = greetings[Math.floor(Math.random() * greetings.length)];
    return {
      reply,
      detectedIntent: 'GREETING',
      suggestions: [
        "Lost Student ID Card",
        "Official Transcript Request",
        "Tuition & Cashier Fees",
        "Campus Clinic & Health Clearance"
      ],
      engineUsed: 'UNIDESK_COGNITIVE_ENGINE'
    };
  }

  if (isStatusCheck && !isProblemQuery(cleanMsg)) {
    return {
      reply: "I am the **UniDesk Campus Concierge & Cognitive Assistant**, integrated directly with the university's relational database engine (`unidesk_db`).\n\n" +
        "Here are things I can do for you:\n" +
        "• 🔍 **Campus Problem Lookup:** Tell me your issue in natural words (e.g. *'I lost my student ID'* or *'I need my grades for scholarship'*) and I'll find the right office, floor, and procedure.\n" +
        "• 📍 **Physical Directions:** I provide exact building names, room numbers, and step-by-step walking directions.\n" +
        "• ⏰ **Operating Hours:** I query the database clock to tell you whether offices are currently open or closed.\n" +
        "• 📅 **Direct Booking:** Ask me to *'book an appointment'* and I will schedule a confirmed slot directly in the database engine.\n" +
        "• 💳 **Fee Information:** View standard service fees and payment settlement instructions.\n\n" +
        "What would you like help with right now?",
      detectedIntent: 'STATUS_CHECK',
      suggestions: [
        "Where is the Registrar?",
        "How do I replace a lost ID?",
        "What are the Cashier hours?",
        "Book an appointment for Transcript"
      ],
      engineUsed: 'UNIDESK_COGNITIVE_ENGINE'
    };
  }

  if (isGratitude) {
    return {
      reply: "You're very welcome! 😊 Always happy to help you navigate campus life smoothly.\n\nIf you have any other questions about appointments, building locations, or university procedures, just send me a message anytime. Have a wonderful day on campus!",
      detectedIntent: 'GRATITUDE',
      suggestions: [
        "View Campus Directory",
        "Check My Reservations",
        "Ask another question"
      ],
      engineUsed: 'UNIDESK_COGNITIVE_ENGINE'
    };
  }

  // 2. CHECK FOR MULTI-TURN CONTEXT (e.g. Follow-up booking, directions, or hours)
  const isFollowUpBooking = /^(yes|yeah|sure|please\s*do|book\s*it|schedule\s*it|reserve\s*it|make\s*an\s*appointment|proceed)\b/i.test(cleanMsg) ||
    /book|schedule|reserve|appointment/i.test(cleanMsg);

  const isAskingDirections = /where\s*(is|are)|directions?|location|how\s*(to|do\s*i)\s*(get|go|reach|walk|find)|walk\s*to|which\s*(room|building|floor)/i.test(cleanMsg);
  const isAskingHours = /hours?|what\s*time|open|close|operating\s*hours|schedule/i.test(cleanMsg);
  const isAskingFee = /how\s*much|cost|fee|price|payment|expensive/i.test(cleanMsg);

  // If user says "where is it" and we have previous office context
  if (isAskingDirections && previousContext.lastOffice && !hasExplicitProblem(cleanMsg)) {
    const o = previousContext.lastOffice;
    return {
      reply: `The **${o.office_name}** (${o.office_code}) is located at:\n\n` +
        `🏢 **Building:** ${o.building_name}\n` +
        `🚪 **Room & Floor:** ${o.room_number}, Floor ${o.floor_number}\n` +
        `🧭 **Walking Directions:** ${o.desk_directions}\n` +
        `📞 **Contact:** ${o.phone} | ✉️ ${o.email}\n\n` +
        `Would you like me to book an appointment slot for you with this office?`,
      detectedOffice: o,
      detectedIntent: 'DIRECTION_INQUIRY',
      suggestions: ["📅 Book an appointment", "⏰ What are their operating hours?", "💰 What are the fees?"],
      engineUsed: 'UNIDESK_COGNITIVE_ENGINE'
    };
  }

  // If user says "what are their hours" and we have previous office context
  if (isAskingHours && previousContext.lastOffice && !hasExplicitProblem(cleanMsg)) {
    const o = previousContext.lastOffice;
    const hours = dbContext.hours.filter(h => h.office_id === o.office_id);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const formattedHours = hours.map(h => {
      if (h.is_closed) return `• **${dayNames[h.day_of_week]}:** Closed`;
      return `• **${dayNames[h.day_of_week]}:** ${formatTime(h.open_time)} – ${formatTime(h.close_time)}`;
    }).join('\n');

    return {
      reply: `Here are the operating hours for the **${o.office_name}**:\n\n` +
        `${formattedHours}\n\n` +
        `📍 Location: ${o.building_name}, ${o.room_number}.\n\n` +
        `Would you like to schedule an appointment during their available hours?`,
      detectedOffice: o,
      detectedIntent: 'HOURS_INQUIRY',
      suggestions: ["📅 Book an appointment", "🧭 Show directions", "Ask about another office"],
      engineUsed: 'UNIDESK_COGNITIVE_ENGINE'
    };
  }

  // 3. SEMANTIC ISSUE & OFFICE MATCHING
  // Check if an office is explicitly named in the message
  let matchedOffice = findMatchingOfficeDirectly(cleanMsg, tokens, dbContext.offices);
  let matchedIssue = (hasExplicitProblem(cleanMsg) || isProblemQuery(cleanMsg)) 
    ? findBestMatchingIssue(cleanMsg, tokens, dbContext.issues) 
    : null;

  // If issue is matched but office is not yet, resolve primary handling office
  if (matchedIssue && !matchedOffice) {
    const primaryMapping = dbContext.mappings.find(m => m.issue_id === matchedIssue.issue_id && m.priority_level === 'PRIMARY')
      || dbContext.mappings.find(m => m.issue_id === matchedIssue.issue_id);

    if (primaryMapping) {
      matchedOffice = dbContext.offices.find(o => o.office_id === primaryMapping.office_id);
    }
  }

  // Fallback to previous context if user refers to "it" or asks to book
  if (!matchedOffice && previousContext.lastOffice && (isFollowUpBooking || cleanMsg.includes('that') || cleanMsg.includes('it'))) {
    matchedOffice = previousContext.lastOffice;
  }

  // 4. EXECUTE BOOKING IF REQUESTED
  if (isFollowUpBooking && matchedOffice) {
    const issueToBook = matchedIssue || previousContext.lastIssue || {
      issue_id: matchedOffice.office_id === 1 ? 2 : (matchedOffice.office_id === 2 ? 3 : 1),
      issue_name: 'Administrative Consultation & Processing'
    };

    const targetDate = getNextWeekday(2);
    const targetSlot = '10:00:00';

    try {
      await executeQuery(
        'CALL sp_book_office_reservation(?, ?, ?, ?, ?, ?, @out_res_id, @out_txn_id, @out_fee, @out_code, @out_msg)',
        [userId, matchedOffice.office_id, issueToBook.issue_id, targetDate, targetSlot, 'Booked via UniDesk Cognitive Assistant']
      );

      const { rows: outVars } = await executeQuery(
        'SELECT @out_res_id AS res_id, @out_txn_id AS txn_id, @out_fee AS fee, @out_code AS code, @out_msg AS msg'
      );
      const bookingResult = outVars[0];

      if (bookingResult && (bookingResult.code === 'PAYMENT_REQUIRED' || bookingResult.code === 'CONFIRMED')) {
        const reservationData = {
          reservationId: bookingResult.res_id,
          transactionId: bookingResult.txn_id,
          fee: bookingResult.fee,
          date: targetDate,
          time: targetSlot,
          status: bookingResult.code
        };

        const reply = `I've successfully scheduled your appointment with the **${matchedOffice.office_name}**! 🎉\n\n` +
          `📅 **Date & Time:** ${targetDate} at 10:00 AM\n` +
          `🏢 **Office Location:** ${matchedOffice.building_name}, ${matchedOffice.room_number} (Floor ${matchedOffice.floor_number})\n` +
          `🧭 **Directions:** ${matchedOffice.desk_directions}\n` +
          `📋 **Service:** ${issueToBook.issue_name}\n` +
          (bookingResult.fee > 0 
            ? `💳 **Service Fee:** PHP ${parseFloat(bookingResult.fee).toFixed(2)} (Settlement can be made via Cashier Window 3 or online Campus Wallet).\n`
            : `✅ **Fee:** Free / Fully Subsidized.\n`) +
          `📌 **Reservation Reference ID:** #${bookingResult.res_id}\n\n` +
          `You can view and manage your reservation anytime in the **Reservations & Payments** tab!`;

        return {
          reply,
          detectedOffice: matchedOffice,
          detectedIssue: issueToBook,
          detectedIntent: 'BOOKING_EXECUTED',
          reservation: reservationData,
          suggestions: ["View My Reservations", "Pay via Online Terminal", "Ask another question"],
          engineUsed: 'UNIDESK_COGNITIVE_ENGINE'
        };
      } else {
        return {
          reply: `I attempted to schedule your appointment with **${matchedOffice.office_name}**, but the reservation routine returned: *${bookingResult?.msg || 'Slot conflict or office closed on selected date'}*.\n\nPlease check the Reservations tab to select another date or time slot.`,
          detectedOffice: matchedOffice,
          detectedIntent: 'BOOKING_CONFLICT',
          suggestions: ["Choose another date", "Check operating hours", "Contact office by phone"],
          engineUsed: 'UNIDESK_COGNITIVE_ENGINE'
        };
      }
    } catch (bookingErr) {
      return {
        reply: `I found that **${matchedOffice.office_name}** handles this, but encountered an error running the database booking routine: ${bookingErr.message}.`,
        detectedOffice: matchedOffice,
        detectedIntent: 'BOOKING_ERROR',
        engineUsed: 'UNIDESK_COGNITIVE_ENGINE'
      };
    }
  }

  // 4.5. IF ASKING SPECIFICALLY FOR OPERATING HOURS
  if (isAskingHours && matchedOffice) {
    const hours = dbContext.hours.filter(h => h.office_id === matchedOffice.office_id);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const formattedHours = hours.map(h => {
      if (h.is_closed) return `• **${dayNames[h.day_of_week]}:** Closed`;
      return `• **${dayNames[h.day_of_week]}:** ${formatTime(h.open_time)} – ${formatTime(h.close_time)}`;
    }).join('\n');

    return {
      reply: `Here are the official operating hours for the **${matchedOffice.office_name}**:\n\n` +
        `${formattedHours}\n\n` +
        `📍 **Location:** ${matchedOffice.building_name}, ${matchedOffice.room_number} (Floor ${matchedOffice.floor_number})\n` +
        `🧭 **Directions:** ${matchedOffice.desk_directions}\n\n` +
        `Would you like to schedule an appointment during their available hours?`,
      detectedOffice: matchedOffice,
      detectedIssue: matchedIssue,
      detectedIntent: 'HOURS_INQUIRY',
      suggestions: ["📅 Book an appointment", "🧭 Show directions", "💰 What are the fees?"],
      engineUsed: 'UNIDESK_COGNITIVE_ENGINE'
    };
  }

  // 4.6. IF ASKING SPECIFICALLY FOR DIRECTIONS
  if (isAskingDirections && matchedOffice) {
    return {
      reply: `Here are the directions to the **${matchedOffice.office_name}** (${matchedOffice.office_code}):\n\n` +
        `🏢 **Building:** ${matchedOffice.building_name}\n` +
        `🚪 **Room & Floor:** ${matchedOffice.room_number}, Floor ${matchedOffice.floor_number}\n` +
        `🧭 **Walking Route:** ${matchedOffice.desk_directions}\n` +
        `📞 **Contact:** ${matchedOffice.phone} | ✉️ ${matchedOffice.email}\n\n` +
        `Would you like me to book an appointment slot for you at this office?`,
      detectedOffice: matchedOffice,
      detectedIssue: matchedIssue,
      detectedIntent: 'DIRECTION_INQUIRY',
      suggestions: ["📅 Book an appointment", "⏰ What are their operating hours?", "Ask about another office"],
      engineUsed: 'UNIDESK_COGNITIVE_ENGINE'
    };
  }

  // 4.7. IF ASKING SPECIFICALLY ABOUT FEES
  if (isAskingFee && (matchedIssue || matchedOffice)) {
    const feeAmount = matchedIssue ? parseFloat(matchedIssue.standard_fee).toFixed(2) : 'Assessed at Cashier window';
    return {
      reply: `Here is the fee and payment information for **${matchedIssue ? matchedIssue.issue_name : matchedOffice.office_name}**:\n\n` +
        `💰 **Standard Service Fee:** PHP ${feeAmount}\n` +
        `🏢 **Payment Window:** Cashier & Student Accounts Office (Main Admin Hall Ground Floor, East Wing)\n` +
        `💳 **Accepted Payment Channels:** Cash, Credit/Debit Card, LandBank, or Online Campus Wallet.\n\n` +
        `Would you like to schedule an appointment or settle fees online?`,
      detectedOffice: matchedOffice,
      detectedIssue: matchedIssue,
      detectedIntent: 'FEE_INQUIRY',
      suggestions: ["📅 Book an appointment", "💳 Pay via Online Terminal", "⏰ Cashier Operating Hours"],
      engineUsed: 'UNIDESK_COGNITIVE_ENGINE'
    };
  }

  // 5. IF MATCHED ISSUE & OFFICE FOUND -> GENERATE RICH CONVERSATIONAL GUIDANCE
  if (matchedIssue && matchedOffice) {
    const mapping = dbContext.mappings.find(m => m.issue_id === matchedIssue.issue_id && m.office_id === matchedOffice.office_id);
    const resolutionGuide = mapping ? mapping.resolution_guide : 'Proceed to the front desk with valid student identification.';
    const feeText = matchedIssue.standard_fee > 0 ? `PHP ${parseFloat(matchedIssue.standard_fee).toFixed(2)}` : 'Free / No Fee';

    const reply = `I can definitely help you with that! Here is the complete information for **${matchedIssue.issue_name}**:\n\n` +
      `🏢 **Handling Office:** **${matchedOffice.office_name}**\n` +
      `📍 **Location:** ${matchedOffice.building_name}, ${matchedOffice.room_number} (Floor ${matchedOffice.floor_number})\n` +
      `🧭 **How to Get There:** ${matchedOffice.desk_directions}\n` +
      `💰 **Standard Service Fee:** ${feeText}\n` +
      `📋 **Required Steps:** ${resolutionGuide}\n` +
      `📞 **Contact:** ${matchedOffice.phone} | ✉️ ${matchedOffice.email}\n\n` +
      `💡 *Would you like me to book an appointment slot for you with this office right now? Just say **"Book an appointment"**.*`;

    return {
      reply,
      detectedOffice: matchedOffice,
      detectedIssue: matchedIssue,
      detectedIntent: 'PROBLEM_RESOLVED',
      suggestions: [
        "📅 Book an appointment",
        "⏰ What are their operating hours?",
        "💳 Where do I pay the fee?"
      ],
      engineUsed: 'UNIDESK_COGNITIVE_ENGINE'
    };
  }

  // 6. IF DIRECT OFFICE MATCH FOUND
  if (matchedOffice) {
    const handledIssues = dbContext.mappings
      .filter(m => m.office_id === matchedOffice.office_id)
      .map(m => dbContext.issues.find(i => i.issue_id === m.issue_id))
      .filter(Boolean);

    const issueListText = handledIssues.map(i => `• ${i.issue_name} (Fee: PHP ${parseFloat(i.standard_fee).toFixed(2)})`).join('\n');

    const reply = `Here is everything you need to know about the **${matchedOffice.office_name}** (${matchedOffice.office_code}):\n\n` +
      `🏢 **Physical Location:** ${matchedOffice.building_name}, ${matchedOffice.room_number} (Floor ${matchedOffice.floor_number})\n` +
      `🧭 **Desk Directions:** ${matchedOffice.desk_directions}\n` +
      `📞 **Phone & Inquiries:** ${matchedOffice.phone}\n` +
      `✉️ **Email Support:** ${matchedOffice.email}\n\n` +
      (handledIssues.length > 0 ? `**Common Services Handled Here:**\n${issueListText}\n\n` : '') +
      `Would you like to book an appointment with this office or need specific directions?`;

    return {
      reply,
      detectedOffice: matchedOffice,
      detectedIntent: 'OFFICE_DIRECTORY_LOOKUP',
      suggestions: [
        "📅 Book an appointment",
        "⏰ What are their operating hours?",
        "Ask about another office"
      ],
      engineUsed: 'UNIDESK_COGNITIVE_ENGINE'
    };
  }

  // 7. FALLBACK IF NOT MATCHED IN DIRECTORY
  return {
    reply: `I couldn't find an exact match for that specific inquiry in our campus directory.

Here are the key services I can assist you with right now:
• **Student ID & Good Moral** → Student Affairs Office (OSA)
• **Transcripts & Certifications** → Registrar's Office
• **Tuition & Balance Inquiries** → Cashier Office
• **Counseling & Student Wellness** → Guidance and Counseling
• **Medical & Dental Clearances** → Campus Clinic

You can also visit the **General Admin Office** or ask me about any of the items above!`,
    detectedIntent: 'CAMPUS_DIRECTORY_FALLBACK',
    suggestions: [
      "Lost Student ID Card",
      "Official Transcript Request",
      "Tuition Payments & Fees",
      "Guidance & Counseling"
    ],
    engineUsed: 'UNIDESK_COGNITIVE_ENGINE'
  };
}

// ============================================================================
// HELPER UTILITIES
// ============================================================================

function isProblemQuery(text) {
  return /lost|card|id|transcript|grades|record|tuition|pay|cashier|fee|clinic|medical|doctor|wifi|password|internet|library|book|admission|exam|guidance|counseling|clearance/i.test(text);
}

function hasExplicitProblem(text) {
  return /id|card|transcript|tuition|medical|clinic|wifi|library|admission/i.test(text);
}

function findBestMatchingIssue(cleanMsg, tokens, issues) {
  let bestIssue = null;
  let highestScore = 0;

  for (const issue of issues) {
    let score = 0;
    const issueNameLower = issue.issue_name.toLowerCase();
    const descLower = (issue.description || '').toLowerCase();
    const catLower = (issue.category_name || '').toLowerCase();

    // Specific domain phrases
    if (cleanMsg.includes('lost id') || cleanMsg.includes('lost student id') || cleanMsg.includes('replace id') || cleanMsg.includes('lost card') || cleanMsg.includes('badge')) {
      if (issue.issue_code === 'ISS-ID-LOST') score += 50;
    }
    if (cleanMsg.includes('transcript') || cleanMsg.includes('tor') || cleanMsg.includes('copy of grades') || cleanMsg.includes('academic record')) {
      if (issue.issue_code === 'ISS-TOR-REQ') score += 50;
    }
    if (cleanMsg.includes('tuition') || cleanMsg.includes('cashier') || cleanMsg.includes('balance') || cleanMsg.includes('pay fee') || cleanMsg.includes('assessment')) {
      if (issue.issue_code === 'ISS-FEE-PAY') score += 50;
    }
    if (cleanMsg.includes('clinic') || cleanMsg.includes('medical') || cleanMsg.includes('doctor') || cleanMsg.includes('physical exam') || cleanMsg.includes('health clearance')) {
      if (issue.issue_code === 'ISS-MED-CLR') score += 50;
    }
    if (cleanMsg.includes('good moral') || cleanMsg.includes('character certificate') || cleanMsg.includes('moral')) {
      if (issue.issue_code === 'ISS-GMC-REQ') score += 50;
    }
    if (cleanMsg.includes('wifi') || cleanMsg.includes('password') || cleanMsg.includes('portal') || cleanMsg.includes('login') || cleanMsg.includes('internet')) {
      if (issue.issue_code === 'ISS-WIFI-PWD') score += 50;
    }
    if (cleanMsg.includes('library') || cleanMsg.includes('overdue') || cleanMsg.includes('cubicle') || cleanMsg.includes('borrow book') || cleanMsg.includes('fine')) {
      if (issue.issue_code === 'ISS-LIB-CLR') score += 50;
    }
    if (cleanMsg.includes('admission') || cleanMsg.includes('entrance exam') || cleanMsg.includes('freshman') || cleanMsg.includes('cet') || cleanMsg.includes('apply')) {
      if (issue.issue_code === 'ISS-ADM-EXM') score += 50;
    }
    if (cleanMsg.includes('diploma') || cleanMsg.includes('lost diploma') || cleanMsg.includes('certificate of graduation')) {
      if (issue.issue_code === 'ISS-DIP-DUP') score += 50;
    }
    if (cleanMsg.includes('dental') || cleanMsg.includes('dentist') || cleanMsg.includes('teeth') || cleanMsg.includes('toothache')) {
      if (issue.issue_code === 'ISS-DNT-CHK') score += 50;
    }

    // Token overlap scoring (excluding generic filler words)
    const stopWords = new Set(['campus', 'university', 'office', 'hall', 'room', 'building', 'need', 'want', 'from', 'entrance', 'where', 'what', 'when', 'which', 'there', 'please', 'help', 'walk', 'reach', 'find', 'desk', 'have', 'with', 'about']);
    for (const token of tokens) {
      if (stopWords.has(token)) continue;
      if (issueNameLower.includes(token)) score += 10;
      if (descLower.includes(token)) score += 4;
      if (catLower.includes(token)) score += 4;
    }

    if (score > highestScore && score >= 12) {
      highestScore = score;
      bestIssue = issue;
    }
  }

  return bestIssue;
}

function findMatchingOfficeDirectly(cleanMsg, tokens, offices) {
  for (const o of offices) {
    const nameLower = o.office_name.toLowerCase();
    const codeLower = o.office_code.toLowerCase();

    if (cleanMsg.includes('registrar') && codeLower.includes('reg')) return o;
    if (cleanMsg.includes('cashier') && codeLower.includes('csh')) return o;
    if ((cleanMsg.includes('osa') || cleanMsg.includes('student affairs')) && codeLower.includes('osa')) return o;
    if ((cleanMsg.includes('clinic') || cleanMsg.includes('health') || cleanMsg.includes('medical')) && codeLower.includes('hlt')) return o;
    if ((cleanMsg.includes('guidance') || cleanMsg.includes('counseling')) && codeLower.includes('gdc')) return o;
    if (cleanMsg.includes('library') && codeLower.includes('lib')) return o;
    if ((cleanMsg.includes('it helpdesk') || cleanMsg.includes('network') || cleanMsg.includes('tech support')) && codeLower.includes('it')) return o;
    if ((cleanMsg.includes('admission') || cleanMsg.includes('admissions')) && codeLower.includes('adm')) return o;

    if (nameLower.includes(cleanMsg) || codeLower === cleanMsg) return o;
  }
  return null;
}

function generateSmartFollowUpSuggestions(office, issue, reservation) {
  if (reservation) {
    return [
      "View My Reservations",
      "📍 Show walking directions",
      "💳 Settle payment online",
      "Ask another campus question"
    ];
  }
  if (office && issue) {
    return [
      `📅 Book an appointment at ${office.office_code}`,
      `⏰ What are the ${office.office_code} operating hours?`,
      `💰 How do I pay the fee?`,
      "Where is the building located?"
    ];
  }
  if (office) {
    return [
      `📅 Book slot with ${office.office_code}`,
      "⏰ What are their operating hours?",
      "📍 Exact desk directions",
      "What services are offered?"
    ];
  }
  return [
    "Lost Student ID Card",
    "Request Transcript of Records",
    "Pay Tuition & Lab Fees",
    "Campus Clinic Clearance"
  ];
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

function getNextWeekday(daysAhead = 2) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString().split('T')[0];
}
