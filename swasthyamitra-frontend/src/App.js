import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AdminLogin from './components/AdminLogin';
import USSDSimulator from './components/USSDSimulator';
import HealthSchemes from './components/HealthSchemes';
import Hospitals from './components/Hospitals';
import Layout from './components/Layout';
import Settings from './components/Settings';
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
    <>
      {token && (
        <button 
          onClick={handleLogout}
          className="absolute top-8 right-12 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm text-red-600 font-medium text-sm hover:bg-red-50 border border-red-100 transition-all z-50"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      )}

      <Layout currentView={view} onViewChange={setView} isAdmin={!!token}>
        <div className="h-full flex flex-col">
          {view === 'chat' && <ChatInterface />}
          {view === 'schemes' && <HealthSchemes />}
          {view === 'hospitals' && <Hospitals />}
          {view === 'ussd' && <USSDSimulator />}
          {view === 'settings' && !token && <AdminLogin onLoginSuccess={setToken} />}
          {view === 'settings' && token && <Settings />}
          {view === 'analytics' && !token && <AdminLogin onLoginSuccess={setToken} />}
          {view === 'analytics' && token && <AnalyticsDashboard token={token} onLogout={handleLogout} />}
        </div>
      </Layout>
    </>
  );
}

export default App;
