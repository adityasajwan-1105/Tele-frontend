import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LandingPage from './components/LandingPage.jsx';
import PatientDashboard from './components/PatientDashboard.jsx';
import DoctorDashboard from './components/DoctorDashboard.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import VideoCallRoom from './components/VideoCallRoom.jsx';

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {user?.role === 'patient' ? (
              <PatientDashboard />
            ) : user?.role === 'doctor' ? (
              <DoctorDashboard />
            ) : user?.role === 'admin' ? (
              <AdminDashboard />
            ) : (
              <Navigate to="/" replace />
            )}
          </ProtectedRoute>
        }
      />
      <Route
        path="/consult/:appointmentId"
        element={
          <ProtectedRoute>
            <VideoCallRoom />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;


