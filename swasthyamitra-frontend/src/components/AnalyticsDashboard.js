import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Building2, Calendar, AlertCircle, PhoneCall, CheckCircle2, AlertTriangle, FileText, Download, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function AnalyticsDashboard({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock timeline data for User Growth
  const userGrowthData = [
    { name: 'Jan', users: 80000 }, { name: 'Feb', users: 95000 },
    { name: 'Mar', users: 105000 }, { name: 'Apr', users: 115000 },
    { name: 'May', users: 124850 }
  ];

  const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#9CA3AF'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/analytics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (err) {
        console.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  if (loading || !data?.stats) {
    return <div className="flex justify-center items-center h-full text-gray-500">Loading Dashboard Data...</div>;
  }

  const { stats, roleDistribution, recentAppointments, topHospitals, systemAlerts } = data;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full pb-8">
      
      {/* Left Main Content */}
      <div className="flex-1 flex flex-col space-y-6 overflow-y-auto pr-2">
        
        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><Users className="w-5 h-5" /></div>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md"><TrendingUp className="w-3 h-3" /> +12%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-2">{stats.totalUsers}</div>
            <div className="text-xs font-semibold text-gray-500 mt-1">Total Users</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600"><Building2 className="w-5 h-5" /></div>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md"><TrendingUp className="w-3 h-3" /> +5%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-2">{stats.registeredHospitals}</div>
            <div className="text-xs font-semibold text-gray-500 mt-1">Registered Hospitals</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600"><Calendar className="w-5 h-5" /></div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-2">{stats.appointments}</div>
            <div className="text-xs font-semibold text-gray-500 mt-1">Appointments</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600"><PhoneCall className="w-5 h-5" /></div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-2">{stats.emergencyRequests}</div>
            <div className="text-xs font-semibold text-gray-500 mt-1">Emergency Requests</div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 shrink-0 h-80">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col h-full">
            <h3 className="font-bold text-gray-900 mb-4 shrink-0">User Growth Overview</h3>
            <div className="flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2, fill: 'white' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col h-full">
            <h3 className="font-bold text-gray-900 mb-4 shrink-0">Users by Role</h3>
            <div className="flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#6b7280' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Appointments Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden shrink-0">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-bold text-gray-900">Recent Appointments</h3>
            <button className="text-xs font-bold text-blue-600 hover:text-blue-700">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-100">
                  <th className="py-3 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Patient Name</th>
                  <th className="py-3 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="py-3 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Doctor / Hospital</th>
                  <th className="py-3 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date & Time</th>
                  <th className="py-3 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentAppointments.map(app => (
                  <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-bold text-gray-800">{app.user}</td>
                    <td className="py-3.5 px-5 text-sm text-gray-500 font-medium">{app.type}</td>
                    <td className="py-3.5 px-5 text-sm text-gray-600 font-medium">{app.doctor}</td>
                    <td className="py-3.5 px-5 text-sm text-gray-500">{app.date}</td>
                    <td className="py-3.5 px-5 text-right">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md ${app.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : (app.status === 'Pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100')}`}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Right Sidebar */}
      <div className="w-full lg:w-80 shrink-0 space-y-6 flex flex-col h-full overflow-y-auto">
        
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 text-sm">System Alerts</h3>
          <div className="space-y-3">
            {systemAlerts.map((alert, idx) => (
              <div key={idx} className={`p-3.5 rounded-xl border flex items-start gap-3 ${alert.type==='error'?'bg-red-50 border-red-100':(alert.type==='warning'?'bg-amber-50 border-amber-100':'bg-blue-50 border-blue-100')}`}>
                 <div className="shrink-0 mt-0.5">
                   {alert.type === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                   {alert.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                   {alert.type === 'info' && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                 </div>
                 <div>
                   <p className={`text-xs font-bold leading-tight mb-1 ${alert.type==='error'?'text-red-800':(alert.type==='warning'?'text-amber-800':'text-blue-800')}`}>{alert.message}</p>
                   <p className="text-[10px] font-medium opacity-70">{alert.time}</p>
                 </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900 text-sm">Top Hospitals</h3>
            <button className="text-[10px] font-bold text-blue-600">See All</button>
          </div>
          <div className="space-y-4">
            {topHospitals.map((hosp, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">{hosp.name}</p>
                  <p className="text-[10px] text-gray-500 truncate">{hosp.location}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-gray-900">{hosp.appointments}</p>
                  <p className="text-[9px] text-gray-400 font-medium uppercase">Appts</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 shadow-sm">
           <h3 className="font-bold text-gray-900 text-sm mb-4">Quick Actions</h3>
           <div className="space-y-2.5">
             <button className="w-full bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all text-gray-700 p-3 rounded-xl flex items-center gap-3 text-xs font-bold shadow-sm">
                <FileText className="w-4 h-4" /> Generate Report
             </button>
             <button className="w-full bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all text-gray-700 p-3 rounded-xl flex items-center gap-3 text-xs font-bold shadow-sm">
                <Download className="w-4 h-4" /> Export Data (CSV)
             </button>
             <button className="w-full bg-blue-600 hover:bg-blue-700 transition-all text-white p-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold shadow-sm mt-2">
                Manage Broadcasts
             </button>
           </div>
        </div>

      </div>
    </div>
  );
}
