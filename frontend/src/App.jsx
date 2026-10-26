import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, ShieldCheck, KeyRound, Lock } from 'lucide-react';
import CampusMapView from './components/CampusMapView.jsx';

// ============================================================================
// INITIAL MOCK / SEED DATA
// ============================================================================
const INITIAL_OFFICES = [
  { id: 1, n: "Registrar's Office", b: "Bates Building", r: "Ground Floor", h: "Mon–Fri, 8:00 AM–5:00 PM", d: "Academic records, transcripts, diplomas, and enrollment certificates.", phone: "+63 (38) 411-2283 ext. 101", email: "registrar@unidesk.edu", dir: "Bates Building ground floor lobby, Windows 1 to 4." },
  { id: 2, n: "Cashier Office", b: "Bates Building", r: "Ground Floor", h: "Mon–Fri, 8:00 AM–4:30 PM", d: "Tuition assessments, administrative fee settlements, refunds, and official receipts.", phone: "+63 (38) 411-2283 ext. 102", email: "cashier@unidesk.edu", dir: "Bates Building ground floor, treasury payment counters." },
  { id: 3, n: "Student Affairs Office", b: "Activity Center Building", r: "2nd Floor", h: "Mon–Fri, 8:00 AM–5:00 PM", d: "Student identification cards, student conduct, student org accreditation, and good moral certificates.", phone: "+63 (38) 411-2283 ext. 201", email: "osa@unidesk.edu", dir: "Activity Center Building, take the main stairs to the 2nd floor." },
  { id: 4, n: "Guidance & Counseling Room", b: "CAS Building", r: "5th Floor", h: "Mon–Fri, 8:30 AM–5:00 PM", d: "Confidential psychological counseling, peer support, career assessment, and scholarships.", phone: "+63 (38) 411-2283 ext. 501", email: "guidance@unidesk.edu", dir: "CAS Building, take the elevator/stairs to the 5th floor." },
  { id: 5, n: "University Health Clinic", b: "Clinic House", r: "Ground Floor", h: "Mon–Fri, 8:00 AM–5:00 PM", d: "Campus health triage, physician consultations, pharmacy, and medical clearances.", phone: "+63 (38) 411-2283 ext. 103", email: "clinic@unidesk.edu", dir: "Clinic House ground floor entrance." },
  { id: 6, n: "University Library Desk", b: "CAS Building", r: "3rd Floor", h: "Mon–Sat, 7:30 AM–7:00 PM", d: "Book reservations, study cubicles, reference collections, and learning commons.", phone: "+63 (38) 411-2283 ext. 301", email: "library@unidesk.edu", dir: "CAS Building 3rd floor, main circulation desk." },
  { id: 7, n: "Computer Laboratory Desk", b: "Bates Building", r: "Ground Floor", h: "Mon–Fri, 8:00 AM–6:00 PM", d: "High-speed computing access, programming lab slots, and software stations.", phone: "+63 (38) 411-2283 ext. 105", email: "lab@unidesk.edu", dir: "Bates Building ground floor, room 103." },
  { id: 8, n: "Auditorium Events Desk", b: "Friena Building", r: "5th Floor", h: "Mon–Fri, 8:00 AM–5:00 PM", d: "Auditorium bookings, event permits, convocations, and symposium arrangements.", phone: "+63 (38) 411-2283 ext. 505", email: "auditorium@unidesk.edu", dir: "Friena Building 5th floor lobby." }
];

const INITIAL_ISSUES = [
  { k: "Lost ID card", o: 3, c: "ID and records", fee: 100, desc: "Replacement of lost or damaged university identification badge." },
  { k: "Transcript of Records (TOR)", o: 1, c: "Academic Records", fee: 150, desc: "Official copy of academic grades and graduation transcript." },
  { k: "Certificate of enrollment", o: 1, c: "Academic Records", fee: 50, desc: "Official proof of active enrollment for visa, loan, or scholarship." },
  { k: "Good moral certificate", o: 3, c: "Student Welfare", fee: 0, desc: "Character clearance certificate for transfer, board exam, or employment." },
  { k: "Tuition & assessment payment", o: 2, c: "Payments & Fees", fee: 0, desc: "Payment of semester tuition, lab fees, and document requests." },
  { k: "Fee refund request", o: 2, c: "Payments & Fees", fee: 0, desc: "Filing and processing of fee reimbursement or overpayment credit." },
  { k: "Counseling & mental wellness appointment", o: 4, c: "Student Welfare", fee: 0, desc: "Confidential consultation with a licensed guidance counselor." },
  { k: "Medical / Dental Consultation", o: 5, c: "Health & Medical", fee: 0, desc: "Campus physician triage, health checkup, or emergency consultation." },
  { k: "Library Book Loan & Study Cubicle", o: 6, c: "Library Services", fee: 0, desc: "Book circulation checkout, research assistance, and study room reservation." },
  { k: "Computer Lab Workstation Access", o: 7, c: "IT & Computing", fee: 0, desc: "Lab terminal session booking, programming environment, or exam access." },
  { k: "Auditorium Venue Booking", o: 8, c: "Campus Events", fee: 0, desc: "Auditorium reservation for academic symposiums, rehearsals, and ceremonies." }
];

const INITIAL_FACILITIES = [
  { id: 101, n: "University Library", t: "Academic Facilities", b: "CAS Building", r: "3rd Floor", h: "Mon–Sat, 7:30 AM–7:00 PM", d: "Multi-floor learning commons, reference collections, thesis archive, and study cubicles." },
  { id: 102, n: "Computer Laboratory", t: "Academic Facilities", b: "Bates Building", r: "Ground Floor", h: "Mon–Fri, 8:00 AM–6:00 PM", d: "High-speed computing cluster, programming lab stations, and student terminal access." },
  { id: 103, n: "Clinic House", t: "Health & Medical Services", b: "Clinic House", r: "Ground Floor", h: "Mon–Fri, 8:00 AM–5:00 PM", d: "First-aid triage, campus physician, dental station, pharmacy, and medical clearances." },
  { id: 104, n: "Auditorium Room", t: "Recreation & Events", b: "Friena Building", r: "5th Floor", h: "By event schedule", d: "5th floor auditorium theater hall for convocations, symposiums, and cultural performances." }
];

const INITIAL_FORM_TYPES = [
  { id: 1, n: "Transcript of Records", o: 1, d: 5, fee: 150, a: 1, isAppointment: false },
  { id: 2, n: "Certificate of Enrollment", o: 1, d: 3, fee: 50, a: 1, isAppointment: false },
  { id: 3, n: "Good Moral Certificate", o: 2, d: 3, fee: 0, a: 1, isAppointment: false },
  { id: 4, n: "ID Replacement Form", o: 2, d: 2, fee: 100, a: 1, isAppointment: false },
  { id: 99, n: "📅 In-Person Office Appointment & Consultation", o: 1, d: 1, fee: 0, a: 1, isAppointment: true }
];

const INITIAL_REQUESTS = [
  {
    ref: "UD-2026-0001",
    ft: 1,
    by: "Alex Santos",
    userEmail: "alex.santos@student.unidesk.edu",
    officeId: 1,
    p: "Job application document verification",
    c: 2,
    s: "ready",
    date: "2026-10-23",
    slot: "09:15 AM",
    locationOverride: null,
    notes: "Requires official registrar dry seal",
    dl: "2026-10-23",
    isAppointment: false,
    h: [["pending", "2026-10-12"], ["approved", "2026-10-13"], ["ready", "2026-10-16"]]
  },
  {
    ref: "UD-2026-0002",
    ft: 3,
    by: "Alex Santos",
    userEmail: "alex.santos@student.unidesk.edu",
    officeId: 2,
    p: "Scholarship renewal requirement",
    c: 1,
    s: "pending",
    date: "2026-10-24",
    slot: "10:30 AM",
    locationOverride: null,
    notes: "Attached clearance sheet",
    dl: "2026-10-28",
    isAppointment: false,
    h: [["pending", "2026-10-15"]]
  },
  {
    ref: "UD-2026-0003",
    ft: 99,
    by: "Juan Dela Cruz",
    userEmail: "juan.delacruz@student.unidesk.edu",
    officeId: 1,
    p: "In-person consultation on grade correction",
    c: 1,
    s: "confirmed",
    date: "2026-10-25",
    slot: "02:00 PM",
    locationOverride: "Temporary Desk at South Hall 204",
    notes: "Relocated due to AC breakdown in Main Registrar Hall",
    dl: "2026-10-25",
    isAppointment: true,
    h: [["pending", "2026-10-16"], ["confirmed", "2026-10-16"]]
  }
];

const INITIAL_NOTIFICATIONS = [
  { t: "Form ready for pickup", m: "UD-2026-0001 is ready. Pick it up by 2026-10-23.", r: 0, u: "Alex Santos", at: "2026-10-16" },
  { t: "System Activity", m: "Admin monitoring active for campus operational services.", r: 0, u: "System Admin", forAdmin: true, at: "2026-10-16" }
];

const INITIAL_SEARCH_LOGS = { "lost id card": 14, "transcript request": 11, "tuition payment": 8, "scholarship": 3 };

const INITIAL_USERS = [
  { n: "System Admin", e: "admin@unidesk.edu", p: "Password123!", role: "admin", id: "ADM-001", dept: "University IT & Systems", status: "active" },
  { n: "Elena Reyes", e: "staff.registrar@unidesk.edu", p: "Password123!", role: "staff", office: 1, id: "STF-104", dept: "Office of the University Registrar", status: "active" },
  { n: "Alex Santos", e: "alex.santos@student.unidesk.edu", p: "Password123!", role: "student", dept: "College of Science", id: "STD-2024-0891", ph: "+63 917 123 4567", status: "active" },
  { n: "John Visitor", e: "john.visitor@gmail.com", p: "Password123!", role: "visitor", id: "VIS-2026-012", dept: "Prospective Student / Campus Visitor", ph: "+63 918 555 1234", status: "active" }
];

const ROLE_LABELS = { admin: "Admin", staff: "Staff", student: "Student", visitor: "Visitor" };
const ROLE_DESC = { admin: "Full system access & user management", staff: "Office operations & reservations desk", student: "Requests & appointments tracking", visitor: "Campus inquiries & visitor permits" };

const BUILDINGS = [
  { n: "CAS Building", code: "CAS-BLDG", lat: 9.650091, lng: 123.868115, fl: 5 },
  { n: "Bates Building", code: "BATES-BLDG", lat: 9.649228, lng: 123.868618, fl: 3 },
  { n: "Clinic House", code: "CLINIC-BLDG", lat: 9.649672, lng: 123.868158, fl: 1 },
  { n: "Activity Center Building", code: "ACT-BLDG", lat: 9.650162, lng: 123.868730, fl: 3 },
  { n: "Friena Building", code: "FRIENA-BLDG", lat: 9.650655, lng: 123.868176, fl: 5 }
];

const TREES = [
  [60,60],[95,105],[40,160],[70,225],[40,300],[100,335],[60,372],[180,50],[232,82],
  [285,45],[520,50],[572,84],[608,40],[722,205],[762,262],[730,335],[770,405],[702,445],
  [250,470],[300,495],[520,472],[566,500],[630,470],[330,232],[470,295],[360,296],[452,226],[215,150],[590,150]
];

// Helper to get fresh default chat for a user
const getDefaultChatForUser = (userName) => {
  const firstName = userName ? userName.split(' ')[0] : 'there';
  return [
    {
      sender: 'ai',
      text: `Hello ${firstName}! 👋 I am your **UniDesk Campus Concierge**.\n\nI can answer inquiries about campus offices, administrative issues, operating hours, fees, or help schedule your appointment in the database. How can I assist you today?`
    }
  ];
};

// ----------------------------------------------------------------------------
// COMPONENT: Password Input with Modern Show/Hide Visibility Toggle
// ----------------------------------------------------------------------------
function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder = "Enter password",
  required = false,
  minLength,
  defaultValue,
  style = {},
  className = "",
  autoComplete
}) {
  const [show, setShow] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        className={className}
        style={{
          width: '100%',
          paddingRight: '2.5rem',
          boxSizing: 'border-box',
          ...style
        }}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={(e) => {
          e.preventDefault();
          setShow(prev => !prev);
        }}
        style={{
          position: 'absolute',
          right: '0.65rem',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '0.25rem',
          color: 'var(--mu)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.8,
          zIndex: 2,
          transition: 'opacity 0.15s, color 0.15s'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--tx)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.color = 'var(--mu)'; }}
        title={show ? "Hide password" : "Show password"}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

