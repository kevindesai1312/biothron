import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Globe, MapPin, ChevronDown, Bell } from 'lucide-react';
import axios from 'axios';

const Layout = ({ currentView, onViewChange, isAdmin, userData, children }) => {
  const isChat = currentView === 'chat';
  
  const [showLanguage, setShowLanguage] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [language, setLanguage] = useState('English');
  const [location, setLocation] = useState('Surat, Gujarat');
  const [notifications, setNotifications] = useState([]);
  
  const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');

  useEffect(() => {
    if (!token) return;
    
    // Fetch profile for language/location
    axios.get('http://localhost:5000/api/user/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
         if (res.data.profile.language) setLanguage(res.data.profile.language);
         if (res.data.profile.location) setLocation(res.data.profile.location);
      }).catch(err => console.error(err));

    // Fetch notifications
    axios.get('http://localhost:5000/api/user/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
         setNotifications(res.data.notifications || []);
      }).catch(err => console.error(err));
  }, [token]);

  const updateProfile = async (field, value) => {
     try {
        await axios.put('http://localhost:5000/api/user/profile', { [field]: value }, { headers: { Authorization: `Bearer ${token}` } });
     } catch (err) {
        console.error("Failed to update " + field);
     }
  };

  const handleLanguageChange = (lang) => {
     setLanguage(lang);
     setShowLanguage(false);
     updateProfile('language', lang);
  };

  const handleLocationChange = (loc) => {
     setLocation(loc);
     setShowLocation(false);
     updateProfile('location', loc);
  };

  const markAllAsRead = async () => {
     try {
        await axios.put('http://localhost:5000/api/user/notifications/read', {}, { headers: { Authorization: `Bearer ${token}` } });
        setNotifications(notifications.map(n => ({...n, read: true})));
     } catch (err) {
        console.error(err);
     }
  };

  const hasUnread = notifications.some(n => !n.read);

  const getPageTitle = () => {
    switch (currentView) {
      case 'schemes': return { title: 'Health Schemes', sub: 'Explore government health schemes and their benefits.' };
      case 'hospitals': return { title: 'Find Hospitals', sub: 'Search and find hospitals near you.' };
      case 'profile': return { title: 'My Profile', sub: 'Manage your personal information and preferences.' };
      case 'analytics': return { title: 'Admin Panel', sub: "Welcome back! Here's what's happening today." };
      case 'ussd': return { title: 'USSD Config', sub: 'Configure offline USSD channel settings.' };
      default: return null;
    }
  };

  const pageHeader = getPageTitle();

  return (
    <div className="flex h-screen overflow-hidden p-6 gap-6 relative">
      <Sidebar currentView={currentView} onViewChange={onViewChange} isAdmin={isAdmin} />

      <main className={`flex-1 h-full glass-card flex flex-col overflow-hidden`}>
        {/* Universal Top Header */}
        {pageHeader && (
          <header className="flex justify-between items-center px-8 py-6 border-b border-gray-100/50 bg-white/30 backdrop-blur-sm z-50 shrink-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{pageHeader.title}</h1>
              <p className="text-sm text-gray-500 mt-1">{pageHeader.sub}</p>
            </div>
            <div className="flex items-center gap-4 relative">
              
              {/* Language Dropdown */}
              <div className="relative">
                 <button onClick={() => { setShowLanguage(!showLanguage); setShowLocation(false); setShowNotifications(false); }} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
                   <Globe className="w-4 h-4 text-gray-500" /> {language} <ChevronDown className="w-4 h-4 text-gray-400" />
                 </button>
                 {showLanguage && (
                    <div className="absolute top-full mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 right-0">
                       {['English', 'Hindi', 'Gujarati'].map(lang => (
                          <button key={lang} onClick={() => handleLanguageChange(lang)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">
                             {lang}
                          </button>
                       ))}
                    </div>
                 )}
              </div>

              {/* Location Dropdown */}
              <div className="relative">
                 <button onClick={() => { setShowLocation(!showLocation); setShowLanguage(false); setShowNotifications(false); }} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
                   <MapPin className="w-4 h-4 text-teal-500" /> {location} <ChevronDown className="w-4 h-4 text-gray-400" />
                 </button>
                 {showLocation && (
                    <div className="absolute top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 right-0">
                       {['Surat, Gujarat', 'Ahmedabad, Gujarat', 'Mumbai, Maharashtra', 'Delhi, NCR'].map(loc => (
                          <button key={loc} onClick={() => handleLocationChange(loc)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-teal-600 transition-colors">
                             {loc}
                          </button>
                       ))}
                    </div>
                 )}
              </div>

              {/* Notifications */}
              <div className="relative">
                 <button onClick={() => { setShowNotifications(!showNotifications); setShowLanguage(false); setShowLocation(false); }} className="p-2.5 bg-white rounded-xl border border-gray-200 text-gray-500 shadow-sm relative hover:bg-gray-50 transition-colors">
                   <Bell className="w-5 h-5" />
                   {hasUnread && <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
                 </button>
                 {showNotifications && (
                    <div className="absolute top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 right-0 overflow-hidden flex flex-col max-h-96">
                       <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                          <h3 className="font-bold text-gray-900">Notifications</h3>
                          {hasUnread && <button onClick={markAllAsRead} className="text-xs font-bold text-blue-600 hover:text-blue-700">Mark all as read</button>}
                       </div>
                       <div className="overflow-y-auto flex-1 p-2">
                          {notifications.length === 0 ? (
                             <div className="text-center p-4 text-sm text-gray-500">No notifications yet.</div>
                          ) : notifications.map(notif => (
                             <div key={notif.id} className={`p-3 rounded-xl mb-1 flex items-start gap-3 transition-colors ${notif.read ? 'bg-white opacity-70' : 'bg-blue-50/50'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notif.read ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-600'}`}>
                                   <Bell className="w-4 h-4" />
                                </div>
                                <div>
                                   <p className={`text-sm ${notif.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>{notif.text}</p>
                                   <span className="text-[10px] text-gray-400 mt-1 block">{new Date(notif.date).toLocaleDateString()}</span>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}
              </div>

              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-md cursor-pointer ml-2 border-2 border-white ring-2 ring-gray-100">
                {userData?.name ? userData.name.charAt(0).toUpperCase() : (isAdmin ? 'A' : 'P')}
              </div>
            </div>
          </header>
        )}

        {/* Content Area */}
        <div className={`w-full mx-auto flex flex-col ${isChat ? 'h-full' : 'flex-1 overflow-y-auto p-8 relative z-0'}`}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
