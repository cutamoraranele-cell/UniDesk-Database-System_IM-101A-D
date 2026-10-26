import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Search, 
  Filter, 
  Save, 
  RefreshCw, 
  AlertTriangle,
  Compass,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';

export default function MyAccountView({ currentUser, onUpdateCurrentUser }) {
  const userRole = currentUser?.userRole || currentUser?.role || 'STUDENT';
  const userOfficeId = currentUser?.officeId || null;
  const isAdmin = userRole === 'ADMIN';
  const isStaff = userRole === 'STAFF';
  const isStaffOrAdmin = isAdmin || isStaff;

  // Account profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: currentUser?.fullName || '',
    phoneNumber: currentUser?.phoneNumber || '',
    departmentOrAffiliation: currentUser?.departmentOrAffiliation || ''
  });
  const [profileStatus, setProfileStatus] = useState(null);

  // Office details (if staff)
  const [officeDetails, setOfficeDetails] = useState(null);

  // Reservations for staff's office or user's bookings
  const [reservations, setReservations] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Reschedule & Relocate Modal (CRUD Update for Unforeseen Circumstances)
  const [relocateModal, setRelocateModal] = useState(null);
  const [relocateStatus, setRelocateStatus] = useState(null);
  const [relocateForm, setRelocateForm] = useState({
    status: 'CONFIRMED',
    reservationDate: '',
    slotTime: '09:15:00',
    locationOverride: '',
    notes: '',
    unseenReason: ''
  });

  // Delete Modal (CRUD Delete)
  const [deletingRes, setDeletingRes] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState(null);

  // Create Walk-in Modal (CRUD Create)
  const [isCreatingRes, setIsCreatingRes] = useState(false);
  const [createStatus, setCreateStatus] = useState(null);
  const [createForm, setNewRes] = useState({
    userId: 3,
    issueId: '',
    reservationDate: new Date().toISOString().split('T')[0],
    slotTime: '09:15:00',
    notes: 'Walk-in desk booking created by staff member'
  });

  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        fullName: currentUser.fullName || '',
        phoneNumber: currentUser.phoneNumber || '',
        departmentOrAffiliation: currentUser.departmentOrAffiliation || ''
      });
    }
  }, [currentUser]);

  useEffect(() => {
    fetchAccountData();
  }, [currentUser, userOfficeId, statusFilter]);

  const fetchAccountData = async () => {
    setLoading(true);
    try {
      // 1. Fetch facilities & issues for dropdowns
      const [facRes, issRes] = await Promise.all([
        fetch('https://unidesk-api.onrender.com/api/facilities'),
        fetch('https://unidesk-api.onrender.com/api/lookup/issues')
      ]);
      const [facData, issData] = await Promise.all([facRes.json(), issRes.json()]);
      if (facData.success) setFacilities(facData.data);
      if (issData.success) {
        setIssues(issData.data);
        if (issData.data.length > 0 && !createForm.issueId) {
          setNewRes(prev => ({ ...prev, issueId: issData.data[0].issue_id }));
        }
      }

      // 2. If staff, fetch assigned office details
      if (isStaff && userOfficeId) {
        const offRes = await fetch(`https://unidesk-api.onrender.com/api/offices/${userOfficeId}`);
        const offData = await offRes.json();
        if (offData.success) setOfficeDetails(offData.data);
      }

      // 3. Fetch reservations:
      // If staff: fetch reservations for user's assigned office
      // If admin: fetch all reservations
      // If student: fetch personal reservations
      let url = 'https://unidesk-api.onrender.com/api/reservations';
      const params = [];
      if (isStaff && userOfficeId) {
        params.push(`officeId=${userOfficeId}`);
      } else if (!isAdmin && currentUser?.userId) {
        params.push(`userId=${currentUser.userId}`);
      }
      if (statusFilter !== 'ALL') {
        params.push(`status=${statusFilter}`);
      }
      if (params.length > 0) {
        url += '?' + params.join('&');
      }

      const resRes = await fetch(url);
      const resData = await resRes.json();
      if (resData.success) setReservations(resData.data);
    } catch (err) {
      console.error('Account data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- SAVE PROFILE INFORMATION ---
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileStatus({ loading: true });

    try {
      const res = await fetch('https://unidesk-api.onrender.com/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.userId,
          fullName: profileForm.fullName,
          phoneNumber: profileForm.phoneNumber,
          departmentOrAffiliation: profileForm.departmentOrAffiliation
        })
      });

      const data = await res.json();
      if (data.success) {
        setProfileStatus({ success: true, message: data.message });
        if (onUpdateCurrentUser) {
          onUpdateCurrentUser(data.data);
        }
        localStorage.setItem('unidesk_user', JSON.stringify(data.data));
        setTimeout(() => {
          setIsEditingProfile(false);
          setProfileStatus(null);
        }, 1200);
      } else {
        setProfileStatus({ error: true, message: data.message });
      }
    } catch (err) {
      setProfileStatus({ error: true, message: err.message });
    }
  };

  // --- OPEN RELOCATE & RESCHEDULE MODAL (UNSEEN CIRCUMSTANCES) ---
  const handleOpenRelocateModal = (res) => {
    setRelocateModal(res);
    setRelocateStatus(null);
    setRelocateForm({
      status: res.reservation_status || 'CONFIRMED',
      reservationDate: res.reservation_date ? res.reservation_date.split('T')[0] : '',
      slotTime: res.slot_time || '09:15:00',
      locationOverride: res.location_override || '',
      notes: res.notes || '',
      unseenReason: ''
    });
  };

  // Preset Unseen Circumstance Helper
  const applyPresetReason = (reasonText, locationSuggestion) => {
    setRelocateForm(prev => ({
      ...prev,
      unseenReason: reasonText,
      locationOverride: locationSuggestion || prev.locationOverride,
      notes: prev.notes 
        ? `${prev.notes} [Notice: ${reasonText}]`
        : `[Unforeseen Notice: ${reasonText}]`
    }));
  };

  // --- SUBMIT RELOCATE & RESCHEDULE (CRUD UPDATE) ---
  const handleSaveRelocation = async (e) => {
    e.preventDefault();
    setRelocateStatus({ loading: true });

    try {
      const fullNotes = relocateForm.unseenReason
        ? `${relocateForm.notes ? relocateForm.notes + ' ' : ''}[Emergency Action: ${relocateForm.unseenReason}]`
        : relocateForm.notes;

      const res = await fetch(`https://unidesk-api.onrender.com/api/reservations/${relocateModal.reservation_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: relocateForm.status,
          reservationDate: relocateForm.reservationDate,
          slotTime: relocateForm.slotTime,
          locationOverride: relocateForm.locationOverride.trim() || null,
          notes: fullNotes,
          requesterRole: userRole,
          requesterOfficeId: userOfficeId,
          requesterUserId: currentUser?.userId
        })
      });

      const data = await res.json();
      if (data.success) {
        setRelocateStatus({
          success: true,
          message: data.message || 'Reservation rescheduled & relocated. Engine trigger trg_reservations_audit_update logged.'
        });
        fetchAccountData();
        setTimeout(() => setRelocateModal(null), 1200);
      } else {
        setRelocateStatus({ error: true, message: data.message });
      }
    } catch (err) {
      setRelocateStatus({ error: true, message: err.message });
    }
  };

  // --- SUBMIT DELETE (CRUD DELETE) ---
  const handleDeleteReservation = async () => {
    if (!deletingRes) return;
    setDeleteStatus({ loading: true });

    try {
      const res = await fetch(`https://unidesk-api.onrender.com/api/reservations/${deletingRes.reservation_id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterRole: userRole,
          requesterOfficeId: userOfficeId
        })
      });

      const data = await res.json();
      if (data.success) {
        setDeleteStatus({ success: true, message: data.message });
        fetchAccountData();
        setTimeout(() => setDeletingRes(null), 1200);
      } else {
        setDeleteStatus({ error: true, message: data.message });
      }
    } catch (err) {
      setDeleteStatus({ error: true, message: err.message });
    }
  };

  // --- CREATE WALK-IN BOOKING (CRUD CREATE) ---
  const handleCreateWalkin = async (e) => {
    e.preventDefault();
    setCreateStatus({ loading: true });

    try {
      const targetOffice = isStaff ? userOfficeId : (currentUser?.officeId || 1);
      const res = await fetch('https://unidesk-api.onrender.com/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parseInt(createForm.userId, 10) || 3,
          officeId: targetOffice,
          issueId: parseInt(createForm.issueId, 10),
          reservationDate: createForm.reservationDate,
          slotTime: createForm.slotTime,
          notes: createForm.notes,
          requesterRole: userRole,
          requesterOfficeId: userOfficeId
        })
      });

      const data = await res.json();
      if (data.success) {
        setCreateStatus({
          success: true,
          message: `Booking #${data.data?.reservationId} registered via stored procedure sp_book_office_reservation.`
        });
        fetchAccountData();
        setTimeout(() => {
          setIsCreatingRes(false);
          setCreateStatus(null);
        }, 1200);
      } else {
        setCreateStatus({ error: true, message: data.message });
      }
    } catch (err) {
      setCreateStatus({ error: true, message: err.message });
    }
  };

  // Filter reservations
  const filteredReservations = reservations.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.student_name?.toLowerCase().includes(q) ||
      r.user_email?.toLowerCase().includes(q) ||
      r.student_or_visitor_id?.toLowerCase().includes(q) ||
      r.issue_name?.toLowerCase().includes(q) ||
      r.location_override?.toLowerCase().includes(q) ||
      String(r.reservation_id).includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Hero Profile Banner */}
      <div className="hero-card" style={{ background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(14, 19, 32, 0.95) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: isAdmin ? 'rgba(239, 68, 68, 0.2)' :
                          isStaff ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.2)',
              border: `2px solid ${isAdmin ? 'rgba(239, 68, 68, 0.4)' : isStaff ? 'rgba(245, 158, 11, 0.4)' : 'rgba(56, 189, 248, 0.4)'}`,
              color: isAdmin ? '#f87171' : isStaff ? '#fbbf24' : '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.45rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)'
            }}>
              {currentUser?.fullName?.charAt(0) || 'U'}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                  {currentUser?.fullName || 'My Account Profile'}
                </h2>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.65rem',
                  borderRadius: '20px',
                  fontFamily: 'var(--font-mono)',
                  background: isAdmin ? 'rgba(239, 68, 68, 0.2)' : isStaff ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: isAdmin ? '#f87171' : isStaff ? '#fbbf24' : '#34d399',
                  border: `1px solid ${isAdmin ? 'rgba(239, 68, 68, 0.4)' : isStaff ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`
                }}>
                  {userRole}
                </span>
                {isStaff && (
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.65rem',
                    borderRadius: '20px',
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#93c5fd',
                    border: '1px solid rgba(59, 130, 246, 0.4)'
                  }}>
                    🏢 {currentUser?.officeName || 'Assigned Office'}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {currentUser?.email} &bull; ID: <code>{currentUser?.studentOrVisitorId || 'PENDING'}</code>
                {currentUser?.departmentOrAffiliation && ` &bull; ${currentUser?.departmentOrAffiliation}`}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem' }}
            >
              <Edit3 size={14} /> {isEditingProfile ? 'Cancel Edit' : 'Edit Profile Info'}
            </button>
          </div>
        </div>
      </div>

      {/* Account Info Details & Assigned Office Card */}
      <div style={{ display: 'grid', gridTemplateColumns: isStaff ? '1fr 1.2fr' : '1fr', gap: '1.35rem' }}>
        {/* Personal Account Information */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={16} color="var(--primary)" /> Account Identity & Credentials
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              User ID #{currentUser?.userId || 'N/A'}
            </span>
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+63 917 123 4567"
                  value={profileForm.phoneNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">College / Department / Affiliation</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Office of the University Registrar"
                  value={profileForm.departmentOrAffiliation}
                  onChange={(e) => setProfileForm({ ...profileForm, departmentOrAffiliation: e.target.value })}
                />
              </div>

              {profileStatus?.error && (
                <div style={{ padding: '0.7rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '8px', color: 'var(--danger-light)', fontSize: '0.8rem' }}>
                  <AlertCircle size={14} style={{ display: 'inline', marginRight: '0.35rem', verticalAlign: '-2px' }} />
                  {profileStatus.message}
                </div>
              )}

              {profileStatus?.success && (
                <div style={{ padding: '0.7rem', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: '8px', color: 'var(--success-light)', fontSize: '0.8rem' }}>
                  <CheckCircle2 size={14} style={{ display: 'inline', marginRight: '0.35rem', verticalAlign: '-2px' }} />
                  {profileStatus.message}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={profileStatus?.loading}>
                  <Save size={14} /> {profileStatus?.loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditingProfile(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.45rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-dim)' }}>Full Name:</span>
                <strong style={{ color: '#fff' }}>{currentUser?.fullName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.45rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-dim)' }}>Registered Email:</span>
                <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{currentUser?.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.45rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-dim)' }}>Official Role:</span>
                <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>{userRole}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.45rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-dim)' }}>ID Number:</span>
                <code style={{ color: '#a5b4fc' }}>{currentUser?.studentOrVisitorId || 'Not Specified'}</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.45rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-dim)' }}>Phone Contact:</span>
                <span style={{ color: '#fff' }}>{currentUser?.phoneNumber || '+63 (2) 8981-8500'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Affiliation:</span>
                <span style={{ color: '#fff' }}>{currentUser?.departmentOrAffiliation || 'University Administration'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Assigned Office Info (Staff Only) */}
        {isStaff && (
          <div className="card" style={{ padding: '1.25rem', border: '1px solid rgba(59, 130, 246, 0.35)', background: 'rgba(15, 23, 42, 0.7)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building size={18} color="#60a5fa" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#93c5fd' }}>
                  Assigned Administrative Office
                </h3>
              </div>
              <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>
                {officeDetails?.office_code || currentUser?.officeCode || 'OFFICE'}
              </span>
            </div>

            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>
              {officeDetails?.office_name || currentUser?.officeName}
            </h4>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              📍 <strong>{officeDetails?.building_name || 'Main Administration'}</strong> ({officeDetails?.room_number || 'Room 101'}, Floor {officeDetails?.floor_number || '1'})
            </div>

            <div className="directions-box" style={{ fontSize: '0.8rem', marginBottom: '0.85rem' }}>
              <strong style={{ color: '#60a5fa' }}>🧭 Physical Directions:</strong><br />
              {officeDetails?.desk_directions || 'Inquire at Main Directory lobby.'}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.72rem',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                background: officeDetails?.is_accepting_payments ? 'var(--success-bg)' : 'var(--danger-bg)',
                color: officeDetails?.is_accepting_payments ? 'var(--success-light)' : 'var(--danger-light)',
                border: `1px solid ${officeDetails?.is_accepting_payments ? 'var(--success-border)' : 'var(--danger-border)'}`
              }}>
                {officeDetails?.is_accepting_payments ? '✓ Accepting Fees' : '✕ No Cashier'}
              </span>
              <span style={{
                fontSize: '0.72rem',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                background: officeDetails?.is_accepting_reservations ? 'rgba(56, 189, 248, 0.15)' : 'var(--danger-bg)',
                color: officeDetails?.is_accepting_reservations ? 'var(--primary-light)' : 'var(--danger-light)',
                border: `1px solid ${officeDetails?.is_accepting_reservations ? 'rgba(56, 189, 248, 0.3)' : 'var(--danger-border)'}`
              }}>
                {officeDetails?.is_accepting_reservations ? '✓ Accepting Bookings' : '✕ Bookings Closed'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* --- STAFF OFFICE RESERVATIONS CONSOLE & DISPATCH CENTER --- */}
      {isStaffOrAdmin ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
          {/* Header & Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.1rem',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(14, 19, 32, 0.95) 100%)',
            borderRadius: '14px',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={20} color="#fbbf24" />
                  Office Reservations Desk & Emergency Dispatch (CRUD)
                </h3>
                <span className="badge badge-accent" style={{ fontSize: '0.72rem' }}>
                  {filteredReservations.length} Active Records
                </span>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Staff management console for <strong>{currentUser?.officeName || 'Assigned Office'}</strong>. In cases of unforeseen circumstances (AC outage, room repair, conflicts), you can reschedule time or relocate office windows.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setIsCreatingRes(true);
                  setCreateStatus(null);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem' }}
              >
                <Plus size={15} /> Book Walk-In / New
              </button>
            </div>
          </div>

          {/* Search & Status Filters */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '0.85rem 1rem',
            background: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Filter size={14} color="var(--primary)" />
                <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontWeight: 600 }}>Filter Status:</span>
                <select
                  className="form-select"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem', width: 'auto' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>

            <div style={{ position: 'relative', minWidth: '260px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2rem', paddingRight: '0.8rem', paddingBlock: '0.38rem', fontSize: '0.82rem' }}
                placeholder="Search user, ID, issue, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Interactive Reservations CRUD Table */}
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Res ID</th>
                  <th>Student / Requester</th>
                  <th>Administrative Issue</th>
                  <th>Date & Slot Time</th>
                  <th>Assigned Location</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Staff Actions (CRUD)</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map(r => {
                  const hasLocationOverride = !!r.location_override;

                  return (
                    <tr key={r.reservation_id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-light)' }}>
                        #{r.reservation_id}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{r.student_name || 'Campus Student'}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                          {r.user_email} &bull; {r.student_or_visitor_id || 'ID Pending'}
                        </div>
                      </td>
                      <td>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.issue_name}</div>
                        {r.notes && (
                          <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontStyle: 'italic', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            "{r.notes}"
                          </div>
                        )}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                        <div>{r.reservation_date ? r.reservation_date.split('T')[0] : ''}</div>
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.76rem' }}>{r.slot_time}</div>
                      </td>
                      <td>
                        {hasLocationOverride ? (
                          <div>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.18rem 0.5rem',
                              borderRadius: '6px',
                              background: 'rgba(245, 158, 11, 0.18)',
                              color: '#fbbf24',
                              border: '1px solid rgba(245, 158, 11, 0.4)',
                              fontSize: '0.74rem',
                              fontWeight: 700
                            }}>
                              <AlertTriangle size={12} /> Relocated: {r.location_override}
                            </span>
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            📍 {r.building_name} ({r.room_number})
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          background: 
                            r.reservation_status === 'CONFIRMED' ? 'var(--success-bg)' :
                            r.reservation_status === 'COMPLETED' ? 'rgba(56, 189, 248, 0.15)' :
                            r.reservation_status === 'CANCELLED' ? 'var(--danger-bg)' : 'var(--warning-bg)',
                          color: 
                            r.reservation_status === 'CONFIRMED' ? 'var(--success-light)' :
                            r.reservation_status === 'COMPLETED' ? 'var(--primary-light)' :
                            r.reservation_status === 'CANCELLED' ? 'var(--danger-light)' : 'var(--warning-light)',
                          border: `1px solid ${
                            r.reservation_status === 'CONFIRMED' ? 'var(--success-border)' :
                            r.reservation_status === 'COMPLETED' ? 'rgba(56, 189, 248, 0.3)' :
                            r.reservation_status === 'CANCELLED' ? 'var(--danger-border)' : 'var(--warning-border)'
                          }`
                        }}>
                          {r.reservation_status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.45rem', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenRelocateModal(r)}
                            title="Reschedule Time or Relocate Window (Unforeseen Circumstance)"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              fontSize: '0.76rem',
                              borderColor: 'rgba(245, 158, 11, 0.4)',
                              color: '#fbbf24'
                            }}
                          >
                            <Edit3 size={13} /> Reschedule / Relocate
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setDeletingRes(r);
                              setDeleteStatus(null);
                            }}
                            title="Delete Reservation Record (CRUD Delete)"
                            style={{ padding: '0.3rem 0.55rem', color: '#f87171' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredReservations.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-dim)' }}>
                      No user reservations found matching the current search criteria for your office.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* --- STUDENT PERSONAL BOOKINGS VIEW --- */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} color="var(--primary)" /> My Campus Appointments ({filteredReservations.length})
          </h3>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Res ID</th>
                  <th>Office & Facility</th>
                  <th>Service Requested</th>
                  <th>Scheduled Date & Slot</th>
                  <th>Location Status</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map(r => (
                  <tr key={r.reservation_id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-light)' }}>
                      #{r.reservation_id}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{r.office_name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                        {r.building_name} ({r.room_number})
                      </div>
                    </td>
                    <td>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.issue_name}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                      {r.reservation_date ? r.reservation_date.split('T')[0] : ''} &bull; {r.slot_time}
                    </td>
                    <td>
                      {r.location_override ? (
                        <span style={{ color: '#fbbf24', fontSize: '0.78rem', fontWeight: 600 }}>
                          ⚠️ Relocated: {r.location_override}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                          Standard Office Window
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        background: r.reservation_status === 'CONFIRMED' ? 'var(--success-bg)' : 'var(--warning-bg)',
                        color: r.reservation_status === 'CONFIRMED' ? 'var(--success-light)' : 'var(--warning-light)',
                        border: `1px solid ${r.reservation_status === 'CONFIRMED' ? 'var(--success-border)' : 'var(--warning-border)'}`
                      }}>
                        {r.reservation_status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredReservations.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-dim)' }}>
                      You currently have no active campus reservations.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODAL 1: RESCHEDULE & RELOCATE (UNFORESEEN CIRCUMSTANCES) --- */}
      {relocateModal && (
        <div className="modal-overlay" onClick={() => setRelocateModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24' }}>
                  <AlertTriangle size={18} /> Reschedule & Relocate (Unforeseen Circumstances)
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  Reservation #{relocateModal.reservation_id} &bull; {relocateModal.student_name} ({relocateModal.issue_name})
                </span>
              </div>
              <button className="close-btn" onClick={() => setRelocateModal(null)}>✕</button>
            </div>

            {relocateStatus?.success ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <CheckCircle2 size={54} color="#10b981" style={{ margin: '0 auto 1rem' }} />
                <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success-light)' }}>
                  Relocation & Rescheduling Saved!
                </h4>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  {relocateStatus.message}
                </p>
                <div className="code-preview" style={{ marginTop: '1.25rem', textAlign: 'left' }}>
                  ⚡ Engine Trigger Executed: trg_reservations_audit_update<br />
                  Target: office_reservations (ID #{relocateModal.reservation_id})<br />
                  New Time: {relocateForm.slotTime} ({relocateForm.reservationDate})<br />
                  Location: {relocateForm.locationOverride || 'Standard'}<br />
                  Audit record logged in audit_logs.
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveRelocation} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                {/* Unforeseen Circumstance Presets */}
                <div>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fbbf24' }}>
                    <Sparkles size={14} /> Quick Circumstance Presets (Click to autofill)
                  </label>
                  <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.74rem' }}
                      onClick={() => applyPresetReason('AC / HVAC Maintenance in Main Office', 'Temporary Desk at South Hall 204')}
                    >
                      ❄️ AC Breakdown
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.74rem' }}
                      onClick={() => applyPresetReason('Emergency Power/Network Maintenance', 'Relocated to West Wing Computer Lab 102')}
                    >
                      ⚡ Network Outage
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.74rem' }}
                      onClick={() => applyPresetReason('Room Renovation / Facility Painting', 'Annex Room 301')}
                    >
                      🛠️ Room Repairs
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.74rem' }}
                      onClick={() => applyPresetReason('Urgent Departmental Meeting / Conflicting Event', 'Executive Conference Window')}
                    >
                      📅 Staff Meeting Conflict
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.74rem' }}
                      onClick={() => applyPresetReason('Inclement Weather Protocol', 'Ground Floor Emergency Assistance Desk')}
                    >
                      🌧️ Weather Advisory
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label">New Scheduled Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={relocateForm.reservationDate}
                      onChange={(e) => setRelocateForm({ ...relocateForm, reservationDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">New Time Slot</label>
                    <select
                      className="form-select"
                      value={relocateForm.slotTime}
                      onChange={(e) => setRelocateForm({ ...relocateForm, slotTime: e.target.value })}
                      required
                    >
                      <option value="08:30:00">08:30 AM</option>
                      <option value="09:15:00">09:15 AM</option>
                      <option value="10:00:00">10:00 AM</option>
                      <option value="10:45:00">10:45 AM</option>
                      <option value="13:30:00">01:30 PM</option>
                      <option value="14:15:00">02:15 PM</option>
                      <option value="15:00:00">03:00 PM</option>
                      <option value="15:45:00">03:45 PM</option>
                    </select>
                  </div>
                </div>

                {/* Location Override */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#60a5fa' }}>
                    <MapPin size={14} /> Relocated Physical Location / Temporary Room Override
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Relocated to South Hall Room 204 (2nd Floor)"
                    value={relocateForm.locationOverride}
                    onChange={(e) => setRelocateForm({ ...relocateForm, locationOverride: e.target.value })}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Or pick existing campus facility:</span>
                    <select
                      className="form-select"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', width: 'auto' }}
                      onChange={(e) => {
                        if (e.target.value) {
                          setRelocateForm(prev => ({ ...prev, locationOverride: e.target.value }));
                        }
                      }}
                    >
                      <option value="">-- Choose Campus Facility --</option>
                      {facilities.map(f => (
                        <option key={f.facility_id} value={`${f.building_name} (${f.room_number}, Floor ${f.floor_number})`}>
                          {f.building_name} ({f.room_number})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Booking Status</label>
                  <select
                    className="form-select"
                    value={relocateForm.status}
                    onChange={(e) => setRelocateForm({ ...relocateForm, status: e.target.value })}
                    required
                  >
                    <option value="CONFIRMED">CONFIRMED (Rescheduled / Relocated)</option>
                    <option value="PENDING">PENDING (Awaiting Student Acknowledgment)</option>
                    <option value="COMPLETED">COMPLETED (Fulfilled)</option>
                    <option value="CANCELLED">CANCELLED (Cannot accommodate)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Operational Notes & Student Notification Reason</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    placeholder="Explain circumstance to the user (e.g. Relocated due to AC maintenance; rescheduled to tomorrow 9:15 AM)..."
                    value={relocateForm.notes}
                    onChange={(e) => setRelocateForm({ ...relocateForm, notes: e.target.value })}
                  ></textarea>
                </div>

                {relocateStatus?.error && (
                  <div style={{ padding: '0.85rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '10px', color: 'var(--danger-light)', fontSize: '0.85rem' }}>
                    <AlertCircle size={15} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: '-2px' }} />
                    {relocateStatus.message}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setRelocateModal(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#f59e0b', borderColor: '#d97706' }} disabled={relocateStatus?.loading}>
                    {relocateStatus?.loading ? 'Executing Engine Update...' : 'Confirm Reschedule & Relocate'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL 2: DELETE CONFIRMATION --- */}
      {deletingRes && (
        <div className="modal-overlay" onClick={() => setDeletingRes(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title" style={{ color: '#f87171' }}>Delete Reservation Record</h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                  Record ID #{deletingRes.reservation_id}
                </span>
              </div>
              <button className="close-btn" onClick={() => setDeletingRes(null)}>✕</button>
            </div>

            {deleteStatus?.success ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <CheckCircle2 size={54} color="#10b981" style={{ margin: '0 auto 1rem' }} />
                <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success-light)' }}>
                  Reservation Deleted!
                </h4>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  {deleteStatus.message}
                </p>
                <div className="code-preview" style={{ marginTop: '1.25rem', textAlign: 'left' }}>
                  ⚡ Engine Trigger Executed: trg_reservations_audit_delete<br />
                  Target: office_reservations (ID #{deletingRes.reservation_id})<br />
                  Audit record logged in audit_logs.
                </div>
              </div>
            ) : (
              <div>
                <div style={{
                  padding: '1rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '10px',
                  marginBottom: '1.2rem',
                  fontSize: '0.86rem',
                  color: '#fca5a5'
                }}>
                  <AlertCircle size={16} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: '-3px' }} />
                  Permanently remove reservation <strong>#{deletingRes.reservation_id}</strong> for <strong>{deletingRes.student_name}</strong>?
                </div>

                {deleteStatus?.error && (
                  <div style={{ padding: '0.85rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '10px', color: 'var(--danger-light)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    <AlertCircle size={15} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: '-2px' }} />
                    {deleteStatus.message}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDeletingRes(null)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flex: 1, background: '#ef4444', borderColor: '#dc2626' }}
                    onClick={handleDeleteReservation}
                    disabled={deleteStatus?.loading}
                  >
                    {deleteStatus?.loading ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL 3: CREATE WALK-IN / NEW BOOKING --- */}
      {isCreatingRes && (
        <div className="modal-overlay" onClick={() => setIsCreatingRes(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Book Walk-In Office Reservation</h3>
                <span style={{ fontSize: '0.82rem', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                  Calls Stored Procedure: sp_book_office_reservation
                </span>
              </div>
              <button className="close-btn" onClick={() => setIsCreatingRes(false)}>✕</button>
            </div>

            {createStatus?.success ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <CheckCircle2 size={54} color="#10b981" style={{ margin: '0 auto 1rem' }} />
                <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success-light)' }}>
                  Reservation Scheduled!
                </h4>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  {createStatus.message}
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateWalkin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div className="form-group">
                  <label className="form-label">Administrative Issue Service</label>
                  <select
                    className="form-select"
                    value={createForm.issueId}
                    onChange={(e) => setNewRes({ ...createForm, issueId: e.target.value })}
                    required
                  >
                    {issues.map(i => (
                      <option key={i.issue_id} value={i.issue_id}>
                        {i.issue_name} (PHP {parseFloat(i.standard_fee).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label">Scheduled Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={createForm.reservationDate}
                      onChange={(e) => setNewRes({ ...createForm, reservationDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Time Slot</label>
                    <select
                      className="form-select"
                      value={createForm.slotTime}
                      onChange={(e) => setNewRes({ ...createForm, slotTime: e.target.value })}
                      required
                    >
                      <option value="08:30:00">08:30 AM</option>
                      <option value="09:15:00">09:15 AM</option>
                      <option value="10:00:00">10:00 AM</option>
                      <option value="10:45:00">10:45 AM</option>
                      <option value="13:30:00">01:30 PM</option>
                      <option value="14:15:00">02:15 PM</option>
                      <option value="15:00:00">03:00 PM</option>
                      <option value="15:45:00">03:45 PM</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Desk Notes</label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    value={createForm.notes}
                    onChange={(e) => setNewRes({ ...createForm, notes: e.target.value })}
                    required
                  ></textarea>
                </div>

                {createStatus?.error && (
                  <div style={{ padding: '0.85rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '10px', color: 'var(--danger-light)', fontSize: '0.85rem' }}>
                    <AlertCircle size={15} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: '-2px' }} />
                    {createStatus.message}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsCreatingRes(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={createStatus?.loading}>
                    {createStatus?.loading ? 'Executing Procedure...' : 'Confirm Appointment'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
