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
- **The Pitch**: "We don't trust the LLM blindly. If a user asks a question and our MongoDB local vector math yields a similarity score below 0.50, our Master Prompt actively locks down the system and prevents a response. It outputs a strict 'Data Boundary Enforced' refusal instead."

## Epidemic Early-Warning Broadcast (Proactive Analytics)
To prove SwasthyaMitra is a true public health infrastructure tool rather than a reactive chatbot:
- **Alert Trigger:** The Admin Analytics Dashboard features a prominent **"Trigger Public Health Alert"** button.
- **Broadcast Banner:** When an admin detects a live regional disease spike, they can click the button. A high-visibility warning banner instantly appears across the patient chat interfaces in that specific region, alerting them to take preventive measures (e.g., *⚠️ Dengue spike detected in your area*).
- **The Pitch**: "SwasthyaMitra isn't just an informational assistant; it's a closed-loop epidemic early-warning system. When our database logs a critical cluster of localized symptom queries, health authorities can instantly broadcast targeted preventive measures back to that specific community."

## Dynamic Rule-Based First-Aid Screening Engine (Zero-Cost Triage Firewall)
For common, well-defined health situations (like dehydration, heatstroke, or minor cuts), we utilize a local JSON-based rule matching engine directly inside the Express backend to provide immediate instructions without burning AI tokens.
- **Local Triage Engine:** The `/api/chat-text` endpoint screens incoming queries against a localized dictionary before routing to the AI.
- **Zero Latency:** If a high-frequency query is matched, the system returns an instant, verified response.
- **The Pitch**: "We engineered a zero-cost triage firewall. If a user asks a high-frequency public health question regarding heatstroke or basic dehydration, our local rule engine catches it immediately. It delivers immediate, lifesaving first-aid answers without burning server resources or API tokens."

## Automated Triage & "ASHA Worker Hand-off" Routing
An exit strategy demonstrating that the AI acts as the first line of triage, not a final diagnostic tool.
- **Triage Detection:** If a user reports prolonged or severe matching symptoms (e.g., *persistent high fever for 5 days*), the Express backend intercepts the interaction and triggers a **Human Escalation Token**.
- **Hand-off Card:** The AI suspends typical responses and instead drops a specialized info card: `"Connecting with your local ASHA worker..."`, displaying the assigned worker's profile (e.g., *ASHA Partner: Sunita Devi, Assigned Code: #3942*).
- **Live Dispatch Feed:** The full conversation transcript is securely forwarded to the **"ASHA Worker Mobile Feed"** widget visible on the Admin Dashboard for immediate human intervention.
- **The Pitch**: "We know AI has boundaries in healthcare. SwasthyaMitra acts as the first line of triage. When symptoms exceed general awareness thresholds, the system flags the interaction and routes the full localized transcript to the village's assigned ASHA worker, ensuring human intervention exactly where it is needed most."

## Zero-Data Ultra-Lightweight Client Target PWA
In deep rural pockets of digital India, downloading a heavy application or parsing media-rich websites over patchy 2G/3G connections is highly unrealistic.
- **Low Data Mode Toggle:** The patient interface features a single-tap "Low Data Mode" switch.
- **Aggressive UI Stripping:** When activated, the React client instantly strips away heavy Tailwind styles, gradients, glassmorphism filters, shadow DOM elements, and non-essential UI animations. It compresses the interface into raw, clean HTML/CSS optimized to transmit tiny byte payloads.
- **Audio Bypass Engine:** In Low Data Mode, the backend is instructed to completely bypass the execution of the Google TTS engine, preventing the generation and transfer of multi-megabyte `.mp3` files, ensuring the response payload is just a few kilobytes of raw JSON text.
- **The Pitch**: "We engineered SwasthyaMitra to thrive in low-bandwidth realities. With a single tap, the interface strips down to an ultra-lightweight text framework that runs seamlessly on unstable 2G networks, ensuring connectivity when standard applications fail completely."
## Zero-API Native Multi-Lingual Engine
Serving rural India means bridging the vernacular language gap, but third-party translation APIs (like Google Translate or AWS Translate) introduce massive latency and cost. 
- **Native Script Execution:** SwasthyaMitra bypasses translation APIs entirely. The React frontend features a 7-language selector (English, Hindi, Bengali, Telugu, Tamil, Marathi, Gujarati) that injects strict behavioral commands directly into the prompt payload.
- **Protocol Enforced RAG:** The backend Gemini LLM natively comprehends the embedded language instruction and forces its RAG outputs directly into the target regional script, optimizing for immediate TTS playback without intermediary translation hops.
- **The Pitch**: "We eliminated the latency and cost of external translation APIs. By leveraging the foundational multi-lingual capabilities of Gemini through strict prompt boundary injections, SwasthyaMitra natively executes and streams public health data directly in 7 regional languages, right out of the box."

