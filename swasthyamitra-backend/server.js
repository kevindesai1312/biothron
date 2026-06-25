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

// Promisify exec for async/await usage
const execPromise = util.promisify(exec);
const { findNearbyHospitals } = require('./locationService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB natively in Node.js
const mongoClient = new MongoClient(process.env.MONGO_URI || "mongodb://localhost:27017");
let db;
mongoClient.connect().then(async () => {
    db = mongoClient.db("SwasthyaMitra");
    console.log("Connected to MongoDB for Telemetry");

    // Seed Admin Securely
    const adminCollection = db.collection('admins');
    const existingAdmin = await adminCollection.findOne({ email: 'admin@gmail.com' });
    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await adminCollection.insertOne({ email: 'admin@gmail.com', password: hashedPassword });
        console.log("Default secure admin seeded.");
    }
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
const diseaseKeywords = ['Malaria', 'Dengue', 'Vaccination', 'TB', 'Fever', 'Diabetes', 'Cholera', 'Typhoid'];
async function logTelemetry(query, location) {
    if (!db) return;
    try {
        const lowerQuery = query.toLowerCase();
        let detectedDisease = 'General Inquiry';
        for (const disease of diseaseKeywords) {
            if (lowerQuery.includes(disease.toLowerCase())) {
                detectedDisease = disease;
                break;
            }
        }
        await db.collection('regional_trends').insertOne({
            disease: detectedDisease,
            location: location || "Unknown",
            timestamp: new Date()
        });
        console.log(`Telemetry logged: ${detectedDisease} in ${location}`);
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
            sources: parsed.sources,
            confidence_score: parsed.confidence_score
        };
    } catch (err) {
        console.error("Failed to execute python pipeline:", err);
        return {
            ai_response: "मुझे क्षमा करें, अभी हमारे सिस्टम में कुछ तकनीकी समस्या है। कृपया बाद में प्रयास करें। (System Error)",
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
            regionalConcernsData: formattedRegions.length > 0 ? formattedRegions : [{ name: 'No Data Yet', value: 0 }]
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
