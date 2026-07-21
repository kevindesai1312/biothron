import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Activity, ShieldCheck, Mail, Phone, Share2, Upload, BadgeAlert, History, Key, QrCode, X } from 'lucide-react';

export default function MyProfile({ userData }) {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
     dob: '', gender: '', bloodGroup: '', phone: '',
     chronicConditions: '', allergies: '', medications: '',
     emergencyContactName: '', emergencyContactPhone: ''
  });

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
      const res = await axios.get('http://localhost:5000/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data.profile);
      setFormData({
         dob: res.data.profile.dob || '',
         gender: res.data.profile.gender || '',
         bloodGroup: res.data.profile.bloodGroup || '',
         phone: res.data.profile.phone || '',
         chronicConditions: res.data.profile.chronicConditions || '',
         allergies: res.data.profile.allergies || '',
         medications: res.data.profile.medications || '',
         emergencyContactName: res.data.profile.emergencyContactName || '',
         emergencyContactPhone: res.data.profile.emergencyContactPhone || ''
      });
    } catch (err) {
      console.error("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
      await axios.put('http://localhost:5000/api/user/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsEditing(false);
      fetchProfile(); // Refresh data
    } catch (err) {
      console.error("Failed to update profile");
      alert("Failed to update profile");
    }
  };

  const profileComplete = profile?.dob && profile?.bloodGroup && profile?.phone ? 100 : (profile?.phone ? 75 : 50);

  // Helper to split comma separated strings into badges
  const renderBadges = (str, colorClass) => {
     if (!str) return <span className={`px-2.5 py-1 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-xs font-semibold`}>None provided</span>;
     return str.split(',').map((item, idx) => (
        <span key={idx} className={`px-2.5 py-1 ${colorClass} rounded-lg text-xs font-semibold mt-1`}>{item.trim()}</span>
     ));
  };

  if (loading) return <div className="h-full flex items-center justify-center text-gray-400">Loading Profile...</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full pb-8 relative">
      {/* Left Column */}
      <div className="w-full lg:w-[380px] shrink-0 space-y-6 flex flex-col h-full">
         
         {/* Profile Card */}
         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden shrink-0">
            <div className="h-24 bg-gradient-to-r from-blue-600 to-teal-500 relative">
               <button className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-colors">
                  <Share2 className="w-4 h-4" />
               </button>
            </div>
            <div className="px-6 pb-6 relative">
               <div className="w-24 h-24 bg-white rounded-full p-1.5 border border-gray-100 shadow-md absolute -top-12 left-6">
                  <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center relative overflow-hidden">
                     <span className="text-3xl font-bold text-blue-600">{profile?.name?.charAt(0) || userData?.name?.charAt(0) || 'U'}</span>
                  </div>
                  <button className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full border-2 border-white shadow-sm hover:bg-blue-700 transition-colors">
                     <Upload className="w-3 h-3" />
                  </button>
               </div>
               
               <div className="pt-14">
                  <div className="flex justify-between items-start mb-2">
                     <div>
                        <h2 className="text-xl font-bold text-gray-900">{profile?.name || userData?.name || 'User'}</h2>
                        <div className="flex items-center gap-1.5 text-xs text-blue-600 font-bold mt-1 bg-blue-50 w-fit px-2 py-0.5 rounded-md border border-blue-100">
                           <ShieldCheck className="w-3 h-3" /> ABHA ID: 91-0000-0000-0000
                        </div>
                     </div>
                     <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl border border-emerald-100">
                        <QrCode className="w-6 h-6" />
                     </div>
                  </div>
               </div>

               <div className="mt-6 flex justify-between divide-x divide-gray-100 border-t border-gray-100 pt-5 text-center">
                  <div className="flex-1">
                     <div className="text-lg font-bold text-gray-900">12</div>
                     <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Appointments</div>
                  </div>
                  <div className="flex-1">
                     <div className="text-lg font-bold text-gray-900">4</div>
                     <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Health Records</div>
                  </div>
                  <div className="flex-1">
                     <div className="text-lg font-bold text-gray-900">2</div>
                     <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Active Programs</div>
                  </div>
               </div>
            </div>
         </div>

         {/* Profile Completion */}
         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 shrink-0">
            <div className="flex justify-between items-end mb-3">
               <div>
                  <h3 className="font-bold text-gray-900 text-sm">Profile Completion</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">Complete your profile to unlock all features.</p>
               </div>
               <span className="font-bold text-blue-600 text-lg">{profileComplete}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
               <div className="bg-gradient-to-r from-blue-500 to-teal-400 h-2 rounded-full" style={{ width: `${profileComplete}%` }}></div>
            </div>
            <button onClick={() => setIsEditing(true)} className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition-colors">
               {profileComplete === 100 ? 'Update Profile' : 'Complete Now'}
            </button>
         </div>

         {/* Emergency Contacts */}
         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex-1 overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
               <h3 className="font-bold text-gray-900 text-sm">Emergency Contacts</h3>
               <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-blue-600 hover:text-blue-700">+ Add/Edit</button>
            </div>
            
            <div className="space-y-4">
               <div className="flex items-center justify-between p-3 border border-red-100 bg-red-50/50 rounded-xl">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600"><BadgeAlert className="w-5 h-5" /></div>
                     <div>
                        <div className="text-sm font-bold text-gray-900">National Emergency</div>
                        <div className="text-xs text-red-600 font-bold">112</div>
                     </div>
                  </div>
                  <button className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"><Phone className="w-4 h-4" /></button>
               </div>
               
               {profile?.emergencyContactName && profile?.emergencyContactPhone ? (
               <div className="flex items-center justify-between p-3 border border-blue-100 bg-blue-50/50 rounded-xl">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">{profile.emergencyContactName.charAt(0)}</div>
                     <div>
                        <div className="text-sm font-bold text-gray-900">{profile.emergencyContactName}</div>
                        <div className="text-xs text-gray-500 font-medium">{profile.emergencyContactPhone}</div>
                     </div>
                  </div>
                  <button className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"><Phone className="w-4 h-4" /></button>
               </div>
               ) : (
                  <div className="text-xs text-gray-400 text-center py-2">No personal emergency contact added.</div>
               )}
            </div>
         </div>
      </div>

      {/* Right Column - Forms & Details */}
      <div className="flex-1 flex flex-col space-y-6 h-full overflow-y-auto pr-2">
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Personal Information */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
               <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2"><User className="w-5 h-5 text-blue-500" /> Personal Information</h3>
                  <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-blue-600 hover:text-blue-700">Edit</button>
               </div>
               <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Full Name</label>
                        <div className="text-sm font-semibold text-gray-800">{profile?.name || userData?.name || 'Not Provided'}</div>
                     </div>
                     <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Date of Birth</label>
                        <div className="text-sm font-semibold text-gray-800">{profile?.dob || 'Not Provided'}</div>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Gender</label>
                        <div className="text-sm font-semibold text-gray-800">{profile?.gender || 'Not Provided'}</div>
                     </div>
                     <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Blood Group</label>
                        <div className="text-sm font-bold text-red-500">{profile?.bloodGroup || 'Unknown'}</div>
                     </div>
                  </div>
                  <div className="pt-2">
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Contact Information</label>
                     <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"><Phone className="w-4 h-4 text-gray-400" /> {profile?.phone || 'No phone added'}</div>
                     <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><Mail className="w-4 h-4 text-gray-400" /> {profile?.email || userData?.email || 'No email added'}</div>
                  </div>
               </div>
            </div>

            {/* Health Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
               <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-500" /> Health Summary</h3>
                  <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-blue-600 hover:text-blue-700">Update</button>
               </div>
               <div className="space-y-4">
                  <div>
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Chronic Conditions</label>
                     <div className="flex gap-2 flex-wrap">
                        {renderBadges(profile?.chronicConditions, 'bg-amber-50 text-amber-700 border-amber-100')}
                     </div>
                  </div>
                  <div>
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Allergies</label>
                     <div className="flex gap-2 flex-wrap">
                        {renderBadges(profile?.allergies, 'bg-red-50 text-red-600 border-red-100')}
                     </div>
                  </div>
                  <div>
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Current Medications</label>
                     <div className="text-sm font-medium text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        {profile?.medications || 'None specified'}
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Additional Settings & Connected Accounts */}
         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-6">
            <div className="p-6 border-b border-gray-100">
               <h3 className="font-bold text-gray-900">Connected Accounts & Security</h3>
               <p className="text-xs text-gray-500 mt-1">Manage your connected services and account security.</p>
            </div>
            
            <div className="divide-y divide-gray-100">
               <div className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><ShieldCheck className="w-5 h-5" /></div>
                     <div>
                        <div className="text-sm font-bold text-gray-900">ABHA Account (Ayushman Bharat)</div>
                        <div className="text-xs text-gray-500">Linked on 15 May 2024</div>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100">Active</span>
                     <button className="text-xs font-semibold text-gray-400 hover:text-red-500">Unlink</button>
                  </div>
               </div>
               
               <div className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600"><Key className="w-5 h-5" /></div>
                     <div>
                        <div className="text-sm font-bold text-gray-900">Password & Authentication</div>
                        <div className="text-xs text-gray-500">Last changed 3 months ago</div>
                     </div>
                  </div>
                  <button className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg transition-colors">
                     Change Password
                  </button>
               </div>
               
               <div className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600"><History className="w-5 h-5" /></div>
                     <div>
                        <div className="text-sm font-bold text-gray-900">Data & Privacy Settings</div>
                        <div className="text-xs text-gray-500">Manage how your health data is used</div>
                     </div>
                  </div>
                  <button className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg transition-colors">
                     Manage
                  </button>
               </div>
            </div>
         </div>

      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
         <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-full">
               <div className="p-5 border-b border-gray-100 flex justify-between items-center shrink-0">
                  <h3 className="font-bold text-gray-900">Edit Profile</h3>
                  <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600">
                     <X className="w-5 h-5" />
                  </button>
               </div>
               <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Date of Birth</label>
                        <input type="text" placeholder="e.g. 12 Oct 1995" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Gender</label>
                        <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500">
                           <option value="">Select</option>
                           <option value="Male">Male</option>
                           <option value="Female">Female</option>
                           <option value="Other">Other</option>
                        </select>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Blood Group</label>
                        <input type="text" placeholder="e.g. O+" value={formData.bloodGroup} onChange={e => setFormData({...formData, bloodGroup: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                        <input type="text" placeholder="+91 98765 43210" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                     </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                     <h4 className="text-sm font-bold text-gray-900 mb-3">Health Summary</h4>
                     <div className="space-y-4">
                        <div>
                           <label className="block text-xs font-bold text-gray-700 mb-1">Chronic Conditions (comma separated)</label>
                           <input type="text" placeholder="e.g. Mild Asthma, Diabetes" value={formData.chronicConditions} onChange={e => setFormData({...formData, chronicConditions: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-gray-700 mb-1">Allergies (comma separated)</label>
                           <input type="text" placeholder="e.g. Penicillin, Dust Mites" value={formData.allergies} onChange={e => setFormData({...formData, allergies: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-gray-700 mb-1">Current Medications</label>
                           <input type="text" placeholder="e.g. Albuterol Inhaler" value={formData.medications} onChange={e => setFormData({...formData, medications: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                        </div>
                     </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                     <h4 className="text-sm font-bold text-gray-900 mb-3">Emergency Contact</h4>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-bold text-gray-700 mb-1">Contact Name</label>
                           <input type="text" placeholder="e.g. Suresh Maheshwari" value={formData.emergencyContactName} onChange={e => setFormData({...formData, emergencyContactName: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-gray-700 mb-1">Contact Phone</label>
                           <input type="text" placeholder="+91 98765 43210" value={formData.emergencyContactPhone} onChange={e => setFormData({...formData, emergencyContactPhone: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                        </div>
                     </div>
                  </div>

               </form>
               <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-end gap-3">
                  <button onClick={() => setIsEditing(false)} className="px-5 py-2 font-bold text-gray-600 hover:bg-gray-200 rounded-xl text-sm transition-colors">Cancel</button>
                  <button onClick={handleSave} className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl text-sm transition-colors shadow-sm">Save Changes</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
