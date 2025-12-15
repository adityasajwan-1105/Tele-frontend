import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../utils/api';
function PatientAppointments({ onBack }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/appointments/patient`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (data.success) {
        setAppointments(data.appointments);
      } else {
        alert('Failed to fetch appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      alert('Error fetching appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();
      
      if (data.success) {
        alert('Appointment cancelled successfully');
        fetchAppointments();
      } else {
        alert(data.message || 'Failed to cancel appointment');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Error cancelling appointment');
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

  if (loading) {
    return (
      <div className="patient-appointments">
        <div className="container">
          <div className="loading">Loading appointments...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-appointments">
      <div className="container">
        <div className="patient-appointments__header">
          <button className="btn btn-text" onClick={onBack}>
            ← Back to Dashboard
          </button>
          <h2>My Appointments</h2>
          <p>View and manage your appointments</p>
        </div>

        {appointments.length === 0 ? (
          <div className="empty-state">
            <p>You don't have any appointments yet.</p>
          </div>
        ) : (
          <div className="appointments__list">
            {appointments.map((appointment) => (
              <div key={appointment._id} className="appointment-card">
                <div className="appointment-card__header">
                  <div>
                    <h4>Dr. {appointment.doctor?.name}</h4>
                    <p className="appointment-card__reason">{appointment.reason}</p>
                    {appointment.doctor?.specialization && (
                      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        {appointment.doctor.specialization.charAt(0).toUpperCase() + appointment.doctor.specialization.slice(1)}
                      </p>
                    )}
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
                  {appointment.doctor?.hospital && (
                    <div className="appointment-card__detail">
                      <span className="detail-icon">🏥</span>
                      <span>{appointment.doctor.hospital}</span>
                    </div>
                  )}
                </div>
                {appointment.rejectionReason && (
                  <div className="appointment-card__rejection">
                    <strong>Rejection Reason:</strong> {appointment.rejectionReason}
                  </div>
                )}
                {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                  <div className="appointment-card__actions">
                    <button
                      className="btn btn-outline"
                      onClick={() => handleCancelAppointment(appointment._id)}
                    >
                      Cancel Appointment
                    </button>
                    {appointment.status === 'confirmed' && (
                      <button
                        className="btn btn-primary"
                        onClick={() => navigate(`/consult/${appointment._id}`)}
                        style={{ marginLeft: '0.75rem' }}
                      >
                        Join Video Visit
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientAppointments;


