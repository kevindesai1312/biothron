import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsDashboard({ token, onLogout }) {
  const [trendingIssuesData, setTrendingIssuesData] = useState([]);
  const [regionalConcernsData, setRegionalConcernsData] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [latestLogId, setLatestLogId] = useState(null);
  const [flashingId, setFlashingId] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get('http://localhost:5000/api/analytics', config);
        setTrendingIssuesData(res.data.trendingIssuesData);
        setRegionalConcernsData(res.data.regionalConcernsData);

        const recentRes = await axios.get('http://localhost:5000/api/analytics/recent', config);
        const newLogs = recentRes.data.recentLogs;
        setRecentLogs(newLogs);
        
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

  return (
    <div className="p-6 bg-gray-50 rounded-xl border max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Healthcare Analytics Dashboard</h2>
        <p className="text-sm text-gray-500">Real-time Public Health Concerns & Interaction Analytics</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Chart 1: Disease Awareness Queries */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Common Inquiries & Target Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendingIssuesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Demographics Distribution */}
        <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-col justify-between">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Regional Health Volume Split (%)</h3>
          <div className="h-48 flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={regionalConcernsData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {regionalConcernsData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs font-medium flex-wrap">
            {regionalConcernsData.map((entry, idx) => {
              const total = regionalConcernsData.reduce((sum, item) => sum + item.value, 0);
              const percentage = total > 0 ? Math.round((entry.value / total) * 100) : 0;
              return (
                <span key={idx} style={{ color: COLORS[idx % COLORS.length] }}>
                  ● {entry.name} ({percentage}%)
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tracking Matrix Panel */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          Live Tracking Matrix
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 bg-gray-50 uppercase border-b">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Disease Inquiry</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.map((log) => {
                const isFlashing = log._id === flashingId;
                const rowClass = isFlashing
                  ? "bg-red-50 transition-colors duration-300 border-b border-red-200"
                  : "bg-white border-b hover:bg-gray-50 transition-colors duration-500";
                const textClass = isFlashing ? "text-red-700 font-medium animate-pulse" : "text-gray-700";

                return (
                  <tr key={log._id} className={rowClass}>
                    <td className={`px-4 py-3 whitespace-nowrap ${textClass}`}>
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className={`px-4 py-3 font-medium ${textClass}`}>
                      {log.location || "Unknown"}
                    </td>
                    <td className={`px-4 py-3 ${textClass}`}>
                      {log.disease || "General"}
                    </td>
                  </tr>
                );
              })}
              {recentLogs.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-4 py-4 text-center text-gray-500 italic">No recent activity detected.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
