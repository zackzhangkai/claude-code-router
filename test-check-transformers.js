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

console.log('Test 1: /v1/messages (no stream field)');
makeRequest('/v1/messages', {
  model: "zidongtaichu,GLM-5.1",
  messages: [{ role: "user", content: "Say hello" }],
  max_tokens: 100
}).then(r => {
  console.log('Status:', r.statusCode);
  console.log('First 100 chars:', r.data.substring(0, 100));
  console.log('---');
  
  console.log('Test 2: /v1/chat/completions (no stream field)');
  return makeRequest('/v1/chat/completions', {
    model: "zidongtaichu,GLM-5.1",
    messages: [{ role: "user", content: "Say hello" }],
    max_tokens: 100
  });
}).then(r => {
  console.log('Status:', r.statusCode);
  console.log('Is SSE?', r.data.startsWith('data:'));
  console.log('First 100 chars:', r.data.substring(0, 100));
}).catch(console.error);
