// A completely keyless, localized matching dictionary
const firstAidDictionary = {
    "dehydration": "• पिलाएं: ओआरएस (ORS) या नमक-चीनी का घोल।\n• आराम: ठंडी जगह पर आराम करें।",
    "दस्त": "• पिलाएं: ओआरएस (ORS) या नमक-चीनी का घोल।\n• आराम: ठंडी जगह पर आराम करें।",
    "लू लगना": "• प्राथमिक उपचार: शरीर पर ठंडा पानी छिड़कें और पंखे के नीचे रखें।\n• तरल पदार्थ: यदि होश में हो, तो ठंडा पानी या छाछ पिलाएं।",
    "snake bite": "• CRITICAL: Do not cut or suck the wound. Keep the patient completely still to slow venom spread and rush to the nearest clinic.",
    "सांप का काटना": "• महत्वपूर्ण: घाव को काटें या चूसें नहीं। मरीज को शांत रखें और तुरंत नजदीकी अस्पताल ले जाएं।"
};

function checkLocalFirstAid(userQuery) {
    const queryLower = userQuery.toLowerCase();
    
    for (const key in firstAidDictionary) {
        if (queryLower.includes(key)) {
            return {
                matched: true,
                instructions: firstAidDictionary[key]
            };
        }
    }
    return { matched: false, instructions: "" };
}

module.exports = { checkLocalFirstAid };
