import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/api';

function VideoCallRoom() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const meetingContainerRef = useRef(null);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await res.json();
        if (!data.success) {
          setError(data.message || 'Unable to load appointment');
          return;
        }

        setAppointment(data.appointment);
      } catch (err) {
        console.error('Failed to load appointment', err);
        setError('Unable to load appointment details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId) {
      fetchAppointment();
    }
  }, [appointmentId]);

  useEffect(() => {
    if (!appointment || !user || !meetingContainerRef.current) {
      return;
    }

    try {
      const appID = Number(import.meta.env.VITE_ZEGO_APP_ID);
      const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

      if (!appID || !serverSecret) {
        console.error('ZEGOCLOUD credentials are not configured');
        setError('Video consultation is not configured. Please contact support.');
        return;
      }

      const roomID = appointmentId;
      const userID = user._id || user.id || `${Date.now()}`;
      const userName = user.name || 'User';

      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomID,
        userID,
        userName
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);

      zp.joinRoom({
        container: meetingContainerRef.current,
        sharedLinks: [
          {
            name: 'Consultation link',
            url: `${window.location.origin}/consult/${appointmentId}`
          }
        ],
        scenario: {
          mode: ZegoUIKitPrebuilt.OneONoneCall
        },
        showScreenSharingButton: true
      });

      return () => {
        if (zp && typeof zp.destroy === 'function') {
          zp.destroy();
        }
      };
    } catch (err) {
      console.error('Failed to initialize ZEGOCLOUD call', err);
      setError('Unable to start video consultation. Please try again later.');
    }
  }, [appointment, user, appointmentId]);

  const handleLeaveCall = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return <div className="video-room video-room--center">Loading consultation...</div>;
  }

  if (error) {
    return (
      <div className="video-room video-room--center">
        <div className="video-room__error">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="video-room">
      <header className="video-room__header">
        <div>
          <h2>TeleMed Consultation</h2>
          <p>
            {appointment?.patient?.name} with Dr. {appointment?.doctor?.name}
          </p>
        </div>
        <button className="btn btn-outline" onClick={handleLeaveCall}>
          Leave Call
        </button>
      </header>

      <div className="video-room__content">
        <div
          ref={meetingContainerRef}
          style={{ width: '100%', height: '80vh', borderRadius: '12px', overflow: 'hidden' }}
        />
      </div>
    </div>
  );
}

export default VideoCallRoom;


