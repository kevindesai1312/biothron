import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Search } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
const SURAT_CENTER = [21.1702, 72.8311];

// Mock data for symptom trend area chart to match mockup's smooth curves
const symptomTrendData = [
  { name: 'Jan', queries: 400, cases: 240 },
  { name: 'Feb', queries: 300, cases: 139 },
  { name: 'Mar', queries: 600, cases: 580 },
  { name: 'Apr', queries: 278, cases: 190 },
  { name: 'May', queries: 789, cases: 480 },
  { name: 'Jun', queries: 439, cases: 380 },
  { name: 'Jul', queries: 600, cases: 430 },
];

export default function AnalyticsDashboard({ token, onLogout }) {
  const [regionalConcernsData, setRegionalConcernsData] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [latestLogId, setLatestLogId] = useState(null);
  const [flashingId, setFlashingId] = useState(null);
  const [ashaFeed, setAshaFeed] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get('http://localhost:5000/api/analytics', config);
        setRegionalConcernsData(res.data.regionalConcernsData);

        const recentRes = await axios.get('http://localhost:5000/api/analytics/recent', config);
        const newLogs = recentRes.data.recentLogs;
        setRecentLogs(newLogs);

        const ashaRes = await axios.get('http://localhost:5000/api/admin/asha-feed', config);
        setAshaFeed(ashaRes.data.feed);
        
        if (newLogs.length > 0) {
          setLatestLogId((prev) => {
            if (prev !== newLogs[0]._id) {
               setFlashingId(newLogs[0]._id);
               setTimeout(() => setFlashingId(null), 4000); // Stop flashing after 4s
            }
            return newLogs[0]._id;
          });
        }
      } catch (err) {
        console.error("Failed to fetch analytics", err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          onLogout();
        }
      }
    };

    fetchAnalytics(); // Initial fetch
    const interval = setInterval(fetchAnalytics, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [token, onLogout]);

  const triggerBroadcast = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post('http://localhost:5000/api/admin/broadcast', {
        message: "Dengue spike detected in your area. Please eliminate standing water immediately.",
        region: "Surat"
      }, config);
      alert("Public Health Alert Broadcasted to Surat!");
    } catch(err) {
      console.error(err);
      alert("Failed to broadcast alert.");
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto space-y-6">
       
       {/* Header */}
       <div className="flex justify-between items-center mb-2">
         <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
         <div className="flex gap-4 items-center">
            <div className="relative">
               <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
               <input type="text" placeholder="Search..." className="pl-9 pr-4 py-2 rounded-full border border-gray-200 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm shadow-sm" />
            </div>
            <button 
              onClick={triggerBroadcast}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2 px-6 rounded-full shadow-md shadow-emerald-200 transition-all flex items-center gap-2"
            >
              Trigger Public Alert
            </button>
         </div>
       </div>

       {/* Bento Grid layout */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Map Card (Top Left - Spans 2 columns) */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 p-5 flex flex-col">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Localized analytics for Surat</h3>
            <div className="flex-1 min-h-[300px] rounded-xl overflow-hidden relative border border-gray-100">
               <MapContainer center={SURAT_CENTER} zoom={12} style={{ height: "100%", width: "100%", zIndex: 0 }} zoomControl={false}>
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; CARTO'
                  />
                  {/* Simulated Heatmap points */}
                  <CircleMarker center={[21.17, 72.83]} radius={45} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.5, stroke: false }} />
                  <CircleMarker center={[21.175, 72.82]} radius={25} pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.4, stroke: false }} />
                  <CircleMarker center={[21.16, 72.84]} radius={50} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.4, stroke: false }} />
                  <CircleMarker center={[21.18, 72.80]} radius={30} pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.4, stroke: false }} />
                  <CircleMarker center={[21.165, 72.825]} radius={35} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.6, stroke: false }} />
               </MapContainer>
               {/* Density Legend */}
               <div className="absolute right-4 top-4 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-sm border border-white/50 z-[10] text-[10px] font-bold text-gray-600 flex flex-col items-center">
                 <div className="mb-2">Density</div>
                 <div className="h-28 w-3 bg-gradient-to-b from-red-500 via-yellow-400 to-green-200 rounded-full"></div>
                 <div className="flex flex-col justify-between h-28 absolute top-[2.1rem] -right-5 pr-1">
                   <span>1000</span>
                   <span>500</span>
                   <span>0</span>
                 </div>
               </div>
            </div>
          </div>

          {/* Small Symptom Trend (Top Right) */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-4">Symptom Trend</h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={symptomTrendData}>
                    <defs>
                      <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="cases" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorCases)" />
                    <Area type="monotone" dataKey="queries" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorQueries)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex justify-between border-t border-emerald-500/10 pt-4 mt-2">
              <div>
                 <div className="text-xl font-bold text-gray-800">1.5K</div>
                 <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Disease Queries</div>
              </div>
              <div className="text-right">
                 <div className="text-xl font-bold text-gray-800">5,100</div>
                 <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Hospital Visits</div>
              </div>
            </div>
          </div>

          {/* Large Symptom Trend (Bottom Left - Spans 2 columns) */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 p-5 flex flex-col">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Overall Volume Trend</h3>
            <div className="h-48 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={symptomTrendData}>
                    <defs>
                      <linearGradient id="colorQueriesLarge" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCasesLarge" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                    <CartesianGrid vertical={false} stroke="#f3f4f6" />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="cases" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorCasesLarge)" />
                    <Area type="monotone" dataKey="queries" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorQueriesLarge)" />
                  </AreaChart>
                </ResponsiveContainer>
            </div>
          </div>

          {/* User Demographic (Bottom Right) */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 p-5 flex flex-col">
            <h3 className="text-sm font-bold text-gray-700 mb-2">User Demographic</h3>
            <div className="flex-1 flex items-center justify-center">
              <div className="w-1/2 h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={regionalConcernsData.length ? regionalConcernsData : [{name: 'Loading...', value: 1}]} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={4} dataKey="value" stroke="none">
                      {(regionalConcernsData.length ? regionalConcernsData : [{name: 'Loading...', value: 1}]).map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 flex flex-col justify-center gap-2.5 pl-4">
                {regionalConcernsData.slice(0, 4).map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[10px] font-bold text-gray-600">
                    <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    <span className="truncate">{entry.name}</span>
                  </div>
                ))}
                {regionalConcernsData.length === 0 && (
                   <div className="text-[10px] font-bold text-gray-400">Loading data...</div>
                )}
              </div>
            </div>
          </div>

       </div>

      {/* Live Data Tables (Restyled) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        {/* Tracking Matrix Panel */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            Live Tracking Matrix
          </h3>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 bg-gray-50/80 uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">Timestamp</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Inquiry</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log) => {
                  const isFlashing = log._id === flashingId;
                  const rowClass = isFlashing
                    ? "bg-red-50 transition-colors duration-300 border-b border-red-100"
                    : "bg-white/50 border-b border-gray-100 hover:bg-white transition-colors duration-500";
                  const textClass = isFlashing ? "text-red-700 font-medium animate-pulse" : "text-gray-600";

                  return (
                    <tr key={log._id} className={rowClass}>
                      <td className={`px-4 py-3 whitespace-nowrap text-xs ${textClass}`}>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className={`px-4 py-3 font-medium text-xs ${textClass}`}>
                        {log.location || "Unknown"}
                      </td>
                      <td className={`px-4 py-3 text-xs ${textClass}`}>
                        {log.disease || "General"}
                      </td>
                    </tr>
                  );
                })}
                {recentLogs.length === 0 && (
                  <tr>
                    <td colSpan="3" className="px-4 py-8 text-center text-gray-400 text-xs font-medium">No recent activity detected.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ASHA Worker Hand-off Feed */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 p-5">
          <h3 className="text-sm font-bold text-blue-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            ASHA Worker Live Triage
          </h3>
          <div className="overflow-x-auto rounded-xl border border-blue-100/50">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-blue-600 bg-blue-50/50 uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Patient Transcript</th>
                  <th className="px-4 py-3 font-semibold">Assigned ASHA</th>
                </tr>
              </thead>
              <tbody>
                {ashaFeed.map((log, idx) => (
                  <tr key={idx} className="bg-white/50 border-b border-gray-100 hover:bg-white">
                    <td className="px-4 py-3 font-medium text-xs text-gray-600">
                      {log.location || "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 italic max-w-[200px] truncate">
                      "{log.query}"
                    </td>
                    <td className="px-4 py-3 font-semibold text-xs text-blue-600">
                      {log.profile.name}
                    </td>
                  </tr>
                ))}
                {ashaFeed.length === 0 && (
                  <tr>
                    <td colSpan="3" className="px-4 py-8 text-center text-gray-400 text-xs font-medium">No triage hand-offs detected yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
