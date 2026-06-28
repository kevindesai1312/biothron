const http = require('http');

const postData = JSON.stringify({
  userQuery: "[Please respond strictly in Gujarati (ગુજરાતી)] What are the symptoms of Malaria?"
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/chat-text',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log("Response from server:");
    console.log(JSON.stringify(JSON.parse(data), null, 2));
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();
