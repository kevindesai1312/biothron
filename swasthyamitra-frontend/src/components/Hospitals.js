import React from 'react';
import { PhoneCall, HeartPulse, ShieldAlert, Building2, Stethoscope, Droplet, Pill, AlertCircle } from 'lucide-react';

const emergencyNumbers = [
  { number: "108", label: "Ambulance", icon: PhoneCall },
  { number: "102", label: "Pregnancy Ambulance", icon: HeartPulse },
  { number: "104", label: "Health Helpline", icon: PhoneCall },
  { number: "1097", label: "AIDS Helpline", icon: PhoneCall },
  { number: "181", label: "Women Helpline", icon: PhoneCall },
  { number: "1098", label: "Child Helpline", icon: PhoneCall },
  { number: "1075", label: "COVID Helpline", icon: PhoneCall },
  { number: "1916", label: "Disaster Management", icon: ShieldAlert }
];

const facilities = [
  {
    title: "Primary Health Center (PHC)",
    description: "First point of contact in rural areas. Provides basic medical care, maternal and child health services, immunization, and common disease treatment.",
    icon: Building2
  },
  {
    title: "Community Health Center (CHC)",
    description: "Referral center for 4 PHCs. Has specialist doctors, 30 beds, laboratory, and X-ray facilities. Handles emergencies and surgeries.",
    icon: Building2
  },
  {
    title: "District Hospital",
    description: "Full service hospital with multiple specialties, ICU, blood bank, and advanced diagnostic facilities. Handles complex cases and surgeries.",
    icon: Building2
  },
  {
    title: "Government Medical College",
    description: "Teaching hospital with all specialties, super specialty departments, advanced research, and cutting edge treatment facilities.",
    icon: Building2
  },
  {
    title: "Ayushman Bharat Health & Wellness Centre",
    description: "Provides comprehensive primary healthcare including free essential drugs, diagnostic services, and teleconsultation.",
    icon: Building2
  },
  {
    title: "Private Clinic",
    description: "Private doctor's clinic for outpatient consultations. Available in both urban and semi-urban areas.",
    icon: Stethoscope
  },
  {
    title: "24/7 Pharmacy",
    description: "Round-the-clock medicine availability. Some government hospitals have free medicine dispensaries.",
    icon: Pill
  },
  {
    title: "Blood Bank",
    description: "Available at district hospitals and medical colleges. Voluntary blood donation camps organized regularly.",
    icon: Droplet
  }
];

export default function Hospitals() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8 bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-xl min-h-[80vh]">
      
      {/* Emergency Numbers Section */}
      <div className="bg-red-50/50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <h2 className="text-lg font-bold">Emergency Numbers (India)</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {emergencyNumbers.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="bg-white rounded-lg p-4 flex flex-col items-center justify-center border border-red-100 shadow-sm text-center">
                <Icon className="w-5 h-5 text-red-400 mb-2" />
                <span className="text-xl font-bold text-red-600 mb-1">{item.number}</span>
                <span className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Facilities Section */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-6">Types of Healthcare Facilities</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {facilities.map((facility, idx) => {
            const Icon = facility.icon;
            return (
              <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex gap-4">
                <div className="bg-blue-50 p-2.5 rounded-lg h-fit border border-blue-100">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-[14px] mb-1.5">{facility.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{facility.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
