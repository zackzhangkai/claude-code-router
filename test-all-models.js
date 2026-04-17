const http = require('http');

const models = ['GLM-5.1', 'Kimi-K2.5', 'DeepSeek-V3.2', 'MiniMax-M2.7'];

async function testModel(model) {
  return new Promise((resolve) => {
    const testRequest = {
      model: `zidongtaichu,${model}`,
      messages: [
        {
          role: "user",
          content: "创建一个文件 /tmp/test-model.txt，内容为 'test'"
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

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const hasToolCalls = parsed.choices?.[0]?.message?.tool_calls?.length > 0;
          resolve({ model, hasToolCalls, finishReason: parsed.choices?.[0]?.finish_reason });
        } catch (e) {
          resolve({ model, hasToolCalls: false, error: e.message });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ model, hasToolCalls: false, error: e.message });
    });

    req.write(JSON.stringify(testRequest));
    req.end();
  });
}

async function runTests() {
  console.log('Testing all models for tool calling support...\n');
  
  for (const model of models) {
    const result = await testModel(model);
    const status = result.hasToolCalls ? '✅' : '❌';
    console.log(`${status} ${model}: ${result.hasToolCalls ? 'Supports tool_calls' : 'Does NOT support tool_calls'}`);
    if (result.finishReason) {
      console.log(`   Finish reason: ${result.finishReason}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
    // Small delay between requests
    await new Promise(r => setTimeout(r, 500));
  }
}

runTests();
