import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/api';
function PatientHealthRecords({ onBack }) {
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealthRecords();
  }, []);

  const fetchHealthRecords = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch appointments and prescriptions
      const [appointmentsRes, prescriptionsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/appointments/patient`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/prescriptions/patient`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const appointmentsData = await appointmentsRes.json();
      const prescriptionsData = await prescriptionsRes.json();
      
      if (appointmentsData.success) {
        setAppointments(appointmentsData.appointments);
      }
      if (prescriptionsData.success) {
        setPrescriptions(prescriptionsData.prescriptions);
      }
    } catch (error) {
      console.error('Error fetching health records:', error);
      alert('Error fetching health records');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Combine and sort all records by date
  const allRecords = [
    ...appointments.map(apt => ({ ...apt, type: 'appointment', date: apt.date })),
    ...prescriptions.map(pres => ({ ...pres, type: 'prescription', date: pres.createdAt }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (loading) {
    return (
      <div className="patient-health-records">
        <div className="container">
          <div className="loading">Loading health records...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-health-records">
      <div className="container">
        <div className="patient-health-records__header">
          <button className="btn btn-text" onClick={onBack}>
            ← Back to Dashboard
          </button>
          <h2>Health Records</h2>
          <p>View your complete medical history</p>
        </div>

        {allRecords.length === 0 ? (
          <div className="empty-state">
            <p>You don't have any health records yet.</p>
          </div>
        ) : (
          <div className="health-records__list">
            {allRecords.map((record, index) => (
              <div key={`${record.type}-${record._id}`} className="health-record-card">
                <div className="health-record-card__header">
                  <div>
                    <h4>
                      {record.type === 'appointment' ? '📅 Appointment' : '💊 Prescription'}
                    </h4>
                    <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                      {formatDate(record.date)}
                    </p>
                  </div>
                  {record.type === 'appointment' && (
                    <span className={`health-record-card__status health-record-card__status--${record.status}`}>
                      {record.status}
                    </span>
                  )}
                </div>

                {record.type === 'appointment' ? (
                  <>
                    <div className="health-record-card__content">
                      <p><strong>Doctor:</strong> Dr. {record.doctor?.name}</p>
                      <p><strong>Specialization:</strong> {record.doctor?.specialization?.charAt(0).toUpperCase() + record.doctor?.specialization?.slice(1)}</p>
                      <p><strong>Reason:</strong> {record.reason}</p>
                      <p><strong>Time:</strong> {record.time}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="health-record-card__content">
                      <p><strong>Doctor:</strong> Dr. {record.doctor?.name}</p>
                      {record.diagnosis && (
                        <p><strong>Diagnosis:</strong> {record.diagnosis}</p>
                      )}
                      <p><strong>Medications:</strong> {record.medications?.length || 0} medication(s) prescribed</p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientHealthRecords;


