import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function DoctorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [prescriptionData, setPrescriptionData] = useState({
    diagnosis: '',
    notes: '',
    medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (activeTab === 'appointments') {
        const res = await fetch('http://localhost:4000/api/appointments/doctor', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setAppointments(data.appointments);
        }
      } else if (activeTab === 'patients') {
        // Get unique patients from appointments
        const appointmentsRes = await fetch('http://localhost:4000/api/appointments/doctor', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const appointmentsData = await appointmentsRes.json();
        if (appointmentsData.success) {
          const uniquePatients = {};
          appointmentsData.appointments.forEach(apt => {
            if (apt.patient && !uniquePatients[apt.patient._id]) {
              uniquePatients[apt.patient._id] = {
                ...apt.patient,
                lastVisit: apt.date,
                totalVisits: appointmentsData.appointments.filter(a => 
                  a.patient && a.patient._id === apt.patient._id
                ).length
              };
            }
          });
          setPatients(Object.values(uniquePatients));
        }
      } else if (activeTab === 'schedule') {
        const res = await fetch('http://localhost:4000/api/appointments/doctor?status=confirmed', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setAppointments(data.appointments);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentAction = async (appointmentId, action) => {
    if (action === 'reject') {
      setShowRejectModal(appointmentId);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/api/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'confirmed' })
      });

      const data = await res.json();
      if (data.success) {
        alert('Appointment confirmed successfully!');
        fetchData();
      } else {
        alert(data.message || 'Failed to confirm appointment');
      }
    } catch (error) {
      console.error('Error confirming appointment:', error);
      alert('Error confirming appointment');
    }
  };

  const handleRejectAppointment = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/api/appointments/${showRejectModal}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: 'rejected',
          rejectionReason: rejectReason
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Appointment rejected');
        setShowRejectModal(null);
        setRejectReason('');
        fetchData();
      } else {
        alert(data.message || 'Failed to reject appointment');
      }
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      alert('Error rejecting appointment');
    }
  };

  const handleCreatePrescription = (patient, appointment = null) => {
    setSelectedPatient(patient);
    setSelectedAppointment(appointment);
    setPrescriptionData({
      diagnosis: '',
      notes: '',
      medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    });
    setShowPrescriptionModal(true);
  };

  const handleAddMedication = () => {
    setPrescriptionData({
      ...prescriptionData,
      medications: [...prescriptionData.medications, { 
        name: '', dosage: '', frequency: '', duration: '', instructions: '' 
      }]
    });
  };

  const handleMedicationChange = (index, field, value) => {
    const updatedMedications = [...prescriptionData.medications];
    updatedMedications[index][field] = value;
    setPrescriptionData({ ...prescriptionData, medications: updatedMedications });
  };

  const handleRemoveMedication = (index) => {
    if (prescriptionData.medications.length > 1) {
      const updatedMedications = prescriptionData.medications.filter((_, i) => i !== index);
      setPrescriptionData({ ...prescriptionData, medications: updatedMedications });
    }
  };

  const handlePrescriptionSubmit = async (e) => {
    e.preventDefault();
    
    // Validate medications
    const validMedications = prescriptionData.medications.filter(med => 
      med.name && med.dosage && med.frequency && med.duration
    );

    if (validMedications.length === 0) {
      alert('Please add at least one medication with all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:4000/api/prescriptions/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientId: selectedPatient._id || selectedPatient.id,
          appointmentId: selectedAppointment?._id || null,
          medications: validMedications,
          diagnosis: prescriptionData.diagnosis || null,
          notes: prescriptionData.notes || null
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Prescription created successfully!');
        setShowPrescriptionModal(false);
        setSelectedPatient(null);
        setSelectedAppointment(null);
        setPrescriptionData({
          diagnosis: '',
          notes: '',
          medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
        });
      } else {
        alert(data.message || 'Failed to create prescription');
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      alert('Error creating prescription');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div className="container dashboard__header-inner">
          <div className="dashboard__brand">
            <h1>TeleMed</h1>
          </div>
          <nav className="dashboard__nav">
            <span className="dashboard__user">Welcome, Dr. {user?.name}</span>
            <button className="btn btn-text" onClick={handleLogout}>Logout</button>
          </nav>
        </div>
      </header>

      <main className="dashboard__main">
        <div className="container">
          <section className="dashboard__welcome">
            <h2>Welcome back, Dr. {user?.name}!</h2>
            <p>Manage your appointments, patients, and consultations from one place.</p>
          </section>

          <section className="dashboard__tabs">
            <div className="tabs">
              <button
                className={`tab ${activeTab === 'appointments' ? 'tab--active' : ''}`}
                onClick={() => setActiveTab('appointments')}
              >
                📅 Appointment Requests
              </button>
              <button
                className={`tab ${activeTab === 'patients' ? 'tab--active' : ''}`}
                onClick={() => setActiveTab('patients')}
              >
                👥 My Patients
              </button>
              <button
                className={`tab ${activeTab === 'schedule' ? 'tab--active' : ''}`}
                onClick={() => setActiveTab('schedule')}
              >
                📋 My Schedule
              </button>
            </div>
          </section>

          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <>
              {activeTab === 'appointments' && (
                <section className="dashboard__appointments">
                  <h3>Appointment Requests</h3>
                  <div className="appointments__list">
                    {appointments.filter(apt => apt.status === 'pending').length === 0 ? (
                      <div className="empty-state">
                        <p>No pending appointment requests at the moment.</p>
                      </div>
                    ) : (
                      appointments
                        .filter(apt => apt.status === 'pending')
                        .map((appointment) => (
                          <div key={appointment._id} className="appointment-card">
                            <div className="appointment-card__header">
                              <div>
                                <h4>{appointment.patient?.name}</h4>
                                <p className="appointment-card__reason">{appointment.reason}</p>
                              </div>
                              <span className={`appointment-card__status appointment-card__status--${appointment.status}`}>
                                {appointment.status}
                              </span>
                            </div>
                            <div className="appointment-card__details">
                              <div className="appointment-card__detail">
                                <span className="detail-icon">📅</span>
                                <span>{formatDate(appointment.date)}</span>
                              </div>
                              <div className="appointment-card__detail">
                                <span className="detail-icon">🕐</span>
                                <span>{appointment.time}</span>
                              </div>
                              {appointment.patient?.phone && (
                                <div className="appointment-card__detail">
                                  <span className="detail-icon">📞</span>
                                  <span>{appointment.patient.phone}</span>
                                </div>
                              )}
                            </div>
                            <div className="appointment-card__actions">
                              <button
                                className="btn btn-primary"
                                onClick={() => handleAppointmentAction(appointment._id, 'accept')}
                              >
                                Accept
                              </button>
                              <button
                                className="btn btn-outline"
                                onClick={() => handleAppointmentAction(appointment._id, 'reject')}
                              >
                                Reject
                              </button>
                              <button
                                className="btn btn-outline"
                                onClick={() => handleCreatePrescription(appointment.patient, appointment)}
                                style={{ marginLeft: '0.5rem' }}
                              >
                                Create Prescription
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </section>
              )}

              {activeTab === 'patients' && (
                <section className="dashboard__patients">
                  <h3>My Patients</h3>
                  <div className="patients__table-wrapper">
                    <table className="patients__table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Last Visit</th>
                          <th>Total Visits</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patients.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="empty-state">
                              No patients yet.
                            </td>
                          </tr>
                        ) : (
                          patients.map((patient) => (
                            <tr key={patient._id || patient.id}>
                              <td>{patient.name}</td>
                              <td>{patient.email}</td>
                              <td>{patient.phone || 'N/A'}</td>
                              <td>{formatDate(patient.lastVisit)}</td>
                              <td>{patient.totalVisits}</td>
                              <td>
                                <button 
                                  className="btn btn-text" 
                                  style={{ fontSize: '0.85rem' }}
                                  onClick={() => handleCreatePrescription(patient)}
                                >
                                  Create Prescription
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {activeTab === 'schedule' && (
                <section className="dashboard__schedule">
                  <h3>My Schedule</h3>
                  <div className="schedule__calendar">
                    <div className="schedule__day">
                      <h4>Confirmed Appointments</h4>
                      <div className="schedule__slots">
                        {appointments.filter(apt => apt.status === 'confirmed').length === 0 ? (
                          <div className="empty-state">
                            <p>No confirmed appointments scheduled.</p>
                          </div>
                        ) : (
                          appointments
                            .filter(apt => apt.status === 'confirmed')
                            .map((appointment) => (
                              <div key={appointment._id} className="schedule__slot">
                                <span className="schedule__time">{appointment.time}</span>
                                <span className="schedule__patient">{appointment.patient?.name}</span>
                                <span className="schedule__reason">{appointment.reason}</span>
                                <button
                                  className="btn btn-primary"
                                  style={{ marginLeft: 'auto' }}
                                  onClick={() => navigate(`/consult/${appointment._id}`)}
                                >
                                  Join Call
                                </button>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}

          <section className="dashboard__info">
            <h3>Your Profile</h3>
            <div className="info__card">
              <div className="info__row">
                <span className="info__label">Name:</span>
                <span className="info__value">Dr. {user?.name}</span>
              </div>
              <div className="info__row">
                <span className="info__label">Email:</span>
                <span className="info__value">{user?.email}</span>
              </div>
              {user?.specialization && (
                <div className="info__row">
                  <span className="info__label">Specialization:</span>
                  <span className="info__value">{user.specialization.charAt(0).toUpperCase() + user.specialization.slice(1)}</span>
                </div>
              )}
              {user?.hospital && (
                <div className="info__row">
                  <span className="info__label">Hospital/Clinic:</span>
                  <span className="info__value">{user.hospital}</span>
                </div>
              )}
              {user?.yearsOfExperience && (
                <div className="info__row">
                  <span className="info__label">Experience:</span>
                  <span className="info__value">{user.yearsOfExperience} years</span>
                </div>
              )}
              {user?.consultationFee && (
                <div className="info__row">
                  <span className="info__label">Consultation Fee:</span>
                  <span className="info__value">${user.consultationFee}</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal">
          <div className="modal__backdrop" onClick={() => setShowRejectModal(null)}></div>
          <div className="modal__panel">
            <div className="modal__header">
              <h3>Reject Appointment</h3>
              <button className="modal__close" onClick={() => setShowRejectModal(null)}>×</button>
            </div>
            <form className="form" onSubmit={(e) => { e.preventDefault(); handleRejectAppointment(); }}>
              <div className="form__field">
                <label className="form__label">Reason for Rejection</label>
                <textarea
                  className="form__textarea"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Please provide a reason for rejecting this appointment..."
                  required
                />
              </div>
              <div className="form__submit">
                <button type="submit" className="btn btn-primary">Reject Appointment</button>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setShowRejectModal(null)}
                  style={{ marginTop: '0.5rem' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prescription Modal */}
      {showPrescriptionModal && selectedPatient && (
        <div className="modal">
          <div className="modal__backdrop" onClick={() => setShowPrescriptionModal(false)}></div>
          <div className="modal__panel" style={{ maxWidth: '800px' }}>
            <div className="modal__header">
              <h3>Create Prescription for {selectedPatient.name}</h3>
              <button className="modal__close" onClick={() => setShowPrescriptionModal(false)}>×</button>
            </div>
            <form className="form" onSubmit={handlePrescriptionSubmit}>
              <div className="form__field">
                <label className="form__label">Diagnosis (Optional)</label>
                <input
                  type="text"
                  className="form__input"
                  value={prescriptionData.diagnosis}
                  onChange={(e) => setPrescriptionData({ ...prescriptionData, diagnosis: e.target.value })}
                  placeholder="Enter diagnosis..."
                />
              </div>

              <div className="form__field">
                <label className="form__label">Medications</label>
                {prescriptionData.medications.map((med, index) => (
                  <div key={index} style={{ 
                    border: '1px solid var(--outline)', 
                    borderRadius: '10px', 
                    padding: '1rem', 
                    marginBottom: '1rem',
                    background: 'var(--panel)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <strong>Medication {index + 1}</strong>
                      {prescriptionData.medications.length > 1 && (
                        <button 
                          type="button"
                          className="btn btn-text" 
                          onClick={() => handleRemoveMedication(index)}
                          style={{ fontSize: '0.85rem', color: '#f44336' }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="form__grid">
                      <div className="form__field">
                        <label className="form__label">Name *</label>
                        <input
                          type="text"
                          className="form__input"
                          value={med.name}
                          onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                          required
                        />
                      </div>
                      <div className="form__field">
                        <label className="form__label">Dosage *</label>
                        <input
                          type="text"
                          className="form__input"
                          value={med.dosage}
                          onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                          placeholder="e.g., 500mg"
                          required
                        />
                      </div>
                      <div className="form__field">
                        <label className="form__label">Frequency *</label>
                        <input
                          type="text"
                          className="form__input"
                          value={med.frequency}
                          onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                          placeholder="e.g., Twice daily"
                          required
                        />
                      </div>
                      <div className="form__field">
                        <label className="form__label">Duration *</label>
                        <input
                          type="text"
                          className="form__input"
                          value={med.duration}
                          onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                          placeholder="e.g., 7 days"
                          required
                        />
                      </div>
                      <div className="form__field" style={{ gridColumn: '1 / -1' }}>
                        <label className="form__label">Instructions (Optional)</label>
                        <textarea
                          className="form__textarea"
                          value={med.instructions}
                          onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                          placeholder="Additional instructions..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button 
                  type="button"
                  className="btn btn-outline" 
                  onClick={handleAddMedication}
                  style={{ marginBottom: '1rem' }}
                >
                  + Add Another Medication
                </button>
              </div>

              <div className="form__field">
                <label className="form__label">Notes (Optional)</label>
                <textarea
                  className="form__textarea"
                  value={prescriptionData.notes}
                  onChange={(e) => setPrescriptionData({ ...prescriptionData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="form__submit">
                <button type="submit" className="btn btn-primary">Create Prescription</button>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setShowPrescriptionModal(false)}
                  style={{ marginTop: '0.5rem' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorDashboard;
