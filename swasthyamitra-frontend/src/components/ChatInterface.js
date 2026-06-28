import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Mic, Send, MapPin, Volume2, ShieldAlert, BookOpen, ChevronDown, Globe, Share2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { handleOfflineSearch } from '../OfflineCache';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});


export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [locationText, setLocationText] = useState("Surat"); // Default test region
  const [isRecording, setIsRecording] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [abhaId, setAbhaId] = useState("");
  const [abhaLinked, setAbhaLinked] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [lowDataMode, setLowDataMode] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("English (English)");
  const [activeTab, setActiveTab] = useState("Chat");
  const [isSlowModeActive, setIsSlowModeActive] = useState(false);
  const [mapCenter, setMapCenter] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationFrameRef = useRef(null);

  const shareToWhatsApp = (aiMessageText) => {
    const encodedText = encodeURIComponent(`*SwasthyaMitra Health Summary:* \n\n${aiMessageText}`);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
  };

  // Poll for Active Broadcast Alerts
  useEffect(() => {
    const fetchAlert = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/alerts/active');
        if (res.data.activeBroadcast && res.data.activeBroadcast.region.toLowerCase() === locationText.toLowerCase()) {
          setActiveAlert(res.data.activeBroadcast);
        } else {
          setActiveAlert(null);
        }
      } catch(e) {}
    };
    fetchAlert();
    const interval = setInterval(fetchAlert, 5000);
    return () => clearInterval(interval);
  }, [locationText]);

  useEffect(() => {
    if (activeTab === "Hospitals") {
      axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationText)}&format=json&limit=1`)
        .then(res => {
          if (res.data && res.data.length > 0) {
            setMapCenter([parseFloat(res.data[0].lat), parseFloat(res.data[0].lon)]);
          }
        })
        .catch(err => console.error(err));
    }
  }, [activeTab, locationText]);

  const playAudioMsg = (msg) => {
    if (isSlowModeActive || !msg.audio) {
      if (msg.text) {
        const utterance = new SpeechSynthesisUtterance(msg.text);
        utterance.lang = selectedLanguage.includes('Hindi') ? 'hi-IN' : 'en-US';
        utterance.rate = isSlowModeActive ? 0.65 : 0.9;
        window.speechSynthesis.speak(utterance);
      }
    } else if (msg.audio) {
      new Audio(msg.audio).play().catch(e => console.log("Audio playback blocked", e));
    }
  };

  // Auto-play audio when new messages arrive
  useEffect(() => {
    if (autoPlayEnabled && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === 'bot') {
        playAudioMsg(lastMsg);
      }
    }
  }, [messages, autoPlayEnabled, isSlowModeActive]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputText("");

    // --- CLIENT-SIDE OFFLINE EMERGENCY "PANIC BUTTON" CACHE ---
    const offlineMatch = handleOfflineSearch(text);
    if (offlineMatch) {
      setMessages(prev => [...prev, { 
          sender: 'bot', 
          text: offlineMatch.data, 
          is_emergency: false,
          is_asha_handoff: false,
          sources: ["Local Resiliency Mode (IndexedDB)"],
          confidence_score: 1.0
      }]);
      return; // Do not attempt network request
    }
    // ----------------------------------------------------------

    try {
      const languageInstruction = `[Please respond strictly in ${selectedLanguage}] `;
      const res = await axios.post('http://localhost:5000/api/chat-text', {
        userQuery: languageInstruction + text,
        locationText,
        abhaLinked,
        lowDataMode
      });
      const uiState = res.data.ui_state;
      if (uiState && uiState.active_tab_fallback) {
        setActiveTab(uiState.active_tab_fallback);
      }
      setMessages(prev => [...prev, { 
          sender: 'bot', 
          text: res.data.ai_response, 
          ui_state: uiState,
          is_emergency: res.data.is_emergency,
          is_asha_handoff: res.data.is_asha_handoff,
          asha_profile: res.data.asha_profile,
          sources: res.data.sources,
          confidence_score: res.data.confidence_score
      }]);
    } catch (err) {
      console.error(err);
    }
  };

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup Web Audio API for Silence Detection
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      
      mediaRecorderRef.current.onstop = async () => {
        // Cleanup Audio API
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('audio', audioBlob);
        if (locationText) {
            formData.append('location', locationText);
        }
        if (abhaLinked) {
            formData.append('abhaLinked', 'true');
        }
        if (lowDataMode) {
            formData.append('lowDataMode', 'true');
        }
        formData.append('selectedLanguage', selectedLanguage);

        try {
          const res = await axios.post('http://localhost:5000/api/chat-voice', formData);
          const uiState = res.data.ui_state;
          if (uiState && uiState.active_tab_fallback) {
            setActiveTab(uiState.active_tab_fallback);
          }
          setMessages(prev => [
            ...prev, 
            { sender: 'user', text: `🎤 Voice: "${res.data.user_query}"` },
            { 
                sender: 'bot', 
                text: res.data.ai_response, 
                ui_state: uiState,
                audio: res.data.audio_url,
                is_emergency: res.data.is_emergency,
                is_asha_handoff: res.data.is_asha_handoff,
                asha_profile: res.data.asha_profile,
                sources: res.data.sources,
                confidence_score: res.data.confidence_score
            }
          ]);
        } catch (err) {
          console.error("Voice pipeline error", err);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      // Silence Detection Loop
      let silenceStart = Date.now();
      const checkSilence = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const sum = dataArrayRef.current.reduce((a, b) => a + b, 0);
        const average = sum / dataArrayRef.current.length;
        
        // Threshold: 10 is very quiet, meaning user stopped talking
        if (average > 10) {
          silenceStart = Date.now(); // Reset timer if speaking
        } else {
          // If silent for 2000ms (2 seconds)
          if (Date.now() - silenceStart > 2000) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              mediaRecorderRef.current.stop();
              return; // Stop the loop
            }
          }
        }
        animationFrameRef.current = requestAnimationFrame(checkSilence);
      };
      
      checkSilence();

    } catch (err) {
      console.error("Mic access denied or failed", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div className={`flex flex-col h-[600px] w-full max-w-2xl mx-auto overflow-hidden ${lowDataMode ? 'bg-white border-4 border-black' : 'bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50'}`}>
      {/* Header */}
      <div className={`${lowDataMode ? 'bg-black text-white p-2 border-b-4 border-black' : 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 shadow-md'} flex flex-col z-10 space-y-3`}>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-bold text-lg">SwasthyaMitra AI</h2>
            <p className="text-xs opacity-90">Your 24/7 Digital Health Buddy</p>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center text-xs bg-emerald-700 px-2 py-1 rounded cursor-pointer hover:bg-emerald-800 transition">
              <Globe className="w-3 h-3 mr-1" />
              <select 
                className="bg-transparent outline-none text-white font-medium appearance-none cursor-pointer"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
              >
                <option value="English (English)" className="text-black">English (English)</option>
                <option value="Hindi (हिंदी)" className="text-black">Hindi (हिंदी)</option>
                <option value="Bengali (বাংলা)" className="text-black">Bengali (বাংলা)</option>
                <option value="Telugu (తెలుగు)" className="text-black">Telugu (తెలుగు)</option>
                <option value="Tamil (தமிழ்)" className="text-black">Tamil (தமிழ்)</option>
                <option value="Marathi (मराठी)" className="text-black">Marathi (मराठी)</option>
                <option value="Gujarati (ગુજરાતી)" className="text-black">Gujarati (ગુજરાતી)</option>
              </select>
            </div>
            <div className="flex items-center text-xs bg-emerald-700 px-2 py-1 rounded">
              <MapPin className="w-3 h-3 mr-1" />
              <input 
                className="bg-transparent outline-none w-16 text-white font-medium"
                value={locationText} 
                onChange={(e) => setLocationText(e.target.value)} 
              />
            </div>
          </div>
        </div>
        {/* ABHA Link & Auto Play Controls */}
        <div className={`flex justify-between items-center mt-2 pt-2 ${lowDataMode ? 'border-t border-gray-600' : 'border-t border-emerald-500/30'}`}>
          
          {/* ABHA Mock UI */}
          <div className="flex items-center gap-2">
            {!abhaLinked ? (
              <div className="flex items-center bg-white/10 rounded overflow-hidden p-0.5">
                <input 
                  type="text" 
                  placeholder="ABHA ID (e.g. 91-XXXX...)"
                  className="bg-transparent text-white text-xs px-2 outline-none w-36 placeholder:text-emerald-200/60"
                  value={abhaId}
                  onChange={(e) => setAbhaId(e.target.value)}
                />
                <button 
                  onClick={() => { if(abhaId.trim()) setAbhaLinked(true); }}
                  className="bg-white text-emerald-700 text-xs font-bold px-2 py-1 rounded hover:bg-emerald-50 transition-colors"
                >
                  Link
                </button>
              </div>
            ) : (
              <div className="flex items-center text-xs font-medium text-emerald-900 bg-emerald-300 px-2 py-1 rounded-full shadow-inner border border-emerald-400">
                ✓ ABHA Linked ({abhaId})
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium" title="Show Hallucination Defense Metric">
              <span className="opacity-90">Dev Mode</span>
              <div 
                className={`relative w-8 h-4 rounded-full transition-colors ${devMode ? 'bg-amber-500' : 'bg-gray-400'}`}
                onClick={() => setDevMode(!devMode)}
              >
                <div className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform ${devMode ? 'translate-x-4' : ''}`}></div>
              </div>
            </label>

            {/* Low Data Mode Toggle */}
            <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium" title="Strip UI for 2G Networks">
              <span className="opacity-90">Low Data Mode</span>
              <div 
                className={`relative w-8 h-4 rounded-full transition-colors ${lowDataMode ? 'bg-blue-500' : 'bg-gray-400'}`}
                onClick={() => setLowDataMode(!lowDataMode)}
              >
                <div className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform ${lowDataMode ? 'translate-x-4' : ''}`}></div>
              </div>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium" title="Slow Down Voice for Accessibility">
              <span className="opacity-90">🐢 धीमी आवाज़</span>
              <div 
                className={`relative w-8 h-4 rounded-full transition-colors ${isSlowModeActive ? 'bg-emerald-400' : 'bg-gray-400'}`}
                onClick={() => setIsSlowModeActive(!isSlowModeActive)}
              >
                <div className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform ${isSlowModeActive ? 'translate-x-4' : ''}`}></div>
              </div>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium">
              <span className="opacity-90">Auto-Play Responses</span>
              <div 
                className={`relative w-8 h-4 rounded-full transition-colors ${autoPlayEnabled ? 'bg-emerald-400' : 'bg-gray-400'}`}
                onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
              >
                <div className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform ${autoPlayEnabled ? 'translate-x-4' : ''}`}></div>
              </div>
            </label>
          </div>
        </div>
        {/* Dynamic Tabs */}
        <div className="flex gap-4 border-t border-emerald-500/30 pt-2 mt-2 overflow-x-auto text-sm font-semibold">
          {["Chat", "Symptoms", "Disease Info", "Schemes"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`${activeTab === tab ? 'text-white border-b-2 border-white' : 'text-emerald-100/70 hover:text-white'} pb-1 px-1 whitespace-nowrap transition-colors`}>{tab}</button>
          ))}
        </div>
      </div>

      {/* Proactive Broadcast Alert Banner */}
      {activeAlert && (
        <div className={`${lowDataMode ? 'bg-black text-white font-bold p-2 text-center uppercase border-b-2 border-white' : 'bg-orange-500 text-white px-4 py-2 text-center text-sm shadow-md flex justify-center items-center gap-2 animate-pulse font-bold tracking-wide'}`}>
          {!lowDataMode && <ShieldAlert className="w-5 h-5" />}
          ⚠️ Alert from local health authorities: {activeAlert.message}
        </div>
      )}

      {/* Dynamic Tab Area */}
      {activeTab === "Hospitals" ? (
        <div className="flex-1 p-0 flex flex-col bg-gray-50/50 relative overflow-hidden" style={{ zIndex: 0 }}>
          {mapCenter ? (
            <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }} className="z-0">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={mapCenter}>
                <Popup>
                  Estimated center of {locationText}. <br />
                  (Nearby clinics highlighted)
                </Popup>
              </Marker>
            </MapContainer>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-5">
              <MapPin className="w-16 h-16 text-emerald-500 mb-4 animate-bounce" />
              <h3 className="text-xl font-bold text-gray-700">Nearby Hospitals Map View</h3>
              <p className="text-sm text-gray-500 mt-2">OpenStreetMap integration loading for {locationText}...</p>
            </div>
          )}
        </div>
      ) : activeTab !== "Chat" ? (
        <div className="flex-1 p-5 flex flex-col items-center justify-center bg-gray-50/50">
          <h3 className="text-xl font-bold text-gray-700">{activeTab} View</h3>
          <p className="text-sm text-gray-500 mt-2">Content for {activeTab} will appear here.</p>
        </div>
      ) : (
        <div className={`flex-1 p-5 overflow-y-auto space-y-4 ${lowDataMode ? 'bg-white' : 'bg-gray-50/50'}`}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} ${lowDataMode ? '' : 'animate-fade-in-up'}`}>
            
            {/* Emergency Banner */}
            {msg.is_emergency && (
              <div className={`mb-2 max-w-[90%] ${lowDataMode ? 'bg-black text-white font-bold p-2' : 'bg-red-600 text-white p-3 rounded-lg shadow-lg animate-pulse'} flex items-start gap-2`}>
                {!lowDataMode && <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                <p className={`${lowDataMode ? 'text-xs' : 'font-bold text-sm tracking-wide'}`}>
                  🚨 Critical Situation Detected: Please visit the nearest primary health center immediately.
                </p>
              </div>
            )}

            {/* ASHA Hand-off Banner */}
            {msg.is_asha_handoff && msg.asha_profile && (
              <div className={`mb-2 max-w-[90%] flex flex-col items-start gap-2 ${lowDataMode ? 'bg-white text-black border-2 border-black p-2 font-bold' : 'bg-blue-600 text-white p-3 rounded-lg shadow-lg animate-pulse'}`}>
                <div className="flex items-center gap-2">
                  {!lowDataMode && <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                  <p className={`${lowDataMode ? 'text-xs' : 'font-bold text-sm tracking-wide'}`}>
                    Connecting with your local ASHA worker...
                  </p>
                </div>
                <div className={`${lowDataMode ? 'border border-black p-1 text-xs' : 'bg-blue-700 w-full p-2 rounded text-xs border border-blue-500'}`}>
                  <p><strong>{msg.asha_profile.role}:</strong> {msg.asha_profile.name}</p>
                  <p><strong>Assigned Code:</strong> {msg.asha_profile.code}</p>
                  {!lowDataMode && <p className="mt-1 opacity-90 text-[11px]">Your conversation transcript has been securely forwarded for immediate human intervention.</p>}
                </div>
              </div>
            )}

            <div className={`${lowDataMode ? 'p-2 max-w-[90%] border-2 border-black text-black' : 'p-4 rounded-2xl max-w-[85%] shadow-sm'} ${!lowDataMode ? (msg.sender === 'user' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-br-none' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none') : ''}`}>
              <p className="text-[15px] leading-relaxed whitespace-pre-line">{msg.text}</p>
              
              {/* Audio Controls */}
              {(msg.audio || msg.sender === 'bot') && (
                <button onClick={() => playAudioMsg(msg)} className="mt-3 flex items-center text-xs text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full font-semibold gap-1 transition-colors">
                  <Volume2 className="w-4 h-4" /> Listen to Audio Response
                </button>
              )}

              {/* Suggested Action Chips */}
              {msg.ui_state?.suggested_chips && msg.ui_state.suggested_chips.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {msg.ui_state.suggested_chips.map((chip, chipIdx) => (
                    <button 
                      key={chipIdx} 
                      onClick={() => { setInputText(chip); sendMessage(chip); }} 
                      className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-full shadow-sm hover:bg-emerald-200 hover:scale-105 font-bold transition-all"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}

              {/* Verified Sources Dropdown */}
              {msg.sources && msg.sources.length > 0 && (
                <details className="mt-3 group">
                  <summary className="flex items-center text-xs font-semibold text-gray-500 cursor-pointer hover:text-emerald-600 transition-colors list-none">
                    <BookOpen className="w-3.5 h-3.5 mr-1" />
                    Verified Sources Used
                    <ChevronDown className="w-3 h-3 ml-1 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-2 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-2 space-y-1">
                    {msg.sources.map((src, i) => (
                      <div key={i} className="flex justify-between border-b border-gray-100 last:border-0 pb-1 last:pb-0">
                        <span className="font-medium text-emerald-700">{src.topic || 'Medical Guide'}</span>
                        <span className="opacity-70 text-right">{src.source || 'Verified Source'}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Share to WhatsApp Button */}
              {msg.sender === 'bot' && (
                <button 
                  onClick={() => shareToWhatsApp(msg.text)} 
                  className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 font-bold text-sm rounded-lg transition-colors shadow-sm ${lowDataMode ? 'bg-black text-white border-2 border-white' : 'bg-[#25D366] hover:bg-[#20b858] text-white border border-[#1DA851]'}`}
                >
                  <Share2 className="w-4 h-4" />
                  Share with ASHA / Family
                </button>
              )}

              {/* Dev Mode Metric Card (Hallucination Defense) */}
              {devMode && msg.sender === 'bot' && msg.confidence_score !== undefined && (
                <div className={`mt-3 p-2 rounded text-xs font-mono font-bold border flex flex-col gap-1 ${msg.confidence_score >= 0.50 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  <span>[Hallucination Defense]</span>
                  <span>Cosine Similarity Score: {msg.confidence_score.toFixed(4)}</span>
                  {msg.confidence_score < 0.50 && <span className="text-red-600">🚨 SYSTEM LOCKED: Boundary Enforced</span>}
                </div>
              )}
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Input Action Panel */}
      <div className={`${lowDataMode ? 'p-2 bg-white border-t-4 border-black' : 'p-4 bg-white/80 backdrop-blur-md border-t'} flex items-center gap-3`}>
        <button 
          onClick={isRecording ? stopRecording : startRecording} 
          className={lowDataMode 
            ? `p-2 font-bold border-2 border-black ${isRecording ? 'bg-black text-white' : 'bg-white text-black'}` 
            : `p-3.5 rounded-full shadow-md transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-red-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-sm'}`}
        >
          {lowDataMode ? (isRecording ? 'STOP' : 'MIC') : <Mic className="w-5 h-5" />}
        </button>
        <input
          type="text"
          placeholder="Ask a health question..."
          className={`flex-1 outline-none transition-all ${lowDataMode ? 'border-2 border-black p-2 bg-white text-black placeholder:text-gray-500' : 'bg-gray-50 border border-gray-200 p-3.5 rounded-full text-[15px] focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'}`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage(inputText)}
        />
        <button 
          onClick={() => sendMessage(inputText)} 
          className={lowDataMode
            ? `p-2 border-2 border-black bg-black text-white font-bold`
            : `p-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all`}
        >
          {lowDataMode ? 'SEND' : <Send className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
