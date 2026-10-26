import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Phone, 
  Mail, 
  Compass, 
  DollarSign, 
  Calendar,
  Save,
  Zap,
  ShieldCheck,
  Plus,
  Lock,
  Unlock,
  Info
} from 'lucide-react';

export default function OfficeMgmtView({ currentUser }) {
  const [offices, setOffices] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingOffice, setEditingOffice] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);

  // Add Office Modal State (Admin only)
  const [isAddingOffice, setIsAddingOffice] = useState(false);
  const [addStatus, setAddStatus] = useState(null);
  const [newOffice, setNewOffice] = useState({
    facilityId: '',
    officeCode: '',
    name: '',
    email: '',
    phone: '+63 (2) 8981-8500',
    deskDirections: '',
    isAcceptingPayments: true,
    isAcceptingReservations: true
  });

  const userRole = currentUser?.role || 'STAFF';
  const userOfficeId = currentUser?.officeId || null;
  const isAdmin = userRole === 'ADMIN';
  const isStaff = userRole === 'STAFF';

  useEffect(() => {
    fetchOffices();
    fetchFacilities();
  }, []);

  const fetchOffices = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/offices');
      const data = await res.json();
      if (data.success) {
        setOffices(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacilities = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/facilities');
      const data = await res.json();
      if (data.success) {
        setFacilities(data.data);
        if (data.data.length > 0) {
          setNewOffice(prev => ({ ...prev, facilityId: data.data[0].facility_id }));
        }
      }
    } catch (e) {
      console.warn('Could not fetch facilities:', e);
    }
  };

  const handleSaveUpdate = async (e) => {
    e.preventDefault();
    setSaveStatus({ loading: true });

    try {
      const res = await fetch(`http://localhost:5000/api/admin/offices/${editingOffice.office_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingOffice.office_name,
          email: editingOffice.email,
          phone: editingOffice.phone,
          deskDirections: editingOffice.desk_directions,
          isAcceptingPayments: editingOffice.is_accepting_payments ? 1 : 0,
          isAcceptingReservations: editingOffice.is_accepting_reservations ? 1 : 0,
          requesterRole: userRole,
          requesterOfficeId: userOfficeId
        })
      });

      const data = await res.json();
      if (data.success) {
        setSaveStatus({
          success: true,
          message: data.message
        });
        fetchOffices();
        setTimeout(() => setEditingOffice(null), 1200);
      } else {
        setSaveStatus({ error: true, message: data.message });
      }
    } catch (err) {
      setSaveStatus({ error: true, message: err.message });
    }
  };

  const handleCreateOffice = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      setAddStatus({ error: true, message: 'Permission denied: Only Administrators can register new campus offices.' });
      return;
    }

    setAddStatus({ loading: true });
    try {
      const res = await fetch('http://localhost:5000/api/admin/offices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityId: parseInt(newOffice.facilityId, 10),
          officeCode: newOffice.officeCode.trim().toUpperCase(),
          name: newOffice.name.trim(),
          email: newOffice.email.trim(),
          phone: newOffice.phone.trim(),
          deskDirections: newOffice.deskDirections.trim(),
          isAcceptingPayments: newOffice.isAcceptingPayments ? 1 : 0,
          isAcceptingReservations: newOffice.isAcceptingReservations ? 1 : 0,
          requesterRole: 'ADMIN'
        })
      });

      const data = await res.json();
      if (data.success) {
        setAddStatus({
          success: true,
          message: data.message || 'New office registered with default operating hours.'
        });
        fetchOffices();
        setTimeout(() => {
          setIsAddingOffice(false);
          setAddStatus(null);
          setNewOffice({
            facilityId: facilities[0]?.facility_id || '',
            officeCode: '',
            name: '',
            email: '',
            phone: '+63 (2) 8981-8500',
            deskDirections: '',
            isAcceptingPayments: true,
            isAcceptingReservations: true
          });
        }, 1200);
      } else {
        setAddStatus({ error: true, message: data.message });
      }
    } catch (err) {
      setAddStatus({ error: true, message: err.message });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Banner */}
      <div className="hero-card" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(14, 19, 32, 0.95) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={24} color="#f59e0b" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h3 style={{ fontSize: '1.18rem', fontWeight: 700, color: '#f8fafc' }}>
                  Campus Administration Office Management (CRUD)
                </h3>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '20px',
                  background: isAdmin ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                  color: isAdmin ? '#f87171' : '#60a5fa',
                  border: `1px solid ${isAdmin ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`
                }}>
                  {isAdmin ? '🛡️ Admin: Full Edit & Office Creation' : `🏢 Staff: Assigned Office Only (#${userOfficeId || 'Unassigned'})`}
                </span>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {isAdmin
                  ? 'As System Administrator, you can create new campus offices and edit metadata across all departments.'
                  : `As Staff, you can edit metadata and desk directions for your assigned office (${currentUser?.officeName || 'Assigned Office'}). Other offices are locked.`}
              </p>
            </div>
          </div>

          {/* Action button: Only Admin can add offices */}
          {isAdmin ? (
            <button
              className="btn btn-primary"
              onClick={() => {
                setIsAddingOffice(true);
                setAddStatus(null);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <Plus size={16} /> Add New Campus Office
            </button>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '0.78rem',
              color: 'var(--text-dim)'
            }}>
              <Lock size={13} /> Only Admins can register new offices
            </div>
          )}
        </div>
      </div>

      {/* Offices Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(370px, 1fr))', gap: '1.35rem' }}>
        {offices.map(o => {
          const isAssignedToThisStaff = isStaff && userOfficeId && parseInt(userOfficeId, 10) === parseInt(o.office_id, 10);
          const canEditThisOffice = isAdmin || isAssignedToThisStaff;

          return (
            <div 
              key={o.office_id} 
              className="office-card"
              style={{
                border: isAssignedToThisStaff ? '1px solid rgba(59, 130, 246, 0.5)' : undefined,
                boxShadow: isAssignedToThisStaff ? '0 4px 20px rgba(59, 130, 246, 0.12)' : undefined
              }}
            >
              <div>
                <div className="office-card-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="office-code-badge">{o.office_code}</span>
                      {isAssignedToThisStaff && (
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '12px',
                          background: 'rgba(59, 130, 246, 0.25)',
                          color: '#93c5fd',
                          border: '1px solid rgba(59, 130, 246, 0.4)'
                        }}>
                          ★ Your Office
                        </span>
                      )}
                    </div>
                    <h3 className="office-title" style={{ marginTop: '0.45rem' }}>{o.office_name}</h3>
                  </div>

                  {canEditThisOffice ? (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setEditingOffice({ ...o });
                        setSaveStatus(null);
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                  ) : (
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled
                      title="Only assigned staff or administrators can modify this office."
                      style={{ opacity: 0.5, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Lock size={12} /> Locked
                    </button>
                  )}
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.65rem' }}>
                  📍 <strong>{o.building_name}</strong> ({o.room_number}, Floor {o.floor_number})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.75rem', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-dim)' }}>
                    <Mail size={13} /> {o.email}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-dim)' }}>
                    <Phone size={13} /> {o.phone}
                  </div>
                </div>

                <div className="directions-box" style={{ marginTop: '0.85rem' }}>
                  <strong style={{ color: 'var(--primary-light)', fontSize: '0.76rem' }}>🧭 Desk Directions:</strong><br />
                  {o.desk_directions}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.95rem', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    padding: '0.22rem 0.55rem',
                    borderRadius: '6px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    background: o.is_accepting_payments ? 'var(--success-bg)' : 'var(--danger-bg)',
                    color: o.is_accepting_payments ? 'var(--success-light)' : 'var(--danger-light)',
                    border: `1px solid ${o.is_accepting_payments ? 'var(--success-border)' : 'var(--danger-border)'}`
                  }}>
                    {o.is_accepting_payments ? '✓ Accepts Payments' : '✕ No Payments'}
                  </span>
                  <span style={{
                    fontSize: '0.72rem',
                    padding: '0.22rem 0.55rem',
                    borderRadius: '6px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    background: o.is_accepting_reservations ? 'rgba(56, 189, 248, 0.15)' : 'var(--danger-bg)',
                    color: o.is_accepting_reservations ? 'var(--primary-light)' : 'var(--danger-light)',
                    border: `1px solid ${o.is_accepting_reservations ? 'rgba(56, 189, 248, 0.3)' : 'var(--danger-border)'}`
                  }}>
                    {o.is_accepting_reservations ? '✓ Accepts Bookings' : '✕ No Bookings'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Office Modal */}
      {editingOffice && (
        <div className="modal-overlay" onClick={() => setEditingOffice(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Edit Office Details</h3>
                <span style={{ fontSize: '0.84rem', color: 'var(--primary-light)', fontFamily: 'var(--font-mono)' }}>
                  {editingOffice.office_code} &bull; {editingOffice.office_name}
                </span>
              </div>
              <button className="close-btn" onClick={() => setEditingOffice(null)}>✕</button>
            </div>

            {saveStatus?.success ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <CheckCircle2 size={54} color="#10b981" style={{ margin: '0 auto 1rem' }} />
                <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success-light)' }}>
                  Office Record Updated!
                </h4>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  {saveStatus.message}
                </p>
                <div className="code-preview" style={{ marginTop: '1.25rem', textAlign: 'left' }}>
                  ⚡ Engine Trigger Executed: trg_offices_audit_update<br />
                  Target: offices (ID #{editingOffice.office_id})<br />
                  Audit record logged in audit_logs table.
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div className="form-group">
                  <label className="form-label">Office Official Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingOffice.office_name}
                    onChange={(e) => setEditingOffice({ ...editingOffice, office_name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      value={editingOffice.email}
                      onChange={(e) => setEditingOffice({ ...editingOffice, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Hotline</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingOffice.phone}
                      onChange={(e) => setEditingOffice({ ...editingOffice, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Walking & Desk Directions</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    value={editingOffice.desk_directions}
                    onChange={(e) => setEditingOffice({ ...editingOffice, desk_directions: e.target.value })}
                    required
                  ></textarea>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', padding: '0.5rem 0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={!!editingOffice.is_accepting_payments}
                      onChange={(e) => setEditingOffice({ ...editingOffice, is_accepting_payments: e.target.checked })}
                    />
                    Accepts Cashier Payments
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={!!editingOffice.is_accepting_reservations}
                      onChange={(e) => setEditingOffice({ ...editingOffice, is_accepting_reservations: e.target.checked })}
                    />
                    Accepts Online Bookings
                  </label>
                </div>

                {saveStatus?.error && (
                  <div style={{ padding: '0.85rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '10px', color: 'var(--danger-light)', fontSize: '0.85rem' }}>
                    <AlertCircle size={15} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: '-2px' }} />
                    {saveStatus.message}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditingOffice(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saveStatus?.loading}>
                    {saveStatus?.loading ? 'Executing Engine Update...' : 'Save & Trigger Audit'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add New Office Modal (ADMIN ONLY) */}
      {isAddingOffice && (
        <div className="modal-overlay" onClick={() => setIsAddingOffice(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Register New Campus Office</h3>
                <span style={{ fontSize: '0.82rem', color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
                  Restricted Administrator Operation &bull; Auto-initializes operating hours
                </span>
              </div>
              <button className="close-btn" onClick={() => setIsAddingOffice(false)}>✕</button>
            </div>

            {addStatus?.success ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <CheckCircle2 size={54} color="#10b981" style={{ margin: '0 auto 1rem' }} />
                <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success-light)' }}>
                  New Office Successfully Created!
                </h4>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  {addStatus.message}
                </p>
                <div className="code-preview" style={{ marginTop: '1.25rem', textAlign: 'left' }}>
                  ⚡ Auto-Generated Standard Mon-Fri 08:00-17:00 Operating Hours<br />
                  Office Code: {newOffice.officeCode}<br />
                  Database Referential Integrity Maintained.
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateOffice} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label">Physical Campus Facility / Room</label>
                    <select
                      className="form-select"
                      value={newOffice.facilityId}
                      onChange={(e) => setNewOffice({ ...newOffice, facilityId: e.target.value })}
                      required
                    >
                      {facilities.map(f => (
                        <option key={f.facility_id} value={f.facility_id}>
                          {f.building_name} ({f.room_number}, Fl {f.floor_number})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Office Code (Unique)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. ADM-DSA"
                      value={newOffice.officeCode}
                      onChange={(e) => setNewOffice({ ...newOffice, officeCode: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Official Office Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Office of Student Affairs & Services"
                    value={newOffice.name}
                    onChange={(e) => setNewOffice({ ...newOffice, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label">Contact Email</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="e.g. affairs@unidesk.edu"
                      value={newOffice.email}
                      onChange={(e) => setNewOffice({ ...newOffice, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Hotline Phone</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newOffice.phone}
                      onChange={(e) => setNewOffice({ ...newOffice, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Walking & Desk Directions</label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    placeholder="e.g. Enter main lobby, take south elevator to 2nd floor, turn left past Room 204."
                    value={newOffice.deskDirections}
                    onChange={(e) => setNewOffice({ ...newOffice, deskDirections: e.target.value })}
                    required
                  ></textarea>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', padding: '0.4rem 0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newOffice.isAcceptingPayments}
                      onChange={(e) => setNewOffice({ ...newOffice, isAcceptingPayments: e.target.checked })}
                    />
                    Accepts Cashier Payments
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newOffice.isAcceptingReservations}
                      onChange={(e) => setNewOffice({ ...newOffice, isAcceptingReservations: e.target.checked })}
                    />
                    Accepts Online Bookings
                  </label>
                </div>

                {addStatus?.error && (
                  <div style={{ padding: '0.85rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '10px', color: 'var(--danger-light)', fontSize: '0.85rem' }}>
                    <AlertCircle size={15} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: '-2px' }} />
                    {addStatus.message}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsAddingOffice(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={addStatus?.loading}>
                    {addStatus?.loading ? 'Creating Office...' : 'Register Office & Initialize'}
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
