import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Mic, Send, Volume2, ShieldAlert, RefreshCcw, Minus, X, Check, Paperclip, Smile, Lock } from 'lucide-react';

import { handleOfflineSearch } from '../OfflineCache';




export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const locationText = "Surat"; // Default test region
  const [isRecording, setIsRecording] = useState(false);
  const autoPlayEnabled = true;
  const abhaLinked = false;
  const lowDataMode = false;
  const selectedLanguage = "English (English)";
  const isSlowModeActive = false;
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationFrameRef = useRef(null);




  const playAudioMsg = useCallback((msg) => {
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
  }, [isSlowModeActive, selectedLanguage]);

  // Auto-play audio when new messages arrive
  useEffect(() => {
    if (autoPlayEnabled && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === 'bot') {
        playAudioMsg(lastMsg);
      }
    }
  }, [messages, autoPlayEnabled, playAudioMsg]);

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
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto overflow-hidden bg-white shadow-2xl rounded-xl font-sans border border-gray-200/60">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#628df7] to-[#456de6] text-white px-6 py-4 flex items-start justify-between relative shadow-sm z-10">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-inner overflow-hidden border-2 border-white/20">
              <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Swasthya&backgroundColor=ffffff" alt="Bot Avatar" className="w-10 h-10 object-cover" />
            </div>
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full"></div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold tracking-wide">SwasthyaMitra AI</h2>
              <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-sm">AI Health Assistant</span>
            </div>
            <p className="text-sm text-blue-100 font-light mt-0.5">Your digital health buddy</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-blue-100 mt-2">
          <RefreshCcw className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
          <Minus className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
          <X className="w-6 h-6 cursor-pointer hover:text-white transition-colors" />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-[#F9F9FB] flex flex-col relative overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="text-center text-xs text-gray-400 font-medium my-2">Today, 10:30 AM</div>

          {messages.length === 0 && (
            <div className="flex items-start gap-3 animate-fade-in-up">
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0 border border-gray-100">
                <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Swasthya&backgroundColor=ffffff" alt="Bot Avatar" className="w-7 h-7" />
              </div>
              <div className="flex flex-col max-w-[75%]">
                <div className="bg-white border border-gray-100 text-gray-800 p-4 rounded-2xl rounded-tl-none shadow-sm text-[15px] leading-relaxed">
                  <p>Hello! 👋 I'm <strong>SwasthyaMitra AI</strong>, your health assistant.</p>
                  <p className="mt-2">How can I help you today?</p>
                </div>
                <span className="text-[10px] text-gray-400 mt-1 ml-1">10:30 AM</span>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
              {msg.sender === 'bot' && (
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0 border border-gray-100 mr-3 mt-1">
                  <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Swasthya&backgroundColor=ffffff" alt="Bot Avatar" className="w-7 h-7" />
                </div>
              )}
              
              <div className={`flex flex-col max-w-[75%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.is_emergency && (
                  <div className="mb-2 bg-red-100 border border-red-200 text-red-700 p-3 rounded-lg shadow-sm flex items-start gap-2">
                    <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="font-semibold text-sm">🚨 Critical Situation Detected: Please visit the nearest primary health center immediately.</p>
                  </div>
                )}

                <div className={`p-4 shadow-sm text-[15px] leading-relaxed ${msg.sender === 'user' ? 'bg-[#E4EBFE] text-[#1A2A4D] rounded-2xl rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-none'}`}>
                  <p className="whitespace-pre-line">{msg.text}</p>
                  
                  {msg.audio && (
                    <button onClick={() => playAudioMsg(msg)} className="mt-3 flex items-center text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full font-semibold gap-1 transition-colors">
                      <Volume2 className="w-4 h-4" /> Listen
                    </button>
                  )}
                </div>
                
                <span className="text-[10px] text-gray-400 mt-1 mx-1 flex items-center gap-1">
                  {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  {msg.sender === 'user' && <Check className="w-3 h-3 text-blue-400" />}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Chips removed by user request */}

        {/* Input Bar */}
        <div className="px-6 py-4 bg-white/80 backdrop-blur-md">
          <div className="flex items-center bg-white border border-gray-200 rounded-full p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              type="text"
              placeholder="Type your message..."
              className="flex-1 outline-none px-2 py-2 text-gray-700 bg-transparent text-[15px]"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(inputText)}
            />
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Smile className="w-5 h-5" />
            </button>
            <button 
              onClick={inputText.trim() ? () => sendMessage(inputText) : (isRecording ? stopRecording : startRecording)} 
              className={`p-3 rounded-full text-white shadow-md transition-transform hover:scale-105 active:scale-95 ml-1 ${inputText.trim() ? 'bg-[#2962FF]' : (isRecording ? 'bg-red-500 animate-pulse' : 'bg-[#2962FF]')}`}
            >
              {inputText.trim() ? <Send className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {/* Footer */}
        <div className="py-2 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5 bg-[#F9F9FB]">
          <Lock className="w-3.5 h-3.5" /> Your conversations are secure and private.
        </div>
      </div>
    </div>
  );
}
