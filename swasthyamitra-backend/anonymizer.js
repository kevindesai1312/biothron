function categorizeAndAnonymize(userQuery) {
    // 1. Remove phone numbers or unique ID strings natively via RegEx matching
    let cleanQuery = userQuery.replace(/\b\d{10}\b/g, "[PHONE_REDACTED]");
    cleanQuery = cleanQuery.replace(/\b\d{4}-\d{4}-\d{4}-\d{4}\b/g, "[ABHA_REDACTED]");

    // 2. Local tagging dictionary for your Dashboard trends
    let identifiedCategory = "General Health Inquiries";
    
    if (/मलेरिया|malaria|मच्छर/i.test(cleanQuery)) identifiedCategory = "Vector-Borne Diseases";
    if (/टीबी|tb|तपेदिक|खांसी/i.test(cleanQuery)) identifiedCategory = "Respiratory Issues";
    if (/टीका|vaccine|पोलियो/i.test(cleanQuery)) identifiedCategory = "Immunization Campaigns";

    return {
        safeQuery: cleanQuery,
        category: identifiedCategory,
        timestamp: new Date()
    };
}

module.exports = { categorizeAndAnonymize };