// Simple Error Boundary to protect UI from blanking out
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("UniDesk ErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="card" style={{ maxWidth: '640px', margin: '2rem auto', textAlign: 'center', padding: '2rem' }}>
          <h2>⚠️ Interface View Notice</h2>
          <p className="mu sm2">
            An unexpected error occurred while rendering this interface.
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button className="pr" onClick={() => { this.setState({ hasError: false }); this.props.onReset && this.props.onReset(); }}>
              Return to Campus Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  // Application Data States
  const [offices, setOffices] = useState(() => {
    try { const s = localStorage.getItem("ud_offices"); return s ? JSON.parse(s) : INITIAL_OFFICES; } catch (e) { return INITIAL_OFFICES; }
  });
  const [issues, setIssues] = useState(() => {
    try { const s = localStorage.getItem("ud_issues"); return s ? JSON.parse(s) : INITIAL_ISSUES; } catch (e) { return INITIAL_ISSUES; }
  });
  const [facilities, setFacilities] = useState(() => {
    try { const s = localStorage.getItem("ud_facilities"); return s ? JSON.parse(s) : INITIAL_FACILITIES; } catch (e) { return INITIAL_FACILITIES; }
  });
  const [formTypes, setFormTypes] = useState(() => {
    try { const s = localStorage.getItem("ud_formtypes"); return s ? JSON.parse(s) : INITIAL_FORM_TYPES; } catch (e) { return INITIAL_FORM_TYPES; }
  });
  const [requests, setRequests] = useState(() => {
    try { const s = localStorage.getItem("ud_requests"); return s ? JSON.parse(s) : INITIAL_REQUESTS; } catch (e) { return INITIAL_REQUESTS; }
  });
  const [notifications, setNotifications] = useState(() => {
    try { const s = localStorage.getItem("ud_notifs"); return s ? JSON.parse(s) : INITIAL_NOTIFICATIONS; } catch (e) { return INITIAL_NOTIFICATIONS; }
  });
  const [searchLogs, setSearchLogs] = useState(() => {
    try { const s = localStorage.getItem("ud_logs"); return s ? JSON.parse(s) : INITIAL_SEARCH_LOGS; } catch (e) { return INITIAL_SEARCH_LOGS; }
  });
  const [users, setUsers] = useState(() => {
    try { const s = localStorage.getItem("ud_users"); return s ? JSON.parse(s) : INITIAL_USERS; } catch (e) { return INITIAL_USERS; }
  });

  // User Session (Defaults to null so entering the system ALWAYS starts in the Visitor interface without an account)
  const [user, setUser] = useState(() => {
    try {
      const s = sessionStorage.getItem("ud_curr_user");
      return s ? JSON.parse(s) : null;
    } catch (e) {
      return null;
    }
  });

  // Ensure entering the system fresh never auto-logs into any legacy local account
  // and ensure building/facility cache refreshes to the real campus coordinates & names
  useEffect(() => {
    try {
      localStorage.removeItem("ud_curr_user");
      const stored = localStorage.getItem("ud_offices");
      if (stored && (stored.includes("Main Building") || !stored.includes("Bates Building"))) {
        localStorage.removeItem("ud_offices");
        localStorage.removeItem("ud_facilities");
        setOffices(INITIAL_OFFICES);
        setFacilities(INITIAL_FACILITIES);
      }
    } catch (e) {}
  }, []);

  // Routing & Auth Modal State
  const [authMode, setAuthMode] = useState('in'); // 'in' | 'reg' | 'forgot' | 'reset'
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authNotice, setAuthNotice] = useState(null);
  const [pendingAuthRedirect, setPendingAuthRedirect] = useState(null);
  const [view, setView] = useState('home'); // 'home' | 'offices-facilities' | 'office-detail' | 'map' | 'myreq' | 'newreq' | 'detail' | 'queue' | 'notifs' | 'dash' | 'manage' | 'manage-accounts' | 'account'
  const [viewArg, setViewArg] = useState(null);

  // Helper to open Auth modal in specific mode with optional notice
  const openAuth = (mode = 'in', notice = null) => {
    setAuthMode(mode);
    setAuthNotice(notice);
    setSentResetLinkInfo(null);
    setShowAuthModal(true);
  };

  // Forgot Password & Reset Password Flow State
  const [forgotEmail, setForgotEmail] = useState('');
  const [sentResetLinkInfo, setSentResetLinkInfo] = useState(null);
  const [resettingUser, setResettingUser] = useState(null);
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetConfirmPass, setResetConfirmPass] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState('');
  const [aiReferredOffice, setAiReferredOffice] = useState(null);
  const [facilityCategoryFilter, setFacilityCategoryFilter] = useState('All');
  const [manageTab, setManageTab] = useState('Offices');
  const [editIndex, setEditIndex] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedOfficeDetail, setSelectedOfficeDetail] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Office Action Confirmation Notice Modal
  const [confirmNotice, setConfirmNotice] = useState(null); // { title, message, onConfirm }

  // New Request / Appointment Form State
  const [newFormId, setNewFormId] = useState(1);
  const [newOfficeId, setNewOfficeId] = useState(1);
  const [newPurpose, setNewPurpose] = useState('');
  const [newCopies, setNewCopies] = useState(1);
  const [newApptDate, setNewApptDate] = useState(new Date().toISOString().slice(0, 10));
  const [newApptSlot, setNewApptSlot] = useState('10:00 AM');

  // AI Concierge Chat State - ISOLATED PER USER
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const aiProvider = 'GEMINI';
  const chatBottomRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('unidesk_ai_provider', 'GEMINI');
  }, []);

  // Profile Edit State (in My Account View)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileDept, setProfileDept] = useState('');
  const [profileTransferOfficeId, setProfileTransferOfficeId] = useState('');

  // Unforeseen Circumstances Reschedule/Relocate Modal State
  const [relocateModalItem, setRelocateModalItem] = useState(null);
  const [relocateDate, setRelocateDate] = useState('');
  const [relocateSlot, setRelocateSlot] = useState('09:15 AM');
  const [relocateLocation, setRelocateLocation] = useState('');
  const [relocateStatus, setRelocateStatusVal] = useState('confirmed');
  const [relocateNotes, setRelocateNotes] = useState('');

  // Delete Reservation Confirmation Modal State
  const [deletingResItem, setDeletingResItem] = useState(null);

  // Walk-in Reservation Modal State
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [walkinStudentName, setWalkinStudentName] = useState('');
  const [walkinStudentEmail, setWalkinStudentEmail] = useState('');
  const [walkinFormId, setWalkinFormId] = useState(1);
  const [walkinDate, setWalkinDate] = useState(new Date().toISOString().slice(0, 10));
  const [walkinSlot, setWalkinSlot] = useState('10:00 AM');
  const [walkinNotes, setWalkinNotes] = useState('Walk-in consultation accommodated by staff');

  // Account Management Modal States (Admin CRUD)
  const [editingUserItem, setEditingUserItem] = useState(null);
  const [deletingUserItem, setDeletingUserItem] = useState(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState('All');

  // Floating Staff AI Concierge State
  const [showFloatingChat, setShowFloatingChat] = useState(false);
  const [floatingChatInput, setFloatingChatInput] = useState('');
  const floatingChatBottomRef = useRef(null);

  // Main Search AI Concierge Panel Visibility State (Revealed only on explicit user trigger)
  const [isAiPanelRevealed, setIsAiPanelRevealed] = useState(false);

  // Sync to localStorage
  useEffect(() => { try { localStorage.setItem("ud_offices", JSON.stringify(offices)); } catch(e){} }, [offices]);
  useEffect(() => { try { localStorage.setItem("ud_issues", JSON.stringify(issues)); } catch(e){} }, [issues]);
  useEffect(() => { try { localStorage.setItem("ud_facilities", JSON.stringify(facilities)); } catch(e){} }, [facilities]);
  useEffect(() => { try { localStorage.setItem("ud_formtypes", JSON.stringify(formTypes)); } catch(e){} }, [formTypes]);
  useEffect(() => { try { localStorage.setItem("ud_requests", JSON.stringify(requests)); } catch(e){} }, [requests]);
  useEffect(() => { try { localStorage.setItem("ud_notifs", JSON.stringify(notifications)); } catch(e){} }, [notifications]);
  useEffect(() => { try { localStorage.setItem("ud_logs", JSON.stringify(searchLogs)); } catch(e){} }, [searchLogs]);
  useEffect(() => { try { localStorage.setItem("ud_users", JSON.stringify(users)); } catch(e){} }, [users]);

  // Auth Session & Chat Isolation when User changes
  useEffect(() => {
    document.body.classList.remove('auth');
    if (user) {
      try {
        sessionStorage.setItem("ud_curr_user", JSON.stringify(user));
        localStorage.removeItem("ud_curr_user");
      } catch(e){}

      // Load specific chat conversation for this user email
      const userChatKey = `ud_chat_${user.e.toLowerCase().trim()}`;
      try {
        const savedChat = localStorage.getItem(userChatKey);
        if (savedChat) {
          const parsed = JSON.parse(savedChat);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setChatMessages(parsed);
          } else {
            setChatMessages(getDefaultChatForUser(user.n));
          }
        } else {
          setChatMessages(getDefaultChatForUser(user.n));
        }
      } catch (err) {
        setChatMessages(getDefaultChatForUser(user.n));
      }

      // Initialize Profile Form
      setProfileName(user.n || '');
      setProfileEmail(user.e || '');
      setProfilePhone(user.ph || '');
      setProfileDept(user.dept || '');
      setProfileTransferOfficeId(user.office || (offices[0]?.id || 1));
    } else {
      try {
        sessionStorage.removeItem("ud_curr_user");
        localStorage.removeItem("ud_curr_user");
      } catch(e){}
      // Load guest visitor chat
      try {
        const guestChat = localStorage.getItem("ud_chat_guest");
        if (guestChat) {
          const parsed = JSON.parse(guestChat);
          setChatMessages(Array.isArray(parsed) && parsed.length > 0 ? parsed : getDefaultChatForUser(null));
        } else {
          setChatMessages(getDefaultChatForUser(null));
        }
      } catch (e) {
        setChatMessages(getDefaultChatForUser(null));
      }
    }
  }, [user?.e]);

  // Save chat per user whenever chatMessages changes (including visitor)
  useEffect(() => {
    if (chatMessages.length > 0) {
      const chatKey = user?.e ? `ud_chat_${user.e.toLowerCase().trim()}` : "ud_chat_guest";
      try {
        localStorage.setItem(chatKey, JSON.stringify(chatMessages));
      } catch (e) {}
    }
  }, [chatMessages, user?.e]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (showFloatingChat) {
      floatingChatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatLoading, showFloatingChat]);

  // Toast Helper
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Admin Notification Trigger Helper
  const pushAdminNotification = (title, message) => {
    const today = new Date().toISOString().slice(0, 10);
    const newNotif = {
      t: title,
      m: message,
      r: 0,
      u: "System Admin",
      forAdmin: true,
      at: today
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const getOffice = (id) => offices.find(o => o.id === Number(id)) || { n: "(removed office)", b: "", r: "" };
  const getForm = (id) => formTypes.find(f => f.id === Number(id)) || { n: "(unknown form)", fee: 0, d: 0, o: 1, isAppointment: false };

  // Calculate unread count for current user
  const unreadCount = user
    ? notifications.filter(n => !n.r && (n.u === user.n || (user.role === 'admin' && n.forAdmin))).length
    : 0;

  // Role Navigation Links (with Merged "Offices & Facilities")
  const getNavLinks = () => {
    const base = [
      ["Search & AI Assistant", "home"],
      ["Offices & Facilities", "offices-facilities"],
      ["Campus map", "map"]
    ];

    if (!user) {
      return [
        ...base,
        ["Request a service", "newreq"]
      ];
    }
    const r = user.role;

    let roleLinks = [];
    if (r === "visitor" || r === "student") {
      roleLinks = [
        ...base,
        ["My requests", "myreq"],
        ["Request a service", "newreq"],
        [`Notifications${unreadCount ? ` (${unreadCount})` : ''}`, "notifs"]
      ];
    } else if (r === "staff") {
      roleLinks = [
        ["Review queue", "queue"],
        ["Offices & Facilities", "offices-facilities"],
        ["Campus map", "map"],
        ["Manage my office", "manage"],
        [`Notifications${unreadCount ? ` (${unreadCount})` : ''}`, "notifs"]
      ];
    } else {
      roleLinks = [
        ["Dashboard", "dash"],
        ["Manage data", "manage"],
        ["Account Directory", "manage-accounts"],
        ["Offices & Facilities", "offices-facilities"],
        ["Campus map", "map"],
        [`Notifications${unreadCount ? ` (${unreadCount})` : ''}`, "notifs"]
      ];
    }

    // Do NOT append My Account next to Notifications; it is accessed via top-right profile
    return roleLinks;
  };

  const navigateTo = (v, arg = null) => {
    // Intercept transactions and personal profile when user is a guest visitor without account
    if (!user && (v === 'newreq' || v === 'myreq' || v === 'account' || v === 'queue' || v === 'dash' || v === 'manage' || v === 'manage-accounts' || v === 'notifs')) {
      showToast("Please sign in or create an account to request a service or view personal records.");
      setPendingAuthRedirect(v);
      openAuth('in', 'Please sign in or register a new account to submit transactions and book appointments.');
      return;
    }
    setView(v);
    setViewArg(arg);
    setEditIndex(null);
    window.scrollTo(0, 0);
  };

  // Open dedicated Office Detail / Services Offered view
  const openOfficeDetail = (officeObj) => {
    setSelectedOfficeDetail(officeObj);
    navigateTo('office-detail', officeObj.id);
  };

  // Book In-Person Appointment for a Facility
  const handleBookFacilityAppointment = (fac) => {
    const facName = fac.n || fac.facility_name;
    const facBuilding = fac.b || fac.building_name;
    
    // Find matching office by name or building
    const matchingOffice = offices.find(o => 
      (facName && o.n.toLowerCase().includes(facName.toLowerCase())) || 
      (facName && facName.toLowerCase().includes(o.n.toLowerCase())) ||
      o.b === facBuilding
    ) || offices[0];

    if (matchingOffice) {
      setNewOfficeId(matchingOffice.id);
    }
    setNewFormId(99); // 📅 In-Person Office Appointment & Consultation (No Fee)
    setNewPurpose(`In-Person Facility Visit / Consultation: ${facName} (${facBuilding || ''})`);
    navigateTo('newreq');
  };

  // Auth Login Handler with Admin Notification & Status check
  const handleLogin = (u) => {
    if (u.status === 'pending_approval') {
      const roleTitle = u.role === 'admin' ? 'admin' : 'staff';
      showToast(`Your ${roleTitle} account is pending administrative review. Please wait for an administrator to confirm your account.`);
      return;
    }

    setUser(u);
    try {
      sessionStorage.setItem("ud_curr_user", JSON.stringify(u));
      localStorage.removeItem("ud_curr_user");
    } catch(e){}
    setShowAuthModal(false);
    setSearchQuery('');
    setSubmittedSearchQuery('');
    setIsAiPanelRevealed(false);
    showToast(`Signed in as ${u.n}`);

    // Every account login shows in Admin notification
    pushAdminNotification("Account Login Alert", `${u.n} (${ROLE_LABELS[u.role] || u.role}) logged into UniDesk with email: ${u.e}`);

    if (pendingAuthRedirect) {
      const dest = pendingAuthRedirect;
      setPendingAuthRedirect(null);
      setView(dest);
    } else {
      if (u.role === 'admin') setView('dash');
      else if (u.role === 'staff') setView('queue');
      else setView('home');
    }
  };

  const handleLogout = () => {
    setUser(null);
    try {
      sessionStorage.removeItem("ud_curr_user");
      localStorage.removeItem("ud_curr_user");
    } catch(e){}
    setShowAuthModal(false);
    setAuthMode('in');
    setAuthNotice(null);
    setPendingAuthRedirect(null);
    setView('home');
    setSearchQuery('');
    setSubmittedSearchQuery('');
    setIsAiPanelRevealed(false);
    showToast("Signed out. You are now browsing as a Campus Visitor.");
  };

  // Profile Save with Editable Email & Staff Transfer Request
  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!profileName.trim() || !profileEmail.trim()) {
      showToast("Name and Email are required");
      return;
    }

    const oldEmail = user.e.toLowerCase();
    const newEmail = profileEmail.trim().toLowerCase();

    // Check if staff requested a transfer
    let transferObj = user.transferRequest || null;
    if (user.role === 'staff' && profileTransferOfficeId && Number(profileTransferOfficeId) !== user.office) {
      const targetOff = getOffice(profileTransferOfficeId);
      transferObj = {
        toOfficeId: Number(profileTransferOfficeId),
        toOfficeName: targetOff.n,
        requestedAt: new Date().toISOString().slice(0, 10),
        status: 'pending'
      };

      // Notify Admin
      pushAdminNotification(
        "Staff Office Transfer Request",
        `${user.n} (Staff ID: ${user.id || 'N/A'}) requested to transfer from ${getOffice(user.office).n} to ${targetOff.n}.`
      );
    }

    const updatedUser = {
      ...user,
      n: profileName.trim(),
      e: newEmail,
      ph: profilePhone.trim(),
      dept: profileDept.trim(),
      transferRequest: transferObj
    };

    // Migrate chat messages if email changed
    if (oldEmail !== newEmail) {
      try {
        const oldChat = localStorage.getItem(`ud_chat_${oldEmail}`);
        if (oldChat) {
          localStorage.setItem(`ud_chat_${newEmail}`, oldChat);
          localStorage.removeItem(`ud_chat_${oldEmail}`);
        }
      } catch (err) {}
    }

    setUser(updatedUser);
    setUsers(prev => prev.map(u => u.e.toLowerCase() === oldEmail ? updatedUser : u));
    setIsEditingProfile(false);

    if (transferObj) {
      showToast("Profile saved & office transfer request submitted for Admin review!");
    } else {
      showToast("Account details updated successfully!");
    }
  };

  // Account Password Update Handler (All account types regardless of role)
  const handleUpdatePassword = (newPassword) => {
    const updatedUser = { ...user, p: newPassword };
    setUser(updatedUser);
    setUsers(prev => prev.map(u => u.e.toLowerCase() === user.e.toLowerCase() ? updatedUser : u));
    showToast("Password updated successfully! Keep your new credentials secure.");
    pushAdminNotification(
      "Security Alert: Password Updated",
      `${user.n} (${user.e}) updated their account password.`
    );
    setNotifications(prev => [
      {
        t: "🔐 Password Updated",
        m: `Your account password was updated successfully on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        r: 0,
        u: user.n,
        at: new Date().toISOString().slice(0, 10)
      },
      ...prev
    ]);
  };

  // Forgot Password: Send Reset Link Request Handler
  const handleRequestPasswordReset = (e) => {
    e.preventDefault();
    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail) {
      showToast("Please enter your registered email address.");
      return;
    }

    const matchedUser = users.find(u => u.e.toLowerCase() === cleanEmail);
    if (!matchedUser) {
      showToast("No account found with this email. Please check your spelling or register.");
      return;
    }

    // Generate simulated secure reset token & link
    const token = `rst_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
    const resetLink = `${window.location.origin}/?action=reset-password&token=${token}&email=${encodeURIComponent(cleanEmail)}`;

    setSentResetLinkInfo({
      email: cleanEmail,
      userName: matchedUser.n,
      token,
      resetLink,
      user: matchedUser
    });

    showToast(`Password reset link sent to ${cleanEmail}! Check simulated inbox below.`);
    pushAdminNotification(
      "Password Reset Requested",
      `Password reset link generated and dispatched to ${matchedUser.n} (${matchedUser.e}).`
    );
  };

  // Execute Password Reset with New Password
  const handleExecutePasswordReset = (e) => {
    e.preventDefault();
    if (!resetNewPass || resetNewPass.length < 8) {
      showToast("New password must be at least 8 characters long.");
      return;
    }
    if (resetNewPass !== resetConfirmPass) {
      showToast("New password and confirmation do not match.");
      return;
    }

    const updatedUser = { ...resettingUser, p: resetNewPass };
    setUsers(prev => prev.map(u => u.e.toLowerCase() === resettingUser.e.toLowerCase() ? updatedUser : u));

    showToast("Password reset successful! You can now sign in with your new password.");
    pushAdminNotification(
      "Password Reset Completed",
      `${resettingUser.n} (${resettingUser.e}) successfully reset their account password.`
    );

    setSentResetLinkInfo(null);
    setResettingUser(null);
    setForgotEmail('');
    setResetNewPass('');
    setResetConfirmPass('');
    setAuthMode('in');
  };

  // Helper: Identify which of the 4 campus offices is referred by AI Concierge or query keywords
  const detectReferredOffice = (queryText, replyText) => {
    // 1. From AI response text if available
    if (replyText) {
      const r = replyText.toLowerCase();
      if (r.includes('student affairs')) return offices.find(o => o.id === 2);
      if (r.includes("registrar's office") || r.includes('registrar')) return offices.find(o => o.id === 1);
      if (r.includes('cashier')) return offices.find(o => o.id === 3);
      if (r.includes('guidance and counseling') || r.includes('guidance & counseling') || r.includes('guidance') || r.includes('counseling')) return offices.find(o => o.id === 4);
    }

    // 2. From query keywords
    const q = (queryText || '').toLowerCase().trim();
    if (!q) return null;

    // Student Affairs Office (id: 2)
    if (/\blost\b.*?\b(student\s*)?id\b|\breplace(ment)?\s*(student\s*)?id\b|\b(student\s*)?id\s*cards?\b|\bstudent\s*id\b|\bgood\s*moral\b|\bstudent\s*conduct\b|\bdisciplin(e|ary)\b|\bstudent\s*organi[sz]ation|\bstudent\s*clubs?\b/i.test(q)) {
      return offices.find(o => o.id === 2);
    }
    // Registrar's Office (id: 1)
    if (/\btranscript(s)?\b|\btor\b|\benrollment\s*certificate\b|\bgrading\s*history\b|\bgrades?\b|\bdegree\s*completion\b|\bacademic\s*records?\b|\bdiploma\b/i.test(q)) {
      return offices.find(o => o.id === 1);
    }
    // Cashier (id: 3)
    if (/\brefund(s)?\b|\bmoney\s*back\b|\btuition\b|\bbalance\b|\breceipt(s)?\b|\bfee(s)?\b|\bpayments?\b/i.test(q)) {
      return offices.find(o => o.id === 3);
    }
    // Guidance & Counseling (id: 4)
    if (/\bstress(ed)?\b|\banxiety\b|\banxious\b|\boverwhelmed\b|\bdepressed\b|\bdepression\b|\bcounseling\b|\bcounselor\b|\bbullying\b|\bharassment\b|\bmental\s*health\b|\bwell-?being\b|\bscholarship/i.test(q)) {
      return offices.find(o => o.id === 4);
    }

    if (/student\s*affairs|osa\b/i.test(q)) return offices.find(o => o.id === 2);
    if (/registrar/i.test(q)) return offices.find(o => o.id === 1);
    if (/cashier/i.test(q)) return offices.find(o => o.id === 3);
    if (/guidance|counseling/i.test(q)) return offices.find(o => o.id === 4);

    return null;
  };

  // Search Action (Integrated with AI Concierge)
  const handleSearchAndAskAI = async (e) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    // Reset the search input to blank immediately upon submission
    setSubmittedSearchQuery(q);
    setSearchQuery('');

    // Explicitly reveal the AI concierge panel directly above the search bar
    setIsAiPanelRevealed(true);

    // Identify referred office immediately
    const immediateRef = detectReferredOffice(q, null);
    if (immediateRef) {
      setAiReferredOffice(immediateRef);
    }

    // Log search query
    setSearchLogs(prev => ({ ...prev, [q.toLowerCase()]: (prev[q.toLowerCase()] || 0) + 1 }));

    // Send query to AI Concierge simultaneously
    await triggerAIChatQuery(q);
  };

  // Trigger AI Chat query directly
  const triggerAIChatQuery = async (queryText) => {
    if (!queryText || chatLoading) return;
    setIsAiPanelRevealed(true);
    const userMsg = { sender: 'user', text: queryText };
    const updated = [...chatMessages, userMsg];
    setChatMessages(updated);
    setChatLoading(true);

    // Ensure referred office updates immediately based on query keywords
    const directRef = detectReferredOffice(queryText, null);
    if (directRef) {
      setAiReferredOffice(directRef);
    }

    try {
      const res = await fetch('http://localhost:5000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: queryText,
          userId: user ? user.e : 'anonymous',
          sessionToken: user ? user.e : 'anonymous',
          aiProvider: 'GEMINI',
          enginePreference: 'GEMINI',
          history: updated.slice(-6).map(m => ({ sender: m.sender === 'user' ? 'USER' : 'AI', text: m.text }))
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setChatMessages(prev => [
          ...prev,
          {
            sender: 'ai',
            text: data.data.reply,
            reasoningContent: data.data.reasoningContent || null,
            engineUsed: data.data.engineUsed
          }
        ]);

        let refOff = null;
        if (data.data.detectedOffice) {
          const code = (data.data.detectedOffice.office_code || '').toLowerCase();
          const name = (data.data.detectedOffice.office_name || data.data.detectedOffice.name || '').toLowerCase();
          refOff = offices.find(o => 
            (code.includes('reg') && o.id === 1) ||
            (code.includes('osa') && o.id === 2) ||
            (code.includes('csh') && o.id === 3) ||
            (code.includes('gdc') && o.id === 4) ||
            o.n.toLowerCase().includes(name.split("'")[0])
          );
        }
        if (!refOff) {
          refOff = detectReferredOffice(queryText, data.data.reply);
        }
        setAiReferredOffice(refOff || directRef || null);
      } else {
        const localReply = generateLocalSmartReply(queryText, offices, issues, facilities);
        setChatMessages(prev => [
          ...prev,
          {
            sender: 'ai',
            text: localReply
          }
        ]);
        setAiReferredOffice(detectReferredOffice(queryText, localReply) || directRef || null);
      }
    } catch (err) {
      const localReply = generateLocalSmartReply(queryText, offices, issues, facilities);
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: localReply
        }
      ]);
      setAiReferredOffice(detectReferredOffice(queryText, localReply) || directRef || null);
    } finally {
      setChatLoading(false);
    }
  };

  // Submit Request / Appointment Form
  const handleSubmitRequest = (e) => {
    e.preventDefault();
    if (!user) {
      openAuth('in', 'Please sign in or register to submit transactions.');
      return;
    }
    const isAppt = Number(newFormId) === 99 || newFormId === 'appointment';
    const f = isAppt ? { id: 99, n: "📅 In-Person Office Appointment & Consultation", o: Number(newOfficeId), fee: 0, isAppointment: true } : getForm(newFormId);
    const ref = `UD-2026-${String(requests.length + 1).padStart(4, "0")}`;
    const today = new Date().toISOString().slice(0, 10);

    const newReq = {
      ref,
      ft: f.id,
      by: user.n,
      userEmail: user.e,
      officeId: isAppt ? Number(newOfficeId) : f.o,
      p: newPurpose,
      c: isAppt ? 1 : Number(newCopies),
      s: isAppt ? "confirmed" : "pending",
      date: isAppt ? newApptDate : today,
      slot: isAppt ? newApptSlot : "10:00 AM",
      locationOverride: null,
      notes: isAppt ? `Appointment for: ${newPurpose}` : newPurpose,
      dl: isAppt ? newApptDate : new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
      isAppointment: isAppt,
      h: [[isAppt ? "confirmed" : "pending", today]]
    };

    setRequests(prev => [newReq, ...prev]);
    setNewPurpose('');
    setNewCopies(1);
    showToast(isAppt ? `Appointment ${ref} scheduled successfully (No fee)!` : `Request ${ref} submitted!`);
    navigateTo('detail', ref);
  };

  // Office Action with Notice Validation
  const requestOfficeActionWithNotice = (ref, nextStatus, label) => {
    const targetReq = requests.find(r => r.ref === ref);
    if (!targetReq) return;

    setConfirmNotice({
      title: `Confirm Action: ${label}`,
      message: `Are you sure you want to mark request ${ref} for "${targetReq.by}" as "${nextStatus}"? This will update the student's operational status and send an official notification.`,
      onConfirm: () => {
        executeQueueAction(ref, nextStatus);
        setConfirmNotice(null);
      }
    });
  };

  const executeQueueAction = (ref, nextStatus) => {
    const today = new Date().toISOString().slice(0, 10);
    let deadline = null;
    if (nextStatus === "ready") {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      deadline = d.toISOString().slice(0, 10);
    }

    setRequests(prev => prev.map(r => {
      if (r.ref === ref) {
        return {
          ...r,
          s: nextStatus,
          dl: deadline || r.dl,
          h: [...r.h, [nextStatus, today]]
        };
      }
      return r;
    }));

    const targetReq = requests.find(r => r.ref === ref);
    if (targetReq) {
      const titles = { approved: "Request approved", rejected: "Request rejected", ready: "Form ready for pickup", claimed: "Form claimed" };
      const newNotif = {
        t: titles[nextStatus] || "Status Update",
        m: `${ref} is now ${nextStatus === 'ready' ? 'ready for pickup' : nextStatus}.${deadline ? ` Pick it up by ${deadline}.` : ''}`,
        r: 0,
        u: targetReq.by,
        at: today
      };
      setNotifications(prev => [newNotif, ...prev]);
    }

    showToast(`${ref} updated to: ${nextStatus}`);
  };

  // Open Relocate & Reschedule Modal
  const openRelocateModal = (item) => {
    if (!item) return;
    setRelocateModalItem(item);
    setRelocateDate(item.date || new Date().toISOString().slice(0, 10));
    setRelocateSlot(item.slot || "09:15 AM");
    setRelocateLocation(item.locationOverride || "");
    setRelocateStatusVal(item.s || "confirmed");
    setRelocateNotes(item.notes || "");
  };

  // Relocate / Reschedule save (Unforeseen Circumstances CRUD)
  const handleSaveRelocation = (e) => {
    e.preventDefault();
    if (!relocateModalItem) return;

    setRequests(prev => prev.map(r => {
      if (r.ref === relocateModalItem.ref) {
        return {
          ...r,
          date: relocateDate,
          slot: relocateSlot,
          locationOverride: relocateLocation.trim() || null,
          s: relocateStatus,
          notes: relocateNotes.trim(),
          h: [...(r.h || []), [`relocated (${relocateLocation || 'rescheduled'})`, new Date().toISOString().slice(0, 10)]]
        };
      }
      return r;
    }));

    // Notify user of relocation
    const newNotif = {
      t: "Reservation Rescheduled / Relocated",
      m: `Your reservation ${relocateModalItem.ref} has been updated: Date: ${relocateDate} (${relocateSlot}). ${relocateLocation ? `Relocated to: ${relocateLocation}.` : ''}`,
      r: 0,
      u: relocateModalItem.by,
      at: new Date().toISOString().slice(0, 10)
    };
    setNotifications(prev => [newNotif, ...prev]);

    setRelocateModalItem(null);
    showToast(`Reservation ${relocateModalItem.ref} relocated & rescheduled!`);
  };

  // Delete Reservation
  const handleConfirmDeleteRes = () => {
    if (!deletingResItem) return;
    setRequests(prev => prev.filter(r => r.ref !== deletingResItem.ref));
    showToast(`Reservation ${deletingResItem.ref} removed from system.`);
    setDeletingResItem(null);
  };

  // Create Walk-in Reservation
  const handleCreateWalkin = (e) => {
    e.preventDefault();
    if (!walkinStudentName.trim()) {
      showToast("Student name is required");
      return;
    }
    const f = getForm(walkinFormId);
    const ref = `UD-2026-${String(requests.length + 1).padStart(4, "0")}`;
    const newWalkin = {
      ref,
      ft: Number(walkinFormId),
      by: walkinStudentName.trim(),
      userEmail: walkinStudentEmail.trim() || "walkin.student@unidesk.edu",
      officeId: user.role === 'staff' ? user.office : f.o,
      p: "In-person Walk-in desk assistance",
      c: 1,
      s: "confirmed",
      date: walkinDate,
      slot: walkinSlot,
      locationOverride: null,
      notes: walkinNotes.trim(),
      dl: walkinDate,
      isAppointment: true,
      h: [["confirmed (walk-in)", walkinDate]]
    };

    setRequests(prev => [newWalkin, ...prev]);
    setShowWalkinModal(false);
    setWalkinStudentName('');
    setWalkinStudentEmail('');
    showToast(`Walk-in reservation ${ref} created for ${newWalkin.by}!`);
  };

  // Admin Account Approval Handler
  const handleApproveStaffAccount = (targetEmail) => {
    let approvedRoleTitle = 'Staff';
    setUsers(prev => prev.map(u => {
      if (u.e.toLowerCase() === targetEmail.toLowerCase()) {
        approvedRoleTitle = u.role === 'admin' ? 'Admin' : 'Staff';
        const updated = { ...u, status: 'active' };
        if (user && user.e.toLowerCase() === targetEmail.toLowerCase()) {
          setUser(updated);
        }
        return updated;
      }
      return u;
    }));
    showToast(`${approvedRoleTitle} account for ${targetEmail} approved and activated!`);
    pushAdminNotification(`${approvedRoleTitle} Account Approved`, `Administrator approved and activated ${approvedRoleTitle.toLowerCase()} credentials for ${targetEmail}.`);
  };

  // Admin Office Transfer Confirmation Handler
  const handleConfirmStaffTransfer = (targetEmail, approve) => {
    let transferredOfficeName = "";
    setUsers(prev => prev.map(u => {
      if (u.e.toLowerCase() === targetEmail.toLowerCase()) {
        if (approve && u.transferRequest) {
          const newOffId = u.transferRequest.toOfficeId;
          transferredOfficeName = u.transferRequest.toOfficeName;
          const updated = {
            ...u,
            office: newOffId,
            dept: u.transferRequest.toOfficeName,
            transferRequest: null
          };
          if (user && user.e.toLowerCase() === targetEmail.toLowerCase()) {
            setUser(updated);
          }
          return updated;
        } else {
          const updated = { ...u, transferRequest: null };
          if (user && user.e.toLowerCase() === targetEmail.toLowerCase()) {
            setUser(updated);
          }
          return updated;
        }
      }
      return u;
    }));

    if (approve && transferredOfficeName) {
      const staffTarget = users.find(u => u.e.toLowerCase() === targetEmail.toLowerCase());
      if (staffTarget) {
        setNotifications(prev => [
          {
            t: "Office Transfer Confirmed",
            m: `Your transfer to ${transferredOfficeName} has been confirmed and activated by Administrator.`,
            r: 0,
            u: staffTarget.n,
            at: new Date().toISOString().slice(0, 10)
          },
          ...prev
        ]);
      }
    }

    showToast(approve ? `Office transfer approved!` : `Office transfer declined.`);
  };

  // Admin Delete User
  const handleDeleteUser = (emailToDelete) => {
    setUsers(prev => prev.filter(u => u.e.toLowerCase() !== emailToDelete.toLowerCase()));
    setDeletingUserItem(null);
    showToast("User account permanently deleted.");
  };

  // Admin Save Edited User (Admin direct transfer without friction)
  const handleSaveUserEdit = (e) => {
    e.preventDefault();
    if (!editingUserItem) return;
    const cleanItem = {
      ...editingUserItem,
      dept: editingUserItem.role === 'staff' && editingUserItem.office 
        ? (getOffice(editingUserItem.office).n || editingUserItem.dept) 
        : editingUserItem.dept,
      transferRequest: null // If admin changes the office directly, clear transfer request with zero friction
    };
    setUsers(prev => prev.map(u => u.e.toLowerCase() === editingUserItem.e.toLowerCase() ? cleanItem : u));
    if (user && user.e.toLowerCase() === editingUserItem.e.toLowerCase()) {
      setUser(cleanItem);
    }
    setEditingUserItem(null);
    showToast("User account details saved successfully!");
  };

  // Admin Add User
  const handleAdminAddUser = (e) => {
    e.preventDefault();
    const form = e.target;
    const email = form.ae.value.trim().toLowerCase();
    if (users.some(u => u.e.toLowerCase() === email)) {
      showToast("An account with this email already exists");
      return;
    }
    const role = form.ar.value;
    const newUser = {
      n: form.an.value.trim(),
      e: email,
      p: form.ap.value,
      role: role,
      id: form.ai.value.trim() || `ID-${Date.now().toString().slice(-4)}`,
      dept: form.ad.value.trim() || 'General Campus',
      office: role === 'staff' ? Number(form.ao.value) : undefined,
      status: 'active'
    };
    setUsers(prev => [...prev, newUser]);
    setShowAddUserModal(false);
    showToast(`User ${newUser.n} created successfully!`);
    pushAdminNotification("Account Created", `Administrator created new account for ${newUser.n} (${newUser.e}).`);
  };

  // Clear Chat for Current Account
  const handleClearCurrentAccountChat = () => {
    const fresh = getDefaultChatForUser(user?.n);
    setChatMessages(fresh);
    if (user?.e) {
      localStorage.setItem(`ud_chat_${user.e.toLowerCase().trim()}`, JSON.stringify(fresh));
    }
    showToast("Chat conversation reset for your account.");
  };

  const handleTestKey = async () => {
    const isDeepSeek = aiProvider === 'DEEPSEEK';
    const key = isDeepSeek ? deepseekKey.trim() : geminiKey.trim();
    if (!key) {
      setTestStatus({ success: false, message: 'Please enter an API key first.' });
      return;
    }
    setTestStatus({ loading: true });
    try {
      const res = await fetch('http://localhost:5000/api/ai/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: key,
          provider: aiProvider,
          model: isDeepSeek ? deepseekModel : undefined
        })
      });
      const data = await res.json();
      setTestStatus(data);
      if (data.success) {
        if (isDeepSeek) {
          localStorage.setItem('unidesk_deepseek_key', key);
          localStorage.setItem('unidesk_deepseek_model', deepseekModel);
        } else {
          localStorage.setItem('unidesk_gemini_key', key);
        }
      }
    } catch (err) {
      setTestStatus({ success: false, message: err.message });
    }
  };

  function generateLocalSmartReply(query, offs, isss, facs) {
    const q = (query || '').toLowerCase().trim();
    if (!q) {
      return "I'm sorry, I don't have specific information for that concern in the current campus directory. Please contact the General Admin Office for assistance.";
    }

    // 1. Check for Ambiguous Queries (Confirm Intent)
    if ((q.includes('certificate') || q.includes('cert')) && !q.includes('enrollment') && !q.includes('good moral') && !q.includes('moral')) {
      return "Could you please clarify: are you requesting an Enrollment Certificate (Registrar's Office) or a Good Moral Certificate (Student Affairs Office)?";
    }
    if ((q.includes('record') || q.includes('records')) && !q.includes('academic') && !q.includes('transcript') && !q.includes('disciplinary') && !q.includes('conduct') && !q.includes('grading')) {
      return "Could you please clarify: are you inquiring about Academic Records (Registrar's Office) or Disciplinary Records (Student Affairs Office)?";
    }
    if (q === 'advising' || q === 'academic advising' || q === 'advice') {
      return "Could you clarify if your advising concern relates to personal well-being (Guidance and Counseling) or curriculum and degree completion (Registrar's Office)?";
    }

    // 2. Exact keyword / phrase matching with actionable advice & concise format
    // Student Affairs Office
    // Keywords: ID cards, Lost ID card, Student conduct, Good moral certificates, Good moral certificate, Disciplinary records, Student organization
    if (/\blost\b.*?\b(student\s*)?id\b|\breplace(ment)?\s*(student\s*)?id\b/i.test(q)) {
      return "This is handled by the **Student Affairs Office**. You will need to file a loss report and pay a replacement fee.";
    }
    if (/\b(student\s*)?id\s*cards?\b|\bstudent\s*id\b/i.test(q)) {
      return "This is handled by the **Student Affairs Office**. Please bring valid identification and 1x1 ID photos for processing.";
    }
    if (/\bgood\s*moral(\s*certificates?)?\b|\bcertificate\s*of\s*good\s*moral\b/i.test(q)) {
      return "This is handled by the **Student Affairs Office**. You can apply for and claim your good moral certificate there.";
    }
    if (/\bstudent\s*conduct\b|\bdisciplin(e|ary)(\s*records?)?\b/i.test(q)) {
      return "Inquiries regarding student conduct and disciplinary records are handled by the **Student Affairs Office**. Please proceed to their main desk.";
    }
    if (/\bstudent\s*organi[sz]ations?\b|\bstudent\s*clubs?\b|\bstudent\s*council\b/i.test(q)) {
      return "Student organizations and student activities are managed by the **Student Affairs Office**. Visit their office for recognition and event clearance.";
    }

    // Registrar's Office
    // Keywords: Academic records, Transcripts, Transcript request, Enrollment certificates, Certificate of enrollment, Grading history, Degree completion
    if (/\btranscript(s)?(\s*request)?\b|\btor\b/i.test(q)) {
      return "Please go to the **Registrar's Office**. You can request an official transcript there.";
    }
    if (/\benrollment\s*certificates?\b|\bcertificate\s*of\s*enrollment\b/i.test(q)) {
      return "This is handled by the **Registrar's Office**. Visit their service window with your student ID to request your enrollment certificate.";
    }
    if (/\bgrading\s*history\b|\bgrades?\b|\bgrade\s*slip\b/i.test(q)) {
      return "Please go to the **Registrar's Office**. You can request a certified copy of your grading history and academic evaluations there.";
    }
    if (/\bdegree\s*completion\b|\bgraduation(\s*records?)?\b|\bdiploma\b/i.test(q)) {
      return "Degree completion and academic clearances are processed by the **Registrar's Office**. Please visit their evaluation window.";
    }
    if (/\bacademic\s*records?\b/i.test(q)) {
      return "Please go to the **Registrar's Office**. You can access and update your official academic records there.";
    }

    // Cashier
    // Keywords: Tuition payments, Fees, Refunds, Refund request, Payment concerns, Balance inquiry, Receipt
    if (/\brefund(s)?(\s*request)?\b|\bmoney\s*back\b/i.test(q)) {
      return "For refund requests and fee concerns, contact the **Cashier**.";
    }
    if (/\btuition(\s*payments?|\s*fees?)?\b/i.test(q)) {
      return "For tuition payments and payment concerns, please proceed to the **Cashier** at Ground Floor East Wing.";
    }
    if (/\bbalance(\s*inquiry)?\b|\baccount\s*balance\b/i.test(q)) {
      return "For balance inquiries and statement of accounts, please visit the **Cashier** window.";
    }
    if (/\breceipt(s)?\b|\bofficial\s*receipt\b/i.test(q)) {
      return "Official receipts and payment validations are issued directly by the **Cashier**.";
    }
    if (/\bfee(s)?\b|\bpayment\s*concerns?\b|\bpay(ment)?s?\b/i.test(q)) {
      return "For fee concerns and payment settlements, please contact the **Cashier**.";
    }

    // Guidance and Counseling
    // Keywords: Counseling sessions, Counseling appointment, Bullying related issue, Mental health, Stress, Anxiety, Scholarship information, Academic advising (if related to personal well-being)
    if (/\bstress(ed)?\b|\banxiety\b|\banxious\b|\boverwhelmed\b|\bdepressed\b|\bdepression\b/i.test(q)) {
      return "Please reach out to **Guidance and Counseling**. They offer counseling sessions to help manage stress.";
    }
    if (/\bcounseling(\s*(sessions?|appointments?))?\b|\bcounselor\b/i.test(q)) {
      return "Please reach out to **Guidance and Counseling**. They offer confidential counseling appointments and personal guidance.";
    }
    if (/\bbullying(\s*related\s*issue)?\b|\bharassment\b/i.test(q)) {
      return "Please report to **Guidance and Counseling**. They provide confidential counseling and intervention for bullying-related concerns.";
    }
    if (/\bmental\s*health\b|\bwell-?being\b/i.test(q)) {
      return "Please reach out to **Guidance and Counseling**. They offer dedicated mental health support and personal counseling.";
    }
    if (/\bscholarship(s)?(\s*information)?\b/i.test(q)) {
      return "For scholarship information and financial assistance counseling, please visit **Guidance and Counseling**.";
    }

    // Direct Office Name Mentions
    if (/registrar/i.test(q)) {
      return "Please go to the **Registrar's Office**. They handle academic records, transcripts, enrollment certificates, and degree completion.";
    }
    if (/student\s*affairs|osa\b/i.test(q)) {
      return "This is handled by the **Student Affairs Office**. They manage student IDs, good moral certificates, student conduct, and student organizations.";
    }
    if (/cashier/i.test(q)) {
      return "Please proceed to the **Cashier**. They process tuition payments, fees, refunds, balance inquiries, and official receipts.";
    }
    if (/guidance|counseling/i.test(q)) {
      return "Please reach out to **Guidance and Counseling**. They offer counseling sessions, mental health support, bullying intervention, and scholarship information.";
    }

    // Fallback strictly as specified
    return "I'm sorry, I don't have specific information for that concern in the current campus directory. Please contact the General Admin Office for assistance.";
  }

  // --------------------------------------------------------------------------
  // AUTH MODAL COMPONENT (Rendered when showAuthModal === true)
  // --------------------------------------------------------------------------
  const renderAuthModal = () => {
    if (!showAuthModal) return null;

    return (
      <div 
        className="modal-overlay"
        style={{
          zIndex: 10000,
          background: 'radial-gradient(900px 500px at 85% 0, #2b8fd644, transparent), linear-gradient(160deg, rgba(4, 32, 15, 0.94), rgba(15, 81, 50, 0.95) 55%, rgba(31, 111, 176, 0.9))',
          backdropFilter: 'blur(10px)',
          display: 'grid',
          placeItems: 'center',
          padding: '1.25rem',
          overflowY: 'auto'
        }}
        onClick={() => setShowAuthModal(false)}
      >
        <div className="ac" onClick={e => e.stopPropagation()} style={{ margin: 'auto', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '0.65rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#f6c915', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🏛️ UniDesk
            </h1>
            <button
              type="button"
              className="sm"
              style={{
                background: 'rgba(255, 255, 255, 0.18)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 700
              }}
              onClick={() => setShowAuthModal(false)}
              title="Close and continue browsing as Campus Visitor"
            >
              ✕
            </button>
          </div>

          {authNotice && (
            <div style={{
              background: 'rgba(246, 201, 21, 0.15)',
              border: '1px solid rgba(246, 201, 21, 0.45)',
              borderRadius: '8px',
              padding: '0.65rem 0.9rem',
              marginBottom: '1rem',
              color: '#fef08a',
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}>
              <span>ℹ️</span> {authNotice}
            </div>
          )}

          <div className="at">
            <button className={authMode === 'in' ? 'on' : ''} onClick={() => { setAuthMode('in'); setSentResetLinkInfo(null); }}>
              Sign In
            </button>
            <button className={authMode === 'reg' ? 'on' : ''} onClick={() => { setAuthMode('reg'); setSentResetLinkInfo(null); }}>
              Register New Account
            </button>
            {authMode === 'forgot' && (
              <button className="on" onClick={() => setAuthMode('forgot')}>
                Password Recovery
              </button>
            )}
            {authMode === 'reset' && (
              <button className="on" onClick={() => setAuthMode('reset')}>
                Choose New Password
              </button>
            )}
          </div>

          <div className="ac-body">
            {authMode === 'in' && (
            <div>
              <div className="dm">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b>Quick sign in (1-Click Evaluation):</b>
                  <span className="hint">Password: Password123!</span>
                </div>
                <div className="g4">
                  {users.map((u, i) => (
                    <button key={i} type="button" onClick={() => handleLogin(u)}>
                      <span className={`rb ${u.role}`}>{ROLE_LABELS[u.role].toUpperCase()}</span>
                      <strong style={{ display: 'block', fontSize: '0.85rem' }}>{u.n}</strong>
                      <small>{ROLE_DESC[u.role]}</small>
                      {u.status === 'pending_approval' && (
                        <span style={{ fontSize: '0.68rem', color: '#f59e0b', display: 'block', fontWeight: 700 }}>
                          Pending Admin Approval
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const email = e.target.le.value.trim().toLowerCase();
                const pass = e.target.lp.value;
                const match = users.find(u => u.e.toLowerCase() === email && u.p === pass);
                if (match) {
                  handleLogin(match);
                } else {
                  showToast("Invalid credentials. Please verify your email and password.");
                }
              }}>
                <label>
                  Email Address
                  <input id="le" name="le" type="email" required placeholder="e.g. alex.santos@student.unidesk.edu" defaultValue="alex.santos@student.unidesk.edu" />
                </label>
                <label>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Password</span>
                    <a
                      href="#"
                      style={{ fontSize: '0.8rem', color: '#f6c915', textDecoration: 'none', fontWeight: 600 }}
                      onClick={(e) => {
                        e.preventDefault();
                        const typedEmail = document.getElementById('le')?.value || '';
                        setForgotEmail(typedEmail);
                        setSentResetLinkInfo(null);
                        setAuthMode('forgot');
                      }}
                    >
                      Forgot password?
                    </a>
                  </div>
                  <PasswordInput id="lp" name="lp" required defaultValue="Password123!" placeholder="Enter your password" />
                </label>
                <button type="submit" className="go">Sign In</button>
              </form>
            </div>
          )}

          {authMode === 'reg' && (
            <RegisterForm 
              offices={offices} 
              onRegister={(newUser) => {
                setUsers(prev => [...prev, newUser]);
                const requiresReview = newUser.status === 'pending_approval';

                // Push admin notification for registration
                pushAdminNotification(
                  "New Account Registration",
                  `${newUser.n} registered as ${ROLE_LABELS[newUser.role] || newUser.role} (${newUser.e}). ${requiresReview ? 'Requires administrative approval before login.' : 'Account active.'}`
                );

                if (requiresReview) {
                  const roleTitle = newUser.role === 'admin' ? 'Admin' : 'Staff';
                  showToast(`Registration submitted! ${roleTitle} accounts require Admin review before login.`);
                  setAuthMode('in');
                } else {
                  handleLogin(newUser);
                }
              }}
              onSwitchToSignIn={() => setAuthMode('in')}
              showToast={showToast}
            />
          )}

          {authMode === 'forgot' && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, color: 'var(--tx)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>🔒</span> Password Recovery
                </h3>
                <p className="mu sm2" style={{ marginTop: '0.35rem' }}>
                  Enter your registered UniDesk email address. We will verify your account and send a secure password reset link to your email.
                </p>
              </div>

              {!sentResetLinkInfo ? (
                <form onSubmit={handleRequestPasswordReset}>
                  <label>
                    Registered Email Address
                    <input
                      type="email"
                      required
                      placeholder="e.g. alex.santos@student.unidesk.edu"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                    />
                  </label>

                  <button type="submit" className="go" style={{ marginTop: '0.75rem' }}>
                    ✉️ Send Password Reset Link
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <a
                      href="#"
                      style={{ color: '#f6c915', fontSize: '0.86rem', textDecoration: 'none' }}
                      onClick={(e) => { e.preventDefault(); setAuthMode('in'); }}
                    >
                      &larr; Back to Sign In
                    </a>
                  </div>
                </form>
              ) : (
                <div>
                  <div style={{
                    background: 'var(--cd)',
                    border: '2px solid #10b981',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.15)',
                    marginTop: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--ln)', paddingBottom: '0.6rem', marginBottom: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.3rem' }}>📧</span>
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.9rem' }}>UniDesk Campus Mail Dispatch</strong>
                          <span className="mu sm2">Simulated Secure Email Service</span>
                        </div>
                      </div>
                      <span style={{ background: '#d1fae5', color: '#065f46', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                        DELIVERED
                      </span>
                    </div>

                    <div style={{ fontSize: '0.86rem', lineHeight: 1.6, color: 'var(--tx)' }}>
                      <p style={{ margin: '0 0 0.5rem 0' }}>
                        Hello <strong>{sentResetLinkInfo.userName}</strong>,
                      </p>
                      <p style={{ margin: '0 0 0.75rem 0' }}>
                        We received a request to reset your password for your UniDesk account (<strong>{sentResetLinkInfo.email}</strong>). Click the button below to choose a new password:
                      </p>
                      
                      <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                        <button
                          type="button"
                          className="go"
                          style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', fontWeight: 700 }}
                          onClick={() => {
                            setResettingUser(sentResetLinkInfo.user);
                            setResetNewPass('');
                            setResetConfirmPass('');
                            setAuthMode('reset');
                          }}
                        >
                          🔐 Reset My Password Now &rarr;
                        </button>
                      </div>

                      <div style={{ background: 'var(--so)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.76rem', color: 'var(--mu)', wordBreak: 'break-all' }}>
                        <strong>Reset URL:</strong> {sentResetLinkInfo.resetLink}
                      </div>

                      <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.78rem', color: 'var(--mu)' }}>
                        If you did not request a password reset, you can safely disregard this email. This link is secure and valid for this session.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                    <button
                      type="button"
                      className="sm"
                      onClick={() => setSentResetLinkInfo(null)}
                    >
                      &larr; Try another email
                    </button>
                    <a
                      href="#"
                      style={{ color: '#f6c915', fontSize: '0.85rem' }}
                      onClick={(e) => { e.preventDefault(); setSentResetLinkInfo(null); setAuthMode('in'); }}
                    >
                      Return to Sign In
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {authMode === 'reset' && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, color: 'var(--tx)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>🔑</span> Choose a New Password
                </h3>
                <p className="mu sm2" style={{ marginTop: '0.35rem' }}>
                  Setting a new password for <strong>{resettingUser?.n}</strong> ({resettingUser?.e}).
                </p>
              </div>

              <form onSubmit={handleExecutePasswordReset}>
                <label>
                  New Password <span style={{ color: 'var(--er)' }}>*</span>
                  <PasswordInput
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                    value={resetNewPass}
                    onChange={e => setResetNewPass(e.target.value)}
                  />
                  <span className="hint">Minimum of 8 characters.</span>
                </label>

                <label>
                  Confirm New Password <span style={{ color: 'var(--er)' }}>*</span>
                  <PasswordInput
                    required
                    minLength={8}
                    placeholder="Repeat new password"
                    value={resetConfirmPass}
                    onChange={e => setResetConfirmPass(e.target.value)}
                  />
                </label>

                <button type="submit" className="go" style={{ marginTop: '0.75rem' }}>
                  Save New Password & Sign In
                </button>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <a
                    href="#"
                    style={{ color: '#f6c915', fontSize: '0.86rem', textDecoration: 'none' }}
                    onClick={(e) => { e.preventDefault(); setAuthMode('in'); }}
                  >
                    &larr; Cancel and Return to Sign In
                  </a>
                </div>
              </form>
            </div>
          )}
          </div>

          <div style={{ textAlign: 'center', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              type="button"
              className="sm"
              style={{ background: 'transparent', border: 'none', color: '#9bb3a4', cursor: 'pointer', fontSize: '0.84rem' }}
              onClick={() => setShowAuthModal(false)}
            >
              &larr; Continue browsing campus directory as Visitor
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --------------------------------------------------------------------------
  // APP SHELL (Visitor default interface & Authenticated dashboard)
  // --------------------------------------------------------------------------
  const navLinks = getNavLinks();

  return (
    <div>
      <header>
        <span className="brand" onClick={() => navigateTo(navLinks[0]?.[1] || 'home')}>
          🏛️ UniDesk
        </span>
        <nav id="nav">
          {navLinks.map(([label, v]) => (
            <button
              key={v}
              className={view === v ? 'on' : ''}
              onClick={() => navigateTo(v)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="who" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {!user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <button
                type="button"
                className="sm"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  fontWeight: 600,
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  padding: '0.4rem 0.95rem',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.84rem',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => openAuth('in')}
                title="Sign In to an existing account"
              >
                Sign In
              </button>
              <button
                type="button"
                className="sm"
                style={{
                  background: 'linear-gradient(135deg, #f6c915 0%, #eab308 100%)',
                  color: '#0b3a24',
                  fontWeight: 700,
                  border: 'none',
                  padding: '0.42rem 1.15rem',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.84rem',
                  boxShadow: '0 2px 10px rgba(246, 201, 21, 0.35)',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => openAuth('reg')}
                title="Create a new account"
              >
                Sign Up
              </button>
            </div>
          ) : (
            <>
              {/* User Account / Profile Button: Primary access to My Account */}
              <button
                type="button"
                className="sm"
                style={{
                  background: view === 'account' ? 'var(--gd)' : 'rgba(255, 255, 255, 0.18)',
                  color: view === 'account' ? 'var(--gt)' : '#fff',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  border: view === 'account' ? '1px solid var(--gd)' : '1px solid rgba(255, 255, 255, 0.35)',
                  padding: '0.38rem 0.88rem',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
                onClick={() => navigateTo('account')}
                title="Open My Account Interface"
              >
                👤 <span>{user?.n || 'User'}</span> · <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', opacity: 0.9 }}>{ROLE_LABELS[user?.role] || user?.role || 'Account'}</span>
                {user?.role === 'staff' && user?.office && ` (${(getOffice(user.office)?.n || '').split(" ")[0]})`}
              </button>
              <button 
                className="sm" 
                onClick={handleLogout}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  padding: '0.38rem 0.8rem',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Log out
              </button>
            </>
          )}
        </div>
      </header>

      <main id="app">
        <ErrorBoundary onReset={() => navigateTo('home')}>
          {/* VIEW: MY ACCOUNT INTERFACE */}
        {view === 'account' && (
          <MyAccountView
            user={user}
            offices={offices}
            requests={requests}
            formTypes={formTypes}
            isEditingProfile={isEditingProfile}
            setIsEditingProfile={setIsEditingProfile}
            profileName={profileName} setProfileName={setProfileName}
            profileEmail={profileEmail} setProfileEmail={setProfileEmail}
            profilePhone={profilePhone} setProfilePhone={setProfilePhone}
            profileDept={profileDept} setProfileDept={setProfileDept}
            profileTransferOfficeId={profileTransferOfficeId} setProfileTransferOfficeId={setProfileTransferOfficeId}
            onSaveProfile={handleSaveProfile}
            onUpdatePassword={handleUpdatePassword}
            onOpenRelocate={openRelocateModal}
            onOpenDelete={(item) => setDeletingResItem(item)}
            onOpenWalkin={() => setShowWalkinModal(true)}
            onNavigateTo={navigateTo}
          />
        )}

        {/* VIEW: MERGED SEARCH & AI CONCIERGE */}
        {view === 'home' && (
          <div>
            <div className="hero">
              <h1>Campus Directory & AI Intelligence Concierge</h1>
              <p>Search any concern or ask naturally (e.g. “lost student ID”, “transcript processing”, “where is registrar”).</p>

              {/* Integrated AI Concierge Response Panel (Revealed directly above search bar on explicit trigger) */}
              {isAiPanelRevealed && (
                <div className="search-ai-panel search-ai-panel-revealed">
                  <div className="chat-header">
                    <h3>⚡ UniDesk AI Concierge (Google Gemini)</h3>
                    <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
                      <button type="button" className="sm" onClick={handleClearCurrentAccountChat} title="Reset chat conversation">
                        🗑️ Clear Chat
                      </button>
                      <span className="sm" style={{ padding: '0.2rem 0.55rem', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', fontWeight: 600, fontSize: '0.75rem' }}>
                        ✨ Gemini Dedicated
                      </span>
                    </div>
                  </div>

                  <div className="chat-messages" style={{ maxHeight: '380px' }}>
                    {chatMessages.map((m, i) => (
                      <div key={i} className={`chat-msg ${m.sender}`}>
                        {m.reasoningContent && (
                          <details className="think-box">
                            <summary>💡 Gemini Thinking Process (Click to inspect)</summary>
                            <div style={{ marginTop: '0.4rem', whiteSpace: 'pre-wrap', color: 'var(--tx)', opacity: 0.85, fontSize: '0.82rem' }}>
                              {m.reasoningContent}
                            </div>
                          </details>
                        )}
                        <div style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="chat-msg ai" style={{ fontStyle: 'italic', color: 'var(--mu)' }}>
                        UniDesk Gemini AI is analyzing database records...
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>
                </div>
              )}
              
              <form className="row" onSubmit={handleSearchAndAskAI}>
                <input
                  id="q"
                  aria-label="Search an issue or ask AI"
                  value={searchQuery}
                  placeholder="Ask a question or enter a concern (e.g. 'I lost my student ID card')..."
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>⚡ Search & Ask AI Concierge</span>
                </button>
              </form>
            </div>

            {/* Quick Suggestion Chips */}
            <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              <span className="mu sm2" style={{ alignSelf: 'center', fontWeight: 600 }}>Suggested Inquiries:</span>
              {[
                "Lost my student ID card",
                "Where is the Registrar and what are their hours?",
                "How do I request an official transcript of records?",
                "Tuition fee assessment and refund process",
                "Campus health clinic medical clearance"
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="sm"
                  onClick={() => {
                    setSubmittedSearchQuery(chip);
                    setSearchQuery('');
                    setIsAiPanelRevealed(true);
                    const refOff = detectReferredOffice(chip, null);
                    setAiReferredOffice(refOff || null);
                    triggerAIChatQuery(chip);
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Structured Search Results */}
            {(() => {
              const activeSearch = (submittedSearchQuery || searchQuery).trim();
              return activeSearch ? (
                <div style={{ marginTop: '1.5rem' }}>
                  <h2>Directory Matches for “{activeSearch}”</h2>
                  {(() => {
                    const q = activeSearch.toLowerCase().trim();
                    const stopWords = new Set(['i', 'need', 'a', 'the', 'for', 'my', 'to', 'in', 'at', 'is', 'where', 'how', 'do', 'can', 'get', 'about', 'and', 'or', 'of', 'me', 'please']);
                    const queryWords = q.split(/[\s,?.!;:()]+/).filter(w => w.length > 2 && !stopWords.has(w));

                    // 1. Determine if an office is referred by the AI Concierge
                    const referredOffice = aiReferredOffice || detectReferredOffice(activeSearch, chatMessages[chatMessages.length - 1]?.text);

                  // 2. Direct text matches
                  let matched = issues.filter(i => {
                    const text = (i.k + " " + i.c + " " + (i.desc || "")).toLowerCase();
                    if (text.includes(q)) return true;
                    return queryWords.some(w => text.includes(w));
                  });

                  let matchedOffices = offices.filter(o => {
                    const text = (o.n + " " + o.d + " " + o.b).toLowerCase();
                    if (text.includes(q)) return true;
                    return queryWords.some(w => text.includes(w));
                  });

                  const matchedFacilities = facilities.filter(f => {
                    const text = (f.n + " " + f.t + " " + (f.d || "") + " " + f.b).toLowerCase();
                    if (text.includes(q)) return true;
                    return queryWords.some(w => text.includes(w));
                  });

                  // 3. If an office was referred by the AI Concierge, it MUST appear and serve as reference!
                  if (referredOffice) {
                    matchedOffices = [
                      referredOffice,
                      ...matchedOffices.filter(o => o.id !== referredOffice.id)
                    ];

                    // Pull in all services/issues offered by this referred office
                    const officeIssues = issues.filter(i => i.o === referredOffice.id);
                    // Sort office issues prioritizing those matching query words
                    const sortedOfficeIssues = [...officeIssues].sort((a, b) => {
                      const aMatch = queryWords.some(w => (a.k + " " + (a.desc || "")).toLowerCase().includes(w));
                      const bMatch = queryWords.some(w => (b.k + " " + (b.desc || "")).toLowerCase().includes(w));
                      if (aMatch && !bMatch) return -1;
                      if (!aMatch && bMatch) return 1;
                      return 0;
                    });

                    const existingKeys = new Set(matched.map(m => m.k));
                    for (const oi of sortedOfficeIssues) {
                      if (!existingKeys.has(oi.k)) {
                        matched.push(oi);
                        existingKeys.add(oi.k);
                      }
                    }
                  }

                  if (!matched.length && !matchedOffices.length && !matchedFacilities.length) {
                    return (
                      <div className="note">
                        No direct directory matches for “{activeSearch}”. Refer to the AI Concierge response above or browse all offices & facilities below.
                      </div>
                    );
                  }

                  return (
                    <div>
                      {/* AI Concierge Reference Banner */}
                      {referredOffice && (
                        <div style={{
                          background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08), rgba(99, 102, 241, 0.08))',
                          border: '1.5px solid rgba(2, 132, 199, 0.35)',
                          borderRadius: '10px',
                          padding: '1rem 1.25rem',
                          marginBottom: '1.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          flexWrap: 'wrap',
                          boxShadow: '0 2px 8px rgba(2, 132, 199, 0.06)'
                        }}>
                          <div>
                            <span style={{ 
                              fontSize: '0.75rem', 
                              fontWeight: 700, 
                              textTransform: 'uppercase', 
                              letterSpacing: '0.05em', 
                              color: '#0284c7',
                              background: '#e0f2fe',
                              padding: '3px 9px',
                              borderRadius: '4px',
                              display: 'inline-block',
                              marginBottom: '0.35rem'
                            }}>
                              ✨ AI Concierge Reference
                            </span>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                              Referred Office: <strong>{referredOffice.n}</strong>
                            </div>
                            <div className="sm2" style={{ color: '#475569', marginTop: '0.2rem' }}>
                              📍 <b>Location:</b> {referredOffice.b}, Room {referredOffice.r} &nbsp;|&nbsp; ⏰ <b>Hours:</b> {referredOffice.h}
                            </div>
                            <small style={{ color: '#64748b', display: 'block', marginTop: '0.25rem' }}>
                              The AI Concierge identified this office as the primary department handling your inquiry.
                            </small>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button 
                              className="sm" 
                              style={{ background: '#0284c7', color: '#fff', border: 'none', fontWeight: 600, padding: '0.5rem 0.9rem' }}
                              onClick={() => openOfficeDetail(referredOffice)}
                            >
                              Services Offered &rarr;
                            </button>
                            <button 
                              className="sm"
                              onClick={() => { setSelectedBuilding(referredOffice.b); navigateTo('map'); }}
                            >
                              Show on Campus Map
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="grid">
                        {/* Matched Administrative Offices */}
                        {matchedOffices.map(o => (
                          <div 
                            key={`off-${o.id}`} 
                            style={referredOffice?.id === o.id ? { border: '2px solid #0284c7', borderRadius: '10px', background: '#f8fafc', padding: '0.3rem' } : {}}
                          >
                            {referredOffice?.id === o.id && (
                              <div style={{ padding: '0.4rem 0.6rem 0.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="mu sm2" style={{ fontWeight: 700, color: '#0284c7' }}>🏛️ Handling Department</span>
                                <span className="rb" style={{ background: '#e0f2fe', color: '#0284c7', fontWeight: 700, fontSize: '0.72rem' }}>
                                  ✨ AI Referred
                                </span>
                              </div>
                            )}
                            <OfficeCard 
                              o={o} 
                              onSelect={() => openOfficeDetail(o)} 
                              onShowOnMap={(b) => { setSelectedBuilding(b); navigateTo('map'); }} 
                            />
                          </div>
                        ))}

                        {/* Matched Services / Issues */}
                        {matched.map((item, idx) => {
                          const o = getOffice(item.o);
                          const isReferredService = referredOffice?.id === item.o;
                          return (
                            <div className="card" key={`issue-${idx}`}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                <span className="mu sm2">{item.c}</span>
                                {isReferredService && (
                                  <span className="rb" style={{ background: '#ecfdf5', color: '#059669', fontWeight: 700, fontSize: '0.72rem' }}>
                                    Offered Service
                                  </span>
                                )}
                              </div>
                              <h3 style={{ margin: '0.2rem 0' }}>{item.k}</h3>
                              <p className="sm2" style={{ color: 'var(--mu, #64748b)', margin: '0.25rem 0 0.5rem 0' }}>
                                {item.desc || `Official administrative service processed by ${o.n}.`}
                              </p>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.5rem 0' }}>
                                <span className="sm2"><b>Fee:</b> {item.fee > 0 ? `₱${item.fee}` : 'Free'}</span>
                                <span className="sm2"><b>Office:</b> {o.n}</span>
                              </div>
                              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <button 
                                  className="sm" 
                                  style={{ background: 'var(--nv)', color: '#fff', border: 'none' }}
                                  onClick={() => openOfficeDetail(o)}
                                >
                                  Office Services &rarr;
                                </button>
                                <button 
                                  className="sm"
                                  onClick={() => {
                                    setNewOfficeId(item.o);
                                    setNewFormId(1);
                                    setNewPurpose(item.k);
                                    navigateTo('newreq');
                                  }}
                                >
                                  Book / Request Form
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* Matched Facilities */}
                        {matchedFacilities.map(f => (
                          <div className="card" key={`fac-${f.id}`}>
                            <span className="mu sm2">{f.t}</span>
                            <h3>{f.n}</h3>
                            <div className="sm2">📍 {f.b}</div>
                            <div className="sm2"><b>⏰ Hours:</b> {f.h}</div>
                            {f.d && <p className="sm2" style={{ color: 'var(--mu, #64748b)', marginTop: '0.4rem' }}>{f.d}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                <p style={{ marginTop: '1rem' }}>
                  <button className="sm" onClick={() => { setSearchQuery(''); setSubmittedSearchQuery(''); setAiReferredOffice(null); }}>Clear search filter</button>
                </p>
              </div>
            ) : (
              <div style={{ marginTop: '1.5rem' }}>
                <h2>Browse Campus Services by Category</h2>
                <div className="chips">
                  {[...new Set(issues.map(i => i.c))].map(c => (
                    <button key={c} className="chip" onClick={() => {
                      setSubmittedSearchQuery(c);
                      setSearchQuery('');
                      const refOff = detectReferredOffice(c, null);
                      setAiReferredOffice(refOff || null);
                    }}>
                      {c}
                    </button>
                  ))}
                </div>

                <h2>Key Campus Administrative Offices</h2>
                <div className="grid">
                  {offices.map(o => (
                    <OfficeCard 
                      key={o.id} 
                      o={o} 
                      handles={issues.filter(i => i.o === o.id).map(i => i.k).join(", ")}
                      forms={formTypes.filter(f => f.o === o.id && f.a && !f.isAppointment).map(f => f.n).join(", ")}
                      onSelect={() => openOfficeDetail(o)}
                      onShowOnMap={(b) => { setSelectedBuilding(b); navigateTo('map'); }} 
                    />
                  ))}
                </div>
              </div>
            );
          })()}
          </div>
        )}

        {/* VIEW: MERGED OFFICES & FACILITIES */}
        {view === 'offices-facilities' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.5rem', marginBottom: '1rem' }}>
              <div>
                <h1 style={{ margin: 0 }}>Offices & Campus Facilities</h1>
                <span className="mu sm2">Unified directory of administrative offices, academic buildings, and recreation hubs</span>
              </div>
            </div>

            {/* Filter Chips */}
            <div className="chips">
              {["All", "Administrative Offices", "Academic Facilities", "Administrative Facilities", "Recreation & Events"].map(category => (
                <button
                  key={category}
                  className={`chip ${facilityCategoryFilter === category ? 'on' : ''}`}
                  onClick={() => setFacilityCategoryFilter(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Administrative Offices Section */}
            {(facilityCategoryFilter === "All" || facilityCategoryFilter === "Administrative Offices") && (
              <div style={{ marginTop: '1.5rem' }}>
                <h2>🏛️ Administrative Offices</h2>
                <div className="grid">
                  {offices.map(o => (
                    <div className="card card-clickable" key={o.id} onClick={() => openOfficeDetail(o)}>
                      <h3>{o.n}</h3>
                      <div className="mu sm2">📍 {o.b}, Room {o.r}</div>
                      <p>{o.d}</p>
                      <div className="sm2"><b>⏰ Hours:</b> {o.h}</div>
                      <div className="sm2" style={{ marginTop: '0.4rem' }}>
                        <b>📋 Key Services:</b> {issues.filter(i => i.o === o.id).map(i => i.k).join(", ") || "—"}
                      </div>
                      <div style={{ marginTop: '.85rem', display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                        <button className="sm" style={{ background: 'var(--nv)', color: '#fff', border: 'none' }} onClick={(e) => { e.stopPropagation(); openOfficeDetail(o); }}>
                          View Services Offered &rarr;
                        </button>
                        <button className="sm" onClick={(e) => { e.stopPropagation(); setSelectedBuilding(o.b); navigateTo('map'); }}>
                          Show on Map
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Campus Facilities Section */}
            {(facilityCategoryFilter === "All" || facilityCategoryFilter !== "Administrative Offices") && (
              <div style={{ marginTop: '2rem' }}>
                <h2>🏫 Campus Facilities & Learning Centers</h2>
                <div className="grid">
                  {facilities
                    .filter(f => facilityCategoryFilter === "All" || f.t === facilityCategoryFilter)
                    .map(f => (
                      <div 
                        className="card card-clickable" 
                        key={f.id}
                        onClick={() => { setSelectedBuilding(f.b); navigateTo('map'); }}
                        style={{ cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span className="mu sm2 tag-badge">{f.t}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--primary-light, #38bdf8)', fontWeight: 600 }}>
                            {f.b}
                          </span>
                        </div>
                        <h3 style={{ marginTop: '0.45rem', fontSize: '1.15rem' }}>{f.n}</h3>
                        <div className="sm2" style={{ color: '#38bdf8', fontWeight: 600 }}>📍 Located in {f.b}</div>
                        <p className="sm2" style={{ marginTop: '0.35rem', lineHeight: 1.5 }}>{f.d}</p>
                        <div className="sm2" style={{ marginTop: '0.35rem' }}><b>⏰ Operating Hours:</b> {f.h}</div>
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                          <button 
                            className="pr sm" 
                            style={{ 
                              background: 'var(--gd, #f6c915)', 
                              color: 'var(--gt, #1e293b)', 
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookFacilityAppointment(f);
                            }}
                          >
                            📅 Book In-Person Appointment (No Fee)
                          </button>
                          <button 
                            className="sm" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setSelectedBuilding(f.b); 
                              navigateTo('map'); 
                            }}
                          >
                            🗺️ Locate on Live Map
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW: DEDICATED OFFICE SERVICES OFFERED INTERFACE */}
        {view === 'office-detail' && selectedOfficeDetail && (() => {
          const o = selectedOfficeDetail;
          const officeServices = issues.filter(i => i.o === o.id);
          const officeForms = formTypes.filter(f => f.o === o.id && f.a);

          return (
            <div>
              <button className="sm" onClick={() => navigateTo('offices-facilities')} style={{ marginBottom: '1rem' }}>
                &larr; Back to Directory
              </button>

              <div className="hero" style={{ borderLeftColor: 'var(--gd)' }}>
                <span className="tag-badge" style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#fff', borderColor: 'rgba(255, 255, 255, 0.3)' }}>
                  Administrative Office
                </span>
                <h1 style={{ marginTop: '0.4rem', color: '#fff' }}>{o.n}</h1>
                <p style={{ color: '#d4e6da' }}>{o.d}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem', marginTop: '1rem', background: 'rgba(0, 0, 0, 0.25)', padding: '1rem', borderRadius: '8px' }}>
                  <div>📍 <strong>Location:</strong> {o.b}, Room {o.r}</div>
                  <div>⏰ <strong>Hours:</strong> {o.h}</div>
                  <div>📞 <strong>Contact:</strong> {o.phone}</div>
                  <div>✉️ <strong>Email:</strong> {o.email}</div>
                </div>
              </div>

              {o.dir && (
                <div className="note" style={{ marginTop: '1.2rem' }}>
                  🧭 <strong>Desk Walking Directions:</strong> {o.dir}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', margin: '1.25rem 0' }}>
                <button
                  className="pr"
                  onClick={() => {
                    setNewOfficeId(o.id);
                    setNewFormId(99); // In-person appointment
                    navigateTo('newreq');
                  }}
                >
                  📅 Book In-Person Appointment (No Fee)
                </button>
                <button
                  className="pr"
                  style={{ background: 'var(--nv)', color: '#fff' }}
                  onClick={() => {
                    setNewOfficeId(o.id);
                    const firstForm = officeForms.find(f => !f.isAppointment);
                    if (firstForm) setNewFormId(firstForm.id);
                    navigateTo('newreq');
                  }}
                >
                  📄 Request an Official Document
                </button>
                <button
                  className="sm"
                  onClick={() => {
                    setSelectedBuilding(o.b);
                    navigateTo('map');
                  }}
                >
                  🗺️ View Building on Map
                </button>
              </div>

              {/* Handled Services & Issues */}
              <h2>📋 Available Services & Administrative Concerns Handled</h2>
              <div className="grid">
                {officeServices.map((iss, i) => (
                  <div className="card" key={i}>
                    <span className="mu sm2 tag-badge">{iss.c}</span>
                    <h3 style={{ marginTop: '0.3rem' }}>{iss.k}</h3>
                    <p className="sm2">{iss.desc}</p>
                    <div className="sm2">
                      Standard Fee: <strong>{iss.fee === 0 ? "FREE / No Charge" : `₱${iss.fee}.00`}</strong>
                    </div>
                  </div>
                ))}
              </div>

              {/* Forms Offered */}
              <h2 style={{ marginTop: '2rem' }}>📄 Official Forms & Certifications Issued</h2>
              <div className="scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Document / Form Name</th>
                      <th>Standard Processing Time</th>
                      <th>Fee (PHP)</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {officeForms.filter(f => !f.isAppointment).map(f => (
                      <tr key={f.id}>
                        <td><strong>{f.n}</strong></td>
                        <td>{f.d} working days</td>
                        <td>₱{f.fee}.00</td>
                        <td>
                          <button
                            className="sm"
                            onClick={() => {
                              setNewOfficeId(o.id);
                              setNewFormId(f.id);
                              navigateTo('newreq');
                            }}
                          >
                            Request Document
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!officeForms.filter(f => !f.isAppointment).length && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--mu)' }}>
                          This office primarily provides direct consultation and walk-in services.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* VIEW: CAMPUS MAP */}
        {view === 'map' && (
          <CampusMapView 
            selectedBuilding={selectedBuilding}
            onSelectBuilding={setSelectedBuilding}
            offices={offices}
            facilities={facilities}
            issues={issues}
            onOpenOfficeDetail={openOfficeDetail}
            onBookAppointment={handleBookFacilityAppointment}
          />
        )}

        {/* VIEW: MY REQUESTS (Student / Visitor) */}
        {view === 'myreq' && (
          !user ? (
            <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center', padding: '2.5rem 1.75rem', borderRadius: '16px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📋</div>
              <h2 style={{ margin: '0 0 0.5rem 0' }}>Sign In to View Your Transactions</h2>
              <p className="mu sm2" style={{ maxWidth: '420px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
                Track the status of your document requests, upcoming in-person office consultations, and pickup notifications.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="pr"
                  style={{ background: 'var(--nv)', color: '#fff', padding: '0.55rem 1.25rem' }}
                  onClick={() => openAuth('in', 'Sign in to access your transaction records.')}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className="sm"
                  onClick={() => openAuth('reg', 'Create an account to start submitting requests.')}
                >
                  Register Account
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h1>My Requests & Appointments</h1>
              <p>
                <button className="pr" style={{ background: 'var(--nv)', color: '#fff' }} onClick={() => navigateTo('newreq')}>
                  + Request a Service or Appointment
                </button>
              </p>
              <div className="scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Document / Appointment</th>
                      <th>Copies</th>
                      <th>Scheduled Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.filter(r => r.by === user?.n || r.userEmail === user?.e).map(r => (
                      <tr key={r.ref}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.ref}</td>
                        <td>
                          <div>{getForm(r.ft).n}</div>
                          {r.locationOverride && (
                            <span style={{ fontSize: '0.78rem', color: 'var(--wn)', fontWeight: 600 }}>
                              ⚠️ Relocated: {r.locationOverride}
                            </span>
                          )}
                        </td>
                        <td>{r.isAppointment ? "N/A (In-person)" : r.c}</td>
                        <td>{r.date || "Scheduled"} ({r.slot || "10:00 AM"})</td>
                        <td>
                          <span className={`b ${r.s}`}>{r.s === "ready" ? "ready for pickup" : r.s}</span>
                        </td>
                        <td>
                          <button className="sm" onClick={() => navigateTo('detail', r.ref)}>
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!requests.filter(r => r.by === user?.n || r.userEmail === user?.e).length && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--mu)' }}>
                          You haven't submitted any requests or appointments yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {/* VIEW: REQUEST A SERVICE OR APPOINTMENT */}
        {view === 'newreq' && (
          !user ? (
            <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center', padding: '2.5rem 1.75rem', borderRadius: '16px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏛️</div>
              <h2 style={{ margin: '0 0 0.5rem 0' }}>Account Required to Request Services</h2>
              <p className="mu sm2" style={{ maxWidth: '420px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
                Official university document requests and in-person consultation appointments are recorded in the university database. Please sign in or register to submit a transaction.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="pr"
                  style={{ background: 'var(--nv)', color: '#fff', padding: '0.55rem 1.25rem' }}
                  onClick={() => openAuth('in', 'Please sign in to submit your transaction request.')}
                >
                  Sign In to Continue
                </button>
                <button
                  type="button"
                  className="pr"
                  style={{ background: 'var(--gd)', color: 'var(--gt)', padding: '0.55rem 1.25rem' }}
                  onClick={() => openAuth('reg', 'Create an account to submit document requests and office appointments.')}
                >
                  Create New Account
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h1>Request a Service or Office Appointment</h1>
              <form className="f" onSubmit={handleSubmitRequest}>
                <label>
                  Select Office
                  <select
                    value={newOfficeId}
                    onChange={(e) => {
                      const oId = Number(e.target.value);
                      setNewOfficeId(oId);
                      // Set default form for this office
                      const availableForOffice = formTypes.filter(f => f.o === oId && f.a);
                      if (availableForOffice.length > 0) {
                        setNewFormId(availableForOffice[0].id);
                      }
                    }}
                  >
                    {offices.map(o => (
                      <option key={o.id} value={o.id}>{o.n} ({o.b})</option>
                    ))}
                  </select>
                </label>

                <label>
                  Request Type / Document
                  <select
                    value={newFormId}
                    onChange={(e) => setNewFormId(e.target.value === 'appointment' ? 99 : Number(e.target.value))}
                  >
                    <option value={99}>📅 In-Person Office Appointment & Consultation (No Fee)</option>
                    {formTypes.filter(f => f.a && !f.isAppointment && f.o === Number(newOfficeId)).map(f => (
                      <option key={f.id} value={f.id}>{f.n} (₱{f.fee} per copy)</option>
                    ))}
                  </select>
                </label>

                {/* Service Details & Fee Calculation */}
                {(() => {
                  const isAppt = Number(newFormId) === 99;
                  const f = isAppt ? { fee: 0, d: 1, isAppointment: true } : getForm(newFormId);
                  const o = getOffice(newOfficeId);
                  const officeServices = issues.filter(i => i.o === o.id);

                  return (
                    <div>
                      <div className="note sm2">
                        {isAppt ? (
                          <>
                            Appointment Type: <strong>In-Person Office Consultation</strong> &bull; Fee: <strong style={{ color: 'var(--ok)' }}>₱0 (FREE)</strong> &bull; Office: <strong>{o.n} ({o.b} Room {o.r})</strong>
                          </>
                        ) : (
                          <>
                            Fee: <strong>₱{f.fee}</strong> per copy &bull; Processing Time: <strong>{f.d} working days</strong> &bull; Office: <strong>{o.n} ({o.b} Room {o.r})</strong>
                          </>
                        )}
                      </div>

                      {/* Show available services offered by this office */}
                      <div style={{ marginTop: '0.4rem', padding: '0.75rem', background: 'var(--cd)', border: '1px solid var(--ln)', borderRadius: '8px' }}>
                        <span className="mu sm2" style={{ fontWeight: 600 }}>All Services Offered by {o.n}:</span>
                        <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.25rem', fontSize: '0.85rem' }}>
                          {officeServices.map((iss, idx) => (
                            <li key={idx}>
                              <strong>{iss.k}</strong>: {iss.desc} ({iss.fee === 0 ? "Free" : `₱${iss.fee}`})
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })()}

                {/* Appointment Date and Time Slot Picker (for appointment option) */}
                {Number(newFormId) === 99 && (
                  <div className="g2">
                    <label>
                      Preferred Date
                      <input
                        type="date"
                        required
                        value={newApptDate}
                        onChange={e => setNewApptDate(e.target.value)}
                      />
                    </label>
                    <label>
                      Time Slot
                      <select value={newApptSlot} onChange={e => setNewApptSlot(e.target.value)}>
                        <option value="08:30 AM">08:30 AM</option>
                        <option value="09:15 AM">09:15 AM</option>
                        <option value="10:00 AM">10:00 AM</option>
                        <option value="10:45 AM">10:45 AM</option>
                        <option value="01:30 PM">01:30 PM</option>
                        <option value="02:15 PM">02:15 PM</option>
                        <option value="03:00 PM">03:00 PM</option>
                      </select>
                    </label>
                  </div>
                )}

                <label>
                  {Number(newFormId) === 99 ? "Purpose of Appointment / Issue to Discuss" : "Purpose of Request"}
                  <input
                    required
                    placeholder={Number(newFormId) === 99 ? "e.g. Inquire about graduation clearance" : "e.g. Job application / scholarship requirements"}
                    value={newPurpose}
                    onChange={(e) => setNewPurpose(e.target.value)}
                  />
                </label>

                {/* REMOVE NUMBER OF COPIES when appointment reservation is selected */}
                {Number(newFormId) !== 99 && (
                  <label>
                    Number of Copies
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newCopies}
                      onChange={(e) => setNewCopies(Number(e.target.value))}
                    />
                  </label>
                )}

                <button type="submit" className="pr" style={{ background: 'var(--nv)', color: '#fff', marginTop: '.5rem' }}>
                  {Number(newFormId) === 99 ? "Confirm Appointment Reservation (₱0 Fee)" : "Submit Document Request"}
                </button>
              </form>
            </div>
          )
        )}

        {/* VIEW: REQUEST DETAIL */}
        {view === 'detail' && (() => {
          const r = requests.find(x => x.ref === viewArg);
          if (!r) return <div className="note">Request not found.</div>;
          const f = getForm(r.ft);
          const o = getOffice(r.officeId || f.o);

          return (
            <div>
              <h1>Request {r.ref}</h1>
              <p>
                <span className={`b ${r.s}`}>{r.s === "ready" ? "ready for pickup" : r.s}</span>
              </p>

              {r.s === "ready" && (
                <div className="note">
                  <b>Ready for pickup.</b> Claim it at <strong>{o.n}</strong> ({o.b} Room {o.r}) on or before <strong>{r.dl}</strong>.
                </div>
              )}

              {r.locationOverride && (
                <div className="note" style={{ borderLeftColor: 'var(--wn)' }}>
                  <b>⚠️ Notice of Relocation:</b> Due to unforeseen circumstances, this service desk was temporarily relocated to: <strong>{r.locationOverride}</strong>.
                </div>
              )}

              <div className="card">
                <h3>{f.n}</h3>
                <div className="sm2">
                  Purpose: <strong>{r.p}</strong> &bull; {r.isAppointment ? "Appointment" : `Copies: ${r.c}`} &bull; Total Fee: <strong>₱{f.fee * (r.isAppointment ? 1 : r.c)}</strong>
                </div>
                <div className="sm2 mu" style={{ marginTop: '.3rem' }}>
                  Requested by: {r.by} &bull; Handling Office: {o.n} ({o.b} Room {o.r})
                </div>
              </div>

              <h2>Status History Timeline</h2>
              <ul className="tl">
                {r.h.map(([st, dt], idx) => (
                  <li key={idx}>
                    <span className={`b ${st}`}>{st}</span> <span className="mu sm2">{dt}</span>
                  </li>
                ))}
              </ul>

              <button className="sm" onClick={() => navigateTo(user.role === 'staff' ? 'queue' : 'myreq')}>
                &larr; Back to List
              </button>
            </div>
          );
        })()}

        {/* VIEW: STAFF REVIEW QUEUE WITH ACTION VALIDATION NOTICE */}
        {view === 'queue' && (
          <div>
            <h1>Staff Review Queue</h1>
            <p className="mu">
              Showing pending, approved, and ready requests for <strong>{getOffice(user.office).n}</strong> (your assigned office).
            </p>
            <div className="scroll">
              <table>
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Student / Requester</th>
                    <th>Requested Service / Form</th>
                    <th>Date & Slot</th>
                    <th>Status</th>
                    <th>Office Actions (With Validation)</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.filter(r => (r.officeId === user.office) || (getForm(r.ft).o === user.office)).map(r => (
                    <tr key={r.ref}>
                      <td>
                        <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('detail', r.ref); }} style={{ fontWeight: 700, color: 'var(--nv)' }}>
                          {r.ref}
                        </a>
                      </td>
                      <td>
                        <strong>{r.by}</strong>
                        <div className="sm2 mu">{r.userEmail}</div>
                      </td>
                      <td>
                        <div>{getForm(r.ft).n} {r.isAppointment ? "(Appointment)" : `×${r.c}`}</div>
                        {r.locationOverride && <span style={{ fontSize: '0.78rem', color: 'var(--wn)' }}>⚠️ {r.locationOverride}</span>}
                      </td>
                      <td>{r.date || "Scheduled"} ({r.slot || "10:00 AM"})</td>
                      <td>
                        <span className={`b ${r.s}`}>{r.s === "ready" ? "ready for pickup" : r.s}</span>
                      </td>
                      <td>
                        {r.s === 'pending' && (
                          <>
                            <button className="sm" onClick={() => requestOfficeActionWithNotice(r.ref, 'approved', 'Approve Request')}>
                              Approve
                            </button>
                            <button className="sm dg" onClick={() => requestOfficeActionWithNotice(r.ref, 'rejected', 'Reject Request')}>
                              Reject
                            </button>
                          </>
                        )}
                        {r.s === 'approved' && (
                          <button className="sm" onClick={() => requestOfficeActionWithNotice(r.ref, 'ready', 'Mark Ready for Pickup')}>
                            Mark Ready
                          </button>
                        )}
                        {r.s === 'ready' && (
                          <button className="sm" onClick={() => requestOfficeActionWithNotice(r.ref, 'claimed', 'Mark as Claimed')}>
                            Mark Claimed
                          </button>
                        )}
                        {(r.s === 'claimed' || r.s === 'rejected' || r.s === 'confirmed') && (
                          <span className="mu sm2">Operational ({r.s})</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!requests.filter(r => (r.officeId === user.office) || (getForm(r.ft).o === user.office)).length && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--mu)' }}>
                        No pending requests for your office at this moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW: NOTIFICATIONS (INCLUDING ADMIN LOGINS & REGISTRATIONS) */}
        {view === 'notifs' && (
          <div>
            <h1>Notifications & System Audit</h1>
            <p>
              <button className="sm" onClick={() => {
                setNotifications(prev => prev.map(n => (n.u === user.n || (user.role === 'admin' && n.forAdmin)) ? { ...n, r: 1 } : n));
                showToast("All notifications marked as read");
              }}>
                Mark all as read
              </button>
            </p>
            {notifications.filter(n => n.u === user.n || (user.role === 'admin' && n.forAdmin)).length ? (
              notifications.filter(n => n.u === user.n || (user.role === 'admin' && n.forAdmin)).map((n, i) => (
                <div className={`card ${n.r ? '' : 'unread'}`} style={{ marginBottom: '.6rem' }} key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <b>{n.t}</b>
                    <span className="mu sm2">{n.at}</span>
                  </div>
                  <div style={{ marginTop: '0.2rem' }}>{n.m}</div>
                </div>
              ))
            ) : (
              <p className="mu">Nothing yet. You will be notified when system activity or request status changes.</p>
            )}
          </div>
        )}

        {/* VIEW: CLICKABLE ADMIN DASHBOARD */}
        {view === 'dash' && (() => {
          const topQueries = Object.entries(searchLogs).sort((a, b) => b[1] - a[1]);
          const maxVal = topQueries.length ? Math.max(...topQueries.map(x => x[1])) : 1;

          return (
            <div>
              <h1>Operational Dashboard (Interactive)</h1>
              <p className="mu">Click any card below to jump directly to its operational management interface:</p>

              <div className="grid">
                <div className="card card-clickable" onClick={() => navigateTo('offices-facilities')} title="Click to view Offices & Facilities">
                  <div className="stat">{offices.length}</div>
                  <div className="mu" style={{ fontWeight: 700 }}>Administrative Offices &rarr;</div>
                  <small style={{ color: 'var(--mu)' }}>Click to manage offices & campus buildings</small>
                </div>

                <div className="card card-clickable" onClick={() => navigateTo('manage-accounts')} title="Click to manage all accounts">
                  <div className="stat">{users.length}</div>
                  <div className="mu" style={{ fontWeight: 700 }}>Registered Accounts (CRUD) &rarr;</div>
                  <small style={{ color: 'var(--mu)' }}>Click to approve staff, manage transfers & edit users</small>
                </div>

                <div className="card card-clickable" onClick={() => { setManageTab('Issues'); navigateTo('manage'); }} title="Click to manage categorized issues">
                  <div className="stat">{issues.length}</div>
                  <div className="mu" style={{ fontWeight: 700 }}>Categorized Issues & Fees &rarr;</div>
                  <small style={{ color: 'var(--mu)' }}>Click to view issues table</small>
                </div>

                <div className="card card-clickable" onClick={() => navigateTo('queue')} title="Click to view requests queue">
                  <div className="stat">{requests.filter(r => r.s === "pending").length}</div>
                  <div className="mu" style={{ fontWeight: 700 }}>Pending Requests & Queue &rarr;</div>
                  <small style={{ color: 'var(--mu)' }}>Click to view review queue</small>
                </div>

                <div className="card card-clickable" onClick={() => document.getElementById('search-logs-section')?.scrollIntoView({ behavior: 'smooth' })}>
                  <div className="stat">{Object.values(searchLogs).reduce((a, b) => a + b, 0)}</div>
                  <div className="mu" style={{ fontWeight: 700 }}>Total Searches Logged &darr;</div>
                  <small style={{ color: 'var(--mu)' }}>Click to view search frequency analytics</small>
                </div>
              </div>

              <h2 id="search-logs-section" style={{ marginTop: '2.5rem' }}>Most Searched Student Queries</h2>
              <div className="card">
                {topQueries.map(([term, count], idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '170px 1fr 40px', gap: '.8rem', alignItems: 'center', margin: '.45rem 0' }}>
                    <span style={{ fontWeight: 600 }}>{term}</span>
                    <div className="bar" style={{ width: `${(count / maxVal) * 100}%` }}></div>
                    <span style={{ textAlign: 'right', fontWeight: 700 }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* VIEW: ADMIN ACCOUNT MANAGEMENT (FULL CRUD & STAFF APPROVALS) */}
        {view === 'manage-accounts' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.5rem', marginBottom: '1.25rem' }}>
              <div>
                <h1 style={{ margin: 0 }}>Registered Accounts Directory (CRUD)</h1>
                <span className="mu sm2">Manage user credentials, roles, staff office approvals, and office transfers</span>
              </div>
              <button className="pr" onClick={() => setShowAddUserModal(true)}>
                + Add User Account
              </button>
            </div>

            {/* Filter Chips */}
            <div className="chips">
              {["All", "Pending Approval", "staff", "student", "visitor", "admin"].map(roleFilter => (
                <button
                  key={roleFilter}
                  className={`chip ${userRoleFilter === roleFilter ? 'on' : ''}`}
                  onClick={() => setUserRoleFilter(roleFilter)}
                >
                  {roleFilter === 'All' ? 'All Accounts' : roleFilter === 'Pending Approval' ? '⏳ Pending Approval' : ROLE_LABELS[roleFilter] || roleFilter}
                </button>
              ))}
            </div>

            <div className="scroll" style={{ marginTop: '1.25rem' }}>
              <table>
                <thead>
                  <tr>
                    <th>Account Holder</th>
                    <th>Email Address</th>
                    <th>Role</th>
                    <th>ID / Department</th>
                    <th>Assigned Office</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Admin CRUD Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter(u => {
                      if (userRoleFilter === 'All') return true;
                      if (userRoleFilter === 'Pending Approval') return u.status === 'pending_approval' || !!u.transferRequest;
                      return u.role === userRoleFilter;
                    })
                    .map((u, i) => {
                      const isPending = u.status === 'pending_approval';
                      const hasTransfer = !!u.transferRequest;

                      return (
                        <tr key={i}>
                          <td>
                            <strong>{u.n}</strong>
                          </td>
                          <td>{u.e}</td>
                          <td>
                            <span className={`rb ${u.role}`}>{ROLE_LABELS[u.role].toUpperCase()}</span>
                          </td>
                          <td>
                            <div>{u.id || "N/A"}</div>
                            <div className="sm2 mu">{u.dept || "—"}</div>
                          </td>
                          <td>
                            {u.role === 'staff' ? (
                              <div>
                                <div>{getOffice(u.office).n}</div>
                                {hasTransfer && (
                                  <div style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 600 }}>
                                    ⚠️ Transfer requested to: {u.transferRequest.toOfficeName}
                                  </div>
                                )}
                              </div>
                            ) : "—"}
                          </td>
                          <td>
                            {isPending ? (
                              <span className="rb pending">Pending Approval</span>
                            ) : (
                              <span className="b ready">Active</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '.3rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              {/* Staff / Admin Approval Action */}
                              {isPending && (
                                <button className="sm" style={{ background: 'var(--nv)', color: '#fff' }} onClick={() => handleApproveStaffAccount(u.e)}>
                                  {u.role === 'admin' ? "Approve Admin" : "Approve Staff"}
                                </button>
                              )}

                              {/* Staff Transfer Confirmation Action */}
                              {hasTransfer && (
                                <>
                                  <button className="sm" style={{ background: 'var(--gd)', color: 'var(--gt)' }} onClick={() => handleConfirmStaffTransfer(u.e, true)}>
                                    Confirm Transfer
                                  </button>
                                  <button className="sm dg" onClick={() => handleConfirmStaffTransfer(u.e, false)}>
                                    Decline
                                  </button>
                                </>
                              )}

                              {/* Edit User Button */}
                              <button className="sm" onClick={() => setEditingUserItem({ ...u })}>
                                Edit
                              </button>

                              {/* Delete User Button */}
                              {u.e !== user.e && (
                                <button className="sm dg" onClick={() => setDeletingUserItem(u)}>
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW: MANAGE DATA (Data CRUD for Offices, Issues, Forms, Facilities) */}
        {view === 'manage' && (
          <ManageDataView 
            user={user}
            offices={offices} setOffices={setOffices}
            issues={issues} setIssues={setIssues}
            formTypes={formTypes} setFormTypes={setFormTypes}
            facilities={facilities} setFacilities={setFacilities}
            manageTab={manageTab} setManageTab={setManageTab}
            editIndex={editIndex} setEditIndex={setEditIndex}
            showToast={showToast}
          />
        )}

        {/* MODAL: OFFICE ACTION VALIDATION NOTICE */}
        {confirmNotice && (
          <div className="modal-overlay" onClick={() => setConfirmNotice(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
              <div className="modal-header">
                <h3 style={{ margin: 0, color: 'var(--nv)' }}>⚠️ {confirmNotice.title}</h3>
                <button className="sm" onClick={() => setConfirmNotice(null)}>✕</button>
              </div>
              <p>{confirmNotice.message}</p>
              <div className="note" style={{ borderLeftColor: 'var(--nv)' }}>
                Please confirm this operational change before proceeding.
              </div>
              <div style={{ display: 'flex', gap: '.5rem', marginTop: '1rem' }}>
                <button className="sm" onClick={() => setConfirmNotice(null)}>Cancel</button>
                <button className="pr" style={{ flex: 1 }} onClick={confirmNotice.onConfirm}>
                  Confirm & Apply Change
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: RESCHEDULE & RELOCATE (UNFORESEEN CIRCUMSTANCES) */}
        {relocateModalItem && (
          <div className="modal-overlay" onClick={() => setRelocateModalItem(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3 style={{ margin: 0, color: 'var(--wn)' }}>⚠️ Reschedule & Relocate (Unforeseen Circumstances)</h3>
                  <span className="mu sm2">Reservation: {relocateModalItem.ref} &bull; {relocateModalItem.by}</span>
                </div>
                <button className="sm" onClick={() => setRelocateModalItem(null)}>✕</button>
              </div>

              <form onSubmit={handleSaveRelocation} style={{ display: 'grid', gap: '.9rem' }}>
                <div>
                  <label>Quick Circumstance Presets (Click to autofill):</label>
                  <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginTop: '.3rem' }}>
                    {[
                      ["❄️ AC Breakdown", "Temporary Desk at South Hall 204", "Relocated due to AC breakdown in main office"],
                      ["⚡ Network Outage", "West Wing Computer Lab 102", "Emergency network maintenance in office"],
                      ["🛠️ Room Repairs", "Annex Room 301", "Facility repairs and repainting"],
                      ["🌧️ Weather Advisory", "Ground Floor Emergency Desk", "Inclement weather safety protocol"],
                      ["📅 Staff Meeting", "Conference Window 2", "Departmental evaluation conflict"]
                    ].map(([label, location, noteText], idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="sm"
                        onClick={() => {
                          setRelocateLocation(location);
                          setRelocateNotes(noteText);
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="g2">
                  <label>
                    New Date
                    <input type="date" required value={relocateDate} onChange={e => setRelocateDate(e.target.value)} />
                  </label>
                  <label>
                    Time Slot
                    <select value={relocateSlot} onChange={e => setRelocateSlot(e.target.value)}>
                      <option value="08:30 AM">08:30 AM</option>
                      <option value="09:15 AM">09:15 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="10:45 AM">10:45 AM</option>
                      <option value="01:30 PM">01:30 PM</option>
                      <option value="02:15 PM">02:15 PM</option>
                      <option value="03:00 PM">03:00 PM</option>
                      <option value="03:45 PM">03:45 PM</option>
                    </select>
                  </label>
                </div>

                <label>
                  Relocated Physical Location / Room Override
                  <input
                    placeholder="e.g. Temporary Desk at South Hall 204"
                    value={relocateLocation}
                    onChange={e => setRelocateLocation(e.target.value)}
                  />
                  <span className="hint">Leave empty if the physical location does not change.</span>
                </label>

                <label>
                  Status
                  <select value={relocateStatus} onChange={e => setRelocateStatusVal(e.target.value)}>
                    <option value="confirmed">CONFIRMED (Rescheduled / Relocated)</option>
                    <option value="pending">PENDING (Awaiting Student Acknowledgment)</option>
                    <option value="ready">READY (Document prepared)</option>
                    <option value="completed">COMPLETED</option>
                    <option value="cancelled">CANCELLED</option>
                  </select>
                </label>

                <label>
                  Circumstance Notes (Sent to Student):
                  <textarea
                    rows="2"
                    placeholder="Provide reason for relocation or rescheduling..."
                    value={relocateNotes}
                    onChange={e => setRelocateNotes(e.target.value)}
                  />
                </label>

                <div style={{ display: 'flex', gap: '.5rem', marginTop: '.4rem' }}>
                  <button type="button" className="sm" onClick={() => setRelocateModalItem(null)}>Cancel</button>
                  <button type="submit" className="pr" style={{ flex: 1 }}>Save Relocation & Time</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: DELETE RESERVATION */}
        {deletingResItem && (
          <div className="modal-overlay" onClick={() => setDeletingResItem(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
              <div className="modal-header">
                <h3 style={{ margin: 0, color: 'var(--er)' }}>Delete Reservation</h3>
                <button className="sm" onClick={() => setDeletingResItem(null)}>✕</button>
              </div>
              <p>
                Are you sure you want to permanently delete reservation <strong>{deletingResItem.ref}</strong> for <strong>{deletingResItem.by}</strong>?
              </p>
              <div className="note" style={{ borderLeftColor: 'var(--er)' }}>
                This record will be removed from the active operational queue.
              </div>
              <div style={{ display: 'flex', gap: '.5rem', marginTop: '1rem' }}>
                <button className="sm" onClick={() => setDeletingResItem(null)}>Cancel</button>
                <button className="sm dg" style={{ flex: 1, padding: '.5rem' }} onClick={handleConfirmDeleteRes}>
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: BOOK WALK-IN RESERVATION */}
        {showWalkinModal && (
          <div className="modal-overlay" onClick={() => setShowWalkinModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 style={{ margin: 0 }}>Book Walk-In Student (CRUD Create)</h3>
                <button className="sm" onClick={() => setShowWalkinModal(false)}>✕</button>
              </div>

              <form onSubmit={handleCreateWalkin} style={{ display: 'grid', gap: '.85rem' }}>
                <label>
                  Student Full Name
                  <input
                    required
                    placeholder="e.g. Maria Clara Santos"
                    value={walkinStudentName}
                    onChange={e => setWalkinStudentName(e.target.value)}
                  />
                </label>

                <label>
                  Student Email
                  <input
                    type="email"
                    placeholder="student@unidesk.edu"
                    value={walkinStudentEmail}
                    onChange={e => setWalkinStudentEmail(e.target.value)}
                  />
                </label>

                <label>
                  Service / Document Requested
                  <select value={walkinFormId} onChange={e => setWalkinFormId(Number(e.target.value))}>
                    {formTypes.map(f => (
                      <option key={f.id} value={f.id}>{f.n} (₱{f.fee})</option>
                    ))}
                  </select>
                </label>

                <div className="g2">
                  <label>
                    Date
                    <input type="date" value={walkinDate} onChange={e => setWalkinDate(e.target.value)} required />
                  </label>
                  <label>
                    Time Slot
                    <select value={walkinSlot} onChange={e => setWalkinSlot(e.target.value)}>
                      <option value="08:30 AM">08:30 AM</option>
                      <option value="09:15 AM">09:15 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="01:30 PM">01:30 PM</option>
                      <option value="02:30 PM">02:30 PM</option>
                      <option value="03:30 PM">03:30 PM</option>
                    </select>
                  </label>
                </div>

                <label>
                  Staff Notes
                  <input value={walkinNotes} onChange={e => setWalkinNotes(e.target.value)} />
                </label>

                <div style={{ display: 'flex', gap: '.5rem', marginTop: '.4rem' }}>
                  <button type="button" className="sm" onClick={() => setShowWalkinModal(false)}>Cancel</button>
                  <button type="submit" className="pr" style={{ flex: 1 }}>Confirm Walk-In Booking</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADMIN EDIT USER */}
        {editingUserItem && (
          <div className="modal-overlay" onClick={() => setEditingUserItem(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 style={{ margin: 0 }}>Edit User Credentials & Office</h3>
                <button className="sm" onClick={() => setEditingUserItem(null)}>✕</button>
              </div>

              <form onSubmit={handleSaveUserEdit} style={{ display: 'grid', gap: '.85rem' }}>
                <label>
                  Full Name
                  <input
                    required
                    value={editingUserItem.n}
                    onChange={e => setEditingUserItem({ ...editingUserItem, n: e.target.value })}
                  />
                </label>

                <label>
                  Email Address
                  <input
                    type="email"
                    required
                    value={editingUserItem.e}
                    onChange={e => setEditingUserItem({ ...editingUserItem, e: e.target.value })}
                  />
                </label>

                <div className="g2">
                  <label>
                    Role
                    <select
                      value={editingUserItem.role}
                      onChange={e => setEditingUserItem({ ...editingUserItem, role: e.target.value })}
                    >
                      <option value="student">Student</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                      <option value="visitor">Visitor</option>
                    </select>
                  </label>

                  <label>
                    Account Status
                    <select
                      value={editingUserItem.status || 'active'}
                      onChange={e => setEditingUserItem({ ...editingUserItem, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="pending_approval">Pending Approval</option>
                    </select>
                  </label>
                </div>

                {editingUserItem.role === 'staff' && (
                  <label>
                    Assigned Administrative Office
                    <select
                      value={editingUserItem.office || 1}
                      onChange={e => setEditingUserItem({ ...editingUserItem, office: Number(e.target.value) })}
                    >
                      {offices.map(o => (
                        <option key={o.id} value={o.id}>{o.n}</option>
                      ))}
                    </select>
                  </label>
                )}

                <div className="g2">
                  <label>
                    ID Number
                    <input
                      value={editingUserItem.id || ''}
                      onChange={e => setEditingUserItem({ ...editingUserItem, id: e.target.value })}
                    />
                  </label>
                  <label>
                    Department / Affiliation
                    <input
                      value={editingUserItem.dept || ''}
                      onChange={e => setEditingUserItem({ ...editingUserItem, dept: e.target.value })}
                    />
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '.5rem', marginTop: '.4rem' }}>
                  <button type="button" className="sm" onClick={() => setEditingUserItem(null)}>Cancel</button>
                  <button type="submit" className="pr" style={{ flex: 1 }}>Save Account Updates</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADMIN DELETE USER */}
        {deletingUserItem && (
          <div className="modal-overlay" onClick={() => setDeletingUserItem(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
              <div className="modal-header">
                <h3 style={{ margin: 0, color: 'var(--er)' }}>Delete Account</h3>
                <button className="sm" onClick={() => setDeletingUserItem(null)}>✕</button>
              </div>
              <p>
                Are you sure you want to permanently delete account <strong>{deletingUserItem.n}</strong> ({deletingUserItem.e})?
              </p>
              <div className="note" style={{ borderLeftColor: 'var(--er)' }}>
                This user will lose access to the UniDesk system.
              </div>
              <div style={{ display: 'flex', gap: '.5rem', marginTop: '1rem' }}>
                <button className="sm" onClick={() => setDeletingUserItem(null)}>Cancel</button>
                <button className="sm dg" style={{ flex: 1, padding: '.5rem' }} onClick={() => handleDeleteUser(deletingUserItem.e)}>
                  Confirm Delete Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ADMIN ADD USER ACCOUNT */}
        {showAddUserModal && (
          <div className="modal-overlay" onClick={() => setShowAddUserModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 style={{ margin: 0 }}>Create User Account (Admin CRUD)</h3>
                <button className="sm" onClick={() => setShowAddUserModal(false)}>✕</button>
              </div>

              <form onSubmit={handleAdminAddUser} style={{ display: 'grid', gap: '.85rem' }}>
                <label>
                  Full Name
                  <input name="an" required placeholder="e.g. Dr. Roberto Cruz" />
                </label>

                <label>
                  Email Address
                  <input name="ae" type="email" required placeholder="e.g. r.cruz@unidesk.edu" />
                </label>

                <label>
                  Password
                  <PasswordInput name="ap" required defaultValue="Password123!" placeholder="Initial account password" />
                </label>

                <div className="g2">
                  <label>
                    Account Role
                    <select name="ar" id="admin_role_select">
                      <option value="student">Student</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                      <option value="visitor">Visitor</option>
                    </select>
                  </label>

                  <label>
                    Assigned Office (if Staff)
                    <select name="ao">
                      {offices.map(o => (
                        <option key={o.id} value={o.id}>{o.n}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="g2">
                  <label>
                    ID Number
                    <input name="ai" placeholder="e.g. STF-2026-90" />
                  </label>
                  <label>
                    Department
                    <input name="ad" placeholder="e.g. Admissions Center" />
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '.5rem', marginTop: '.4rem' }}>
                  <button type="button" className="sm" onClick={() => setShowAddUserModal(false)}>Cancel</button>
                  <button type="submit" className="pr" style={{ flex: 1 }}>Create Account</button>
                </div>
              </form>
            </div>
          </div>
        )}


        </ErrorBoundary>
      </main>

      {/* FLOATING AI CONCIERGE WIDGET FOR STAFF & ADMIN UI */}
      {user && (user.role === 'staff' || user.role === 'admin') && view !== 'account' && (
        <>
          {/* Floating Trigger Pill: Logo + "Ask here" */}
          <button
            type="button"
            className="floating-ai-trigger"
            onClick={() => setShowFloatingChat(prev => !prev)}
            title={`${user.role === 'admin' ? 'Admin' : 'Staff'} AI Intelligence Concierge`}
            aria-label={`${user.role === 'admin' ? 'Admin' : 'Staff'} AI Concierge - Ask here`}
          >
            <span className="floating-ai-icon-circle">⚡</span>
            <span>{showFloatingChat ? "Close AI" : "Ask here"}</span>
          </button>

          {/* Floating AI Concierge Chat Dialog */}
          {showFloatingChat && (
            <div className="floating-ai-window" role="dialog" aria-label={`${user.role === 'admin' ? 'Admin' : 'Staff'} AI Concierge Dialog`}>
              <div className="floating-ai-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="floating-ai-icon-circle" style={{ width: '24px', height: '24px', fontSize: '0.85rem' }}>⚡</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.98rem', color: 'var(--gd)', lineHeight: 1.2 }}>
                      {user.role === 'admin' ? 'Admin' : 'Staff'} AI Concierge
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: '#d4e6da', opacity: 0.9 }}>
                      {user.role === 'admin' ? "System & Database Administration" : (getOffice(user?.office)?.n || "Campus Operations")} • Google Gemini AI
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="sm"
                    style={{ padding: '0.2rem 0.45rem', fontSize: '0.72rem', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff' }}
                    onClick={handleClearCurrentAccountChat}
                    title="Clear chat conversation"
                  >
                    🗑️
                  </button>
                  <button
                    type="button"
                    className="sm"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.78rem', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff' }}
                    onClick={() => setShowFloatingChat(false)}
                    title={`Close ${user.role === 'admin' ? 'Admin' : 'Staff'} AI Concierge`}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Quick Suggestions for Staff/Admin Operations */}
              <div style={{ padding: '0.45rem 0.75rem', background: 'var(--so)', borderBottom: '1px solid var(--ln)', display: 'flex', gap: '0.35rem', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                {(user.role === 'admin' ? [
                  "Pending staff accounts & transfers",
                  "Offices & facility directory status",
                  "Most searched student queries",
                  "Issues & standard fees"
                ] : [
                  "Lost ID replacement steps",
                  "TOR fee & requirements",
                  "Clearance & certification",
                  "Office operating hours"
                ]).map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="sm"
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                    onClick={() => triggerAIChatQuery(chip)}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Chat Messages Stream */}
              <div className="floating-ai-messages">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`chat-msg ${m.sender}`} style={{ fontSize: '0.86rem', padding: '0.6rem 0.85rem' }}>
                    {m.reasoningContent && (
                      <details className="think-box" style={{ fontSize: '0.78rem', padding: '0.35rem 0.6rem' }}>
                        <summary>💡 Gemini Thinking</summary>
                        <div style={{ marginTop: '0.3rem', whiteSpace: 'pre-wrap', opacity: 0.85 }}>
                          {m.reasoningContent}
                        </div>
                      </details>
                    )}
                    <div style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="chat-msg ai" style={{ fontStyle: 'italic', color: 'var(--mu)', fontSize: '0.85rem' }}>
                    {`${user.role === 'admin' ? 'Admin' : 'Staff'} Gemini AI is querying records...`}
                  </div>
                )}
                <div ref={floatingChatBottomRef} />
              </div>

              {/* Chat Input Bar */}
              <form
                className="floating-ai-input-bar"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (floatingChatInput.trim() && !chatLoading) {
                    triggerAIChatQuery(floatingChatInput.trim());
                    setFloatingChatInput('');
                  }
                }}
              >
                <input
                  value={floatingChatInput}
                  onChange={e => setFloatingChatInput(e.target.value)}
                  placeholder={`Ask ${user.role === 'admin' ? 'admin' : 'staff'} concierge anything...`}
                  aria-label={`Ask ${user.role === 'admin' ? 'admin' : 'staff'} AI concierge`}
                />
                <button type="submit" className="pr" style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }} disabled={chatLoading}>
                  ➤
                </button>
              </form>
            </div>
          )}
        </>
      )}

      {/* AUTH MODAL DIALOG (Sign In / Register / Password Recovery) */}
      {renderAuthModal()}

      {/* FLOATING ACTION TOAST */}
      {toastMsg && <div id="toast" style={{ display: 'block' }}>{toastMsg}</div>}
    </div>
  );
}

// ----------------------------------------------------------------------------
// COMPONENT: My Account View (Profile + Password Change + Staff CRUD Desk)
// ----------------------------------------------------------------------------
function MyAccountView({
  user,
  offices,
  requests,
  formTypes,
  isEditingProfile,
  setIsEditingProfile,
  profileName, setProfileName,
  profileEmail, setProfileEmail,
  profilePhone, setProfilePhone,
  profileDept, setProfileDept,
  profileTransferOfficeId, setProfileTransferOfficeId,
  onSaveProfile,
  onUpdatePassword,
  onOpenRelocate,
  onOpenDelete,
  onOpenWalkin,
  onNavigateTo
}) {
  if (!user) return null;
  const isStaff = user?.role === 'staff';
  const isAdmin = user?.role === 'admin';
  const assignedOffice = isStaff ? (offices?.find(o => o.id === Number(user?.office)) || null) : null;

  // Change Password Modal State
  const [showChangePassModal, setShowChangePassModal] = useState(false);
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePassError, setChangePassError] = useState('');

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (currPassword !== user.p) {
      setChangePassError("Current password is incorrect. Please check your existing password.");
      return;
    }
    if (newPassword.length < 8) {
      setChangePassError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword === currPassword) {
      setChangePassError("New password cannot be identical to your current password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePassError("New password and confirmation do not match.");
      return;
    }

    onUpdatePassword(newPassword);
    setCurrPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setChangePassError('');
    setShowChangePassModal(false);
  };

  const visibleReservations = (requests || []).filter(r => {
    if (!r) return false;
    if (isStaff) {
      return (Number(r.officeId) === Number(user?.office)) || 
             (formTypes?.find(f => f.id === Number(r.ft))?.o === Number(user?.office));
    }
    if (isAdmin) return true;
    return r.by === user?.n || (r.userEmail && user?.e && r.userEmail.toLowerCase() === user.e.toLowerCase());
  });

  const getFormName = (ftId) => formTypes?.find(f => f.id === Number(ftId))?.n || (Number(ftId) === 99 ? "In-Person Office Appointment & Consultation" : "Document Service");

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.5rem', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>My Account & Operational Profile</h1>
          <span className="mu sm2">Manage your credentials, contact email, and office operations</span>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          <button
            className="sm"
            onClick={() => setIsEditingProfile(!isEditingProfile)}
          >
            {isEditingProfile ? "Cancel Profile Editing" : "✏️ Edit Profile Info"}
          </button>
        </div>
      </div>

      {/* Staff Office Transfer Request Pending Notice */}
      {isStaff && user.transferRequest && (
        <div className="note" style={{ borderLeftColor: '#f59e0b', background: '#fffbeb', color: '#92400e', marginBottom: '1.2rem' }}>
          <strong>⏳ Transfer requests submitted:</strong> Requested transfer to <strong>{user.transferRequest.toOfficeName}</strong> ({user.transferRequest.requestedAt}). Wait for admin to confirm.
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '6px solid var(--nv)' }}>
        {isEditingProfile ? (
          <form onSubmit={onSaveProfile} style={{ display: 'grid', gap: '.9rem' }}>
            <h3>Edit Account Details & Office Affiliation</h3>
            <div className="g2">
              <label>
                Full Name
                <input required value={profileName} onChange={e => setProfileName(e.target.value)} />
              </label>

              {/* EDITABLE EMAIL ADDRESS */}
              <label>
                Email Address (Editable)
                <input type="email" required value={profileEmail} onChange={e => setProfileEmail(e.target.value)} />
              </label>

              <label>
                Contact Phone Number
                <input placeholder="+63 917 123 4567" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} />
              </label>

              <label>
                Department / College Affiliation
                <input placeholder="e.g. College of Science" value={profileDept} onChange={e => setProfileDept(e.target.value)} />
              </label>
            </div>

            {/* STAFF OFFICE TRANSFER: UPDATE ASSIGNED ADMINISTRATIVE OFFICE */}
            {isStaff && (
              <div style={{ background: 'var(--so)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--ln)' }}>
                {user.transferRequest ? (
                  <div>
                    <strong style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                      ⏳ Transfer requests submitted
                    </strong>
                    <div className="sm2" style={{ color: 'var(--tx)' }}>
                      Requested transfer to: <strong>{user.transferRequest.toOfficeName}</strong>
                    </div>
                    <div className="hint" style={{ marginTop: '0.25rem', color: '#b45309' }}>
                      Wait for admin to confirm.
                    </div>
                  </div>
                ) : (
                  <>
                    <label style={{ color: 'var(--nv)', fontWeight: 600 }}>
                      🏢 Update Assigned Administrative Office:
                      <select
                        value={profileTransferOfficeId}
                        onChange={e => setProfileTransferOfficeId(Number(e.target.value))}
                      >
                        {offices.map(o => (
                          <option key={o.id} value={o.id}>
                            {o.n} ({o.b}, Room {o.r}) {o.id === user.office ? "— (Current Office)" : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                    <span className="hint">
                      Select your target office from the list above. Saving your profile will submit a transfer request for Admin confirmation.
                    </span>
                  </>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '.5rem', marginTop: '.3rem' }}>
              <button type="submit" className="pr">Save Profile Changes</button>
              <button type="button" className="sm" onClick={() => setIsEditingProfile(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <div className="mu sm2">Account Holder</div>
              <strong style={{ fontSize: '1.2rem', color: 'var(--nv)' }}>{user.n}</strong>
              <div style={{ marginTop: '.3rem' }}>
                <span className={`rb ${user?.role || 'student'}`}>{(ROLE_LABELS[user?.role] || user?.role || 'User').toUpperCase()}</span>
              </div>
            </div>

            <div>
              <div className="mu sm2">Email & Contact (Editable)</div>
              <div><strong>{user.e}</strong></div>
              <div className="sm2 mu">{user.ph || "No phone registered"}</div>
              <button 
                type="button" 
                className="sm" 
                style={{ marginTop: '0.4rem', fontSize: '0.75rem', padding: '0.2rem 0.55rem' }}
                onClick={() => setIsEditingProfile(true)}
              >
                ✏️ Update Email Address
              </button>
            </div>

            <div>
              <div className="mu sm2">Identification & Affiliation</div>
              <div>ID: <strong>{user.id || "N/A"}</strong></div>
              <div className="sm2 mu">{user.dept || "Campus Community"}</div>
            </div>

            {isStaff && (
              <div>
                <div className="mu sm2">Assigned Administrative Office</div>
                <strong style={{ color: 'var(--gt)' }}>{assignedOffice?.n || "Registrar"}</strong>
                <div className="sm2 mu">📍 {assignedOffice?.b}, Room {assignedOffice?.r}</div>
                {user.transferRequest ? (
                  <div style={{ fontSize: '0.78rem', color: '#d97706', marginTop: '0.35rem', fontWeight: 600 }}>
                    ⏳ Transfer requests submitted (to: {user.transferRequest.toOfficeName}). Wait for admin to confirm.
                  </div>
                ) : (
                  <button 
                    type="button" 
                    className="sm" 
                    style={{ marginTop: '0.4rem', fontSize: '0.75rem', padding: '0.2rem 0.55rem' }}
                    onClick={() => setIsEditingProfile(true)}
                  >
                    🏢 Update Office Assignment
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Account Security Card */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.15rem 1.35rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'var(--so)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--nv)',
              flexShrink: 0
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--tx)', fontSize: '0.98rem' }}>
                Password & Security
              </div>
              <div className="mu sm2" style={{ marginTop: '0.15rem' }}>
                Ensure your account is protected with a secure, confidential password.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="sm pr"
            onClick={() => { setShowChangePassModal(true); setChangePassError(''); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600, padding: '0.45rem 0.9rem' }}
          >
            <KeyRound size={15} /> Change Password
          </button>
        </div>
      </div>

      {/* MODAL: CHANGE ACCOUNT PASSWORD */}
      {showChangePassModal && (
        <div className="modal-overlay" onClick={() => setShowChangePassModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={18} color="var(--nv)" /> Change Account Password
              </h3>
              <button className="sm" onClick={() => setShowChangePassModal(false)}>✕</button>
            </div>

            <p className="mu sm2" style={{ marginTop: '0.35rem' }}>
              Update password credentials for <strong>{user.n}</strong> ({user.e}).
            </p>

            <form onSubmit={handlePasswordSubmit} style={{ display: 'grid', gap: '0.85rem', marginTop: '0.75rem' }}>
              <label>
                Current Password <span style={{ color: 'var(--er)' }}>*</span>
                <PasswordInput
                  required
                  placeholder="Enter current password"
                  value={currPassword}
                  onChange={e => { setCurrPassword(e.target.value); setChangePassError(''); }}
                />
              </label>

              <label>
                New Password <span style={{ color: 'var(--er)' }}>*</span>
                <PasswordInput
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); setChangePassError(''); }}
                />
                <span className="hint">Must be at least 8 characters long.</span>
              </label>

              <label>
                Confirm New Password <span style={{ color: 'var(--er)' }}>*</span>
                <PasswordInput
                  required
                  minLength={8}
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setChangePassError(''); }}
                />
              </label>

              {changePassError && (
                <div className="note" style={{ borderLeftColor: 'var(--er)', color: 'var(--er)', background: 'rgba(239, 68, 68, 0.08)', padding: '0.5rem 0.75rem', fontSize: '0.82rem' }}>
                  ⚠️ {changePassError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="sm" onClick={() => setShowChangePassModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="pr" style={{ flex: 1 }}>
                  Confirm & Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Office Operations CRUD Desk */}
      {(isStaff || isAdmin) && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.5rem', marginBottom: '.75rem' }}>
            <div>
              <h2 style={{ margin: 0 }}>
                {isStaff ? `🏢 ${assignedOffice?.n || 'Office'} Student Reservations & Queue` : "🏢 All Campus Office Reservations (Admin CRUD)"}
              </h2>
              <span className="mu sm2">
                Use CRUD actions to update status, book walk-ins, or relocate physical windows for unforeseen circumstances
              </span>
            </div>
            <button className="pr" onClick={onOpenWalkin}>
              + Book Walk-In Student
            </button>
          </div>

          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Res ID</th>
                  <th>Student / Requester</th>
                  <th>Service Requested</th>
                  <th>Scheduled Date & Time</th>
                  <th>Location Status</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Staff Actions (CRUD)</th>
                </tr>
              </thead>
              <tbody>
                {visibleReservations.map(r => {
                  const hasRelocation = !!r.locationOverride;
                  return (
                    <tr key={r.ref}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.ref}</td>
                      <td>
                        <strong>{r.by}</strong>
                        <div className="sm2 mu">{r.userEmail || "Student"}</div>
                      </td>
                      <td>
                        <div>{getFormName(r.ft)} {r.isAppointment ? "(Appointment)" : `×${r.c}`}</div>
                        {r.notes && <div className="sm2 mu" style={{ fontStyle: 'italic' }}>"{r.notes}"</div>}
                      </td>
                      <td>
                        <div>{r.date || "Scheduled"}</div>
                        <div className="sm2 mu">{r.slot || "Regular slot"}</div>
                      </td>
                      <td>
                        {hasRelocation ? (
                          <span style={{ color: 'var(--wn)', fontWeight: 600, fontSize: '0.85rem' }}>
                            ⚠️ Relocated: {r.locationOverride}
                          </span>
                        ) : (
                          <span className="mu sm2">
                            Standard Window ({assignedOffice ? `${assignedOffice.b} Room ${assignedOffice.r}` : "Standard"})
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`b ${r.s}`}>{r.s}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '.3rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button
                            className="sm"
                            style={{ background: 'var(--so)', borderColor: 'var(--wn)' }}
                            onClick={() => onOpenRelocate(r)}
                            title="Reschedule Time or Relocate Physical Room (Unforeseen Circumstances)"
                          >
                            ⚠️ Reschedule / Relocate
                          </button>
                          <button
                            className="sm dg"
                            onClick={() => onOpenDelete(r)}
                            title="Delete Reservation Record"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!visibleReservations.length && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--mu)' }}>
                      No active student reservations found for your office.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student / Visitor Personal Reservations Desk */}
      {!isStaff && !isAdmin && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.5rem', marginBottom: '.75rem' }}>
            <h2 style={{ margin: 0 }}>📋 My Personal Bookings & Document Requests</h2>
            <button className="pr" onClick={() => onNavigateTo('newreq')}>
              + Request a Service or Appointment
            </button>
          </div>

          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Ref ID</th>
                  <th>Service Requested</th>
                  <th>Appointment Date & Time</th>
                  <th>Location Status</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleReservations.map(r => (
                  <tr key={r.ref}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.ref}</td>
                    <td>{getFormName(r.ft)} {r.isAppointment ? "(Appointment)" : `×${r.c}`}</td>
                    <td>{r.date || "Scheduled"} ({r.slot || "Regular slot"})</td>
                    <td>
                      {r.locationOverride ? (
                        <span style={{ color: 'var(--wn)', fontWeight: 600 }}>
                          ⚠️ Relocated to: {r.locationOverride}
                        </span>
                      ) : (
                        <span className="mu sm2">Standard Office Desk</span>
                      )}
                    </td>
                    <td>
                      <span className={`b ${r.s}`}>{r.s}</span>
                    </td>
                    <td>
                      <button className="sm" onClick={() => onNavigateTo('detail', r.ref)}>
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {!visibleReservations.length && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--mu)' }}>
                      You have no active reservations or document requests.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// COMPONENT: Office Card
// ----------------------------------------------------------------------------
function OfficeCard({ o, handles, forms, onSelect, onShowOnMap }) {
  return (
    <div className="card card-clickable" onClick={onSelect} title="Click to view services offered">
      <h3>{o.n}</h3>
      <div className="mu sm2">📍 {o.b}, Room {o.r}</div>
      <p>{o.d}</p>
      <div className="sm2"><b>⏰ Hours:</b> {o.h}</div>
      {handles && <div className="sm2" style={{ marginTop: '0.3rem' }}><b>📋 Services:</b> {handles}</div>}
      {forms && <div className="sm2"><b>📄 Forms:</b> {forms}</div>}
      <div style={{ marginTop: '.75rem', display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
        <button className="sm" style={{ background: 'var(--nv)', color: '#fff', border: 'none' }} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
          Services Offered &rarr;
        </button>
        <button className="sm" onClick={(e) => { e.stopPropagation(); onShowOnMap(o.b); }}>
          Show on map
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// COMPONENT: Register Form (Role-Tailored Requirements)
// ----------------------------------------------------------------------------
function RegisterForm({ offices, onRegister, onSwitchToSignIn, showToast }) {
  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('Password123!');
  const [idNumber, setIdNumber] = useState('');
  const [dept, setDept] = useState('');
  const [officeId, setOfficeId] = useState(offices[0]?.id || 1);
  const [phone, setPhone] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    // Visitor: no ID or College/Department
    // Staff: Assigned Office, status is pending approval
    // Admin: status is pending approval, strictly 5 core fields
    const isStaff = role === 'staff';
    const isAdmin = role === 'admin';
    const isVisitor = role === 'visitor';
    const requiresReview = isStaff || isAdmin;

    const newUser = {
      n: name.trim(),
      e: cleanEmail,
      p: pass,
      role: role,
      id: (isVisitor || isAdmin || isStaff) ? undefined : idNumber.trim(),
      dept: isStaff ? offices.find(o => o.id === Number(officeId))?.n : ((isVisitor || isAdmin) ? undefined : dept.trim()),
      ph: phone.trim(),
      office: isStaff ? Number(officeId) : undefined,
      status: requiresReview ? 'pending_approval' : 'active',
      reg: true
    };

    onRegister(newUser);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="g2">
        <label>
          Full Name
          <input required placeholder="e.g. Maria Clara Santos" value={name} onChange={e => setName(e.target.value)} />
        </label>
        <label>
          Account Role
          <select value={role} onChange={e => setRole(e.target.value)}>
            <option value="student">Student</option>
            <option value="visitor">Visitor</option>
            <option value="staff">Office Staff (Requires Admin Review)</option>
            <option value="admin">Admin (Requires Admin Review)</option>
          </select>
        </label>
        <label>
          Email Address
          <input type="email" required placeholder="e.g. student@unidesk.edu" value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <PasswordInput required minLength={8} placeholder="At least 8 characters" value={pass} onChange={e => setPass(e.target.value)} />
        </label>

        {/* Student Specific Fields */}
        {role === 'student' && (
          <>
            <label>
              Student ID
              <input
                required
                placeholder="e.g. STD-2026-1042"
                value={idNumber}
                onChange={e => setIdNumber(e.target.value)}
              />
            </label>
            <label>
              College / Department
              <input placeholder="e.g. College of Science" value={dept} onChange={e => setDept(e.target.value)} />
            </label>
          </>
        )}

        {/* Staff Specific Fields */}
        {role === 'staff' && (
          <label>
            Assigned Administrative Office
            <select value={officeId} onChange={e => setOfficeId(Number(e.target.value))}>
              {offices.map(o => (
                <option key={o.id} value={o.id}>{o.n} ({o.b})</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <label>
        Mobile Phone Number
        <input placeholder="+63 917 123 4567" value={phone} onChange={e => setPhone(e.target.value)} />
      </label>

      {/* STAFF & ADMIN ACCOUNT APPROVAL NOTICE */}
      {(role === 'staff' || role === 'admin') && (
        <div className="note sm2" style={{ borderLeftColor: '#f59e0b', color: '#92400e', background: '#fffbeb' }}>
          ℹ️ <strong>{role === 'admin' ? 'Admin' : 'Staff'} Registration Notice:</strong> {role === 'admin' ? 'Administrator' : 'Staff'} accounts are submitted for administrative review. An existing administrator must confirm and activate your credentials before you can log in.
        </div>
      )}

      <button type="submit" className="go" style={{ marginTop: '.5rem' }}>
        Complete Registration
      </button>

      <span className="hint" style={{ display: 'block', textAlign: 'center', marginTop: '.3rem' }}>
        Already registered?{' '}
        <a href="#" style={{ color: '#f6c915' }} onClick={(e) => { e.preventDefault(); onSwitchToSignIn(); }}>
          Sign In here
        </a>
      </span>
    </form>
  );
}

// ----------------------------------------------------------------------------
// COMPONENT: Manage Data View (CRUD for Offices, Issues, Forms, Facilities)
// ----------------------------------------------------------------------------
function ManageDataView({
  user,
  offices, setOffices,
  issues, setIssues,
  formTypes, setFormTypes,
  facilities, setFacilities,
  manageTab, setManageTab,
  editIndex, setEditIndex,
  showToast
}) {
  const isAdmin = user.role === 'admin';
  const tabs = isAdmin ? ["Offices", "Issues", "Form types", "Facilities"] : ["Offices", "Issues", "Form types"];

  const schemas = {
    Offices: {
      data: offices,
      setData: setOffices,
      fields: [["n", "Office Name"], ["b", "Building"], ["r", "Room"], ["h", "Operating Hours"], ["d", "Description"]]
    },
    Issues: {
      data: issues,
      setData: setIssues,
      fields: [["k", "Problem / Keyword"], ["c", "Category"], ["fee", "Fee (PHP)"]],
      hasOffice: true
    },
    "Form types": {
      data: formTypes,
      setData: setFormTypes,
      fields: [["n", "Document Name"], ["d", "Processing Days"], ["fee", "Fee (PHP)"]],
      hasOffice: true
    },
    Facilities: {
      data: facilities,
      setData: setFacilities,
      fields: [["n", "Facility Name"], ["t", "Type"], ["b", "Building"], ["h", "Operating Hours"]]
    }
  };

  const currentSchema = schemas[manageTab];
  const canEditRow = (row) => {
    if (isAdmin) return true;
    if (user.role !== 'staff') return false;
    if (manageTab === 'Offices') return row.id === user.office;
    return row.o === user.office;
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const form = e.target;
    const newObj = { id: Date.now() };

    for (const [key, label] of currentSchema.fields) {
      const val = form[key].value.trim();
      if (!val) {
        showToast(`Please fill in "${label}"`);
        return;
      }
      newObj[key] = (key === 'fee' || key === 'd') ? Number(val) : val;
    }

    if (currentSchema.hasOffice) {
      newObj.o = isAdmin ? Number(form.office_select.value) : user.office;
    }

    currentSchema.setData(prev => [...prev, newObj]);
    form.reset();
    showToast("Record added successfully!");
  };

  const handleSaveEdit = (idx, editedObj) => {
    currentSchema.setData(prev => prev.map((item, i) => i === idx ? editedObj : item));
    setEditIndex(null);
    showToast("Changes saved successfully!");
  };

  const handleDelete = (idx) => {
    currentSchema.setData(prev => prev.filter((_, i) => i !== idx));
    showToast("Record deleted.");
  };

  return (
    <div>
      <h1>{isAdmin ? "Data Management & Catalog" : "Manage My Office"}</h1>
      {!isAdmin && (
        <p className="mu">
          You have permission to edit records for <strong>{offices.find(o => o.id === user.office)?.n}</strong>.
        </p>
      )}

      <div className="chips">
        {tabs.map(tab => (
          <button
            key={tab}
            className={`chip ${manageTab === tab ? 'on' : ''}`}
            onClick={() => { setManageTab(tab); setEditIndex(null); }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="scroll" style={{ marginTop: '1.25rem' }}>
        <table>
          <thead>
            <tr>
              {currentSchema.fields.map(([_, label], i) => (
                <th key={i}>{label}</th>
              ))}
              {currentSchema.hasOffice && <th>Assigned Office</th>}
              <th style={{ width: '130px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentSchema.data.map((row, idx) => {
              const allowed = canEditRow(row);
              if (editIndex === idx) {
                return (
                  <EditableRow
                    key={idx}
                    row={row}
                    schema={currentSchema}
                    offices={offices}
                    isAdmin={isAdmin}
                    onSave={(updated) => handleSaveEdit(idx, updated)}
                    onCancel={() => setEditIndex(null)}
                  />
                );
              }

              return (
                <tr key={idx}>
                  {currentSchema.fields.map(([key], i) => (
                    <td key={i}>{row[key]}</td>
                  ))}
                  {currentSchema.hasOffice && (
                    <td>{offices.find(o => o.id === row.o)?.n || "—"}</td>
                  )}
                  <td>
                    {allowed ? (
                      <>
                        <button className="sm" onClick={() => setEditIndex(idx)}>Edit</button>
                        <button className="sm dg" onClick={() => handleDelete(idx)}>Delete</button>
                      </>
                    ) : (
                      <span className="mu sm2">View only</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {(isAdmin || (manageTab !== 'Offices' && manageTab !== 'Facilities')) && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3>Add New {manageTab.slice(0, -1)}</h3>
          <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '.65rem', alignItems: 'end' }}>
            {currentSchema.fields.map(([key, label], i) => (
              <label key={i}>
                {label}
                <input name={key} placeholder={label} required />
              </label>
            ))}
            {currentSchema.hasOffice && (
              <label>
                Office
                {isAdmin ? (
                  <select name="office_select">
                    {offices.map(o => (
                      <option key={o.id} value={o.id}>{o.n}</option>
                    ))}
                  </select>
                ) : (
                  <input readOnly value={offices.find(o => o.id === user.office)?.n || ''} />
                )}
              </label>
            )}
            <div>
              <button type="submit" className="pr" style={{ width: '100%' }}>Add Record</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// COMPONENT: Editable Table Row
// ----------------------------------------------------------------------------
function EditableRow({ row, schema, offices, isAdmin, onSave, onCancel }) {
  const [formData, setFormData] = useState({ ...row });

  return (
    <tr style={{ background: 'var(--so)' }}>
      {schema.fields.map(([key, label], i) => (
        <td key={i}>
          <input
            style={{ width: '100%' }}
            value={formData[key] ?? ''}
            onChange={(e) => setFormData({ ...formData, [key]: (key === 'fee' || key === 'd') ? Number(e.target.value) : e.target.value })}
          />
        </td>
      ))}
      {schema.hasOffice && (
        <td>
          {isAdmin ? (
            <select
              value={formData.o}
              onChange={(e) => setFormData({ ...formData, o: Number(e.target.value) })}
            >
              {offices.map(o => (
                <option key={o.id} value={o.id}>{o.n}</option>
              ))}
            </select>
          ) : (
            offices.find(o => o.id === formData.o)?.n || "—"
          )}
        </td>
      )}
      <td>
        <button className="sm" onClick={() => onSave(formData)}>Save</button>
        <button className="sm" onClick={onCancel}>Cancel</button>
      </td>
    </tr>
  );
}
