import React from 'react';
import { 
  Database, 
  Search, 
  MapPin, 
  CalendarCheck, 
  Bot, 
  ShieldCheck, 
  User,
  LogOut,
  LogIn,
  Building,
  Settings,
  Sparkles
} from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  diagnostics, 
  currentUser, 
  onOpenAuth, 
  onLogout 
}) {
  const isAdminOrStaff = currentUser?.userRole === 'ADMIN' || currentUser?.userRole === 'STAFF';

  const tabs = [
    { id: 'lookup', label: 'Issue & Office Lookup', icon: Search },
    { id: 'map', label: 'Campus Map & Directory', icon: MapPin },
    { id: 'reservations', label: currentUser ? 'My Reservations & Payments' : 'Reservations & Payments', icon: CalendarCheck },
    { id: 'ai', label: 'AI Campus Concierge', icon: Bot, badge: 'Smart' },
    // Admin & Staff exclusive modules
    ...(isAdminOrStaff ? [
      { id: 'office_mgmt', label: 'Office Management (CRUD)', icon: Building, badge: 'Staff' },
      { id: 'admin', label: 'Database Engine & Triggers', icon: ShieldCheck, badge: 'Grading Focus' }
    ] : [
      { id: 'admin', label: 'Database Diagnostics & RBAC', icon: ShieldCheck }
    ]),
    // My Account Tab for authenticated users
    ...(currentUser ? [
      { id: 'account', label: 'My Account & Desk', icon: User, badge: currentUser.userRole === 'STAFF' ? 'Office' : undefined }
    ] : [])
  ];

  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-icon">
          <Database size={24} />
        </div>
        <div>
          <h1 className="brand-title">UniDesk</h1>
          <div className="brand-subtitle">Campus Operations &bull; Database Engine</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
        {/* Cluster Status Pill */}
        {diagnostics ? (
          <div className="status-pill" title={`Host: ${diagnostics.host} | DB: ${diagnostics.dbName}`}>
            <span className="status-dot"></span>
            <span>{diagnostics.currentRole || 'unidesk_app_role'} ({diagnostics.latencyMs}ms)</span>
          </div>
        ) : (
          <div className="status-pill" style={{ borderColor: 'rgba(245, 158, 11, 0.3)', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.08)' }}>
            <span className="status-dot" style={{ backgroundColor: '#f59e0b', boxShadow: '0 0 10px #f59e0b' }}></span>
            <span>Connecting...</span>
          </div>
        )}

        {/* User Account / Profile Box - Clicking opens My Account Interface */}
        {currentUser ? (
          <div 
            onClick={() => setActiveTab('account')}
            title="Click to view My Account & Office Reservations Desk"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.4rem 0.85rem',
              background: activeTab === 'account' ? 'rgba(56, 189, 248, 0.16)' : 'rgba(20, 27, 45, 0.65)',
              borderRadius: '14px',
              border: activeTab === 'account' ? '1px solid rgba(56, 189, 248, 0.6)' : '1px solid var(--border-subtle)',
              boxShadow: activeTab === 'account' ? '0 0 15px rgba(56, 189, 248, 0.25)' : 'var(--shadow-sm)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: currentUser.userRole === 'ADMIN' ? 'rgba(244, 63, 94, 0.18)' :
                          currentUser.userRole === 'STAFF' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(56, 189, 248, 0.18)',
              color: currentUser.userRole === 'ADMIN' ? 'var(--danger-light)' :
                     currentUser.userRole === 'STAFF' ? 'var(--warning-light)' : 'var(--primary-light)',
              border: `1px solid ${currentUser.userRole === 'ADMIN' ? 'rgba(244, 63, 94, 0.3)' :
                                   currentUser.userRole === 'STAFF' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem',
              fontFamily: 'var(--font-mono)'
            }}>
              {currentUser.fullName?.charAt(0) || 'U'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {currentUser.fullName}
                </span>
                <span style={{
                  fontSize: '0.66rem',
                  padding: '0.12rem 0.42rem',
                  borderRadius: '5px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  background: currentUser.userRole === 'ADMIN' ? 'var(--danger-bg)' :
                              currentUser.userRole === 'STAFF' ? 'var(--warning-bg)' : 'var(--success-bg)',
                  color: currentUser.userRole === 'ADMIN' ? 'var(--danger-light)' :
                         currentUser.userRole === 'STAFF' ? 'var(--warning-light)' : 'var(--success-light)',
                  border: `1px solid ${currentUser.userRole === 'ADMIN' ? 'var(--danger-border)' :
                                       currentUser.userRole === 'STAFF' ? 'var(--warning-border)' : 'var(--success-border)'}`
                }}>
                  {currentUser.userRole}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                <span>{currentUser.studentOrVisitorId || currentUser.email}</span>
                <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>&bull; My Account ↗</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onLogout();
              }}
              className="btn btn-secondary btn-sm"
              title="Sign Out"
              style={{
                padding: '0.35rem 0.55rem',
                marginLeft: '0.25rem',
                color: 'var(--text-muted)'
              }}
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => onOpenAuth && onOpenAuth('in')}
              style={{
                borderRadius: '20px',
                padding: '0.4rem 0.95rem',
                fontSize: '0.84rem'
              }}
            >
              <LogIn size={14} /> Sign In
            </button>
            <button 
              className="btn btn-primary btn-sm" 
              onClick={() => onOpenAuth && onOpenAuth('reg')}
              style={{
                borderRadius: '20px',
                padding: '0.4rem 1.15rem',
                fontSize: '0.84rem',
                fontWeight: 700
              }}
            >
              Sign Up
            </button>
          </div>
        )}
      </div>

      {/* Tabs Bar */}
      <nav className="nav-tabs" style={{ width: '100%', marginTop: '0.5rem' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`nav-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={17} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span style={{
                  fontSize: '0.66rem',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '9999px',
                  background: isActive ? 'rgba(56, 189, 248, 0.22)' : 'rgba(255, 255, 255, 0.07)',
                  color: isActive ? 'var(--primary-light)' : 'var(--text-muted)',
                  border: `1px solid ${isActive ? 'rgba(56, 189, 248, 0.35)' : 'transparent'}`,
                  fontWeight: 700,
                  marginLeft: '0.2rem'
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
