import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  User, 
  Sparkles, 
  Calendar, 
  Building, 
  Compass, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Zap, 
  Settings, 
  Key, 
  ShieldCheck, 
  RefreshCw, 
  ExternalLink, 
  Trash2, 
  Check, 
  AlertCircle,
  Cpu,
  Brain,
  Eye,
  EyeOff
} from 'lucide-react';

export default function AIChatView({ currentUserId = 3, currentUser }) {
  const [messages, setMessages] = useState([
    {
      sender: 'AI',
      text: `Hello ${currentUser?.fullName ? currentUser.fullName.split(' ')[0] : 'there'}! 👋 I am your **UniDesk AI Campus Concierge**.\n\nI can converse with you about any campus concern, guide you to the exact handling offices and building floors, provide operating schedules, or book appointment slots directly in the university database engine!\n\nHow can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([
    "I lost my student ID card, what should I do?",
    "Where is the Registrar and what are their hours?",
    "How can I request my official transcript of records?",
    "How much does a medical clearance cost?",
    "Can you book an appointment for me?"
  ]);

  // AI Engine State - Dedicated Exclusively to Google Gemini
  const providerPreference = 'GEMINI';
  const activeEngineName = 'Google Gemini (Cloud LLM)';

  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('unidesk_ai_provider', 'GEMINI');
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleClearChat = () => {
    setMessages([
      {
        sender: 'AI',
        text: `Conversation memory reset. Hello again! How can I assist you on campus today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setSuggestions([
      "Lost Student ID Card",
      "Official Transcript Request",
      "Cashier & Tuition Fees",
      "Where is the Clinic?"
    ]);
  };

  const handleSend = async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      sender: 'USER',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      const payload = {
        message: textToSend,
        userId: currentUserId,
        history: newHistory.slice(-8),
        aiProvider: 'GEMINI',
        enginePreference: 'GEMINI'
      };

      const res = await fetch('http://localhost:5000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setMessages(prev => [
          ...prev,
          {
            sender: 'AI',
            text: data.data.reply,
            reasoningContent: data.data.reasoningContent,
            office: data.data.detectedOffice,
            reservation: data.data.reservation,
            engineUsed: data.data.engineUsed,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);

        if (data.data.suggestions && data.data.suggestions.length > 0) {
          setSuggestions(data.data.suggestions);
        }
      } else {
        setMessages(prev => [
          ...prev,
          {
            sender: 'AI',
            text: "I encountered an issue querying the university database routines. Please ask again or select one of the suggestions.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'AI',
          text: `Connection error: ${err.message}. Please verify the server is running on port 5000.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner & AI Engine Controls */}
      <div className="hero-card" style={{ padding: '1.25rem 1.65rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'var(--primary-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 16px var(--primary-glow)'
            }}>
              <Sparkles size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>UniDesk AI Campus Concierge</h3>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.18rem 0.55rem',
                  borderRadius: '20px',
                  background: 'rgba(56, 189, 248, 0.2)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.4)'
                }}>
                  ✨ Google Gemini LLM
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Conversational Reasoning &bull; Multi-Turn Dialogue Memory &bull; 100% Database Grounded on <code>unidesk_db</code>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{
              fontSize: '0.76rem',
              fontWeight: 600,
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.12)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <Sparkles size={14} /> Gemini Active
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleClearChat}
              title="Clear chat history and reset memory"
            >
              <Trash2 size={14} /> Reset Chat
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Context-Aware Suggestion Chips */}
      <div className="chip-group">
        <span className="chip-label">Suggested Queries:</span>
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            className="search-chip"
            onClick={() => handleSend(s)}
            disabled={loading}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Main Chat Box */}
      <div className="chat-window">
        {/* Messages Scroll Area */}
        <div className="chat-messages">
          {messages.map((m, idx) => (
            <div key={idx} className={`chat-bubble ${m.sender.toLowerCase()}`}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.55rem', fontSize: '0.74rem', opacity: 0.85 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  {m.sender === 'AI' ? (
                    <Sparkles size={14} color="#38bdf8" />
                  ) : (
                    <User size={14} />
                  )}
                  <strong>{m.sender === 'AI' ? 'UniDesk Concierge' : (currentUser?.fullName || 'You')}</strong>
                  <span>&bull; {m.timestamp}</span>
                </div>
                {m.engineUsed && (
                  <span style={{ fontSize: '0.66rem', fontFamily: 'var(--font-mono)', opacity: 0.75, color: 'var(--primary-light)' }}>
                    Google Gemini
                  </span>
                )}
              </div>

              {/* Gemini Reasoning / Thinking Content if present */}
              {m.reasoningContent && (
                <details style={{
                  marginBottom: '0.75rem',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  fontSize: '0.8rem',
                  color: '#38bdf8'
                }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Brain size={14} /> Gemini Thinking Process (Chain-of-Thought)
                  </summary>
                  <div style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', color: '#cbd5e1', fontSize: '0.78rem', lineHeight: '1.55', maxHeight: '200px', overflowY: 'auto' }}>
                    {m.reasoningContent}
                  </div>
                </details>
              )}

              {/* Message Content */}
              <div style={{ whiteSpace: 'pre-line', lineHeight: 1.65, fontSize: '0.92rem' }}>
                {m.text}
              </div>

              {/* Office Card inside Chat if detected */}
              {m.office && (
                <div style={{
                  marginTop: '0.95rem',
                  padding: '1rem 1.15rem',
                  borderRadius: '14px',
                  background: 'rgba(8, 12, 20, 0.75)',
                  border: '1px solid var(--border-medium)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary-light)', fontSize: '0.95rem' }}>
                      {m.office.office_name}
                    </span>
                    <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>
                      {m.office.office_code}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    📍 <strong>{m.office.building_name}</strong> ({m.office.room_number}, Floor {m.office.floor_number})
                  </div>

                  <div className="directions-box" style={{ marginTop: '0.65rem', fontSize: '0.8rem' }}>
                    <strong>🧭 Walking Directions:</strong> {m.office.desk_directions}
                  </div>
                </div>
              )}

              {/* Direct Booking Receipt if triggered */}
              {m.reservation && (
                <div style={{
                  marginTop: '0.95rem',
                  padding: '1rem 1.15rem',
                  borderRadius: '14px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.35)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--success-light)', fontWeight: 700, fontSize: '0.92rem' }}>
                    <CheckCircle2 size={16} /> Appointment Automatically Scheduled via Database Stored Procedure!
                  </div>
                  <div style={{ marginTop: '0.45rem', fontSize: '0.84rem', color: '#cbd5e1' }}>
                    Office: <strong>{m.reservation.officeName}</strong> &bull; Date: <strong>{m.reservation.date}</strong> at <strong>{m.reservation.slotTime}</strong>
                  </div>
                  <div style={{ marginTop: '0.3rem', fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    Reservation ID: #{m.reservation.reservationId} &bull; Status: {m.reservation.statusCode}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="chat-bubble ai" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <RefreshCw size={15} className="spinner" color="var(--primary)" />
              <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                UniDesk Gemini AI is querying campus records...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          className="chat-input-bar"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            type="text"
            className="search-input"
            style={{ padding: '0.85rem 1.25rem', fontSize: '0.96rem' }}
            placeholder="Type your question naturally (e.g. 'I lost my student card', 'Where is the registrar?', 'Book an appointment')..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '0 1.5rem' }}
            disabled={loading || !input.trim()}
          >
            <Send size={18} />
          </button>
        </form>
      </div>


    </div>
  );
}
