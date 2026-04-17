const http = require('http');

const testRequest = {
  model: "zidongtaichu,GLM-5.1",
  messages: [
    {
      role: "user",
      content: "创建一个文件 /tmp/test-manual.txt，内容为 '测试成功'"
    }
  ],
  tools: [
    {
      type: "function",
      function: {
        name: "write_file",
        description: "创建或写入文件",
        parameters: {
          type: "object",
          properties: {
            path: { type: "string" },
            content: { type: "string" }
          },
          required: ["path", "content"]
        }
      }
    }
  ],
  tool_choice: "required",
  stream: false
};

const options = {
  hostname: '127.0.0.1',
  port: 34567,
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test-key'
  }
};

console.log('Testing file creation via ccr...');

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
      
      const message = parsed.choices?.[0]?.message;
      if (message?.tool_calls?.length > 0) {
        console.log('\n✅ SUCCESS: tool_calls found!');
        message.tool_calls.forEach((tool, i) => {
          console.log(`\nTool ${i + 1}:`);
          console.log('  Name:', tool.function?.name);
          console.log('  Arguments:', tool.function?.arguments);
        });
      } else {
        console.log('\n❌ No tool_calls in response');
        console.log('Content:', message?.content);
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
