const http = require('http');

// Test with streaming enabled (which Claude Code likely uses)
const testRequest = {
  model: "zidongtaichu,GLM-5.1",
  messages: [
    {
      role: "user",
      content: "创建一个文件 /tmp/test-streaming.txt，内容为 '流式测试成功'"
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
  stream: true  // Claude Code uses streaming
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

console.log('Testing streaming response...');

const req = http.request(options, (res) => {
  let buffer = '';
  let hasToolCalls = false;
  let completeResponse = '';

  res.on('data', (chunk) => {
    buffer += chunk.toString();
    completeResponse += chunk.toString();
    
    // Process SSE lines
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
        try {
          const data = JSON.parse(line.slice(6));
          
          // Check for tool_calls in delta
          if (data.choices?.[0]?.delta?.tool_calls?.length) {
            hasToolCalls = true;
            const toolCall = data.choices[0].delta.tool_calls[0];
            console.log('Tool call delta:', JSON.stringify(toolCall, null, 2));
          }
          
          // Check for finish_reason
          if (data.choices?.[0]?.finish_reason) {
            console.log('Finish reason:', data.choices[0].finish_reason);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  });

  res.on('end', () => {
    console.log('\n=== STREAMING TEST COMPLETE ===');
    console.log('Has tool calls:', hasToolCalls);
    
    // Check if file was created
    const fs = require('fs');
    if (fs.existsSync('/tmp/test-streaming.txt')) {
      console.log('✅ File was created!');
      console.log('Content:', fs.readFileSync('/tmp/test-streaming.txt', 'utf8'));
    } else {
      console.log('❌ File was NOT created (expected - this is just the API test)');
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(JSON.stringify(testRequest));
req.end();
