import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AdminLogin from './components/AdminLogin';
import USSDSimulator from './components/USSDSimulator';
import HealthSchemes from './components/HealthSchemes';
import Hospitals from './components/Hospitals';
import { LogOut } from 'lucide-react';

function App() {
  const [view, setView] = useState('chat');
  const [token, setToken] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
    setView('chat');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 p-6 space-y-6 relative">
      
      {token && (
        <button 
          onClick={handleLogout}
          className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm text-red-600 font-medium text-sm hover:bg-red-50 border border-red-100 transition-all z-20"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      )}

      <div className="flex justify-center gap-4 flex-wrap">
        <button 
          onClick={() => setView('chat')} 
          className={`px-4 py-2 rounded-lg font-medium text-sm transition shadow-sm ${view === 'chat' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
          Patient Mobile Interface
        </button>
        <button 
          onClick={() => setView('schemes')} 
          className={`px-4 py-2 rounded-lg font-medium text-sm transition shadow-sm ${view === 'schemes' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
          Health Schemes
        </button>
        <button 
          onClick={() => setView('hospitals')} 
          className={`px-4 py-2 rounded-lg font-medium text-sm transition shadow-sm ${view === 'hospitals' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
          Hospitals & Emergencies
        </button>
        <button 
          onClick={() => setView('ussd')} 
          className={`px-4 py-2 rounded-lg font-medium text-sm transition shadow-sm ${view === 'ussd' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
          Offline USSD Simulator
        </button>
        <button 
          onClick={() => setView('analytics')} 
          className={`px-4 py-2 rounded-lg font-medium text-sm transition shadow-sm ${view === 'analytics' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
          Admin Analytics Dashboard
        </button>
      </div>

      <div>
        {view === 'chat' && <ChatInterface />}
        {view === 'schemes' && <HealthSchemes />}
        {view === 'hospitals' && <Hospitals />}
        {view === 'ussd' && <USSDSimulator />}
        {view === 'analytics' && !token && <AdminLogin onLoginSuccess={setToken} />}
        {view === 'analytics' && token && <AnalyticsDashboard token={token} onLogout={handleLogout} />}
      </div>
    </div>
  );
}

export default App;
