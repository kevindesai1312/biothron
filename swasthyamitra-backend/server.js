const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const googleTTS = require('google-tts-api');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { checkLocalFirstAid } = require('./triageEngine');
const { categorizeAndAnonymize } = require('./anonymizer');

// Promisify exec for async/await usage
const execPromise = util.promisify(exec);
const { findNearbyHospitals } = require('./locationService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB natively in Node.js
const mongoClient = new MongoClient(process.env.MONGO_URI || "mongodb+srv://kevinkdesai1308_db_user:Yh2joDtSbsNacDQu@cluster0.zahkpwz.mongodb.net/smartipm?retryWrites=true&w=majority");
let db;
mongoClient.connect().then(async () => {
    db = mongoClient.db("SwasthyaMitra");
    console.log("Connected to MongoDB for Telemetry");

    // Seed Admin Securely
    const adminCollection = db.collection('admins');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await adminCollection.updateOne(
        { email: 'admin@gmail.com' },
        { $set: { password: hashedPassword } },
        { upsert: true }
    );
    console.log("Default secure admin seeded.");
}).catch(err => console.error("MongoDB connection error:", err));

app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure Multer to temporarily store audio recordings
const upload = multer({ dest: 'uploads/' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const emergencyKeywords = /chest pain|severe bleeding|snake bite|heart attack|unconscious|difficulty breathing/i;

// JWT Middleware
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_healthcare_key';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid or expired token." });
        req.user = user;
        next();
    });
}

function checkEmergency(query) {
    if (emergencyKeywords.test(query)) {
        return {
            is_emergency: true,
            ai_response: "🚨 Critical Situation Detected: Please visit the nearest primary health center immediately."
        };
    }
    return null;
}

// --- USER AUTHENTICATION ENDPOINTS ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!db) return res.status(503).json({ error: "Database not ready" });

        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) return res.status(400).json({ error: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.collection('users').insertOne({ 
            name, email, password: hashedPassword, role: 'patient', createdAt: new Date() 
        });

        res.status(201).json({ success: true, message: "User registered successfully" });
    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ error: "Server error during registration" });
    }
});

app.post('/api/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!db) return res.status(503).json({ error: "Database not ready" });

        const admin = await db.collection('admins').findOne({ email });
        if (!admin) return res.status(401).json({ error: "Invalid admin credentials" });

        const validPassword = await bcrypt.compare(password, admin.password);
        if (!validPassword) return res.status(401).json({ error: "Invalid admin credentials" });

        const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ token, user: { role: 'admin' } });
    } catch (err) {
        console.error("Admin Login Error:", err);
        res.status(500).json({ error: "Server error during admin login" });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!db) return res.status(503).json({ error: "Database not ready" });

        let user = await db.collection('users').findOne({ email });
        let role = user ? (user.role || 'patient') : null;

        if (!user) {
            user = await db.collection('admins').findOne({ email });
            role = 'admin';
        }

        if (!user) return res.status(401).json({ error: "Invalid credentials" });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: "Invalid credentials" });

        const token = jwt.sign({ userId: user._id, email: user.email, role: role, name: user.name || 'Admin' }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { name: user.name || 'Admin', email: user.email, role: role } });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: "Server error during login" });
    }
});

app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        if (!db) return res.status(503).json({ error: "Database not connected" });
        let user = await db.collection('users').findOne({ email: req.user.email }, { projection: { password: 0 } });
        if (!user) {
            user = await db.collection('admins').findOne({ email: req.user.email }, { projection: { password: 0 } });
        }
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json({ profile: user });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

