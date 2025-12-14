import React, { useState, useEffect } from 'react';
import API_BASE from '../config/api';

function BrowseDoctors({ onBack }) {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [specializations, setSpecializations] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    reason: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [searchTerm, specializationFilter, doctors]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/patient/doctors`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (data.success) {
        setDoctors(data.doctors);
        setFilteredDoctors(data.doctors);
        
        // Extract unique specializations
        const uniqueSpecializations = [...new Set(
          data.doctors
            .map(d => d.specialization)
            .filter(s => s)
            .map(s => s.toLowerCase())
        )].sort();
        setSpecializations(uniqueSpecializations);
      } else {
        alert('Failed to fetch doctors');
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      alert('Error fetching doctors');
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = [...doctors];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(doctor => 
        doctor.name?.toLowerCase().includes(searchLower) ||
        doctor.specialization?.toLowerCase().includes(searchLower) ||
        doctor.hospital?.toLowerCase().includes(searchLower) ||
        doctor.qualifications?.toLowerCase().includes(searchLower)
      );
    }

    // Apply specialization filter
    if (specializationFilter) {
      filtered = filtered.filter(doctor => 
        doctor.specialization?.toLowerCase() === specializationFilter.toLowerCase()
      );
    }

    setFilteredDoctors(filtered);
  };

  const handleBookAppointment = (doctor) => {
    setSelectedDoctor(doctor);
    setShowBookingModal(true);
    setBookingData({ date: '', time: '', reason: '' });
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookingData.date || !bookingData.time || !bookingData.reason) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setBookingLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/appointments/book`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          doctorId: selectedDoctor._id,
          date: bookingData.date,
          time: bookingData.time,
          reason: bookingData.reason
        })
      });

      const data = await res.json();
      
      if (data.success) {
        alert('Appointment booked successfully! The doctor will review your request.');
        setShowBookingModal(false);
        setSelectedDoctor(null);
        setBookingData({ date: '', time: '', reason: '' });
      } else {
        alert(data.message || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Error booking appointment');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="browse-doctors">
        <div className="container">
          <div className="loading">Loading doctors...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="browse-doctors">
      <div className="container">
        {/* Header */}
        <div className="browse-doctors__header">
          <button className="btn btn-text" onClick={onBack}>
            ← Back to Dashboard
          </button>
          <h2>Browse Doctors</h2>
          <p>Find and book appointments with approved doctors</p>
        </div>

        {/* Search and Filter Section */}
        <div className="browse-doctors__filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name, specialization, hospital, or qualifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <div className="filter-box">
            <label htmlFor="specialization-filter">Filter by Specialization:</label>
            <select
              id="specialization-filter"
              value={specializationFilter}
              onChange={(e) => setSpecializationFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Specializations</option>
              {specializations.map((spec, index) => (
                <option key={index} value={spec}>
                  {spec.charAt(0).toUpperCase() + spec.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="browse-doctors__results">
          <p>
            {filteredDoctors.length === 0 
              ? 'No doctors found' 
              : `Found ${filteredDoctors.length} doctor${filteredDoctors.length === 1 ? '' : 's'}`}
          </p>
        </div>

        {/* Doctors Grid */}
        {filteredDoctors.length === 0 ? (
          <div className="no-results">
            <p>No doctors match your search criteria. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="doctors-grid">
            {filteredDoctors.map((doctor) => (
              <div key={doctor._id} className="doctor-card">
                <div className="doctor-card__header">
                  <div className="doctor-card__avatar">
                    👨‍⚕️
                  </div>
                  <div className="doctor-card__info">
                    <h3>Dr. {doctor.name}</h3>
                    <p className="doctor-card__specialization">
                      {doctor.specialization 
                        ? doctor.specialization.charAt(0).toUpperCase() + doctor.specialization.slice(1)
                        : 'General Practitioner'}
                    </p>
                  </div>
                </div>
                
                <div className="doctor-card__details">
                  {doctor.hospital && (
                    <div className="doctor-card__detail">
                      <span className="detail-icon">🏥</span>
                      <span className="detail-text">{doctor.hospital}</span>
                    </div>
                  )}
                  
                  {doctor.yearsOfExperience && (
                    <div className="doctor-card__detail">
                      <span className="detail-icon">📅</span>
                      <span className="detail-text">{doctor.yearsOfExperience} years of experience</span>
                    </div>
                  )}
                  
                  {doctor.qualifications && (
                    <div className="doctor-card__detail">
                      <span className="detail-icon">🎓</span>
                      <span className="detail-text">{doctor.qualifications}</span>
                    </div>
                  )}
                  
                  {doctor.consultationFee && (
                    <div className="doctor-card__detail">
                      <span className="detail-icon">💰</span>
                      <span className="detail-text">${doctor.consultationFee} consultation fee</span>
                    </div>
                  )}
                  
                  {doctor.licenseNumber && (
                    <div className="doctor-card__detail">
                      <span className="detail-icon">📜</span>
                      <span className="detail-text">License: {doctor.licenseNumber}</span>
                    </div>
                  )}
                </div>
                
                <div className="doctor-card__actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleBookAppointment(doctor)}
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedDoctor && (
        <div className="modal">
          <div className="modal__backdrop" onClick={() => setShowBookingModal(false)}></div>
          <div className="modal__panel">
            <div className="modal__header">
              <h3>Book Appointment with Dr. {selectedDoctor.name}</h3>
              <button className="modal__close" onClick={() => setShowBookingModal(false)}>×</button>
            </div>
            <form className="form" onSubmit={handleBookingSubmit}>
              <div className="form__grid">
                <div className="form__field">
                  <label className="form__label">Date</label>
                  <input
                    type="date"
                    className="form__input"
                    value={bookingData.date}
                    onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="form__field">
                  <label className="form__label">Time</label>
                  <input
                    type="time"
                    className="form__input"
                    value={bookingData.time}
                    onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                    required
                  />
                </div>
                <div className="form__field" style={{ gridColumn: '1 / -1' }}>
                  <label className="form__label">Reason for Visit</label>
                  <textarea
                    className="form__textarea"
                    value={bookingData.reason}
                    onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })}
                    placeholder="Describe your symptoms or reason for the appointment..."
                    required
                  />
                </div>
              </div>
              <div className="form__submit">
                <button type="submit" className="btn btn-primary" disabled={bookingLoading}>
                  {bookingLoading ? 'Booking...' : 'Book Appointment'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setShowBookingModal(false)}
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

export default BrowseDoctors;

