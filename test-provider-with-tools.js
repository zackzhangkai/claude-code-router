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

makeRequest({
  model: "GLM-5.1",
  messages: [
    { role: "system", content: "You are Claude, a helpful AI assistant. Use the provided tools when needed." },
    { role: "user", content: "Create a file at /tmp/test.txt with content 'hello'" }
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
  max_tokens: 1000,
  stream: false
}).then(r => {
  console.log('Status:', r.statusCode);
  console.log('Content-Type:', r.headers['content-type']);
  console.log('Is SSE?', r.data.startsWith('data:'));
  console.log('Has tool_calls?', r.data.includes('tool_calls'));
  console.log('First 500 chars:', r.data.substring(0, 500));
}).catch(console.error);