## "Share to WhatsApp / ASHA" Quick Link (Zero-Cost Telehealth Bridge)
Once a user receives a localized medical summary or list of PM-JAY empaneled centers, they need an effortless way to dispatch that info to their families or community healthcare workers.
- **Viral Social Loop:** A "Share with ASHA / Family" button is embedded on every AI response card.
- **Zero-Cost Deep Link:** It utilizes a completely free HTML universal deep link scheme that targets the official WhatsApp application installed on the phone/laptop locally—requiring absolutely no paid Meta Business API configurations.
- **The Pitch**: "We created a viral social loop for public health dispatch. With one tap, our platform packages the fully translated AI context boundary guidelines and uses a zero-cost localized application deep link to forward the entire health summary directly to family members or village ASHA networks via standard WhatsApp channels instantly."

## Client-Side Offline Emergency "Panic Button" Cache
If cellular coverage drops out completely in a deep pocket of a village, network requests to the server will fail. We implemented an automated, keyless offline fallback system directly inside the user's browser using standard client-side storage boundaries.
- **Offline Resiliency:** Utilizing `navigator.onLine`, the client detects network loss and instantly fails over to a compressed JSON blueprint of critical lifesaving procedures (CPR, heatstroke, etc.).
- **The Pitch**: "We engineered SwasthyaMitra to never leave a citizen stranded during a total network blackout. Using browser-native connectivity monitoring, the application automatically detects when it drops offline. It switches into 'Local Resiliency Mode,' immediately exposing a pre-cached matrix of critical first-aid guidelines securely embedded directly within the client's internal storage."

## Regex-Driven Admin Trend Anonymizer (Server-Side Performance Engine)
Patient privacy is non-negotiable. To ensure secure public health tracking without relying on external cloud processing, we built a local sanitization engine.
- **Instant Scrubbing:** A native Regex firewall inside the Node.js runtime strips out PII like phone numbers and ABHA identity strings before logging telemetry.
- **Auto-Categorization:** Raw user queries are matched against local dictionaries to automatically tag broad health trends (e.g., "Vector-Borne Diseases", "Respiratory Issues") before sending data to MongoDB.
- **The Pitch**: "Patient privacy is non-negotiable, and processing data safely shouldn't depend on paid compliance APIs. We built a native regex analytics sanitization firewall directly inside our Node.js runtime. Before any transaction log hits our MongoDB dashboard metrics layer, all PII like mobile numbers or identity traces are scrubbed entirely locally, while trends are categorized automatically to safely feed the public health dashboard."

## Integrated Health Schemes Portal
To serve as a comprehensive public health hub, SwasthyaMitra includes a dedicated directory for government health schemes.
- **Scheme Directory:** A beautifully designed, accessible UI listing critical programs like Ayushman Bharat (PM-JAY), Mission Indradhanush, and the National TB Elimination Program. Each scheme links directly to the official government portal (e.g., `pmjay.gov.in`, `nikshay.in`) for instant eligibility checking and registration.
- **The Pitch**: "SwasthyaMitra goes beyond conversational AI. We integrated a dedicated Health Schemes portal that acts as a digital bridge, actively educating citizens about government programs like PM-JAY and Mission Indradhanush, and routing them directly to official government portals so they can claim the benefits they are entitled to."

## Emergency Routing & Facilities Guide
SwasthyaMitra also features a dedicated "Hospitals & Emergencies" directory.
- **Instant Access to Helplines:** Provides immediate, scannable access to national toll-free numbers (108 Ambulance, 102 Pregnancy Ambulance, 1098 Child Helpline, etc.) categorized distinctly with clear icons.
- **Health Infrastructure Education:** Features an educational breakdown of India's rural health hierarchy, explaining the difference between PHCs, CHCs, District Hospitals, and Wellness Centres so rural users know exactly where to seek specific types of care.
- **The Pitch**: "In a crisis, seconds matter. Our dedicated emergency routing dashboard strips away the noise to provide immediate access to national helplines, while simultaneously educating the community on the different tiers of public health facilities available to them."

## Structured JSON Output for Dynamic UI States
Instead of raw text, the Gemini AI returns a strict JSON object mapping both the conversational reply and exact UI states. 
- **Context-Aware State Management:** If a rural user asks about clinics, the backend instructs the React frontend to dynamically flip the interface to the Hospitals view, rendering OpenStreetMap coordinates immediately.
- **The Pitch**: "Our AI engine doesn't just talk; it actively controls the interface. If a rural user asks about hospital availability, the Gemini engine returns a UI state directive that instantly flips the active layout to the native 'Hospitals' module without forcing a low-literacy user to find and click navigation links manually."

## Dynamic Localized Voice "Slow-Down" for Elderly Users
In rural digital medicine, older generations or people under immense stress struggle to comprehend high-speed synthesized robotic voices.
- **Client-Side Speech Synthesis Engine:** We embedded a "Turtle" icon (धीमी आवाज़) that dials down the native browser TTS `SpeechSynthesisUtterance` by exactly 35%.
- **The Pitch**: "Accessibility isn't just about translating words; it's about physical comprehension. We built a hardware-level audio deceleration toggle that dials down the client-side speech synthesis module engine by 35%, ensuring elderly patients can clearly digest critical medical instructions at an approachable pace without adding a single millisecond of cloud processing lag."

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
   MONGO_URI=mongodb+srv://kevinkdesai1308_db_user:Yh2joDtSbsNacDQu@cluster0.zahkpwz.mongodb.net/smartipm?retryWrites=true&w=majority
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
