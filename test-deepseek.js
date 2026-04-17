const http = require('http');

// Test DeepSeek-V3.2 directly
const testRequest = {
  model: "zidongtaichu,DeepSeek-V3.2",
  messages: [
    {
      role: "user",
      content: "创建一个文件 /tmp/test-deepseek.txt，内容为 'DeepSeek测试'"
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

console.log('Testing DeepSeek-V3.2...');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\n=== RESPONSE ===');
    try {
      const parsed = JSON.parse(data);
      const message = parsed.choices?.[0]?.message;
      
      if (message?.tool_calls?.length > 0) {
        console.log('✅ DeepSeek returned tool_calls!');
        console.log(JSON.stringify(message.tool_calls, null, 2));
      } else {
        console.log('❌ DeepSeek did NOT return tool_calls');
        console.log('Content:', message?.content);
        console.log('Finish reason:', parsed.choices?.[0]?.finish_reason);
      }
    } catch (e) {
      console.log('Error:', e.message);
      console.log('Raw:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(JSON.stringify(testRequest));
req.end();
