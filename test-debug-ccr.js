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
  messages: [{ role: "user", content: "Say hello" }],
  max_tokens: 100,
  stream: false
};

makeRequest('/v1/chat/completions', requestData).then(r => {
  console.log('Status:', r.statusCode);
  console.log('Content-Type:', r.headers['content-type']);
  console.log('Response preview:', r.data.substring(0, 200));
  console.log('---');
  console.log('Full response:', r.data);
}).catch(console.error);
