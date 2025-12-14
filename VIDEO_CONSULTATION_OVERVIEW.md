## Video Consultation & Chat Overview

### What We’re Adding
- WebRTC-based video/audio sessions between a doctor and their patient.
- Real-time text chat that stays alongside the live call.
- Socket.IO signaling layer to broker peer discovery, WebRTC offers/answers, ICE candidates, and chat events.
- Join links exposed directly on confirmed appointments so both parties can launch the call in one click.

### High-Level Architecture
1. **HTTP + Socket.IO server**  
   - The Express API now sits behind a single HTTP server instance that also attaches a Socket.IO server.  
   - When a browser joins an appointment room, the server tracks participants and relays signaling or chat payloads only to that room.

2. **Room lifecycle**
   - Client emits `join-room` (appointmentId + basic user info).  
   - Server responds with `existing-peers` so the newcomer can create a WebRTC offer.  
   - Peers exchange `offer`, `answer`, and `ice-candidate` messages through `signal`.  
   - Disconnects or manual leaves broadcast `peer-left` so UIs can clean up.

3. **In-call chat**
   - Chat messages are emitted on the same socket namespace with `chat-message`.  
   - The server stamps timestamps and re-broadcasts to the room.

4. **Frontend UI**
   - `VideoCallRoom.jsx` handles media permissions, WebRTC peer connection management, mute/camera toggles, chat pane, and call controls.
   - Patients and doctors open `/consult/:appointmentId` from their dashboards; the component fetches appointment details to ensure authorization before joining the room.

### Security Considerations
- Only logged-in users (patient, doctor, or admin) who belong to the appointment can fetch details needed to join a room.
- Socket layer only receives minimal user metadata (name, role, avatar color seed) to display presence; authentication still comes from the REST call.
- All media stays peer-to-peer; only signaling and chat text traverse the backend.

### Next Steps / Future Enhancements
- Persist chat transcripts per appointment if compliance requires it.
- Add push notifications when the other participant joins.
- Support screen sharing or recording once storage/compliance requirements are defined.

