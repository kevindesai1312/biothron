const axios = require('axios');

/**
 * Finds nearby medical facilities using OpenStreetMap APIs (Nominatim + Overpass)
 * @param {string} userLocationText - The location or village name provided by the user.
 * @returns {Promise<Array>} - An array of nearby healthcare centers.
 */
async function findNearbyHospitals(userLocationText) {
    try {
        // 1. Geocoding: Convert location text to Latitude/Longitude using Nominatim API
        // NOTE: OpenStreetMap requires a descriptive User-Agent header to avoid blocking.
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(userLocationText)}&format=json&limit=1`;
        
        const geocodeRes = await axios.get(geocodeUrl, {
            headers: { 'User-Agent': 'SwasthyaMitraHealthcareBot/1.0' }
        });

        if (!geocodeRes.data || geocodeRes.data.length === 0) {
            return [];
        }

        const lat = parseFloat(geocodeRes.data[0].lat);
        const lon = parseFloat(geocodeRes.data[0].lon);

        // 2. Proximity Search: Use the Overpass API to query hospitals within a 15km radius (15000 meters)
        // This query searches for nodes and ways tagged with amenity=hospital or amenity=clinic
        const overpassUrl = `https://overpass-api.de/api/interpreter`;
        const overpassQuery = `
            [out:json][timeout:25];
            (
              node["amenity"="hospital"](around:15000, ${lat}, ${lon});
              node["amenity"="clinic"](around:15000, ${lat}, ${lon});
              way["amenity"="hospital"](around:15000, ${lat}, ${lon});
              way["amenity"="clinic"](around:15000, ${lat}, ${lon});
            );
            out tags center;
        `;

        const overpassRes = await axios.post(overpassUrl, overpassQuery, {
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'SwasthyaMitraHealthcareBot/1.0'
            }
        });

        if (!overpassRes.data.elements || overpassRes.data.elements.length === 0) {
            return [];
        }

        // 3. Format and return the top 3 nearest facilities found
        const facilities = overpassRes.data.elements.slice(0, 3).map((element, index) => {
            const tags = element.tags || {};
            
            // Hackathon Logic: Simulating government empanelment status
            const isEmpaneled = tags.amenity === 'hospital' || index % 2 === 0; 
            
            return {
                name: tags.name || "Unnamed Local Health Center",
                address: tags["addr:street"] || tags["addr:full"] || "Local Village Area",
                type: tags.amenity || "clinic",
                abhaEmpaneled: isEmpaneled,
                schemeBenefits: isEmpaneled ? "Free treatment up to ₹5 Lakhs under PM-JAY" : "Standard Government Subsidized Rates"
            };
        });

        return facilities;

    } catch (error) {
        console.error("Error fetching OpenStreetMap data:", error.message);
        return [];
    }
}

module.exports = { findNearbyHospitals };
