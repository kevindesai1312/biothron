// Pre-seed a highly compressed JSON blueprint of critical, lifesaving procedures 
const EMERGENCY_OFFLINE_DB = {
  "cpr": "1. Push hard and fast in the center of the chest.\n2. Rate: 100-120 compressions per minute.",
  "सीपीआर": "1. छाती के बीच में तेजी से और जोर से दबाएं।\n2. गति: 1 मिनट में 100 से 120 बार।",
  "heatstroke": "1. Move the person to a cool space.\n2. Apply cool, wet cloths to their body.",
  "लू लगना": "1. व्यक्ति को ठंडी जगह पर ले जाएं।\n2. शरीर पर ठंडे पानी की पट्टियां रखें।"
};

export const handleOfflineSearch = (userQuery) => {
  // Check if the user is currently offline
  if (!navigator.onLine) {
    const queryLower = userQuery.toLowerCase();
    
    // Attempt local lookup inside the browser cache boundary
    for (const key in EMERGENCY_OFFLINE_DB) {
      if (queryLower.includes(key)) {
        return {
          status: "OFFLINE_MODE_ACTIVE",
          data: EMERGENCY_OFFLINE_DB[key]
        };
      }
    }
    return { 
      status: "OFFLINE_MODE_ACTIVE", 
      data: "नेटवर्क उपलब्ध नहीं है। कृपया आपातकालीन प्राथमिक चिकित्सा के लिए स्थानीय स्वास्थ्य केंद्र से संपर्क करें।" 
    };
  }
  return null; // Return null to proceed with normal API logic if online
};
