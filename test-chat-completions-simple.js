const http = require('http');

function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: '127.0.0.1',
      port: 34567,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data: responseData }));
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function test() {
  // Test with valid model format
  const requestData = {
    model: "zidongtaichu,GLM-5.1",
    messages: [
      { role: "user", content: "Say hello" }
    ],
    max_tokens: 100
  };
  
  console.log('Testing with valid model format: zidongtaichu,GLM-5.1');
  const response = await makeRequest('/v1/chat/completions', requestData);
  console.log('Status:', response.statusCode);
  console.log('Response:', response.data.substring(0, 500));
}

test().catch(console.error);
