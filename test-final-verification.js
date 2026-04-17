#!/usr/bin/env node

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
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: responseData
        });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

const tools = [
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
  },
  {
    "type": "function",
    "function": {
      "name": "read_file",
      "description": "Read content from a file",
      "parameters": {
        "type": "object",
        "properties": {
          "path": { "type": "string" }
        },
        "required": ["path"]
      }
    }
  }
];

async function testChatCompletions() {
  console.log('=== Testing /v1/chat/completions with tool calling ===\n');
  
  const requestData = {
    model: "zidongtaichu,GLM-5.1",
    messages: [
      {
        role: "system",
        content: "You are Claude, a helpful AI assistant. Use the provided tools when needed."
      },
      {
        role: "user",
        content: "Please create a test file at /tmp/test-ccr-verification.txt with the content 'Hello from CCR verification test'"
      }
    ],
    tools: tools,
    tool_choice: "auto",
    max_tokens: 4096,
    temperature: 0.7
  };
  
  try {
    console.log('Sending request to create a file...');
    const response = await makeRequest('/v1/chat/completions', requestData);
    
    console.log('Status:', response.statusCode);
    
    if (response.statusCode !== 200) {
      console.error('❌ FAILED: Non-200 status code');
      console.error('Response:', response.data);
      return false;
    }
    
    const responseObj = JSON.parse(response.data);
    
    console.log('\nResponse structure:');
    console.log('- ID:', responseObj.id);
    console.log('- Model:', responseObj.model);
    console.log('- Choices count:', responseObj.choices?.length || 0);
    
    if (responseObj.choices && responseObj.choices.length > 0) {
      const choice = responseObj.choices[0];
      console.log('- Finish reason:', choice.finish_reason);
      console.log('- Message role:', choice.message?.role);
      
      const toolCalls = choice.message?.tool_calls;
      if (toolCalls && toolCalls.length > 0) {
        console.log('\n✅ SUCCESS: Tool calls detected!');
        console.log('- Number of tool calls:', toolCalls.length);
        
        toolCalls.forEach((call, i) => {
          console.log(`\nTool call ${i + 1}:`);
          console.log('  - ID:', call.id);
          console.log('  - Type:', call.type);
          console.log('  - Function name:', call.function?.name);
          try {
            const args = JSON.parse(call.function?.arguments || '{}');
            console.log('  - Arguments:', JSON.stringify(args, null, 2));
          } catch (e) {
            console.log('  - Arguments (raw):', call.function?.arguments);
          }
        });
        
        const writeFileCall = toolCalls.find(call => call.function?.name === 'write_file');
        if (writeFileCall) {
          console.log('\n✅ VERIFIED: write_file tool call present!');
          return true;
        } else {
          console.log('\n⚠️ WARNING: No write_file tool call found');
          console.log('Available tool calls:', toolCalls.map(c => c.function?.name).join(', '));
          return false;
        }
      } else {
        console.log('\n❌ FAILED: No tool_calls in response');
        console.log('Content:', choice.message?.content);
        return false;
      }
    } else {
      console.log('\n❌ FAILED: No choices in response');
      return false;
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    return false;
  }
}

async function testMessagesEndpoint() {
  console.log('\n\n=== Testing /v1/messages endpoint ===\n');
  
  const requestData = {
    model: "zidongtaichu,GLM-5.1",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: "Create a file at /tmp/test-messages.txt with content 'Test from messages endpoint'"
      }
    ],
    tools: [
      {
        name: "write_file",
        description: "Write content to a file",
        input_schema: {
          type: "object",
          properties: {
            path: { type: "string" },
            content: { type: "string" }
          },
          required: ["path", "content"]
        }
      }
    ]
  };
  
  try {
    console.log('Sending request...');
    const response = await makeRequest('/v1/messages', requestData);
    
    console.log('Status:', response.statusCode);
    
    if (response.statusCode !== 200) {
      console.error('❌ FAILED: Non-200 status code');
      console.error('Response:', response.data);
      return false;
    }
    
    const responseObj = JSON.parse(response.data);
    console.log('\nResponse structure:');
    console.log('- Type:', responseObj.type);
    console.log('- Role:', responseObj.role);
    
    const content = responseObj.content;
    if (content && Array.isArray(content)) {
      const toolUse = content.find(c => c.type === 'tool_use');
      if (toolUse) {
        console.log('\n✅ SUCCESS: tool_use detected!');
        console.log('- Tool name:', toolUse.name);
        console.log('- Tool input:', JSON.stringify(toolUse.input, null, 2));
        return true;
      } else {
        console.log('\n❌ FAILED: No tool_use in response');
        console.log('Content:', JSON.stringify(content, null, 2));
        return false;
      }
    } else {
      console.log('\n❌ FAILED: Unexpected content format');
      return false;
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    return false;
  }
}

async function main() {
  console.log('=================================================');
  console.log('CCR Tool Calling Verification Test');
  console.log('=================================================\n');
  
  let chatResult = false;
  let messagesResult = false;
  
  try {
    chatResult = await testChatCompletions();
  } catch (e) {
    console.error('Chat completions test error:', e);
  }
  
  try {
    messagesResult = await testMessagesEndpoint();
  } catch (e) {
    console.error('Messages test error:', e);
  }
  
  console.log('\n\n=================================================');
  console.log('SUMMARY');
  console.log('=================================================');
  console.log('/v1/chat/completions:', chatResult ? '✅ PASS' : '❌ FAIL');
  console.log('/v1/messages:', messagesResult ? '✅ PASS' : '❌ FAIL');
  console.log('=================================================');
  
  if (chatResult && messagesResult) {
    console.log('\n🎉 ALL TESTS PASSED! Tool calling is working correctly.');
    console.log('\nThe ccr service is now configured to use GLM-5.1 which supports');
    console.log('tool calling. Claude Code should now be able to execute file operations.');
    process.exit(0);
  } else {
    console.log('\n❌ SOME TESTS FAILED');
    process.exit(1);
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
