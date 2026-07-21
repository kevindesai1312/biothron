import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Info, Shield, Users, IndianRupee, Sparkles, Filter } from 'lucide-react';

export default function HealthSchemes() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All Schemes');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  
  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/schemes');
        setSchemes(res.data.schemes);
      } catch (err) {
        console.error("Failed to load schemes");
      } finally {
        setLoading(false);
      }
    };
    fetchSchemes();
  }, []);

  // Filter Logic
  const filteredSchemes = schemes.filter(scheme => {
    const matchesSearch = scheme.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          scheme.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeTab === 'All Schemes' || scheme.type === activeTab;
    
    const matchesCategory = categoryFilter === 'All Categories' || scheme.category === categoryFilter;
    
    return matchesSearch && matchesTab && matchesCategory;
  });

  const categories = ['All Categories', ...new Set(schemes.map(s => s.category))];

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col space-y-6">
        {/* Search & Tabs */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-4 top-3 text-gray-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search schemes by name, keyword..." 
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm bg-white"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-3 overflow-x-auto pb-1 scrollbar-hide">
          {['All Schemes', 'Central Government', 'State Government', 'Private Schemes'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 font-semibold rounded-xl text-sm whitespace-nowrap shrink-0 transition-colors ${
                activeTab === tab 
                  ? 'bg-blue-50 border border-blue-100 text-blue-700' 
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Scheme List */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-10">
          {loading ? (
             <div className="text-center py-10 text-gray-400 font-medium">Loading schemes...</div>
          ) : filteredSchemes.length === 0 ? (
             <div className="text-center py-10 text-gray-400 font-medium">No schemes found matching your criteria.</div>
          ) : (
            filteredSchemes.map((scheme, idx) => (
              <div key={idx} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group flex items-start gap-4">
                <div className={`p-3 rounded-xl shrink-0 ${scheme.popular ? 'bg-emerald-50 text-emerald-600' : (idx%2===0 ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600')}`}>
                  <Shield className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-gray-900">{scheme.title}</h3>
                    {scheme.popular && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md">Most Popular</span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm mb-3 leading-relaxed max-w-2xl">{scheme.description}</p>
                  <div className="flex gap-2">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded-md">{scheme.type}</span>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-md">{scheme.category}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3 shrink-0">
                  <a href={scheme.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
                    Apply Now &rarr;
                  </a>
                  <a href={scheme.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors opacity-0 group-hover:opacity-100">
                    Learn More <Info className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-full lg:w-80 shrink-0 space-y-6">
        
        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-gray-900">Filter Schemes</h3>
            <button 
              onClick={() => { setSearchTerm(''); setActiveTab('All Schemes'); setCategoryFilter('All Categories'); }}
              className="text-xs font-semibold text-blue-600 flex items-center gap-1"
            >
              Clear All <Filter className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Category</label>
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-blue-500"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            
            <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors mt-2">
              <Filter className="w-4 h-4" /> Apply Filters
            </button>
          </div>
        </div>

        {/* Stats Block */}
        <div className="bg-gray-50/80 rounded-2xl border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 text-sm mb-1">Empowering Healthcare for All</h3>
          <p className="text-xs text-gray-500 mb-5 leading-relaxed">Discover schemes that can help you and your family live a healthier life.</p>
          <div className="flex justify-between text-center divide-x divide-gray-200">
             <div className="flex-1 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mb-2"><Shield className="w-4 h-4 text-blue-600" /></div>
                <div className="font-bold text-gray-900 text-sm">28+</div>
                <div className="text-[10px] text-gray-500 font-medium">Schemes</div>
             </div>
             <div className="flex-1 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mb-2"><Users className="w-4 h-4 text-emerald-600" /></div>
                <div className="font-bold text-gray-900 text-sm">12 Cr+</div>
                <div className="text-[10px] text-gray-500 font-medium">Beneficiaries</div>
             </div>
             <div className="flex-1 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mb-2"><IndianRupee className="w-4 h-4 text-amber-600" /></div>
                <div className="font-bold text-gray-900 text-sm">₹2.5L Cr+</div>
                <div className="text-[10px] text-gray-500 font-medium">Coverage</div>
             </div>
          </div>
        </div>

        {/* AI Assistant Block */}
        <div className="bg-gradient-to-br from-[#f0f4ff] to-[#e1ebfb] rounded-2xl border border-blue-100 p-6 relative overflow-hidden">
          <div className="relative z-10 w-2/3">
            <h3 className="font-bold text-gray-900 text-sm mb-1">Need help finding the right scheme?</h3>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">Our AI assistant can help you find schemes you are eligible for.</p>
            <button className="px-4 py-2 bg-white rounded-xl text-blue-600 text-xs font-bold flex items-center gap-2 shadow-sm hover:shadow transition-all">
               <Sparkles className="w-4 h-4 text-blue-500" /> Ask AI Assistant
            </button>
          </div>
          {/* Mock Robot Image */}
          <div className="absolute right-0 bottom-0 w-28 h-28 bg-blue-200/50 rounded-tl-full flex items-center justify-center pt-8 pl-8">
             <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg relative">
                <div className="w-10 h-3 bg-black rounded-full flex items-center justify-between px-2">
                   <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                   <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                </div>
                <div className="absolute -left-2 top-6 w-3 h-3 bg-blue-400 rounded-full"></div>
                <div className="absolute -right-2 top-4 w-3 h-3 bg-blue-400 rounded-full"></div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
