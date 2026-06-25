import React, { useState } from 'react';
import axios from 'axios';
import { Phone, Delete, Navigation } from 'lucide-react';

export default function USSDSimulator() {
  const [screenText, setScreenText] = useState("SwasthyaMitra USSD Gateway\nDial *454# to start");
  const [inputText, setInputText] = useState("");
  const [isDialed, setIsDialed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDial = () => {
    if (inputText === "*454#") {
      setIsDialed(true);
      setScreenText("Welcome to SwasthyaMitra.\nPlease type your health query below:");
      setInputText("");
    } else {
      setScreenText("Invalid MMI code.\nTry *454#");
      setInputText("");
    }
  };

  const handleSendQuery = async () => {
    if (!inputText.trim()) return;
    
    if (inputText === "1" && isDialed) {
      setIsDialed(false);
      setScreenText("SwasthyaMitra USSD Gateway\nDial *454# to start");
      setInputText("");
      return;
    }

    setLoading(true);
    setScreenText("Sending request...\nPlease wait.");
    
    try {
      const res = await axios.post('http://localhost:5000/api/ussd', {
        text: inputText,
        phoneNumber: "+919876543210",
        location: "USSD Rural Network"
      });
      
      setScreenText(res.data);
    } catch (err) {
      setScreenText("Network Error.\nPlease try again later.");
    } finally {
      setLoading(false);
      setInputText("");
    }
  };

  const appendNum = (num) => {
    if (inputText.length < 160) {
      setInputText(prev => prev + num);
    }
  };

  return (
    <div className="flex justify-center items-center py-8">
      {/* Phone Body */}
      <div className="w-[320px] bg-slate-800 rounded-[3rem] p-4 shadow-2xl border-4 border-slate-700 relative overflow-hidden flex flex-col items-center">
        
        {/* Speaker Grill */}
        <div className="w-16 h-2 bg-slate-900 rounded-full mb-6 mt-2"></div>
        
        {/* Screen */}
        <div className="w-[280px] h-[240px] bg-green-500 rounded-lg border-8 border-slate-900 p-3 shadow-inner flex flex-col justify-between overflow-hidden relative">
          
          {/* Retro Screen Glare */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>

          {/* Text Area */}
          <div className="flex-1 overflow-y-auto font-mono text-slate-900 text-sm whitespace-pre-wrap leading-tight tracking-tight">
            {screenText}
          </div>
          
          {/* Input Area */}
          <div className="mt-2 border-t-2 border-slate-900/20 pt-2 font-mono text-slate-900 text-sm flex items-center relative">
            <span className="animate-pulse mr-1">{'>'}</span>
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (!isDialed ? handleDial() : handleSendQuery())}
              className="bg-transparent outline-none w-full text-slate-900 font-mono text-sm placeholder-slate-900/30"
              placeholder={loading ? "..." : "Type here..."}
              autoFocus
            />
          </div>
        </div>

        {/* Brand Text */}
        <div className="text-slate-500 text-xs font-bold tracking-widest mt-4 mb-2 uppercase">NOKIA-MOCK</div>

        {/* Action Buttons */}
        <div className="w-full px-4 flex justify-between mb-4">
          <button 
            onClick={() => !isDialed ? handleDial() : handleSendQuery()}
            className="w-16 h-12 bg-slate-700 rounded-xl flex justify-center items-center active:bg-slate-600 shadow-md border-b-4 border-slate-900 hover:brightness-110 transition-all text-green-400"
          >
            <Phone className="w-5 h-5 fill-current" />
          </button>
          
          <button className="w-16 h-12 bg-slate-700 rounded-xl flex justify-center items-center active:bg-slate-600 shadow-md border-b-4 border-slate-900">
            <Navigation className="w-5 h-5 text-slate-400" />
          </button>

          <button 
            onClick={() => setInputText(prev => prev.slice(0, -1))}
            className="w-16 h-12 bg-slate-700 rounded-xl flex justify-center items-center active:bg-slate-600 shadow-md border-b-4 border-slate-900 hover:brightness-110 transition-all text-red-400"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Numpad */}
        <div className="w-full px-2 grid grid-cols-3 gap-3 mb-6">
          {[
            ['1', ''], ['2', 'ABC'], ['3', 'DEF'],
            ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'],
            ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'],
            ['*', ''], ['0', '+'], ['#', '']
          ].map(([num, letters]) => (
            <button 
              key={num}
              onClick={() => appendNum(num)}
              className="bg-slate-700 h-14 rounded-xl flex flex-col justify-center items-center active:bg-slate-600 active:translate-y-1 shadow-md border-b-4 border-slate-900 transition-all"
            >
              <span className="text-white font-bold text-lg leading-none">{num}</span>
              <span className="text-slate-400 text-[10px] leading-none mt-0.5">{letters}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
