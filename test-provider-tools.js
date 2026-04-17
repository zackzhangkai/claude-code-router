const https = require('https');

function makeRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'cloud.zidongtaichu.com',
      port: 443,
      path: '/maas/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ryvsk3zz73419gkgubrnvufp',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
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

console.log('Test provider with tools and stream: false');
makeRequest({
  model: "GLM-5.1",
  messages: [
    { role: "system", content: "You are Claude, a helpful AI assistant. Use the provided tools when needed." },
    { role: "user", content: "Say hello" }
  ],
  tools: [
    {
      type: "function",
      function: {
        name: "write_file",
        description: "Write content to a file",
        parameters: {
          type: "object",
          properties: {
            path: { type: "string" },
            content: { type: "string" }
          }
        }
      }
    }
  ],
  max_tokens: 100,
  stream: false
}).then(r => {
  console.log('Status:', r.statusCode);
  console.log('Content-Type:', r.headers['content-type']);
  console.log('Is SSE?', r.data.startsWith('data:'));
  console.log('First 100 chars:', r.data.substring(0, 100));
}).catch(console.error);
