import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Building, 
  MapPin, 
  Clock, 
  Calendar, 
  DollarSign, 
  Compass, 
  CheckCircle2, 
  AlertCircle,
  Phone,
  Mail,
  Zap,
  ArrowRight,
  Layers,
  Sparkles
} from 'lucide-react';

export default function LookupView({ onSelectForBooking, onNavigateToMap, currentUserId = 3 }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [bookingModal, setBookingModal] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    date: getNextWeekdayDate(),
    time: '10:00:00',
    notes: ''
  });
  const [bookingStatus, setBookingStatus] = useState(null);

  const chips = [
    'Lost Student ID',
    'Transcript of Records',
    'Tuition Fee Payment',
    'Medical Clearance',
    'Wi-Fi & Password Reset',
    'Library Fine & Cubicle',
    'Freshman Admission'
  ];

  useEffect(() => {
    fetchResults(query);
  }, [query]);

  const fetchResults = async (searchTerm) => {
    setLoading(true);
    try {
      const res = await fetch(`https://unidesk-api.onrender.com/api/lookup?q=${encodeURIComponent(searchTerm)}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.data);
        setExecutionTime(data.executionTimeMs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingStatus({ loading: true });

    try {
      const res = await fetch('https://unidesk-api.onrender.com/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          officeId: bookingModal.office_id,
          issueId: bookingModal.issue_id,
          reservationDate: bookingForm.date,
          slotTime: bookingForm.time,
          notes: bookingForm.notes
        })
      });

      const data = await res.json();
      if (data.success) {
        setBookingStatus({
          success: true,
          message: data.message,
          data: data.data
        });
      } else {
        setBookingStatus({
          error: true,
          message: data.message || 'Booking rejected by database engine constraint.'
        });
      }
    } catch (err) {
      setBookingStatus({
        error: true,
        message: err.message
      });
    }
  };

  function getNextWeekdayDate() {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    while (d.getDay() === 0 || d.getDay() === 6) {
      d.setDate(d.getDate() + 1);
    }
    return d.toISOString().split('T')[0];
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Search Bar Card */}
      <div className="hero-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Campus Problem & Issue Resolver</h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Resolves handling administrative offices, locations, and fees via stored procedure <code>sp_resolve_office_by_query</code>.
            </p>
          </div>
          {executionTime !== null && (
            <div className="status-pill" style={{ color: 'var(--primary-light)', borderColor: 'var(--border-highlight)', background: 'rgba(56, 189, 248, 0.08)' }}>
              <Zap size={13} color="#38bdf8" />
              <span>Routine Execution: {executionTime}ms</span>
            </div>
          )}
        </div>

        <div className="search-input-wrapper">
          <Search size={22} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Type your campus problem (e.g. 'lost ID', 'transcript request', 'medical exam', 'wifi password')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="chip-group" style={{ marginTop: '1.15rem' }}>
          <span className="chip-label">Quick Problems:</span>
          {chips.map(chip => (
            <button
              key={chip}
              className={`search-chip ${query === chip ? 'active' : ''}`}
              onClick={() => setQuery(chip)}
            >
              {chip}
            </button>
          ))}
          {query && (
            <button
              className="search-chip"
              style={{ color: 'var(--danger-light)', borderColor: 'var(--danger-border)' }}
              onClick={() => setQuery('')}
            >
              Clear Search
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.25rem' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Found <strong style={{ color: 'var(--text-primary)' }}>{results.length}</strong> handling administrative offices & procedures
        </span>
      </div>

      {/* Office Results Grid */}
      <div className="results-grid">
        {results.map((item, idx) => (
          <div key={`${item.office_id}-${item.issue_id}-${idx}`} className="office-card">
            <div>
              {/* Header */}
              <div className="office-card-header">
                <div>
                  <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', marginBottom: '0.45rem' }}>
                    <span className="office-code-badge">{item.office_code}</span>
                    <span className={`priority-badge ${item.priority_level?.toLowerCase()}`}>
                      {item.priority_level} Office
                    </span>
                  </div>
                  <h3 className="office-title">{item.office_name}</h3>
                </div>

                {/* Stored Function: is_open_now */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  padding: '0.25rem 0.6rem',
                  borderRadius: '9999px',
                  background: item.is_open_now ? 'var(--success-bg)' : 'var(--danger-bg)',
                  color: item.is_open_now ? 'var(--success-light)' : 'var(--danger-light)',
                  border: `1px solid ${item.is_open_now ? 'var(--success-border)' : 'var(--danger-border)'}`
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: item.is_open_now ? 'var(--success)' : 'var(--danger)',
                    boxShadow: item.is_open_now ? '0 0 8px var(--success)' : 'none'
                  }}></span>
                  {item.is_open_now ? 'OPEN NOW' : 'CLOSED'}
                </div>
              </div>

              {/* Matched Issue Box */}
              <div className="issue-match-box" style={{ marginTop: '0.95rem' }}>
                <span className="issue-label">{item.issue_category}</span>
                <span className="issue-title">{item.issue_name}</span>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {item.issue_description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.4rem' }}>
                  <span className="fee-badge">
                    <DollarSign size={14} /> Fee: PHP {parseFloat(item.standard_fee).toFixed(2)}
                  </span>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    ⏱️ Avg. {item.avg_resolution_minutes} mins
                  </span>
                </div>
              </div>

              {/* Location Hierarchy (3NF) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.95rem' }}>
                <div className="location-row">
                  <Building size={16} color="#38bdf8" />
                  <span><strong>{item.building_name}</strong> ({item.building_code})</span>
                </div>
                <div className="location-row">
                  <MapPin size={16} color="#818cf8" />
                  <span>{item.room_number} &bull; Floor {item.floor_number}</span>
                </div>
              </div>

              {/* Walking Directions */}
              <div className="directions-box" style={{ marginTop: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem', color: 'var(--primary-light)', fontWeight: 700, fontSize: '0.76rem' }}>
                  <Compass size={14} /> Desk Directions:
                </div>
                {item.desk_directions}
              </div>

              {/* Resolution Guide */}
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Resolution Guide:</strong> {item.resolution_guide}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }}
                onClick={() => {
                  setBookingModal(item);
                  setBookingStatus(null);
                }}
              >
                <Calendar size={15} /> Book Appointment
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => onNavigateToMap && onNavigateToMap(item.building_code)}
              >
                <MapPin size={15} /> View on Map
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Booking Modal */}
      {bookingModal && (
        <div className="modal-overlay" onClick={() => setBookingModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Schedule Office Reservation</h3>
                <span style={{ fontSize: '0.84rem', color: 'var(--primary-light)', fontFamily: 'var(--font-mono)' }}>
                  {bookingModal.office_name} ({bookingModal.office_code})
                </span>
              </div>
              <button className="close-btn" onClick={() => setBookingModal(null)}>✕</button>
            </div>

            {bookingStatus?.success ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <CheckCircle2 size={54} color="#10b981" style={{ margin: '0 auto 1rem' }} />
                <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success-light)' }}>
                  Reservation Confirmed!
                </h4>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  {bookingStatus.message}
                </p>
                <div className="code-preview" style={{ marginTop: '1.25rem', textAlign: 'left' }}>
                  Reservation ID: #{bookingStatus.data?.reservationId}<br />
                  Required Fee: PHP {bookingStatus.data?.feeAmount}<br />
                  Transaction ID: #{bookingStatus.data?.transactionId || 'N/A'}<br />
                  Status: {bookingStatus.data?.requiresPayment ? 'PENDING FEE SETTLEMENT' : 'CONFIRMED'}
                </div>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: '1.5rem', width: '100%' }}
                  onClick={() => setBookingModal(null)}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div style={{ padding: '0.95rem 1.15rem', background: 'rgba(8, 12, 20, 0.6)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Selected Administrative Service:
                  </div>
                  <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.96rem', marginTop: '0.15rem' }}>
                    {bookingModal.issue_name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--success-light)', fontFamily: 'var(--font-mono)', marginTop: '0.35rem', fontWeight: 600 }}>
                    Standard Processing Fee: PHP {parseFloat(bookingModal.standard_fee).toFixed(2)}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Reservation Date (Mon - Fri)</label>
                  <input
                    type="date"
                    className="form-input"
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Time Slot (Within Office Operating Hours)</label>
                  <select
                    className="form-select"
                    value={bookingForm.time}
                    onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                  >
                    <option value="08:30:00">08:30 AM</option>
                    <option value="09:00:00">09:00 AM</option>
                    <option value="10:00:00">10:00 AM</option>
                    <option value="11:00:00">11:00 AM</option>
                    <option value="13:30:00">01:30 PM</option>
                    <option value="14:30:00">02:30 PM</option>
                    <option value="15:30:00">03:30 PM</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Additional Inquiries / Student Notes</label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    placeholder="Provide details or document reference..."
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  ></textarea>
                </div>

                {bookingStatus?.error && (
                  <div style={{ padding: '0.85rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '10px', color: 'var(--danger-light)', fontSize: '0.85rem' }}>
                    <AlertCircle size={15} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: '-2px' }} />
                    {bookingStatus.message}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setBookingModal(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={bookingStatus?.loading}>
                    {bookingStatus?.loading ? 'Executing Stored Procedure...' : 'Confirm Booking'}
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
