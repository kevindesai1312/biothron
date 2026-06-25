import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Mic, Send, MapPin, Volume2, ShieldAlert, BookOpen, ChevronDown } from 'lucide-react';

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [locationText, setLocationText] = useState("Surat"); // Default test region
  const [isRecording, setIsRecording] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [abhaId, setAbhaId] = useState("");
  const [abhaLinked, setAbhaLinked] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationFrameRef = useRef(null);

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

  // Auto-play audio when new messages arrive
  useEffect(() => {
    if (autoPlayEnabled && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === 'bot' && lastMsg.audio) {
        new Audio(lastMsg.audio).play().catch(e => console.log("Auto-play blocked", e));
      }
    }
  }, [messages, autoPlayEnabled]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputText("");

    try {
      const res = await axios.post('http://localhost:5000/api/chat-text', {
        userQuery: text,
        locationText,
        abhaLinked
      });
      setMessages(prev => [...prev, { 
          sender: 'bot', 
          text: res.data.ai_response, 
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

        try {
          const res = await axios.post('http://localhost:5000/api/chat-voice', formData);
          setMessages(prev => [
            ...prev, 
            { sender: 'user', text: `🎤 Voice: "${res.data.user_query}"` },
            { 
                sender: 'bot', 
                text: res.data.ai_response, 
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
    <div className="flex flex-col h-[600px] w-full max-w-2xl bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 mx-auto overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 flex flex-col shadow-md z-10 space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-bold text-lg">SwasthyaMitra AI</h2>
            <p className="text-xs opacity-90">Your 24/7 Digital Health Buddy</p>
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
        {/* ABHA Link & Auto Play Controls */}
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-emerald-500/30">
          
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
            {/* Dev Mode Toggle */}
            <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium" title="Show Hallucination Defense Metric">
              <span className="opacity-90">Dev Mode</span>
              <div 
                className={`relative w-8 h-4 rounded-full transition-colors ${devMode ? 'bg-amber-500' : 'bg-gray-400'}`}
                onClick={() => setDevMode(!devMode)}
              >
                <div className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform ${devMode ? 'translate-x-4' : ''}`}></div>
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
      </div>

      {/* Proactive Broadcast Alert Banner */}
      {activeAlert && (
        <div className="bg-orange-500 text-white px-4 py-2 text-center text-sm shadow-md flex justify-center items-center gap-2 animate-pulse font-bold tracking-wide">
          <ShieldAlert className="w-5 h-5" />
          ⚠️ Alert from local health authorities: {activeAlert.message}
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-gray-50/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-fade-in-up`}>
            
            {/* Emergency Banner */}
            {msg.is_emergency && (
              <div className="mb-2 max-w-[90%] bg-red-600 text-white p-3 rounded-lg flex items-start gap-2 shadow-lg animate-pulse">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="font-bold text-sm tracking-wide">
                  🚨 Critical Situation Detected: Please visit the nearest primary health center immediately.
                </p>
              </div>
            )}

            {/* ASHA Hand-off Banner */}
            {msg.is_asha_handoff && msg.asha_profile && (
              <div className="mb-2 max-w-[90%] bg-blue-600 text-white p-3 rounded-lg flex flex-col items-start gap-2 shadow-lg animate-pulse">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="font-bold text-sm tracking-wide">
                    Connecting with your local ASHA worker...
                  </p>
                </div>
                <div className="bg-blue-700 w-full p-2 rounded text-xs border border-blue-500">
                  <p><strong>{msg.asha_profile.role}:</strong> {msg.asha_profile.name}</p>
                  <p><strong>Assigned Code:</strong> {msg.asha_profile.code}</p>
                  <p className="mt-1 opacity-90 text-[11px]">Your conversation transcript has been securely forwarded for immediate human intervention.</p>
                </div>
              </div>
            )}

            <div className={`p-4 rounded-2xl max-w-[85%] shadow-sm ${msg.sender === 'user' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-br-none' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'}`}>
              <p className="text-[15px] leading-relaxed whitespace-pre-line">{msg.text}</p>
              
              {/* Audio Controls */}
              {msg.audio && (
                <button onClick={() => new Audio(msg.audio).play()} className="mt-3 flex items-center text-xs text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full font-semibold gap-1 transition-colors">
                  <Volume2 className="w-4 h-4" /> Listen to Audio Response
                </button>
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

              {/* Dev Mode Metric Card (Hallucination Defense) */}
              {devMode && msg.sender === 'bot' && msg.confidence_score !== undefined && (
                <div className={`mt-3 p-2 rounded text-xs font-mono font-bold border flex flex-col gap-1 ${msg.confidence_score >= 0.70 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  <span>[Hallucination Defense]</span>
                  <span>Cosine Similarity Score: {msg.confidence_score.toFixed(4)}</span>
                  {msg.confidence_score < 0.70 && <span className="text-red-600">🚨 SYSTEM LOCKED: Boundary Enforced</span>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input Action Panel */}
      <div className="p-4 bg-white/80 backdrop-blur-md border-t flex items-center gap-3">
        <button 
          onClick={isRecording ? stopRecording : startRecording} 
          className={`p-3.5 rounded-full shadow-md transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-red-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-sm'}`}
        >
          <Mic className="w-5 h-5" />
        </button>
        <input
          type="text"
          placeholder="Ask a health question or use the microphone..."
          className="flex-1 bg-gray-50 border border-gray-200 p-3.5 rounded-full outline-none text-[15px] focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage(inputText)}
        />
        <button onClick={() => sendMessage(inputText)} className="p-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
