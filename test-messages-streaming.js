const http = require('http');

const testRequest = {
  model: "zidongtaichu,GLM-5.1",
  messages: [
    {
      role: "user",
      content: "创建一个文件 /tmp/test-messages-stream.txt，内容为 'messages流式测试'"
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
  stream: true
};

const options = {
  hostname: '127.0.0.1',
  port: 34567,
  path: '/v1/messages',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test-key'
  }
};

console.log('Testing /v1/messages streaming response...');

const req = http.request(options, (res) => {
  let buffer = '';
  let hasToolUse = false;

  res.on('data', (chunk) => {
    buffer += chunk.toString();
    
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
        try {
          const data = JSON.parse(line.slice(6));
          
          if (data.type === 'content_block_start' && data.content_block?.type === 'tool_use') {
            hasToolUse = true;
            console.log('Tool use start:', JSON.stringify(data.content_block, null, 2));
          }
          
          if (data.type === 'content_block_delta' && data.delta?.partial_json) {
            console.log('Tool use delta:', data.delta.partial_json);
          }
          
          if (data.type === 'message_stop') {
            console.log('Message stop');
          }
        } catch (e) {}
      }
    }
  });

  res.on('end', () => {
    console.log('\n=== /v1/messages STREAMING TEST COMPLETE ===');
    console.log('Has tool_use:', hasToolUse);
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(JSON.stringify(testRequest));
req.end();
