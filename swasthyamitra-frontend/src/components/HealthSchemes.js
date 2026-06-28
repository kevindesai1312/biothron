import React from 'react';
import { ChevronRight } from 'lucide-react';

const schemes = [
  {
    title: "Ayushman Bharat (PM-JAY)",
    description: "World's largest government funded healthcare scheme providing health coverage up to ₹5 lakh per family per year for secondary and tertiary care hospitalization.",
    url: "https://pmjay.gov.in/"
  },
  {
    title: "Janani Suraksha Yojana (JSY)",
    description: "Safe motherhood intervention under the National Health Mission to reduce maternal and neonatal mortality by promoting institutional delivery.",
    url: "https://nhm.gov.in/index1.php?lang=1&level=3&sublinkid=841&lid=309"
  },
  {
    title: "Mission Indradhanush",
    description: "Universal Immunization Program to cover all unvaccinated or partially vaccinated children and pregnant women.",
    url: "https://www.mohfw.gov.in/"
  },
  {
    title: "National TB Elimination Program (Ni-kshay)",
    description: "Program to eliminate Tuberculosis in India by 2025 through free diagnosis and treatment.",
    url: "https://nikshay.in/"
  },
  {
    title: "Janani Shishu Suraksha Karyakram (JSSK)",
    description: "Entitles all pregnant women delivering in public health institutions to absolutely free and no expense delivery.",
    url: "https://nhm.gov.in/index1.php?lang=1&level=3&sublinkid=842&lid=308"
  },
  {
    title: "Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA)",
    description: "Fixed day assured comprehensive and quality antenatal care to pregnant women on the 9th of every month.",
    url: "https://pmsma.mohfw.gov.in/"
  }
];

export default function HealthSchemes() {
  return (
    <div className="max-w-4xl mx-auto p-8 bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">Health Schemes for Every Indian</h1>
        <p className="text-gray-500 text-sm max-w-lg mx-auto">
          Learn about government health programs, check your eligibility, and access benefits you are entitled to.
        </p>
      </div>

      <div className="space-y-4">
        {schemes.map((scheme, idx) => (
          <div 
            key={idx} 
            onClick={() => window.open(scheme.url, '_blank', 'noopener,noreferrer')}
            className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex justify-between items-center group"
          >
            <div className="pr-4">
              <h3 className="font-bold text-gray-800 text-[15px] mb-1 group-hover:text-emerald-700 transition-colors">{scheme.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{scheme.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 flex-shrink-0 transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
}
