import React, { useState } from 'react';

function SignupForm({ onClose, onSignupSuccess }) {
  const [role, setRole] = useState('patient');
  const [formData, setFormData] = useState({
    // Common fields
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Patient fields
    dateOfBirth: '',
    phone: '',
    address: '',
    gender: '',
    emergencyContact: '',
    emergencyPhone: '',
    // Doctor fields
    specialization: '',
    licenseNumber: '',
    yearsOfExperience: '',
    hospital: '',
    qualifications: '',
    consultationFee: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Common validations
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Role-specific validations
    if (role === 'patient') {
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      if (!formData.address.trim()) newErrors.address = 'Address is required';
      if (!formData.gender) newErrors.gender = 'Gender is required';
      if (!formData.emergencyContact.trim()) newErrors.emergencyContact = 'Emergency contact is required';
      if (!formData.emergencyPhone.trim()) newErrors.emergencyPhone = 'Emergency phone is required';
    } else if (role === 'doctor') {
      if (!formData.specialization.trim()) newErrors.specialization = 'Specialization is required';
      if (!formData.licenseNumber.trim()) newErrors.licenseNumber = 'License number is required';
      if (!formData.yearsOfExperience) newErrors.yearsOfExperience = 'Years of experience is required';
      if (!formData.hospital.trim()) newErrors.hospital = 'Hospital/Clinic name is required';
      if (!formData.qualifications.trim()) newErrors.qualifications = 'Qualifications are required';
      if (!formData.consultationFee) newErrors.consultationFee = 'Consultation fee is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Prepare data for API
      const submitData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: role
      };

      if (role === 'patient') {
        submitData.dateOfBirth = formData.dateOfBirth;
        submitData.phone = formData.phone;
        submitData.address = formData.address;
        submitData.gender = formData.gender;
        submitData.emergencyContact = formData.emergencyContact;
        submitData.emergencyPhone = formData.emergencyPhone;
      } else if (role === 'doctor') {
        submitData.specialization = formData.specialization;
        submitData.licenseNumber = formData.licenseNumber;
        submitData.yearsOfExperience = parseInt(formData.yearsOfExperience);
        submitData.hospital = formData.hospital;
        submitData.qualifications = formData.qualifications;
        submitData.consultationFee = parseFloat(formData.consultationFee);
      }

      const response = await fetch('http://localhost:4000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (data.success) {
        // Show success message
        if (role === 'patient') {
          alert('Patient account created successfully! Please login to continue.');
          onClose();
          // Trigger login modal to open after signup
          if (onSignupSuccess) {
            onSignupSuccess();
          }
        } else if (role === 'doctor') {
          alert('Doctor account created successfully! Your registration is pending admin approval. You will be able to login once an administrator approves your credentials.');
          onClose();
          // Don't open login modal for doctors - they need to wait for approval
        }
      } else {
        // Handle validation errors from backend
        if (data.message) {
          setErrors({ submit: data.message });
        } else {
          setErrors({ submit: 'Failed to create account. Please try again.' });
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      setErrors({ submit: 'Network error. Please check if the server is running.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      {/* Role Selector */}
      <div className="form__header">
        <div className="segmented">
          <button
            type="button"
            className={`segmented__btn ${role === 'patient' ? 'is-active' : ''}`}
            onClick={() => setRole('patient')}
          >
            Patient
          </button>
          <button
            type="button"
            className={`segmented__btn ${role === 'doctor' ? 'is-active' : ''}`}
            onClick={() => setRole('doctor')}
          >
            Doctor
          </button>
        </div>
      </div>

      <div className="form__grid">
        {/* Common Fields */}
        <div className="form__field">
          <label className="form__label" htmlFor="name">Full Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            className="form__input"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
          />
          {errors.name && <span className="form__error">{errors.name}</span>}
        </div>

        <div className="form__field">
          <label className="form__label" htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            className="form__input"
            value={formData.email}
            onChange={handleChange}
            placeholder="john@example.com"
          />
          {errors.email && <span className="form__error">{errors.email}</span>}
        </div>

        <div className="form__field">
          <label className="form__label" htmlFor="password">Password *</label>
          <input
            type="password"
            id="password"
            name="password"
            className="form__input"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
          />
          {errors.password && <span className="form__error">{errors.password}</span>}
        </div>

        <div className="form__field">
          <label className="form__label" htmlFor="confirmPassword">Confirm Password *</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            className="form__input"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
          />
          {errors.confirmPassword && <span className="form__error">{errors.confirmPassword}</span>}
        </div>

        {/* Patient-Specific Fields */}
        {role === 'patient' && (
          <>
            <div className="form__field">
              <label className="form__label" htmlFor="dateOfBirth">Date of Birth *</label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                className="form__input"
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
              {errors.dateOfBirth && <span className="form__error">{errors.dateOfBirth}</span>}
            </div>

            <div className="form__field">
              <label className="form__label" htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className="form__input"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 234 567 8900"
              />
              {errors.phone && <span className="form__error">{errors.phone}</span>}
            </div>

            <div className="form__field">
              <label className="form__label" htmlFor="gender">Gender *</label>
              <select
                id="gender"
                name="gender"
                className="form__select"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
              {errors.gender && <span className="form__error">{errors.gender}</span>}
            </div>

            <div className="form__field">
              <label className="form__label" htmlFor="address">Address *</label>
              <textarea
                id="address"
                name="address"
                className="form__textarea"
                value={formData.address}
                onChange={handleChange}
                placeholder="Street, City, State, ZIP"
                rows="2"
              />
              {errors.address && <span className="form__error">{errors.address}</span>}
            </div>

            <div className="form__field">
              <label className="form__label" htmlFor="emergencyContact">Emergency Contact Name *</label>
              <input
                type="text"
                id="emergencyContact"
                name="emergencyContact"
                className="form__input"
                value={formData.emergencyContact}
                onChange={handleChange}
                placeholder="Jane Doe"
              />
              {errors.emergencyContact && <span className="form__error">{errors.emergencyContact}</span>}
            </div>

            <div className="form__field">
              <label className="form__label" htmlFor="emergencyPhone">Emergency Contact Phone *</label>
              <input
                type="tel"
                id="emergencyPhone"
                name="emergencyPhone"
                className="form__input"
                value={formData.emergencyPhone}
                onChange={handleChange}
                placeholder="+1 234 567 8900"
              />
              {errors.emergencyPhone && <span className="form__error">{errors.emergencyPhone}</span>}
            </div>
          </>
        )}

        {/* Doctor-Specific Fields */}
        {role === 'doctor' && (
          <>
            <div className="form__field">
              <label className="form__label" htmlFor="specialization">Specialization *</label>
              <select
                id="specialization"
                name="specialization"
                className="form__select"
                value={formData.specialization}
                onChange={handleChange}
              >
                <option value="">Select Specialization</option>
                <option value="cardiology">Cardiology</option>
                <option value="dermatology">Dermatology</option>
                <option value="pediatrics">Pediatrics</option>
                <option value="orthopedics">Orthopedics</option>
                <option value="neurology">Neurology</option>
                <option value="psychiatry">Psychiatry</option>
                <option value="general">General Practice</option>
                <option value="internal-medicine">Internal Medicine</option>
                <option value="oncology">Oncology</option>
                <option value="other">Other</option>
              </select>
              {errors.specialization && <span className="form__error">{errors.specialization}</span>}
            </div>

            <div className="form__field">
              <label className="form__label" htmlFor="licenseNumber">Medical License Number *</label>
              <input
                type="text"
                id="licenseNumber"
                name="licenseNumber"
                className="form__input"
                value={formData.licenseNumber}
                onChange={handleChange}
                placeholder="MD-12345"
              />
              {errors.licenseNumber && <span className="form__error">{errors.licenseNumber}</span>}
            </div>

            <div className="form__field">
              <label className="form__label" htmlFor="yearsOfExperience">Years of Experience *</label>
              <input
                type="number"
                id="yearsOfExperience"
                name="yearsOfExperience"
                className="form__input"
                value={formData.yearsOfExperience}
                onChange={handleChange}
                placeholder="5"
                min="0"
              />
              {errors.yearsOfExperience && <span className="form__error">{errors.yearsOfExperience}</span>}
            </div>

            <div className="form__field">
              <label className="form__label" htmlFor="hospital">Hospital/Clinic Name *</label>
              <input
                type="text"
                id="hospital"
                name="hospital"
                className="form__input"
                value={formData.hospital}
                onChange={handleChange}
                placeholder="City General Hospital"
              />
              {errors.hospital && <span className="form__error">{errors.hospital}</span>}
            </div>

            <div className="form__field">
              <label className="form__label" htmlFor="qualifications">Qualifications *</label>
              <textarea
                id="qualifications"
                name="qualifications"
                className="form__textarea"
                value={formData.qualifications}
                onChange={handleChange}
                placeholder="MD, MBBS, etc."
                rows="2"
              />
              {errors.qualifications && <span className="form__error">{errors.qualifications}</span>}
            </div>

            <div className="form__field">
              <label className="form__label" htmlFor="consultationFee">Consultation Fee (USD) *</label>
              <input
                type="number"
                id="consultationFee"
                name="consultationFee"
                className="form__input"
                value={formData.consultationFee}
                onChange={handleChange}
                placeholder="100"
                min="0"
                step="0.01"
              />
              {errors.consultationFee && <span className="form__error">{errors.consultationFee}</span>}
            </div>
          </>
        )}
      </div>

      {errors.submit && (
        <div className="form__errors">
          {errors.submit}
        </div>
      )}

      <div className="form__submit">
        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%' }}
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </div>
    </form>
  );
}

export default SignupForm;

