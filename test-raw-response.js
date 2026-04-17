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

// Test what the provider returns when we explicitly set stream: false
console.log('Testing provider with stream: false');
makeRequest({
  model: "GLM-5.1",
  messages: [{ role: "user", content: "Say hello" }],
  max_tokens: 100,
  stream: false
}).then(r => {
  console.log('Status:', r.statusCode);
  console.log('Content-Type:', r.headers['content-type']);
  console.log('Is streaming format?', r.data.startsWith('data:'));
  console.log('First 100 chars:', r.data.substring(0, 100));
}).catch(console.error);
