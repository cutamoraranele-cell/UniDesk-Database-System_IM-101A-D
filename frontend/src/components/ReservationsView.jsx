import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Receipt, 
  Calendar, 
  DollarSign, 
  Building, 
  Zap,
  ArrowRight,
  ShieldCheck,
  Edit3,
  Trash2,
  Plus,
  Search,
  Filter,
  Lock,
  RefreshCw,
  User,
  FileText
} from 'lucide-react';

export default function ReservationsView({ currentUserId = 3, currentUser }) {
  const userRole = currentUser?.role || 'STUDENT';
  const userOfficeId = currentUser?.officeId || null;
  const isAdmin = userRole === 'ADMIN';
  const isStaff = userRole === 'STAFF';
  const isStaffOrAdmin = isAdmin || isStaff;

  // Active sub-tab
  const [activeTab, setActiveTab] = useState(isStaffOrAdmin ? 'staff_ops' : 'my_reservations');

  // Data states
  const [personalReservations, setPersonalReservations] = useState([]);
  const [operationalReservations, setOperationalReservations] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [offices, setOffices] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters for Operational Desk
  const [selectedOfficeFilter, setSelectedOfficeFilter] = useState(isStaff && userOfficeId ? String(userOfficeId) : 'ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Payment Modal (for student settlements)
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CAMPUS_WALLET');
  const [paymentStatus, setPaymentStatus] = useState(null);

  // Edit Reservation Modal (CRUD Update)
  const [editingRes, setEditingRes] = useState(null);
  const [editStatus, setEditStatus] = useState(null);

  // Delete Confirmation Modal (CRUD Delete)
  const [deletingRes, setDeletingRes] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState(null);

  // Create Walk-in Reservation Modal (CRUD Create)
  const [isCreatingRes, setIsCreatingRes] = useState(false);
  const [createStatus, setCreateStatus] = useState(null);
  const [newRes, setNewRes] = useState({
    userId: currentUserId || 3,
    officeId: isStaff && userOfficeId ? userOfficeId : '',
    issueId: '',
    reservationDate: new Date().toISOString().split('T')[0],
    slotTime: '09:15:00',
    notes: 'Walk-in desk appointment booked by staff/admin'
  });

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchData();
  }, [currentUserId, selectedOfficeFilter, selectedStatusFilter]);

  const fetchMetadata = async () => {
    try {
      const [offRes, issRes] = await Promise.all([
        fetch('https://unidesk-api.onrender.com/api/offices'),
        fetch('https://unidesk-api.onrender.com/api/lookup/issues')
      ]);
      const [offData, issData] = await Promise.all([offRes.json(), issRes.json()]);
      if (offData.success) {
        setOffices(offData.data);
        if (offData.data.length > 0 && !newRes.officeId) {
          setNewRes(prev => ({ 
            ...prev, 
            officeId: isStaff && userOfficeId ? userOfficeId : offData.data[0].office_id 
          }));
        }
      }
      if (issData.success) {
        setIssues(issData.data);
        if (issData.data.length > 0 && !newRes.issueId) {
          setNewRes(prev => ({ ...prev, issueId: issData.data[0].issue_id }));
        }
      }
    } catch (err) {
      console.warn('Metadata fetch error:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Personal reservations
      const personalPromise = fetch(`https://unidesk-api.onrender.com/api/reservations?userId=${currentUserId}`).then(r => r.json());
      
      // 2. Operational reservations (if staff, filter by assigned office; if admin, filter by selectedOfficeFilter)
      let opsUrl = 'https://unidesk-api.onrender.com/api/reservations';
      const params = [];
      if (isStaff && userOfficeId) {
        params.push(`officeId=${userOfficeId}`);
      } else if (isAdmin && selectedOfficeFilter !== 'ALL') {
        params.push(`officeId=${selectedOfficeFilter}`);
      }
      if (selectedStatusFilter !== 'ALL') {
        params.push(`status=${selectedStatusFilter}`);
      }
      if (params.length > 0) {
        opsUrl += '?' + params.join('&');
      }
      const opsPromise = isStaffOrAdmin ? fetch(opsUrl).then(r => r.json()) : Promise.resolve({ success: true, data: [] });

      // 3. Transactions
      const txnPromise = fetch('https://unidesk-api.onrender.com/api/transactions').then(r => r.json());

      const [pData, oData, tData] = await Promise.all([personalPromise, opsPromise, txnPromise]);

      if (pData.success) setPersonalReservations(pData.data);
      if (oData.success) setOperationalReservations(oData.data);
      if (tData.success) setTransactions(tData.data);
    } catch (err) {
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- CRUD: UPDATE RESERVATION ---
  const handleUpdateReservation = async (e) => {
    e.preventDefault();
    setEditStatus({ loading: true });

    try {
      const res = await fetch(`https://unidesk-api.onrender.com/api/reservations/${editingRes.reservation_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editingRes.reservation_status,
          reservationDate: editingRes.reservation_date ? editingRes.reservation_date.split('T')[0] : editingRes.reservation_date,
          slotTime: editingRes.slot_time,
          notes: editingRes.notes,
          requesterRole: userRole,
          requesterOfficeId: userOfficeId,
          requesterUserId: currentUserId
        })
      });

      const data = await res.json();
      if (data.success) {
        setEditStatus({
          success: true,
          message: data.message
        });
        fetchData();
        setTimeout(() => setEditingRes(null), 1200);
      } else {
        setEditStatus({ error: true, message: data.message });
      }
    } catch (err) {
      setEditStatus({ error: true, message: err.message });
    }
  };

  // --- CRUD: DELETE RESERVATION ---
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
        setDeleteStatus({
          success: true,
          message: data.message
        });
        fetchData();
        setTimeout(() => setDeletingRes(null), 1200);
      } else {
        setDeleteStatus({ error: true, message: data.message });
      }
    } catch (err) {
      setDeleteStatus({ error: true, message: err.message });
    }
  };

  // --- CRUD: CREATE MANUAL / WALK-IN RESERVATION ---
  const handleCreateReservation = async (e) => {
    e.preventDefault();
    setCreateStatus({ loading: true });

    try {
      const targetOfficeId = isStaff ? userOfficeId : parseInt(newRes.officeId, 10);
      const res = await fetch('https://unidesk-api.onrender.com/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parseInt(newRes.userId, 10) || currentUserId || 3,
          officeId: targetOfficeId,
          issueId: parseInt(newRes.issueId, 10),
          reservationDate: newRes.reservationDate,
          slotTime: newRes.slotTime,
          notes: newRes.notes,
          requesterRole: userRole,
          requesterOfficeId: userOfficeId
        })
      });

      const data = await res.json();
      if (data.success) {
        setCreateStatus({
          success: true,
          message: `Booking #${data.data?.reservationId} registered via sp_book_office_reservation.`
        });
        fetchData();
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

  // --- Settle Payment (Standard User) ---
  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setPaymentStatus({ loading: true });

    try {
      const res = await fetch('https://unidesk-api.onrender.com/api/transactions/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: paymentModal.transaction_id,
          paymentMethod: paymentMethod,
          amountPaid: parseFloat(paymentModal.amount)
        })
      });

      const data = await res.json();
      if (data.success) {
        setPaymentStatus({
          success: true,
          message: data.message,
          data: data.data
        });
        fetchData();
      } else {
        setPaymentStatus({
          error: true,
          message: data.message || 'Payment processing failed.'
        });
      }
    } catch (err) {
      setPaymentStatus({
        error: true,
        message: err.message
      });
    }
  };

  // Filter operational reservations by search query
  const filteredOpsReservations = operationalReservations.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.student_name?.toLowerCase().includes(q) ||
      r.user_email?.toLowerCase().includes(q) ||
      r.student_or_visitor_id?.toLowerCase().includes(q) ||
      r.issue_name?.toLowerCase().includes(q) ||
      r.office_name?.toLowerCase().includes(q) ||
      String(r.reservation_id).includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner explaining Database Engine Automation & RBAC */}
      <div className="hero-card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(14, 19, 32, 0.95) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Zap size={24} color="#10b981" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h3 style={{ fontSize: '1.18rem', fontWeight: 700, color: '#f8fafc' }}>
                  Reservation Management & Database Trigger Automation
                </h3>
                {isStaffOrAdmin && (
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '20px',
                    background: isAdmin ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                    color: isAdmin ? '#f87171' : '#60a5fa',
                    border: `1px solid ${isAdmin ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`
                  }}>
                    {isAdmin ? '🛡️ Admin: All Offices (CRUD)' : `🏢 Staff: ${currentUser?.officeName || 'Assigned Office'} Only (CRUD)`}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Relational triggers <code>trg_reservations_audit_update</code>, <code>trg_reservations_audit_delete</code>, and <code>trg_on_transaction_payment_settled</code> enforce full auditability and state transitions on reservation modifications.
              </p>
            </div>
          </div>

          {/* New Reservation Action button for staff/admin */}
          {isStaffOrAdmin && activeTab === 'staff_ops' && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setIsCreatingRes(true);
                setCreateStatus(null);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <Plus size={16} /> New Walk-in / Booking
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {isStaffOrAdmin && (
          <button
            className={`nav-tab-btn ${activeTab === 'staff_ops' ? 'active' : ''}`}
            onClick={() => setActiveTab('staff_ops')}
          >
            <ShieldCheck size={16} /> Office Reservations Desk (CRUD) ({operationalReservations.length})
          </button>
        )}
        <button
          className={`nav-tab-btn ${activeTab === 'my_reservations' ? 'active' : ''}`}
          onClick={() => setActiveTab('my_reservations')}
        >
          <Calendar size={16} /> My Bookings ({personalReservations.length})
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <Receipt size={16} /> Financial Transactions ({transactions.length})
        </button>
      </div>

      {/* TAB 1: OPERATIONAL MANAGEMENT DESK (STAFF / ADMIN CRUD) */}
      {isStaffOrAdmin && activeTab === 'staff_ops' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Filter Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '1rem',
            background: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', flex: 1 }}>
              {/* Office Filter: Dropdown for Admin, locked badge for Staff */}
              {isAdmin ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Building size={15} color="var(--primary)" />
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontWeight: 600 }}>Filter Office:</span>
                  <select
                    className="form-select"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem', width: 'auto' }}
                    value={selectedOfficeFilter}
                    onChange={(e) => setSelectedOfficeFilter(e.target.value)}
                  >
                    <option value="ALL">All Campus Offices</option>
                    {offices.map(o => (
                      <option key={o.office_id} value={o.office_id}>
                        {o.office_code} - {o.office_name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  fontSize: '0.82rem',
                  color: '#93c5fd'
                }}>
                  <Building size={14} />
                  <span>Assigned Office: <strong>{currentUser?.officeName || `Office #${userOfficeId}`}</strong></span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>(Strict Staff RBAC Scope)</span>
                </div>
              )}

              {/* Status Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Filter size={15} color="var(--primary)" />
                <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontWeight: 600 }}>Status:</span>
                <select
                  className="form-select"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem', width: 'auto' }}
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>

            {/* Search Box */}
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2rem', paddingRight: '0.8rem', paddingBlock: '0.4rem', fontSize: '0.82rem' }}
                placeholder="Search student, issue, or ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Operational Data Table */}
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Res ID</th>
                  <th>Student / Visitor</th>
                  <th>Target Office</th>
                  <th>Administrative Issue</th>
                  <th>Date & Slot</th>
                  <th>Status</th>
                  <th>Fee / Settled</th>
                  <th style={{ textAlign: 'right' }}>Actions (CRUD)</th>
                </tr>
              </thead>
              <tbody>
                {filteredOpsReservations.map(r => {
                  const isAssignedOffice = isStaff && userOfficeId && parseInt(userOfficeId, 10) === parseInt(r.office_id, 10);
                  const canManage = isAdmin || isAssignedOffice;

                  return (
                    <tr key={r.reservation_id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-light)' }}>
                        #{r.reservation_id}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{r.student_name || 'Walk-in Visitor'}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                          {r.user_email} &bull; {r.student_or_visitor_id || 'ID Pending'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.office_name}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                          {r.office_code} &bull; {r.room_number}
                        </div>
                      </td>
                      <td>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.issue_name}</div>
                        {r.notes && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            "{r.notes}"
                          </div>
                        )}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                        <div>{r.reservation_date ? r.reservation_date.split('T')[0] : ''}</div>
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.76rem' }}>{r.slot_time}</div>
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
                      <td>
                        <div style={{ fontSize: '0.78rem', color: 'var(--success-light)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          PHP {parseFloat(r.standard_fee || 0).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: r.payment_status === 'PAID' ? 'var(--success-light)' : 'var(--warning-light)' }}>
                          {r.payment_status || 'NO FEE'}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {canManage ? (
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setEditingRes({ ...r });
                                setEditStatus(null);
                              }}
                              title="Edit Reservation Status or Reschedule (CRUD Update)"
                              style={{ padding: '0.3rem 0.55rem' }}
                            >
                              <Edit3 size={13} />
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
                        ) : (
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Lock size={11} /> Locked
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredOpsReservations.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-dim)' }}>
                      No office reservations match the active criteria. Click "+ New Walk-in / Booking" to create a reservation.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PERSONAL BOOKINGS */}
      {activeTab === 'my_reservations' && (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Res ID</th>
                <th>Office & Facility</th>
                <th>Administrative Issue</th>
                <th>Date & Slot</th>
                <th>Booking Status</th>
                <th>Fee Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {personalReservations.map(r => (
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
                    <div style={{ fontSize: '0.78rem', color: 'var(--success-light)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      PHP {parseFloat(r.standard_fee).toFixed(2)}
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem' }}>
                    {r.reservation_date ? r.reservation_date.split('T')[0] : ''} &bull; {r.slot_time}
                  </td>
                  <td>
                    <span style={{
                      padding: '0.22rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      background: r.reservation_status === 'CONFIRMED' ? 'var(--success-bg)' : 'var(--warning-bg)',
                      color: r.reservation_status === 'CONFIRMED' ? 'var(--success-light)' : 'var(--warning-light)',
                      border: `1px solid ${r.reservation_status === 'CONFIRMED' ? 'var(--success-border)' : 'var(--warning-border)'}`
                    }}>
                      {r.reservation_status}
                    </span>
                  </td>
                  <td>
                    {r.transaction_id ? (
                      <span style={{
                        padding: '0.22rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        background: r.payment_status === 'PAID' ? 'var(--success-bg)' : 'var(--danger-bg)',
                        color: r.payment_status === 'PAID' ? 'var(--success-light)' : 'var(--danger-light)',
                        border: `1px solid ${r.payment_status === 'PAID' ? 'var(--success-border)' : 'var(--danger-border)'}`
                      }}>
                        {r.payment_status || 'PENDING'}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>No Fee</span>
                    )}
                  </td>
                  <td>
                    {r.transaction_id && r.payment_status !== 'PAID' ? (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setPaymentModal({
                            transaction_id: r.transaction_id,
                            amount: r.standard_fee,
                            office_name: r.office_name,
                            issue_name: r.issue_name,
                            reservation_id: r.reservation_id,
                            reference_no: r.reference_no
                          });
                          setPaymentStatus(null);
                        }}
                      >
                        <CreditCard size={13} /> Settle Payment
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.82rem', color: 'var(--success-light)', fontWeight: 600 }}>✓ Settled</span>
                    )}
                  </td>
                </tr>
              ))}
              {personalReservations.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-dim)' }}>
                    No personal reservations found for your account. Look up a campus issue to schedule an appointment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: FINANCIAL TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Txn ID</th>
                <th>Reference No</th>
                <th>Payer / Student</th>
                <th>Office Window</th>
                <th>Fee Service</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.transaction_id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-light)' }}>
                    #{t.transaction_id}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {t.reference_no}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{t.payer_name || 'Alex Santos'}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>{t.payer_email || 'student@unidesk.edu'}</div>
                  </td>
                  <td>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{t.office_name}</div>
                  </td>
                  <td>
                    <div style={{ color: 'var(--text-secondary)' }}>{t.issue_name}</div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--success-light)' }}>
                    PHP {parseFloat(t.amount).toFixed(2)}
                  </td>
                  <td>
                    <span className="badge badge-accent" style={{ fontSize: '0.72rem' }}>
                      {t.payment_method}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      padding: '0.22rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      background: t.payment_status === 'PAID' ? 'var(--success-bg)' : 'var(--danger-bg)',
                      color: t.payment_status === 'PAID' ? 'var(--success-light)' : 'var(--danger-light)',
                      border: `1px solid ${t.payment_status === 'PAID' ? 'var(--success-border)' : 'var(--danger-border)'}`
                    }}>
                      {t.payment_status}
                    </span>
                  </td>
                  <td>
                    {t.payment_status !== 'PAID' ? (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setPaymentModal({
                            transaction_id: t.transaction_id,
                            amount: t.amount,
                            office_name: t.office_name,
                            issue_name: t.issue_name,
                            reservation_id: t.reservation_id,
                            reference_no: t.reference_no
                          });
                          setPaymentStatus(null);
                        }}
                      >
                        <CreditCard size={13} /> Settle
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--success-light)' }}>✓ Paid & Settled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL 1: EDIT RESERVATION (CRUD UPDATE) */}
      {editingRes && (
        <div className="modal-overlay" onClick={() => setEditingRes(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Edit Reservation #{editingRes.reservation_id}</h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--primary-light)', fontFamily: 'var(--font-mono)' }}>
                  {editingRes.office_name} &bull; {editingRes.student_name}
                </span>
              </div>
              <button className="close-btn" onClick={() => setEditingRes(null)}>✕</button>
            </div>

            {editStatus?.success ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <CheckCircle2 size={54} color="#10b981" style={{ margin: '0 auto 1rem' }} />
                <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success-light)' }}>
                  Reservation Updated!
                </h4>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  {editStatus.message}
                </p>
                <div className="code-preview" style={{ marginTop: '1.25rem', textAlign: 'left' }}>
                  ⚡ Engine Trigger Executed: trg_reservations_audit_update<br />
                  Target: office_reservations (ID #{editingRes.reservation_id})<br />
                  Old vs New values saved to audit_logs.
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateReservation} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div className="form-group">
                  <label className="form-label">Reservation Status</label>
                  <select
                    className="form-select"
                    value={editingRes.reservation_status}
                    onChange={(e) => setEditingRes({ ...editingRes, reservation_status: e.target.value })}
                    required
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label">Scheduled Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={editingRes.reservation_date ? editingRes.reservation_date.split('T')[0] : ''}
                      onChange={(e) => setEditingRes({ ...editingRes, reservation_date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Time Slot</label>
                    <select
                      className="form-select"
                      value={editingRes.slot_time}
                      onChange={(e) => setEditingRes({ ...editingRes, slot_time: e.target.value })}
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
                  <label className="form-label">Operational Desk Notes</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    value={editingRes.notes || ''}
                    onChange={(e) => setEditingRes({ ...editingRes, notes: e.target.value })}
                    placeholder="Provide notes or verification details..."
                  ></textarea>
                </div>

                {editStatus?.error && (
                  <div style={{ padding: '0.85rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '10px', color: 'var(--danger-light)', fontSize: '0.85rem' }}>
                    <AlertCircle size={15} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: '-2px' }} />
                    {editStatus.message}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditingRes(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={editStatus?.loading}>
                    {editStatus?.loading ? 'Executing Engine Update...' : 'Save & Trigger Audit'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: DELETE RESERVATION (CRUD DELETE) */}
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
                  Audit record logged in audit_logs table.
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
                  Are you sure you want to permanently remove reservation <strong>#{deletingRes.reservation_id}</strong> for <strong>{deletingRes.student_name}</strong>?
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                    Office: {deletingRes.office_name} &bull; Service: {deletingRes.issue_name}
                  </div>
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

      {/* MODAL 3: CREATE WALK-IN / NEW RESERVATION (CRUD CREATE) */}
      {isCreatingRes && (
        <div className="modal-overlay" onClick={() => setIsCreatingRes(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Book Walk-In / Office Reservation</h3>
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
                  Appointment Successfully Scheduled!
                </h4>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  {createStatus.message}
                </p>
                <div className="code-preview" style={{ marginTop: '1.25rem', textAlign: 'left' }}>
                  ⚡ Relational Stored Procedure Executed<br />
                  Status: PENDING<br />
                  Trigger trg_reservations_audit_insert recorded.
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateReservation} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  {/* Office: locked if Staff; selectable if Admin */}
                  <div className="form-group">
                    <label className="form-label">Campus Office</label>
                    {isStaff ? (
                      <input
                        type="text"
                        className="form-input"
                        disabled
                        value={`${currentUser?.officeCode || 'DEPT'} - ${currentUser?.officeName || 'Assigned Office'}`}
                        style={{ opacity: 0.8 }}
                      />
                    ) : (
                      <select
                        className="form-select"
                        value={newRes.officeId}
                        onChange={(e) => setNewRes({ ...newRes, officeId: e.target.value })}
                        required
                      >
                        {offices.map(o => (
                          <option key={o.office_id} value={o.office_id}>
                            {o.office_code} - {o.office_name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Issue */}
                  <div className="form-group">
                    <label className="form-label">Administrative Issue</label>
                    <select
                      className="form-select"
                      value={newRes.issueId}
                      onChange={(e) => setNewRes({ ...newRes, issueId: e.target.value })}
                      required
                    >
                      {issues.map(i => (
                        <option key={i.issue_id} value={i.issue_id}>
                          {i.issue_name} (PHP {parseFloat(i.standard_fee).toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label">Reservation Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newRes.reservationDate}
                      onChange={(e) => setNewRes({ ...newRes, reservationDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Time Slot</label>
                    <select
                      className="form-select"
                      value={newRes.slotTime}
                      onChange={(e) => setNewRes({ ...newRes, slotTime: e.target.value })}
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
                  <label className="form-label">Notes / Walk-In Reason</label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    value={newRes.notes}
                    onChange={(e) => setNewRes({ ...newRes, notes: e.target.value })}
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
                    {createStatus?.loading ? 'Executing Stored Procedure...' : 'Confirm Booking'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 4: SETTLE PAYMENT */}
      {paymentModal && (
        <div className="modal-overlay" onClick={() => setPaymentModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Settle Administrative Fee</h3>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  Reference No: <code>{paymentModal.reference_no}</code>
                </span>
              </div>
              <button className="close-btn" onClick={() => setPaymentModal(null)}>✕</button>
            </div>

            {paymentStatus?.success ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <CheckCircle2 size={54} color="#10b981" style={{ margin: '0 auto 1rem' }} />
                <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success-light)' }}>
                  Transaction Completed!
                </h4>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  {paymentStatus.message}
                </p>
                <div className="code-preview" style={{ marginTop: '1.25rem', textAlign: 'left' }}>
                  ⚡ Engine Trigger Executed: trg_on_transaction_payment_settled<br />
                  Target: office_reservations (ID #{paymentModal.reservation_id})<br />
                  Status autonomously updated to CONFIRMED.
                </div>
              </div>
            ) : (
              <form onSubmit={handleProcessPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '1.2rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>{paymentModal.office_name}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginTop: '0.2rem' }}>
                      {paymentModal.issue_name}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Amount Due</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--success-light)', fontFamily: 'var(--font-mono)' }}>
                      PHP {parseFloat(paymentModal.amount).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Settlement Payment Channel</label>
                  <select
                    className="form-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="CAMPUS_WALLET">UniDesk Campus Digital Wallet</option>
                    <option value="ONLINE_TRANSFER">Online Bank Transfer / Instapay</option>
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="CASH">Cashier Window Payment</option>
                  </select>
                </div>

                {paymentStatus?.error && (
                  <div style={{ padding: '0.85rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '10px', color: 'var(--danger-light)', fontSize: '0.85rem' }}>
                    <AlertCircle size={15} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: '-2px' }} />
                    {paymentStatus.message}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setPaymentModal(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={paymentStatus?.loading}>
                    {paymentStatus?.loading ? 'Executing Engine SP...' : 'Process Payment'}
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
