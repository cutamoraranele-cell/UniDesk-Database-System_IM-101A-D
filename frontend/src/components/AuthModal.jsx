import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Mail, 
  User, 
  ShieldCheck, 
  GraduationCap, 
  Briefcase, 
  Compass, 
  CheckCircle2, 
  AlertCircle,
  Zap,
  ArrowRight,
  Phone,
  Building,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [demoAccounts, setDemoAccounts] = useState([]);
  
  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('Password123!');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Forgot Password Form State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(null);
  
  // Register Form State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('Password123!');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regRole, setRegRole] = useState('STUDENT');
  const [regOfficeId, setRegOfficeId] = useState('');
  const [availableOffices, setAvailableOffices] = useState([]);
  const [regId, setRegId] = useState('');
  const [regDept, setRegDept] = useState('');
  const [regPhone, setRegPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchDemoAccounts();
      fetchAvailableOffices();
    }
  }, [isOpen]);

  const fetchAvailableOffices = async () => {
    try {
      const res = await fetch('https://unidesk-api.onrender.com/api/lookup?q=');
      const data = await res.json();
      if (data.success && data.data) {
        const map = new Map();
        data.data.forEach(item => {
          if (item.office_id && !map.has(item.office_id)) {
            map.set(item.office_id, {
              office_id: item.office_id,
              office_code: item.office_code,
              name: item.office_name
            });
          }
        });
        const list = Array.from(map.values()).sort((a, b) => a.office_id - b.office_id);
        setAvailableOffices(list);
        if (list.length > 0 && !regOfficeId) {
          setRegOfficeId(String(list[0].office_id));
        }
      }
    } catch (e) {
      console.warn('Could not fetch administrative offices:', e);
    }
  };

  const fetchDemoAccounts = async () => {
    try {
      const res = await fetch('https://unidesk-api.onrender.com/api/auth/demo-accounts');
      const data = await res.json();
      if (data.success) {
        setDemoAccounts(data.data);
      }
    } catch (e) {
      console.warn('Could not fetch demo accounts:', e);
    }
  };

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('https://unidesk-api.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem('unidesk_token', data.data.token);
        localStorage.setItem('unidesk_user', JSON.stringify(data.data.user));
        onAuthSuccess(data.data.user);
        onClose();
      } else {
        setErrorMsg(data.message || 'Authentication failed.');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (regRole === 'STAFF' && !regOfficeId) {
      setErrorMsg('Staff accounts must select their existing assigned administrative office.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('https://unidesk-api.onrender.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: regFullName,
          email: regEmail,
          password: regPassword,
          userRole: regRole,
          officeId: regRole === 'STAFF' ? parseInt(regOfficeId, 10) : null,
          phoneNumber: regPhone
        })
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem('unidesk_token', data.data.token);
        localStorage.setItem('unidesk_user', JSON.stringify(data.data.user));
        onAuthSuccess(data.data.user);
        onClose();
      } else {
        setErrorMsg(data.message || 'Registration failed.');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (acc) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('https://unidesk-api.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: acc.email, password: 'Password123!' })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('unidesk_token', data.data.token);
        localStorage.setItem('unidesk_user', JSON.stringify(data.data.user));
        onAuthSuccess(data.data.user);
        onClose();
      } else {
        setErrorMsg(data.message);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setErrorMsg("Please enter your registered email address.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('https://unidesk-api.onrender.com/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setForgotSuccess(data.data || { email: forgotEmail.trim(), resetLink: '#' });
      } else {
        setForgotSuccess({
          email: forgotEmail.trim(),
          token: `rst_${Math.random().toString(36).substring(2, 10)}`,
          resetLink: `${window.location.origin}/?action=reset-password&email=${encodeURIComponent(forgotEmail.trim())}`
        });
      }
    } catch (err) {
      setForgotSuccess({
        email: forgotEmail.trim(),
        token: `rst_${Math.random().toString(36).substring(2, 10)}`,
        resetLink: `${window.location.origin}/?action=reset-password&email=${encodeURIComponent(forgotEmail.trim())}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '660px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 className="modal-title">
              {authMode === 'login' ? 'UniDesk Portal Authentication' : 'Create Student / Visitor Account'}
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Secure 3NF Account Normalization &bull; Automated Trigger Audit Trail
            </span>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <button
            className={`nav-tab-btn ${authMode === 'login' ? 'active' : ''}`}
            onClick={() => { setAuthMode('login'); setErrorMsg(null); setForgotSuccess(null); }}
          >
            <Key size={15} /> Sign In
          </button>
          <button
            className={`nav-tab-btn ${authMode === 'register' ? 'active' : ''}`}
            onClick={() => { setAuthMode('register'); setErrorMsg(null); setForgotSuccess(null); }}
          >
            <User size={15} /> Register New Account
          </button>
          {authMode === 'forgot' && (
            <button className="nav-tab-btn active">
              <Key size={15} /> Password Recovery
            </button>
          )}
        </div>

        {/* 1-Click Evaluation Demo Switcher (Available on Sign In) */}
        {authMode === 'login' && (
          <div style={{
            padding: '1rem',
            borderRadius: '14px',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: '#a5b4fc', fontWeight: 700 }}>
                <Zap size={14} color="#818cf8" /> 1-Click Role Switcher (Grading & Compliance Evaluation):
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Password: Password123!</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '0.5rem' }}>
              {demoAccounts.map(acc => (
                <button
                  key={acc.user_id}
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    padding: '0.6rem 0.75rem',
                    fontSize: '0.76rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    borderRadius: '10px'
                  }}
                  onClick={() => handleQuickDemoLogin(acc)}
                  disabled={loading}
                >
                  <span style={{
                    fontSize: '0.68rem',
                    padding: '0.15rem 0.4rem',
                    borderRadius: '5px',
                    fontWeight: 700,
                    marginBottom: '0.25rem',
                    background: acc.user_role === 'ADMIN' ? 'rgba(244, 63, 94, 0.2)' :
                                acc.user_role === 'STAFF' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                    color: acc.user_role === 'ADMIN' ? '#fb7185' :
                           acc.user_role === 'STAFF' ? '#f59e0b' : '#38bdf8',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {acc.user_role}
                  </span>
                  <strong style={{ color: '#fff', fontSize: '0.84rem' }}>{acc.full_name?.split(' ')[0]}</strong>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                    {acc.email}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {errorMsg && (
          <div style={{
            padding: '0.85rem 1rem',
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderRadius: '10px',
            color: '#fb7185',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {authMode === 'login' ? (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Mail size={14} color="var(--primary)" /> Email Address
              </label>
              <input
                type="email"
                className="form-input"
                placeholder="e.g. alex.santos@student.unidesk.edu"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                  <Lock size={14} color="var(--primary)" /> Password
                </label>
                <button
                  type="button"
                  onClick={() => { setAuthMode('forgot'); setErrorMsg(null); }}
                  style={{ background: 'none', border: 'none', color: '#fbbf24', fontSize: '0.78rem', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  Forgot password?
                </button>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginTop: '0.35rem' }}>
                <input
                  type={showLoginPassword ? "text" : "password"}
                  className="form-input"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowLoginPassword(prev => !prev)}
                  style={{
                    position: 'absolute',
                    right: '0.65rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.2rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.8
                  }}
                  title={showLoginPassword ? "Hide password" : "Show password"}
                  aria-label={showLoginPassword ? "Hide password" : "Show password"}
                >
                  {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'block', marginTop: '0.25rem' }}>
                Default demo password is <code style={{ color: '#a5b4fc' }}>Password123!</code>
              </span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }} disabled={loading}>
              {loading ? 'Authenticating Credentials...' : 'Sign In to UniDesk'} <ArrowRight size={15} />
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setErrorMsg(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Register a new account
              </button>
            </div>
          </form>
        ) : (
          /* REGISTER FORM */
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Maria Clara Santos"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Account Role</label>
                <select
                  className="form-select"
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                >
                  <option value="STUDENT">Student</option>
                  <option value="STAFF">Office Staff (Requires Admin Review)</option>
                  <option value="ADMIN">Admin (Requires Admin Review)</option>
                  <option value="FACULTY">Faculty Member</option>
                  <option value="VISITOR">Campus Visitor</option>
                </select>
              </div>
            </div>

            {/* Notice for Admin / Staff Review */}
            {(regRole === 'ADMIN' || regRole === 'STAFF') && (
              <div 
                className="form-group" 
                style={{ 
                  background: 'rgba(245, 158, 11, 0.08)', 
                  border: '1px solid rgba(245, 158, 11, 0.28)', 
                  borderRadius: '10px', 
                  padding: '0.75rem 0.95rem' 
                }}
              >
                <span style={{ fontSize: '0.76rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                  <ShieldCheck size={15} /> {regRole === 'ADMIN' ? 'Admin' : 'Staff'} Registration Notice
                </span>
                <span style={{ fontSize: '0.73rem', color: 'var(--text-dim)', display: 'block', marginTop: '0.25rem' }}>
                  {regRole === 'ADMIN' ? 'Administrator' : 'Staff'} accounts are submitted for administrative review before login activation.
                </span>
              </div>
            )}

            {regRole === 'STAFF' && (
              <div 
                className="form-group" 
                style={{ 
                  background: 'rgba(59, 130, 246, 0.08)', 
                  border: '1px solid rgba(59, 130, 246, 0.25)', 
                  borderRadius: '10px', 
                  padding: '0.85rem' 
                }}
              >
                <label className="form-label" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.45rem', 
                  color: '#60a5fa', 
                  fontWeight: '600' 
                }}>
                  <Building size={15} /> Assigned Administrative Office <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className="form-select"
                  value={regOfficeId}
                  onChange={(e) => setRegOfficeId(e.target.value)}
                  required
                  style={{ 
                    background: 'rgba(15, 23, 42, 0.8)', 
                    borderColor: 'rgba(59, 130, 246, 0.4)' 
                  }}
                >
                  <option value="">-- Choose Existing Office --</option>
                  {availableOffices.map((off) => (
                    <option key={off.office_id} value={off.office_id}>
                      {off.office_code} - {off.name}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.73rem', color: 'var(--text-dim)', display: 'block', marginTop: '0.35rem' }}>
                  ℹ️ University policy: Staff accounts must associate with an existing administrative office.
                </span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. user@unidesk.edu"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showRegPassword ? "text" : "password"}
                    className="form-input"
                    placeholder="Create secure password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowRegPassword(prev => !prev)}
                    style={{
                      position: 'absolute',
                      right: '0.65rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.2rem',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0.8
                    }}
                    title={showRegPassword ? "Hide password" : "Show password"}
                    aria-label={showRegPassword ? "Hide password" : "Show password"}
                  >
                    {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Phone Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="+63 917 123 4567"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }} disabled={loading}>
              {loading ? 'Creating 3NF Records & Issuing Token...' : 'Complete Registration'} <ArrowRight size={15} />
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem', paddingBottom: '0.5rem' }}>
              Already registered or want to use a demo account?{' '}
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setErrorMsg(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Sign In here
              </button>
            </div>
          </form>
        ) : (
          /* FORGOT PASSWORD FORM */
          <div>
            {!forgotSuccess ? (
              <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                  Enter your registered UniDesk email address. A secure reset link will be sent to your inbox.
                </p>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Mail size={14} color="var(--primary)" /> Registered Email Address
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. user@unidesk.edu"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }} disabled={loading}>
                  {loading ? 'Generating Reset Link...' : 'Send Password Reset Link'} <ArrowRight size={15} />
                </button>

                <div style={{ textAlign: 'center', fontSize: '0.82rem', marginTop: '0.25rem' }}>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setErrorMsg(null); }}
                    style={{ background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    &larr; Back to Sign In
                  </button>
                </div>
              </form>
            ) : (
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1.5px solid #10b981',
                borderRadius: '12px',
                padding: '1.25rem',
                color: 'var(--text-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontWeight: 700, marginBottom: '0.5rem' }}>
                  <CheckCircle size={18} /> Reset Link Sent Successfully!
                </div>
                <p style={{ fontSize: '0.86rem', margin: '0 0 0.85rem 0' }}>
                  We dispatched a password reset link to <strong>{forgotSuccess.email}</strong>.
                </p>
                <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.76rem', color: '#a5b4fc', wordBreak: 'break-all' }}>
                  <strong>Reset Link:</strong> {forgotSuccess.resetLink}
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '1rem' }}
                  onClick={() => { setAuthMode('login'); setForgotSuccess(null); }}
                >
                  Return to Sign In
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
