const http = require('http');

// Test with streaming enabled like Claude Code uses
const testRequest = {
  model: "zidongtaichu,GLM-5.1",
  messages: [
    {
      role: "user",
      content: "Create a file at /tmp/test-actual.txt with content 'actual test'"
    }
  ],
  tools: [{
    name: "write_file",
    description: "Write to a file",
    input_schema: {
      type: "object",
      properties: {
        path: {type: "string"},
        content: {type: "string"}
      },
      required: ["path", "content"]
    }
  }],
  max_tokens: 1000,
  stream: true
};

const options = {
  hostname: '127.0.0.1',
  port: 34567,
  path: '/v1/messages',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test',
    'anthropic-version': '2023-06-01'
  }
};

console.log('Testing /v1/messages with streaming and tools...');

const req = http.request(options, (res) => {
  let buffer = '';
  let toolUseFound = false;

  res.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
        try {
          const data = JSON.parse(line.slice(6));
          console.log('Event:', data.type);
          
          if (data.type === 'content_block_start' && data.content_block?.type === 'tool_use') {
            toolUseFound = true;
            console.log('Tool use detected:', JSON.stringify(data.content_block, null, 2));
          }
          
          if (data.type === 'content_block_delta' && data.delta?.partial_json) {
            console.log('Tool args:', data.delta.partial_json);
          }
          
          if (data.type === 'message_stop') {
            console.log('Message complete');
          }
        } catch (e) {}
      }
    }
  });

  res.on('end', () => {
    console.log('\n=== RESULT ===');
    console.log('Tool use found:', toolUseFound);
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(JSON.stringify(testRequest));
req.end();
