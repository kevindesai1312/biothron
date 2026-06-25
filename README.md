# SwasthyaMitra Full Stack Setup

SwasthyaMitra is a multilingual, voice-first public health platform powered by Gemini AI, MongoDB Vector Search, and OpenStreetMap.

## Architecture

1. **`query_pipeline.py` (AI Brain)**: 
   - Handles the Gemini embedding generation, context formulation, and prompt logic.
   - Performs semantic search locally via `numpy` and `pymongo` against `medical_knowledge`.

2. **`swasthyamitra-backend/` (Node.js/Express Engine)**:
   - Exposed API server running on port `5000` (auto-restarts via nodemon).
   - `/api/chat-voice`: Receives audio, uses Gemini 1.5 Flash for STT, executes the AI brain (Gemini 2.5 Flash), and generates TTS via Google TTS API.
   - `/api/chat-text`: Receives text, enriches with nearby OpenStreetMap locations, executes the AI brain, and returns JSON.

3. **`swasthyamitra-frontend/` (React/Tailwind Dashboard)**:
   - Patient Interface (Smartphone): Real-time chat & microphone integration with auto-play TTS and single-tap mic silence detection.
   - Offline USSD Gateway (Feature Phone): Network-agnostic endpoint (`/api/ussd`) providing the exact same Gemini RAG pipeline via a lightweight, SMS-friendly text interface. Includes a retro Nokia-style UI simulator for demonstrations.
   - Trust/Safety: Includes Emergency Overrides (short-circuiting AI during crises) and transparent AI Source Verification.
   - Admin Analytics: JWT-secured, Recharts-powered dashboard showing real-time public health disease trends across regional lines.
   - Live Tracking Matrix: The dashboard features a real-time matrix feed that pulses red the exact moment a new medical query hits the database, providing a live synchronization "Wow Factor".
   - ABHA Integration (PM-JAY): Mock integration of Ayushman Bharat Health Accounts, providing personalized AI responses and tagging local OpenStreetMap hospitals as PM-JAY Empaneled for up to ₹5 Lakhs in free treatment.
     > ⚠ **Note:** The ABHA and PM-JAY empanelment integration is a mock implementation built specifically for hackathon demonstration purposes.

## How to Run the Project

You will need two separate terminal windows.

### Terminal 1: Backend Server
1. `cd swasthyamitra-backend`
2. Ensure you have your `.env` configured:
   ```
   GEMINI_API_KEY=your_gemini_key
   PORT=5000
   MONGO_URI=mongodb://localhost:27017
   ```
3. Run `npm install`
4. Run `npm run dev` (starts the server with nodemon)

### Terminal 2: Frontend Server
1. `cd swasthyamitra-frontend`
2. Run `npm install`
3. Run `npm run dev`
4. The React application will automatically open in your browser at `http://localhost:3000`.

## Testing the Admin Dashboard

The Admin Analytics dashboard is securely locked behind a JWT authentication wall. To access the live polling charts and tracking matrix:
- **Email:** `admin@gmail.com`
- **Password:** `admin123`
