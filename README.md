# SwasthyaMitra Full Stack Setup

**[GitHub Repository](https://github.com/kevindesai1312/biothron)**

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

## Bulletproof Hallucination Defense (Visual Proving Ground)

Judges are inherently skeptical of LLMs handling medical queries due to liability and safety concerns. SwasthyaMitra addresses this with a **100% verified data boundary enforcement mechanism**:
- **Dev Toggle UI**: A hidden toggle on the frontend reveals a card showing the exact **Cosine Similarity Score** calculated by our local Python NumPy script against the MongoDB Compass database.
- **The Pitch**: "We don't trust the LLM blindly. If a user asks a question and our MongoDB local vector math yields a similarity score below 0.70, our Master Prompt actively locks down the system and prevents a response. It outputs a strict 'Data Boundary Enforced' refusal instead."

## Epidemic Early-Warning Broadcast (Proactive Analytics)
To prove SwasthyaMitra is a true public health infrastructure tool rather than a reactive chatbot:
- **Alert Trigger:** The Admin Analytics Dashboard features a prominent **"Trigger Public Health Alert"** button.
- **Broadcast Banner:** When an admin detects a live regional disease spike, they can click the button. A high-visibility warning banner instantly appears across the patient chat interfaces in that specific region, alerting them to take preventive measures (e.g., *⚠️ Dengue spike detected in your area*).
- **The Pitch**: "SwasthyaMitra isn't just an informational assistant; it's a closed-loop epidemic early-warning system. When our database logs a critical cluster of localized symptom queries, health authorities can instantly broadcast targeted preventive measures back to that specific community."

## Automated Triage & "ASHA Worker Hand-off" Routing
An exit strategy demonstrating that the AI acts as the first line of triage, not a final diagnostic tool.
- **Triage Detection:** If a user reports prolonged or severe matching symptoms (e.g., *persistent high fever for 5 days*), the Express backend intercepts the interaction and triggers a **Human Escalation Token**.
- **Hand-off Card:** The AI suspends typical responses and instead drops a specialized info card: `"Connecting with your local ASHA worker..."`, displaying the assigned worker's profile (e.g., *ASHA Partner: Sunita Devi, Assigned Code: #3942*).
- **Live Dispatch Feed:** The full conversation transcript is securely forwarded to the **"ASHA Worker Mobile Feed"** widget visible on the Admin Dashboard for immediate human intervention.
- **The Pitch**: "We know AI has boundaries in healthcare. SwasthyaMitra acts as the first line of triage. When symptoms exceed general awareness thresholds, the system flags the interaction and routes the full localized transcript to the village's assigned ASHA worker, ensuring human intervention exactly where it is needed most."

## How to Run the Project

### Prerequisites
- **Node.js** (v16+)
- **Python** 3.8+
- **MongoDB** (running locally on `mongodb://localhost:27017` or Atlas)

### Initial Setup (Python Engine & Vector DB)
1. Open a terminal in the root folder.
2. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file in the `swasthyamitra-backend` folder and add your keys:
   ```env
   GEMINI_API_KEY=your_gemini_key
   PORT=5000
   MONGO_URI=mongodb://localhost:27017
   ```
4. Run the data ingestion script to populate MongoDB with the medical knowledge base:
   ```bash
   python ingest.py
   ```

You will now need two separate terminal windows for the frontend and backend.

### Terminal 1: Backend Server
1. `cd swasthyamitra-backend`
2. Run `npm install`
3. Run `npm run dev` (starts the server with nodemon)

### Terminal 2: Frontend Server
1. `cd swasthyamitra-frontend`
2. Run `npm install`
3. Run `npm run dev`
4. The React application will automatically open in your browser at `http://localhost:3000`.

## Testing the Admin Dashboard

The Admin Analytics dashboard is securely locked behind a JWT authentication wall. To access the live polling charts and tracking matrix:
- **Email:** `admin@gmail.com`
- **Password:** `admin123`