app.put('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        if (!db) return res.status(503).json({ error: "Database not connected" });
        const { name, dob, gender, bloodGroup, phone, chronicConditions, allergies, medications, emergencyContactName, emergencyContactPhone, language, location } = req.body;
        
        // Remove undefined fields
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (dob !== undefined) updateData.dob = dob;
        if (gender !== undefined) updateData.gender = gender;
        if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup;
        if (phone !== undefined) updateData.phone = phone;
        if (chronicConditions !== undefined) updateData.chronicConditions = chronicConditions;
        if (allergies !== undefined) updateData.allergies = allergies;
        if (medications !== undefined) updateData.medications = medications;
        if (emergencyContactName !== undefined) updateData.emergencyContactName = emergencyContactName;
        if (emergencyContactPhone !== undefined) updateData.emergencyContactPhone = emergencyContactPhone;
        if (language !== undefined) updateData.language = language;
        if (location !== undefined) updateData.location = location;

        let result = await db.collection('users').updateOne(
            { email: req.user.email },
            { $set: updateData }
        );
        
        if (result.matchedCount === 0) {
            result = await db.collection('admins').updateOne(
                { email: req.user.email },
                { $set: updateData }
            );
        }
        
        if (result.matchedCount === 0) return res.status(404).json({ error: "User not found" });
        
        res.json({ success: true, message: "Profile updated successfully" });
    } catch (err) {
        console.error("Profile Update Error:", err);
        res.status(500).json({ error: "Server error during profile update" });
    }
});

