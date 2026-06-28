const { categorizeAndAnonymize } = require('./anonymizer');

const testQuery = "मुझे मलेरिया हो गया है और मेरा फोन नंबर 9876543210 है। ABHA ID 1234-5678-9012-3456 है।";

console.log("--- ORIGINAL RAW QUERY ---");
console.log(testQuery);

console.log("\n--- AFTER ANONYMIZER FIREWALL ---");
const safeData = categorizeAndAnonymize(testQuery);
console.log(JSON.stringify(safeData, null, 2));
