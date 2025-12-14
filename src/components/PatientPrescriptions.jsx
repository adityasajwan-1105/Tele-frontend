import React, { useState, useEffect } from 'react';
import API_BASE from '../config/api';

function PatientPrescriptions({ onBack }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/prescriptions/patient`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (data.success) {
        setPrescriptions(data.prescriptions);
      } else {
        alert('Failed to fetch prescriptions');
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      alert('Error fetching prescriptions');
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

  if (loading) {
    return (
      <div className="patient-prescriptions">
        <div className="container">
          <div className="loading">Loading prescriptions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-prescriptions">
      <div className="container">
        <div className="patient-prescriptions__header">
          <button className="btn btn-text" onClick={onBack}>
            ← Back to Dashboard
          </button>
          <h2>My Prescriptions</h2>
          <p>View your e-prescriptions and medication history</p>
        </div>

        {prescriptions.length === 0 ? (
          <div className="empty-state">
            <p>You don't have any prescriptions yet.</p>
          </div>
        ) : (
          <div className="prescriptions__list">
            {prescriptions.map((prescription) => (
              <div key={prescription._id} className="prescription-card">
                <div className="prescription-card__header">
                  <div>
                    <h4>Prescription from Dr. {prescription.doctor?.name}</h4>
                    <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                      {formatDate(prescription.createdAt)}
                    </p>
                    {prescription.doctor?.specialization && (
                      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        {prescription.doctor.specialization.charAt(0).toUpperCase() + prescription.doctor.specialization.slice(1)}
                      </p>
                    )}
                  </div>
                  <span className={`prescription-card__status prescription-card__status--${prescription.status}`}>
                    {prescription.status}
                  </span>
                </div>

                {prescription.diagnosis && (
                  <div className="prescription-card__section">
                    <h5>Diagnosis</h5>
                    <p>{prescription.diagnosis}</p>
                  </div>
                )}

                <div className="prescription-card__section">
                  <h5>Medications</h5>
                  <div className="medications__list">
                    {prescription.medications.map((med, index) => (
                      <div key={index} className="medication-item">
                        <div className="medication-item__header">
                          <strong>{med.name}</strong>
                          <span className="medication-item__dosage">{med.dosage}</span>
                        </div>
                        <div className="medication-item__details">
                          <span>Frequency: {med.frequency}</span>
                          <span>Duration: {med.duration}</span>
                        </div>
                        {med.instructions && (
                          <p className="medication-item__instructions">{med.instructions}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {prescription.notes && (
                  <div className="prescription-card__section">
                    <h5>Notes</h5>
                    <p>{prescription.notes}</p>
                  </div>
                )}

                {prescription.appointment && (
                  <div className="prescription-card__section">
                    <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                      Related to appointment on {formatDate(prescription.appointment.date)} at {prescription.appointment.time}
                    </p>
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

export default PatientPrescriptions;


