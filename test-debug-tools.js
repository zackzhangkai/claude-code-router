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

const requestData = {
  model: "zidongtaichu,GLM-5.1",
  messages: [
    { role: "system", content: "You are Claude, a helpful AI assistant. Use the provided tools when needed." },
    { role: "user", content: "Please create a test file at /tmp/test-ccr-verification.txt with the content 'Hello from CCR verification test'" }
  ],
  tools: [
    {
      "type": "function",
      "function": {
        "name": "write_file",
        "description": "Write content to a file",
        "parameters": {
          "type": "object",
          "properties": {
            "path": { "type": "string" },
            "content": { "type": "string" }
          },
          "required": ["path", "content"]
        }
      }
    }
  ],
  tool_choice: "auto",
  max_tokens: 4096
};

makeRequest('/v1/chat/completions', requestData).then(r => {
  console.log('Status:', r.statusCode);
  console.log('Content-Type:', r.headers['content-type']);
  console.log('---');
  console.log('Full response:', r.data);
  
  if (r.statusCode === 200) {
    try {
      const obj = JSON.parse(r.data);
      console.log('\n--- Parsed ---');
      console.log('Finish reason:', obj.choices?.[0]?.finish_reason);
      console.log('Tool calls:', JSON.stringify(obj.choices?.[0]?.message?.tool_calls, null, 2));
    } catch(e) {
      console.log('Parse error:', e.message);
    }
  }
}).catch(console.error);
