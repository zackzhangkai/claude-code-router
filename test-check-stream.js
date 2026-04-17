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
      res.on('end', () => resolve({ 
        statusCode: res.statusCode, 
        headers: res.headers, 
        data: responseData 
      }));
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Test 1: Simple request without tools
console.log('Test 1: Simple request without tools');
makeRequest('/v1/chat/completions', {
  model: "zidongtaichu,GLM-5.1",
  messages: [{ role: "user", content: "Say hello" }],
  max_tokens: 100
}).then(r => {
  console.log('Status:', r.statusCode);
  console.log('First 100 chars:', r.data.substring(0, 100));
  console.log('---');
  
  // Test 2: Request with tools
  console.log('\nTest 2: Request with tools');
  return makeRequest('/v1/chat/completions', {
    model: "zidongtaichu,GLM-5.1",
    messages: [{ role: "user", content: "Say hello" }],
    tools: [{ type: "function", function: { name: "test", description: "test", parameters: { type: "object", properties: {} } } }],
    max_tokens: 100
  });
}).then(r => {
  console.log('Status:', r.statusCode);
  console.log('First 200 chars:', r.data.substring(0, 200));
}).catch(console.error);
