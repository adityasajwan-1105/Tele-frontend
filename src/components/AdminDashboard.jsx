import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/api';
function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');
  const [activeView, setActiveView] = useState(null); // 'patients', 'doctors', 'approved', 'pending', 'rejected'
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [approvedDoctors, setApprovedDoctors] = useState([]);
  const [rejectedDoctors, setRejectedDoctors] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    if (activeView) {
      fetchViewData(activeView);
    } else {
      // Reset data when going back to dashboard
      setAllPatients([]);
      setAllDoctors([]);
    }
  }, [activeView]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsRes = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      // Fetch doctors based on active tab
      let endpoint = '';
      if (activeTab === 'pending') {
        endpoint = 'pending-doctors';
      } else if (activeTab === 'approved') {
        endpoint = 'approved-doctors';
      } else if (activeTab === 'rejected') {
        endpoint = 'rejected-doctors';
      }

      if (endpoint) {
        const res = await fetch(`${API_BASE_URL}/api/admin/${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.success) {
          if (activeTab === 'pending') setPendingDoctors(data.doctors);
          else if (activeTab === 'approved') setApprovedDoctors(data.doctors);
          else if (activeTab === 'rejected') setRejectedDoctors(data.doctors);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchViewData = async (view) => {
    try {
      setLoading(true);
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        alert('Please login again');
        return;
      }
      
      let endpoint = '';
      
      if (view === 'patients') {
        endpoint = 'all-patients';
      } else if (view === 'doctors') {
        endpoint = 'all-doctors';
      } else if (view === 'approved') {
        endpoint = 'approved-doctors';
      } else if (view === 'pending') {
        endpoint = 'pending-doctors';
      } else if (view === 'rejected') {
        endpoint = 'rejected-doctors';
      }

      if (endpoint) {
        const res = await fetch(`${API_BASE_URL}/api/admin/${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${currentToken}`
          }
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log(`Fetched ${view} data:`, data); // Debug log
        
        if (data.success) {
          if (view === 'patients') {
            console.log('Setting patients:', data.patients); // Debug log
            setAllPatients(Array.isArray(data.patients) ? data.patients : []);
          } else {
            const doctors = Array.isArray(data.doctors) ? data.doctors : [];
            setAllDoctors(doctors);
            if (view === 'pending') setPendingDoctors(doctors);
            else if (view === 'approved') setApprovedDoctors(doctors);
            else if (view === 'rejected') setRejectedDoctors(doctors);
          }
        } else {
          console.error(`Failed to fetch ${view}:`, data.message);
          alert(data.message || `Failed to fetch ${view}`);
        }
      }
    } catch (error) {
      console.error('Error fetching view data:', error);
      alert(`Error fetching ${view}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatCardClick = (view) => {
    setActiveView(view);
    if (view === 'pending' || view === 'approved' || view === 'rejected') {
      setActiveTab(view);
    }
  };

  const handleApprove = async (doctorId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/approve-doctor/${doctorId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();
      if (data.success) {
        alert('Doctor approved successfully!');
        fetchData();
      } else {
        alert(data.message || 'Failed to approve doctor');
      }
    } catch (error) {
      console.error('Error approving doctor:', error);
      alert('Error approving doctor');
    }
  };

  const handleReject = async (doctorId) => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/reject-doctor/${doctorId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectReason })
      });

      const data = await res.json();
      if (data.success) {
        alert('Doctor rejected');
        setShowRejectModal(null);
        setRejectReason('');
        fetchData();
      } else {
        alert(data.message || 'Failed to reject doctor');
      }
    } catch (error) {
      console.error('Error rejecting doctor:', error);
      alert('Error rejecting doctor');
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const renderDoctorCard = (doctor) => (
    <div key={doctor._id} className="doctor-card">
      <div className="doctor-card__header">
        <div>
          <h4>Dr. {doctor.name}</h4>
          <p className="doctor-card__email">{doctor.email}</p>
        </div>
        <span className={`doctor-card__status doctor-card__status--${doctor.approvalStatus}`}>
          {doctor.approvalStatus}
        </span>
      </div>
      <div className="doctor-card__details">
        <div className="doctor-card__detail">
          <span className="detail-label">Specialization:</span>
          <span className="detail-value">{doctor.specialization?.charAt(0).toUpperCase() + doctor.specialization?.slice(1)}</span>
        </div>
        <div className="doctor-card__detail">
          <span className="detail-label">License Number:</span>
          <span className="detail-value">{doctor.licenseNumber}</span>
        </div>
        <div className="doctor-card__detail">
          <span className="detail-label">Hospital/Clinic:</span>
          <span className="detail-value">{doctor.hospital}</span>
        </div>
        <div className="doctor-card__detail">
          <span className="detail-label">Experience:</span>
          <span className="detail-value">{doctor.yearsOfExperience} years</span>
        </div>
        <div className="doctor-card__detail">
          <span className="detail-label">Qualifications:</span>
          <span className="detail-value">{doctor.qualifications}</span>
        </div>
        <div className="doctor-card__detail">
          <span className="detail-label">Consultation Fee:</span>
          <span className="detail-value">₹{doctor.consultationFee}</span>
        </div>
      </div>
      {doctor.approvalStatus === 'pending' && (
        <div className="doctor-card__actions">
          <button className="btn btn-primary" onClick={() => handleApprove(doctor._id)}>
            Approve
          </button>
          <button className="btn btn-outline" onClick={() => setShowRejectModal(doctor._id)}>
            Reject
          </button>
        </div>
      )}
      {doctor.rejectionReason && (
        <div className="doctor-card__rejection">
          <strong>Rejection Reason:</strong> {doctor.rejectionReason}
        </div>
      )}
    </div>
  );

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div className="container dashboard__header-inner">
          <div className="dashboard__brand">
            <h1>TeleMed Admin</h1>
          </div>
          <nav className="dashboard__nav">
            <span className="dashboard__user">Welcome, {user?.name}</span>
            <button className="btn btn-text" onClick={handleLogout}>Logout</button>
          </nav>
        </div>
      </header>

      <main className="dashboard__main">
        <div className="container">
          <section className="dashboard__welcome">
            <h2>Admin Dashboard</h2>
            <p>Manage doctor approvals and monitor the platform.</p>
          </section>

          {/* Statistics */}
          {stats && (
            <section className="dashboard__stats">
              <div className="stats__grid">
                <div 
                  className={`stat-card ${activeView === 'patients' ? 'stat-card--active' : ''}`}
                  onClick={() => handleStatCardClick('patients')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="stat-card__icon">👥</div>
                  <div className="stat-card__content">
                    <h3>{stats.totalPatients}</h3>
                    <p>Total Patients</p>
                  </div>
                </div>
                <div 
                  className={`stat-card ${activeView === 'doctors' ? 'stat-card--active' : ''}`}
                  onClick={() => handleStatCardClick('doctors')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="stat-card__icon">👨‍⚕️</div>
                  <div className="stat-card__content">
                    <h3>{stats.totalDoctors}</h3>
                    <p>Total Doctors</p>
                  </div>
                </div>
                <div 
                  className={`stat-card stat-card--success ${activeView === 'approved' ? 'stat-card--active' : ''}`}
                  onClick={() => handleStatCardClick('approved')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="stat-card__icon">✅</div>
                  <div className="stat-card__content">
                    <h3>{stats.approvedDoctors}</h3>
                    <p>Approved Doctors</p>
                  </div>
                </div>
                <div 
                  className={`stat-card stat-card--warning ${activeView === 'pending' ? 'stat-card--active' : ''}`}
                  onClick={() => handleStatCardClick('pending')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="stat-card__icon">⏳</div>
                  <div className="stat-card__content">
                    <h3>{stats.pendingDoctors}</h3>
                    <p>Pending Approvals</p>
                  </div>
                </div>
                <div 
                  className={`stat-card stat-card--danger ${activeView === 'rejected' ? 'stat-card--active' : ''}`}
                  onClick={() => handleStatCardClick('rejected')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="stat-card__icon">❌</div>
                  <div className="stat-card__content">
                    <h3>{stats.rejectedDoctors}</h3>
                    <p>Rejected Doctors</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Back button when viewing specific category */}
          {activeView && (
            <section style={{ marginBottom: '1rem' }}>
              <button 
                className="btn btn-outline" 
                onClick={() => setActiveView(null)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                ← Back to Dashboard
              </button>
            </section>
          )}

          {/* Patients View */}
          {activeView === 'patients' && (
            <section className="dashboard__patients">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3>All Patients ({allPatients.length})</h3>
              </div>
              {loading ? (
                <div className="loading">Loading patients...</div>
              ) : allPatients.length === 0 ? (
                <div className="empty-state">
                  <p>No patients registered yet.</p>
                </div>
              ) : (
                <div className="patients__grid">
                  {allPatients.map((patient) => (
                    <div key={patient._id} className="patient-card">
                      <div className="patient-card__header">
                        <div className="patient-card__avatar">
                          {patient.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4>{patient.name}</h4>
                          <p className="patient-card__email">{patient.email}</p>
                        </div>
                      </div>
                      <div className="patient-card__details">
                        {patient.phone && (
                          <div className="patient-card__detail">
                            <span className="detail-label">Phone:</span>
                            <span className="detail-value">{patient.phone}</span>
                          </div>
                        )}
                        {patient.dateOfBirth && (
                          <div className="patient-card__detail">
                            <span className="detail-label">Date of Birth:</span>
                            <span className="detail-value">
                              {new Date(patient.dateOfBirth).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {patient.gender && (
                          <div className="patient-card__detail">
                            <span className="detail-label">Gender:</span>
                            <span className="detail-value">
                              {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                            </span>
                          </div>
                        )}
                        {patient.address && (
                          <div className="patient-card__detail">
                            <span className="detail-label">Address:</span>
                            <span className="detail-value">{patient.address}</span>
                          </div>
                        )}
                        <div className="patient-card__detail">
                          <span className="detail-label">Joined:</span>
                          <span className="detail-value">
                            {new Date(patient.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* All Doctors View */}
          {activeView === 'doctors' && (
            <section className="dashboard__doctors">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3>All Doctors ({allDoctors.length})</h3>
              </div>
              {loading ? (
                <div className="loading">Loading doctors...</div>
              ) : allDoctors.length === 0 ? (
                <div className="empty-state">
                  <p>No doctors registered yet.</p>
                </div>
              ) : (
                <div className="doctors__list">
                  {allDoctors.map(renderDoctorCard)}
                </div>
              )}
            </section>
          )}

          {/* Tabs - Only show when not viewing specific category or when viewing doctor-related categories */}
          {(!activeView || activeView === 'approved' || activeView === 'pending' || activeView === 'rejected') && (
            <section className="dashboard__tabs">
              <div className="tabs">
                <button
                  className={`tab ${activeTab === 'pending' ? 'tab--active' : ''}`}
                  onClick={() => {
                    setActiveTab('pending');
                    setActiveView('pending');
                  }}
                >
                  ⏳ Pending Approvals ({stats?.pendingDoctors || 0})
                </button>
                <button
                  className={`tab ${activeTab === 'approved' ? 'tab--active' : ''}`}
                  onClick={() => {
                    setActiveTab('approved');
                    setActiveView('approved');
                  }}
                >
                  ✅ Approved Doctors ({stats?.approvedDoctors || 0})
                </button>
                <button
                  className={`tab ${activeTab === 'rejected' ? 'tab--active' : ''}`}
                  onClick={() => {
                    setActiveTab('rejected');
                    setActiveView('rejected');
                  }}
                >
                  ❌ Rejected Doctors ({stats?.rejectedDoctors || 0})
                </button>
              </div>
            </section>
          )}

          {/* Content */}
          {(!activeView || activeView === 'approved' || activeView === 'pending' || activeView === 'rejected') && (
            <>
              {loading ? (
                <div className="loading">Loading...</div>
              ) : (
                <section className="dashboard__doctors">
                  {activeTab === 'pending' && (
                    <>
                      <h3>Pending Doctor Approvals</h3>
                      {pendingDoctors.length === 0 ? (
                        <div className="empty-state">
                          <p>No pending doctor approvals.</p>
                        </div>
                      ) : (
                        <div className="doctors__list">
                          {pendingDoctors.map(renderDoctorCard)}
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === 'approved' && (
                    <>
                      <h3>Approved Doctors</h3>
                      {approvedDoctors.length === 0 ? (
                        <div className="empty-state">
                          <p>No approved doctors yet.</p>
                        </div>
                      ) : (
                        <div className="doctors__list">
                          {approvedDoctors.map(renderDoctorCard)}
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === 'rejected' && (
                    <>
                      <h3>Rejected Doctors</h3>
                      {rejectedDoctors.length === 0 ? (
                        <div className="empty-state">
                          <p>No rejected doctors.</p>
                        </div>
                      ) : (
                        <div className="doctors__list">
                          {rejectedDoctors.map(renderDoctorCard)}
                        </div>
                      )}
                    </>
                  )}
                </section>
              )}
            </>
          )}

          {/* Reject Modal */}
          {showRejectModal && (
            <div className="modal" role="dialog" aria-modal="true">
              <div className="modal__backdrop" onClick={() => {
                setShowRejectModal(null);
                setRejectReason('');
              }} />
              <div className="modal__panel" style={{ maxWidth: '500px' }}>
                <div className="modal__header">
                  <h3>Reject Doctor</h3>
                  <button className="modal__close" onClick={() => {
                    setShowRejectModal(null);
                    setRejectReason('');
                  }}>×</button>
                </div>
                <div className="form" style={{ padding: '1.5rem' }}>
                  <div className="form__field">
                    <label className="form__label">Reason for Rejection *</label>
                    <textarea
                      className="form__textarea"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      rows="4"
                    />
                  </div>
                  <div className="form__submit">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleReject(showRejectModal)}
                      style={{ width: '100%' }}
                    >
                      Reject Doctor
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        setShowRejectModal(null);
                        setRejectReason('');
                      }}
                      style={{ width: '100%', marginTop: '0.5rem' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;