app.get('/api/user/notifications', authenticateToken, async (req, res) => {
    try {
        if (!db) return res.status(503).json({ error: "Database not connected" });
        let user = await db.collection('users').findOne({ email: req.user.email }, { projection: { notifications: 1 } });
        if (!user) user = await db.collection('admins').findOne({ email: req.user.email }, { projection: { notifications: 1 } });
        
        if (!user) return res.status(404).json({ error: "User not found" });
        
        // Seed default notification if none exist
        if (!user.notifications || user.notifications.length === 0) {
            const welcomeNotif = {
                id: Date.now().toString(),
                text: "Welcome to SwasthyaMitra! Complete your profile to get personalized health schemes.",
                read: false,
                date: new Date().toISOString()
            };
            await db.collection('users').updateOne({ email: req.user.email }, { $set: { notifications: [welcomeNotif] } });
            await db.collection('admins').updateOne({ email: req.user.email }, { $set: { notifications: [welcomeNotif] } });
            return res.json({ notifications: [welcomeNotif] });
        }
        
        res.json({ notifications: user.notifications });
    } catch (err) {
        console.error("Notifications Fetch Error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

app.put('/api/user/notifications/read', authenticateToken, async (req, res) => {
    try {
        if (!db) return res.status(503).json({ error: "Database not connected" });
        
        // Mark all as read
        await db.collection('users').updateOne(
            { email: req.user.email },
            { $set: { "notifications.$[].read": true } }
        );
        await db.collection('admins').updateOne(
            { email: req.user.email },
            { $set: { "notifications.$[].read": true } }
        );
        
        res.json({ success: true });
    } catch (err) {
        console.error("Notifications Read Error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// --- HOSPITALS & SCHEMES ENDPOINTS ---
app.get('/api/hospitals', async (req, res) => {
    try {
        const location = req.query.location || "Surat, Gujarat";
        const facilities = await findNearbyHospitals(location);
        res.json({ hospitals: facilities });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch hospitals" });
    }
});

app.get('/api/schemes', async (req, res) => {
    const schemes = [
      { title: "Ayushman Bharat", description: "Free health insurance coverage up to ₹5 lakh per family per year for secondary and tertiary care hospitalization.", type: "Central Government", category: "Health Insurance", popular: true, url: "https://pmjay.gov.in/" },
      { title: "Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA)", description: "Free check-ups on the 9th of every month for pregnant women by specialist doctors.", type: "Central Government", category: "Maternal Health", popular: false, url: "https://pmsma.mohfw.gov.in/" },
      { title: "Janani Suraksha Yojana", description: "Financial assistance for pregnant women and safe delivery in government institutions.", type: "Central Government", category: "Maternal Health", popular: false, url: "https://nhm.gov.in/" },
      { title: "PM-JAY (Ayushman Bharat)", description: "World's largest health assurance scheme for vulnerable families.", type: "Central Government", category: "Health Insurance", popular: false, url: "https://pmjay.gov.in/" },
      { title: "National Health Mission (NHM)", description: "Improving health infrastructure and providing universal access to quality healthcare.", type: "State Government", category: "Public Health", popular: false, url: "https://nhm.gov.in/" }
    ];
    res.json({ schemes });
});

// --- USSD ENDPOINT ---
app.post('/api/ussd', async (req, res) => {
    try {
        const { text, phoneNumber } = req.body;
        if (!text) return res.status(400).send("No query provided.");
        
        console.log(`USSD Request from ${phoneNumber}: ${text}`);
        
        // Check for emergency or basic routing first
        const emergency = checkEmergency(text);
        if (emergency) {
            return res.send("🚨 EMERGENCY: Visit nearest primary health center immediately.");
        }
        
        // Use RAG with prompt restriction
        const ussdQuery = `[System: You are responding to a USSD SMS interface. Limit your response to 150 characters MAXIMUM. Be extremely concise.] ${text}`;
        
        const resultObj = await getAIandRAGResponse(ussdQuery);
        let finalResponse = resultObj.ai_response || "System Error. Try again.";
        
        if (finalResponse.length > 155) {
            finalResponse = finalResponse.substring(0, 150) + "...";
        }
        
        res.send(finalResponse);
    } catch (err) {
        console.error("USSD Error:", err);
        res.status(500).send("Network Error. Try again.");
    }
});

// --- PROACTIVE ANALYTICS & ASHA HAND-OFF STATE ---
let activeBroadcast = null;
const ashaFeed = [];
const ashaHandoffKeywords = /5 days|persistent high fever|prolonged|not going away|several days/i;

function checkAshaHandoff(query) {
    if (ashaHandoffKeywords.test(query)) {
        return {
            is_asha_handoff: true,
            asha_profile: {
                name: "Sunita Devi",
                code: "#3942",
                role: "Local ASHA Worker"
            }
        };
    }
    return null;
}

// Telemetry Logic
async function logTelemetry(query, location) {
    if (!db) return;
    try {
        const anonymizedData = categorizeAndAnonymize(query);
        await db.collection('regional_trends').insertOne({
            disease: anonymizedData.category,
            safeQuery: anonymizedData.safeQuery,
            location: location || "Unknown",
            timestamp: anonymizedData.timestamp
        });
        console.log(`Telemetry logged: ${anonymizedData.category} in ${location} (Query Sanitized)`);
    } catch (err) {
        console.error("Telemetry error:", err);
    }
}

function fileToGenerativePart(filePath, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
            mimeType
        },
    };
}

// --- CORE VOICE ENTRY ENDPOINT ---
app.post('/api/chat-voice', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No audio file provided" });
        }

        const audioPath = req.file.path;

        // 1. Voice-to-Text: Send audio to Gemini 1.5 Flash
        console.log("Transcribing audio via Gemini...");
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const audioPart = fileToGenerativePart(audioPath, "audio/mp3"); 
        const prompt = "Transcribe the following audio exactly in its original language. Output ONLY the transcribed text and nothing else.";
        const result = await model.generateContent([prompt, audioPart]);
        
        let userQueryText = result.response.text().trim();

        if (req.body.selectedLanguage) {
            userQueryText = `[Please respond strictly in ${req.body.selectedLanguage}] ` + userQueryText;
        }

        if (req.body.abhaLinked === 'true') {
            userQueryText = `[USER PROFILE: ABHA Card Linked. Name: Pratham.] ` + userQueryText;
        }

        console.log(`User Said (Transcribed): ${userQueryText}`);

        const emergency = checkEmergency(userQueryText);
        const ashaHandoff = checkAshaHandoff(userQueryText);
        let finalResponse, sources = [], isEmergency = false, isAshaHandoff = false, ashaProfile = null, confidenceScore = 0;

        if (emergency) {
            console.log("Emergency Triggered!");
            finalResponse = emergency.ai_response;
            isEmergency = true;
        } else if (ashaHandoff) {
            console.log("ASHA Hand-off Triggered!");
            finalResponse = "Connecting with your local ASHA worker... Please wait while we securely transmit your symptom details.";
            isAshaHandoff = true;
            ashaProfile = ashaHandoff.asha_profile;
            
            ashaFeed.unshift({
                timestamp: new Date(),
                query: userQueryText,
                location: req.body.location || "Unknown",
                profile: ashaProfile
            });
            if (ashaFeed.length > 50) ashaFeed.pop();
        } else {
            // Check if user location was provided to enrich the query with OSM data
            if (req.body.location) {
                console.log(`Location provided: ${req.body.location}. Fetching nearby clinics...`);
                const facilities = await findNearbyHospitals(req.body.location);
                if (facilities.length > 0) {
                    const facilityList = facilities.map(f => {
                        const empaneledStr = f.abhaEmpaneled ? ` (Empaneled: YES - ${f.schemeBenefits})` : ` (Empaneled: NO)`;
                        return `${f.name} at ${f.address}${empaneledStr}`;
                    }).join(' | ');
                    userQueryText += ` (System Note: User is near ${req.body.location}. Nearby clinics found: ${facilityList}. IMPORTANT: If the user's ABHA card is linked, YOU MUST explicitly tell them their treatment is free up to 5 Lakhs at any Empaneled hospital listed here.)`;
                    console.log(`Enriched Query: ${userQueryText}`);
                }
            }

            // 2. RAG & LLM Processing 
            const resultObj = await getAIandRAGResponse(userQueryText);
            finalResponse = resultObj.ai_response;
            sources = resultObj.sources || [];
            confidenceScore = resultObj.confidence_score || 0;
            
            // 2.5 Log Telemetry asynchronously
            logTelemetry(userQueryText, req.body.location || "Unknown");
        }

        let outputFilename = null;
        if (req.body.lowDataMode !== 'true') {
            // 3. Text-to-Voice: Convert the response back into speech for accessibility
            console.log("Generating audio response via Google TTS...");
            const base64AudioArray = await googleTTS.getAllAudioBase64(finalResponse, {
                lang: 'hi', // Using Hindi for regional accessibility
                slow: false,
                host: 'https://translate.google.com',
                splitPunct: ',.?'
            });

            // Save TTS file locally
            outputFilename = `response_${Date.now()}.mp3`;
            const outputAudioPath = path.join(uploadDir, outputFilename);
            
            // Concatenate all audio buffers
            const buffers = base64AudioArray.map(obj => Buffer.from(obj.base64, 'base64'));
            const finalBuffer = Buffer.concat(buffers);
            await fs.promises.writeFile(outputAudioPath, finalBuffer);
        } else {
            console.log("Low Data Mode Enabled: Bypassing Google TTS Generation to save bandwidth.");
        }

        // Clean up the incoming audio chunk file
        fs.unlinkSync(audioPath);

        // 4. Return both Text & Audio URL to Frontend
        res.json({
            user_query: userQueryText,
            ai_response: finalResponse,
            ui_state: resultObj ? resultObj.ui_state : undefined,
            sources: sources,
            confidence_score: confidenceScore,
            is_emergency: isEmergency,
            is_asha_handoff: isAshaHandoff,
            asha_profile: ashaProfile,
            audio_url: outputFilename ? `http://localhost:${process.env.PORT || 5000}/uploads/${outputFilename}` : null
        });

    } catch (error) {
        console.error("Error processing voice session:", error);
        res.status(500).json({ error: "Voice pipeline failure" });
    }
});

// --- CORE TEXT ENTRY ENDPOINT ---
app.post('/api/chat-text', async (req, res) => {
    try {
        let { userQuery, locationText, abhaLinked } = req.body;
        if (!userQuery) {
            return res.status(400).json({ error: "No text query provided" });
        }

        if (abhaLinked) {
            userQuery = `[USER PROFILE: ABHA Card Linked. Name: Pratham.] ` + userQuery;
        }

        // --- DYNAMIC RULE-BASED FIRST-AID SCREENING ENGINE ---
        const firstAidMatch = checkLocalFirstAid(userQuery);
        if (firstAidMatch.matched) {
            console.log("Local First-Aid Rule Matched. Bypassing AI.");
            return res.json({
                user_query: userQuery,
                ai_response: firstAidMatch.instructions,
                is_emergency: false,
                is_asha_handoff: false,
                sources: ["Local Triage Engine"],
                confidence_score: 1.0
            });
        }
        // -----------------------------------------------------

        const emergency = checkEmergency(userQuery);
        const ashaHandoff = checkAshaHandoff(userQuery);
        if (emergency) {
            return res.json({
                user_query: userQuery,
                ai_response: emergency.ai_response,
                is_emergency: true,
                is_asha_handoff: false,
                sources: []
            });
        } else if (ashaHandoff) {
            console.log("ASHA Hand-off Triggered!");
            ashaFeed.unshift({
                timestamp: new Date(),
                query: userQuery,
                location: locationText || "Unknown",
                profile: ashaHandoff.asha_profile
            });
            if (ashaFeed.length > 50) ashaFeed.pop();

            return res.json({
                user_query: userQuery,
                ai_response: "Connecting with your local ASHA worker... Please wait while we securely transmit your symptom details.",
                is_emergency: false,
                is_asha_handoff: true,
                asha_profile: ashaHandoff.asha_profile,
                sources: []
            });
        }

        if (locationText) {
            console.log(`Location provided: ${locationText}. Fetching nearby clinics...`);
            const facilities = await findNearbyHospitals(locationText);
            if (facilities.length > 0) {
                const facilityList = facilities.map(f => {
                    const empaneledStr = f.abhaEmpaneled ? ` (Empaneled: YES - ${f.schemeBenefits})` : ` (Empaneled: NO)`;
                    return `${f.name} at ${f.address}${empaneledStr}`;
                }).join(' | ');
                userQuery += ` (System Note: User is near ${locationText}. Nearby clinics found: ${facilityList}. IMPORTANT: If the user's ABHA card is linked, YOU MUST explicitly tell them their treatment is free up to 5 Lakhs at any Empaneled hospital listed here.)`;
            }
        }

        console.log(`Enriched Query: ${userQuery}`);
        const resultObj = await getAIandRAGResponse(userQuery);
        
        // Log Telemetry asynchronously
        logTelemetry(userQuery, locationText || "Unknown");

        res.json({
            user_query: userQuery,
            ai_response: resultObj.ai_response,
            ui_state: resultObj.ui_state,
            sources: resultObj.sources || [],
            confidence_score: resultObj.confidence_score || 0,
            is_emergency: false,
            is_asha_handoff: false
        });

    } catch (error) {
        console.error("Error processing text session:", error);
        res.status(500).json({ error: "Text pipeline failure" });
    }
});

// --- OFFLINE USSD/SMS ENDPOINT ---
app.post('/api/ussd', async (req, res) => {
    try {
        let { text, phoneNumber, location } = req.body;
        if (!text) {
            return res.status(400).json({ error: "No query provided" });
        }

        console.log(`USSD Request from ${phoneNumber || 'Unknown'}: ${text}`);

        const emergency = checkEmergency(text);
        if (emergency) {
            // USSD responses must be short plain text
            return res.send(`SwasthyaMitra:\n${emergency.ai_response}\n\nReply 1 to exit`);
        }

        const resultObj = await getAIandRAGResponse(text);
        
        // Log Telemetry asynchronously
        logTelemetry(text, location || "USSD Network");

        // Strip markdown and truncate for SMS/USSD limits (~160 chars)
        let cleanText = resultObj.ai_response.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#/g, '');
        if (cleanText.length > 140) {
            cleanText = cleanText.substring(0, 137) + "...";
        }

        res.send(`SwasthyaMitra:\n${cleanText}\n\nReply 1 to exit`);

    } catch (error) {
        console.error("Error processing USSD session:", error);
        res.status(500).send("System Error. Try again later.");
    }
});

// Connect to the Python RAG Pipeline
const systemErrorMessages = {
    "English": "I apologize, our system is currently experiencing technical issues. Please try again later. (System Error)",
    "Hindi": "मुझे क्षमा करें, अभी हमारे सिस्टम में कुछ तकनीकी समस्या है। कृपया बाद में प्रयास करें। (System Error)",
    "Bengali": "আমি দুঃখিত, আমাদের সিস্টেমে বর্তমানে কিছু প্রযুক্তিগত সমস্যা হচ্ছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন। (System Error)",
    "Telugu": "నన్ను క్షమించండి, ప్రస్తుతం మా సిస్టమ్‌లో కొన్ని సాంకేతిక సమస్యలు ఉన్నాయి. దయచేసి తర్వాత మళ్లీ ప్రయత్నించండి. (System Error)",
    "Tamil": "மன்னிக்கவும், எங்கள் அமைப்பில் தற்போது சில தொழில்நுட்ப சிக்கல்கள் உள்ளன. தயவுசெய்து சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும். (System Error)",
    "Marathi": "मला क्षमा करा, सध्या आमच्या सिस्टममध्ये काही तांत्रिक समस्या आहेत. कृपया नंतर पुन्हा प्रयत्न करा. (System Error)",
    "Gujarati": "હું માફી માંગુ છું, હાલમાં અમારી સિસ્ટમમાં કેટલીક તકનીકી સમસ્યાઓ છે. કૃપા કરીને થોડા સમય પછી ફરી પ્રયાસ કરો. (System Error)"
};

function getSystemErrorFallback(query) {
    if (!query) return systemErrorMessages["English"];
    for (const [lang, msg] of Object.entries(systemErrorMessages)) {
        if (query.includes(lang)) {
            return msg;
        }
    }
    return systemErrorMessages["English"];
}

async function getAIandRAGResponse(query) {
    try {
        // Run the python script with the query as an argument.
        // We use base64 encoding to completely avoid Windows shell escaping issues with complex JSON/quotes.
        const pythonPath = 'python'; // or 'python3' depending on system
        const scriptPath = path.join(__dirname, '..', 'query_pipeline.py');
        const queryBase64 = Buffer.from(query, 'utf8').toString('base64');
        const command = `${pythonPath} "${scriptPath}" --base64 ${queryBase64}`;
        
        console.log("Executing Python RAG Pipeline...");
        const { stdout, stderr } = await execPromise(command, { env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
        
        if (stderr) {
            console.error("Python Stderr:", stderr);
        }
        
        // Return the stdout, parsing the JSON
        const rawJsonStr = stdout.trim();
        const parsed = JSON.parse(rawJsonStr);
        return {
            ai_response: parsed.response,
            ui_state: parsed.ui_state,
            sources: parsed.sources,
            confidence_score: parsed.confidence_score
        };
    } catch (err) {
        console.error("Failed to execute python pipeline:", err);
        return {
            ai_response: getSystemErrorFallback(query),
            sources: [],
            confidence_score: 0
        };
    }
}

// --- PROACTIVE BROADCAST ENDPOINTS ---
app.post('/api/admin/broadcast', authenticateToken, (req, res) => {
    const { message, region } = req.body;
    activeBroadcast = { message, region, timestamp: new Date() };
    console.log(`[BROADCAST] Alert sent to ${region}: ${message}`);
    res.json({ success: true, broadcast: activeBroadcast });
});

app.get('/api/alerts/active', (req, res) => {
    res.json({ activeBroadcast });
});

app.get('/api/admin/asha-feed', authenticateToken, (req, res) => {
    res.json({ feed: ashaFeed });
});

// --- ADMIN LOGIN ENDPOINT ---
app.post('/api/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!db) return res.status(503).json({ error: "Database not ready" });

        const admin = await db.collection('admins').findOne({ email });
        if (!admin) return res.status(401).json({ error: "Invalid credentials" });

        const validPassword = await bcrypt.compare(password, admin.password);
        if (!validPassword) return res.status(401).json({ error: "Invalid credentials" });

        const token = jwt.sign({ email: admin.email, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: "Server error during login" });
    }
});

// --- ANALYTICS ENDPOINT (PROTECTED) ---
app.get('/api/analytics', authenticateToken, async (req, res) => {
    try {
        if (!db) return res.status(503).json({ error: "Database not connected" });
        
        // Aggregate diseases to find counts
        const diseaseTrends = await db.collection('regional_trends').aggregate([
            { $group: { _id: "$disease", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]).toArray();
        
        // Format for Recharts { name: 'Malaria', count: 5 }
        const formattedTrends = diseaseTrends.map(item => ({
            name: item._id,
            count: item.count
        }));

        // Aggregate regions to find distribution
        const regionalDistribution = await db.collection('regional_trends').aggregate([
            { $group: { _id: "$location", value: { $sum: 1 } } },
            { $sort: { value: -1 } },
            { $limit: 5 }
        ]).toArray();
        
        const formattedRegions = regionalDistribution.map(item => ({
            name: item._id,
            value: item.value
        }));

        res.json({
            trendingIssuesData: formattedTrends.length > 0 ? formattedTrends : [{ name: 'No Data Yet', count: 0 }],
            regionalConcernsData: formattedRegions.length > 0 ? formattedRegions : [{ name: 'No Data Yet', value: 0 }],
            // Admin Panel Mockup Data
            stats: {
                totalUsers: "1,24,850",
                registeredHospitals: "1,256",
                appointments: "18,742",
                emergencyRequests: "1,089",
                activeSchemes: "32"
            },
            roleDistribution: [
                { name: 'Patients', value: 87452 },
                { name: 'Doctors', value: 18590 },
                { name: 'Hospitals', value: 9856 },
                { name: 'Admin Staff', value: 5732 },
                { name: 'Others', value: 3220 }
            ],
            recentAppointments: [
                { id: 1, user: 'Ramesh Patel', type: 'Consultation', doctor: 'Dr. Meera Shah', date: '24 May 2024, 11:30 AM', status: 'Confirmed' },
                { id: 2, user: 'Priya Parmar', type: 'Follow-up', doctor: 'Sunshine Hospital', date: '24 May 2024, 02:00 PM', status: 'Confirmed' },
                { id: 3, user: 'Amit Singh', type: 'Consultation', doctor: 'Dr. Viral Mehta', date: '24 May 2024, 03:30 PM', status: 'Pending' },
                { id: 4, user: 'Neha Joshi', type: 'Checkup', doctor: 'City Care Hospital', date: '24 May 2024, 04:15 PM', status: 'Completed' },
                { id: 5, user: 'Dilip Kumar', type: 'Consultation', doctor: 'Dr. Meera Shah', date: '24 May 2024, 05:00 PM', status: 'Confirmed' }
            ],
            topHospitals: [
                { name: 'Sunshine Global Hospital', location: 'Surat, Gujarat', appointments: 2450 },
                { name: 'New Civil Hospital', location: 'Surat, Gujarat', appointments: 1987 },
                { name: 'Kiran Multi Super Specialty', location: 'Surat, Gujarat', appointments: 1654 },
                { name: 'Athwa Lines General Hospital', location: 'Surat, Gujarat', appointments: 1238 },
                { name: 'Shalby Multi-Specialty Hospital', location: 'Surat, Gujarat', appointments: 1102 }
            ],
            systemAlerts: [
                { type: 'error', message: 'High server load detected', time: 'Today, 10:30 AM' },
                { type: 'warning', message: '2 hospitals pending verification', time: 'Today, 09:15 AM' },
                { type: 'info', message: 'Database backup completed', time: 'Yesterday, 11:45 PM' }
            ]
        });
    } catch (err) {
        console.error("Analytics error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// --- RECENT ACTIVITY ENDPOINT (PROTECTED) ---
app.get('/api/analytics/recent', authenticateToken, async (req, res) => {
    try {
        if (!db) return res.status(503).json({ error: "Database not connected" });
        
        const recentLogs = await db.collection('regional_trends')
            .find({})
            .sort({ timestamp: -1 })
            .limit(5)
            .toArray();
            
        res.json({ recentLogs });
    } catch (err) {
        console.error("Recent analytics error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Serve the generated audio files publicly
app.use('/uploads', express.static(uploadDir));

app.listen(PORT, () => console.log(`SwasthyaMitra Engine running on port ${PORT}`));
