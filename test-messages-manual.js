const http = require('http');

const testRequest = {
  model: "zidongtaichu,GLM-5.1",
  messages: [
    {
      role: "user",
      content: "创建一个文件 /tmp/test-messages.txt，内容为 '测试messages端点'"
    }
  ],
  tools: [
    {
      name: "write_file",
      description: "创建或写入文件",
      input_schema: {
        type: "object",
        properties: {
          path: { type: "string" },
          content: { type: "string" }
        },
        required: ["path", "content"]
      }
    }
  ],
  tool_choice: { type: "any" },
  stream: false,
  max_tokens: 4096
};

const options = {
  hostname: '127.0.0.1',
  port: 34567,
  path: '/v1/messages',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test-key',
    'anthropic-version': '2023-06-01'
  }
};

console.log('Testing /v1/messages endpoint...');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\n=== RESPONSE ===');
    console.log('Status:', res.statusCode);
    try {
      const parsed = JSON.parse(data);
      console.log('Response:', JSON.stringify(parsed, null, 2));
      
      if (parsed.content?.some(c => c.type === 'tool_use')) {
        console.log('\n✅ SUCCESS: tool_use found!');
        const toolUse = parsed.content.find(c => c.type === 'tool_use');
        console.log('Tool:', JSON.stringify(toolUse, null, 2));
      } else {
        console.log('\n❌ No tool_use in response');
        console.log('Content types:', parsed.content?.map(c => c.type));
      }
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(JSON.stringify(testRequest));
req.end();
