import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AdminLogin from './components/AdminLogin';
import USSDSimulator from './components/USSDSimulator';
import UserLogin from './components/UserLogin';
import HealthSchemes from './components/HealthSchemes';
import Hospitals from './components/Hospitals';
import Layout from './components/Layout';
import Settings from './components/Settings'; // Will be renamed to MyProfile
import { LogOut } from 'lucide-react';

function App() {
  const [view, setView] = useState('chat');
  const [adminToken, setAdminToken] = useState(null);
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const savedAdminToken = localStorage.getItem('adminToken');
    if (savedAdminToken) setAdminToken(savedAdminToken);

    const savedUserToken = localStorage.getItem('userToken');
    const savedUserData = localStorage.getItem('userData');
    if (savedUserToken && savedUserData) {
      setUserToken(savedUserToken);
      setUserData(JSON.parse(savedUserData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    setAdminToken(null);
    setUserToken(null);
    setUserData(null);
    setView('chat');
  };

  return (
    <>
      {(adminToken || userToken) && (
        <button 
          onClick={handleLogout}
          className="absolute top-8 right-12 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm text-red-600 font-medium text-sm hover:bg-red-50 border border-red-100 transition-all z-50"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      )}

      {/* Render Login for Guests on restricted views */}
      {!adminToken && !userToken && view === 'profile' && (
        <Layout currentView={view} onViewChange={setView} isAdmin={false}>
            <UserLogin onLoginSuccess={(token, user) => { 
                setUserToken(token); 
                setUserData(user); 
                if (user.role === 'admin') {
                    setAdminToken(token);
                    localStorage.setItem('adminToken', token);
                }
            }} />
        </Layout>
      )}

      {(!adminToken && view === 'analytics') && (
        <Layout currentView={view} onViewChange={setView} isAdmin={false}>
            <AdminLogin onLoginSuccess={setAdminToken} />
        </Layout>
      )}

      {/* Render Application */}
      {((userToken || view !== 'profile') && (adminToken || view !== 'analytics')) && (
        <Layout currentView={view} onViewChange={setView} isAdmin={!!adminToken} userData={userData}>
          <div className="h-full flex flex-col">
            {view === 'chat' && <ChatInterface />}
            {view === 'schemes' && <HealthSchemes />}
            {view === 'hospitals' && <Hospitals />}
            {view === 'ussd' && <USSDSimulator />}
            {view === 'profile' && userToken && <Settings userData={userData} userToken={userToken} />}
            {view === 'analytics' && adminToken && <AnalyticsDashboard token={adminToken} onLogout={handleLogout} />}
          </div>
        </Layout>
      )}
    </>
  );
}

export default App;
