#!/bin/bash

# Test to compare what Claude Code expects vs what ccr returns

echo "=== Testing ccr /v1/chat/completions ==="
curl -s http://127.0.0.1:34567/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test" \
  -d '{
    "model": "zidongtaichu,GLM-5.1",
    "messages": [{"role": "user", "content": "Say hello"}],
    "stream": false
  }' | jq '.choices[0].message.content' 2>/dev/null || echo "Failed"

echo ""
echo "=== Testing ccr /v1/messages ==="
curl -s http://127.0.0.1:34567/v1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "zidongtaichu,GLM-5.1",
    "messages": [{"role": "user", "content": "Say hello"}],
    "max_tokens": 100
  }' | jq '.content[0].text' 2>/dev/null || echo "Failed"
