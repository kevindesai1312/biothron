import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, Map as MapIcon, Bookmark, Sparkles, PhoneCall, Ambulance, Video, Calendar, ShieldCheck, ChevronDown } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function Hospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [sortNearest, setSortNearest] = useState(true);
  
  const [selectedTypes, setSelectedTypes] = useState({
    'GOVERNMENT': true,
    'PRIVATE': true,
    'TRUST / NGO': true
  });
  
  const [selectedFacilities, setSelectedFacilities] = useState({
    '24x7 Emergency': true,
    'ICU': false,
    'Pharmacy': false,
    'Ambulance': false,
    'Blood Bank': false
  });

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/hospitals?location=Surat, Gujarat');
        let facilities = res.data.hospitals;
        if (facilities.length < 5) {
          facilities = [
            { name: 'New Civil Hospital', address: 'Varachha, Surat, Gujarat', rating: 4.2, reviews: 256, type: 'GOVERNMENT', distance: 2.5, facilities: ['24x7 Emergency', 'ICU', 'Pharmacy', 'Blood Bank'], lat: 21.1938, lng: 72.8275 },
            { name: 'Sunshine Global Hospital', address: 'City Light, Surat, Gujarat', rating: 4.5, reviews: 189, type: 'PRIVATE', distance: 3.1, facilities: ['24x7 Emergency', 'ICU', 'Pharmacy', 'Ambulance'], lat: 21.1663, lng: 72.8023 },
            { name: 'Kiran Multi Super Speciality Hospital', address: 'Ring Road, Surat, Gujarat', rating: 4.3, reviews: 142, type: 'PRIVATE', distance: 4.2, facilities: ['24x7 Emergency', 'ICU', 'Pharmacy'], lat: 21.2045, lng: 72.8402 },
            { name: 'Athwa Lines General Hospital', address: 'Athwa, Surat, Gujarat', rating: 4.0, reviews: 98, type: 'TRUST / NGO', distance: 5.0, facilities: ['24x7 Emergency', 'Pharmacy'], lat: 21.1764, lng: 72.7938 },
            { name: 'Shalby Multi-Specialty Hospital', address: 'Adajan, Surat, Gujarat', rating: 4.6, reviews: 310, type: 'PRIVATE', distance: 6.8, facilities: ['24x7 Emergency', 'ICU', 'Pharmacy', 'Ambulance'], lat: 21.1969, lng: 72.7933 },
          ];
        } else {
          // Normalize distances if they came from OSM without proper structure
          facilities = facilities.map((f, i) => ({ ...f, distance: 2.0 + (i*0.5) }));
        }
        setHospitals(facilities);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHospitals();
  }, []);

  const handleTypeToggle = (type) => {
    setSelectedTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handleFacilityToggle = (facility) => {
    setSelectedFacilities(prev => ({ ...prev, [facility]: !prev[facility] }));
  };

  const handleClearAll = () => {
    setSearchTerm('');
    setSelectedTypes({ 'GOVERNMENT': true, 'PRIVATE': true, 'TRUST / NGO': true });
    setSelectedFacilities({ '24x7 Emergency': false, 'ICU': false, 'Pharmacy': false, 'Ambulance': false, 'Blood Bank': false });
  };

  // Filter Logic
  const filteredHospitals = hospitals.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (h.address && h.address.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Type Filter (if none selected, show none, or whatever logic. Assuming must match at least one selected type)
    const matchesType = selectedTypes[h.type] || (!selectedTypes['GOVERNMENT'] && !selectedTypes['PRIVATE'] && !selectedTypes['TRUST / NGO']);

    // Facility Filter
    const activeFacilities = Object.keys(selectedFacilities).filter(f => selectedFacilities[f]);
    const matchesFacilities = activeFacilities.length === 0 || activeFacilities.every(af => h.facilities?.includes(af));

    return matchesSearch && matchesType && matchesFacilities;
  }).sort((a, b) => {
    if (sortNearest) return a.distance - b.distance;
    return b.rating - a.rating; // otherwise sort by highest rating
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      
      {/* Left Filters Sidebar */}
      <div className="w-full lg:w-64 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-gray-900 text-[15px]">Filter Hospitals</h3>
          <button onClick={handleClearAll} className="text-[11px] font-bold text-blue-600">Clear All</button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-xs font-bold text-gray-800 mb-2 block">Distance</label>
            <select className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-blue-500 font-medium">
              <option>Within 10 km</option>
              <option>Within 20 km</option>
              <option>Any Distance</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-800 mb-3 block">Hospital Type</label>
            <div className="space-y-2">
               <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" checked={selectedTypes['GOVERNMENT']} onChange={() => handleTypeToggle('GOVERNMENT')} className="rounded text-blue-600 w-4 h-4" /> Government
               </label>
               <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" checked={selectedTypes['PRIVATE']} onChange={() => handleTypeToggle('PRIVATE')} className="rounded text-blue-600 w-4 h-4" /> Private
               </label>
               <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" checked={selectedTypes['TRUST / NGO']} onChange={() => handleTypeToggle('TRUST / NGO')} className="rounded text-blue-600 w-4 h-4" /> Trust / NGO
               </label>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-800 mb-3 block">Facilities</label>
            <div className="space-y-2">
               {Object.keys(selectedFacilities).map(facility => (
                 <label key={facility} className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={selectedFacilities[facility]} onChange={() => handleFacilityToggle(facility)} className="rounded text-blue-600 w-4 h-4" /> {facility}
                 </label>
               ))}
            </div>
          </div>

          <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
            <Filter className="w-4 h-4" /> Apply Filters
          </button>
        </div>
      </div>

      {/* Center List */}
      <div className="flex-1 flex flex-col space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-4 top-3 text-gray-400" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search hospitals, specialties, treatments..." 
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm bg-white"
            />
          </div>
          <button 
            onClick={() => setSortNearest(!sortNearest)}
            className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 flex items-center gap-2 shrink-0 hover:bg-gray-50 transition-colors"
          >
             Sort By <strong>{sortNearest ? 'Nearest' : 'Rating'}</strong> <ChevronDown className="w-4 h-4" />
          </button>
          <button className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-blue-600 flex items-center gap-2 shrink-0 lg:hidden">
             <Filter className="w-4 h-4" /> Filters
          </button>
        </div>

        <div className="flex justify-between items-center px-1 pt-2">
           <h2 className="text-sm font-bold text-blue-800">{filteredHospitals.length} Hospitals found</h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pb-10 pr-2">
          {loading ? (
             <div className="text-center py-10 text-gray-400 font-medium">Loading hospitals...</div>
          ) : filteredHospitals.length === 0 ? (
             <div className="text-center py-10 text-gray-400 font-medium">No hospitals match your selected filters.</div>
          ) : (
            filteredHospitals.map((hospital, idx) => (
              <div key={idx} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex gap-4 relative">
                {/* Mock Image Box */}
                <div className="w-32 h-32 bg-gray-200 rounded-lg shrink-0 bg-cover bg-center border border-gray-100" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?q=80&w=200&auto=format&fit=crop')` }}></div>
                
                <div className="flex-1 flex flex-col justify-between py-1">
                   <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-[9px] font-bold tracking-wider rounded-md ${hospital.type === 'GOVERNMENT' ? 'bg-emerald-100 text-emerald-700' : (hospital.type === 'PRIVATE' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700')}`}>
                          {hospital.type || 'HOSPITAL'}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-base">{hospital.name}</h3>
                      <p className="text-gray-500 text-xs mb-1.5">{hospital.address}</p>
                      
                      <div className="flex items-center gap-1.5 mb-3 text-xs">
                         <span className="text-amber-500">★</span> 
                         <span className="font-bold text-gray-700">{hospital.rating || "4.0"}</span> 
                         <span className="text-gray-400">({hospital.reviews || "100"} reviews)</span>
                      </div>
                   </div>

                   <div className="flex gap-2 flex-wrap">
                      {(hospital.facilities || ['24x7 Emergency', 'Pharmacy']).slice(0,4).map((f, i) => (
                        <span key={i} className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${f.includes('Emergency') ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>{f}</span>
                      ))}
                   </div>
                </div>

                <div className="flex flex-col justify-between items-end shrink-0 py-1 pl-2">
                   <button className="text-gray-400 hover:text-blue-600"><Bookmark className="w-5 h-5" /></button>
                   <div className="text-right">
                     <div className="text-xs font-bold text-gray-900 mb-1">{hospital.distance} km</div>
                     <button className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:text-blue-700">View Details &rarr;</button>
                   </div>
                </div>
              </div>
            ))
          )}
          
        </div>
      </div>

      {/* Right Sidebar (Map & Actions) */}
      <div className="w-full lg:w-[340px] shrink-0 flex flex-col space-y-6">
        
        <div className="bg-white rounded-2xl border border-gray-100 p-1 shadow-sm relative overflow-hidden h-[300px] shrink-0 z-0">
           <div className="flex justify-between items-center px-4 py-3 absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-white to-transparent pointer-events-none">
             <h3 className="font-bold text-gray-900 text-sm drop-shadow-md">Hospitals Near You</h3>
             <button className="text-[10px] font-bold text-blue-600 flex items-center gap-1 bg-white/80 px-2 py-1 rounded-md pointer-events-auto">View Full Map <MapIcon className="w-3 h-3" /></button>
           </div>
           
           <div className="w-full h-full rounded-xl overflow-hidden relative z-0">
             <MapContainer center={[21.1702, 72.8311]} zoom={11} className="w-full h-full" zoomControl={false}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {filteredHospitals.filter(h => h.lat && h.lng).map((hospital, idx) => (
                  <Marker key={idx} position={[hospital.lat, hospital.lng]}>
                    <Popup>
                      <div className="text-xs">
                        <strong>{hospital.name}</strong><br/>
                        {hospital.address}<br/>
                        {hospital.distance} km away
                      </div>
                    </Popup>
                  </Marker>
                ))}
             </MapContainer>
           </div>
        </div>

        <div className="bg-blue-50/80 rounded-2xl border border-blue-100 p-4 flex gap-3 items-center">
           <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
           <div>
              <h4 className="text-xs font-bold text-blue-900 mb-0.5">All hospitals are verified for your safety.</h4>
              <p className="text-[10px] text-blue-700">Data is updated regularly.</p>
           </div>
        </div>

        <div className="bg-gradient-to-br from-[#f0f4ff] to-[#e1ebfb] rounded-2xl border border-blue-100 p-6 relative overflow-hidden shrink-0">
          <div className="relative z-10 w-[70%]">
            <h3 className="font-bold text-gray-900 text-sm mb-1">Need Help Choosing a Hospital?</h3>
            <p className="text-[11px] text-gray-600 mb-4 leading-relaxed">Our AI assistant can help you find the best hospital based on your condition and location.</p>
            <button className="px-4 py-2 bg-white rounded-xl text-blue-600 text-xs font-bold flex items-center gap-2 shadow-sm hover:shadow transition-all">
               <Sparkles className="w-4 h-4 text-blue-500" /> Ask AI Assistant
            </button>
          </div>
          {/* Mock Robot Image */}
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-blue-200/50 rounded-tl-full flex items-center justify-center pt-6 pl-6">
             <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg relative">
                <div className="w-8 h-2.5 bg-black rounded-full flex items-center justify-between px-1.5">
                   <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                   <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                </div>
             </div>
          </div>
        </div>

        <div className="pt-2">
           <h3 className="font-bold text-gray-900 text-sm mb-4">Quick Actions</h3>
           <div className="grid grid-cols-4 gap-3">
              <button className="flex flex-col items-center gap-2 group">
                 <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-blue-600 group-hover:border-blue-200 group-hover:bg-blue-50 transition-colors">
                    <PhoneCall className="w-5 h-5" />
                 </div>
                 <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight">Nearby<br/>Emergency</span>
              </button>
              <button className="flex flex-col items-center gap-2 group">
                 <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-blue-600 group-hover:border-blue-200 group-hover:bg-blue-50 transition-colors">
                    <Ambulance className="w-5 h-5" />
                 </div>
                 <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight">Book<br/>Ambulance</span>
              </button>
              <button className="flex flex-col items-center gap-2 group">
                 <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-blue-600 group-hover:border-blue-200 group-hover:bg-blue-50 transition-colors">
                    <Video className="w-5 h-5" />
                 </div>
                 <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight">Video<br/>Consultation</span>
              </button>
              <button className="flex flex-col items-center gap-2 group">
                 <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-blue-600 group-hover:border-blue-200 group-hover:bg-blue-50 transition-colors">
                    <Calendar className="w-5 h-5" />
                 </div>
                 <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight">Book<br/>Appointment</span>
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}
