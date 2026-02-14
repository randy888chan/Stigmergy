import { toolSchemas, sanitizeToolCall } from './utils/sanitization.js';

const newTools = [
  'gemini.query',
  'gemini.health_check',
  'qwen.qwen_generate_code',
  'qwen.qwen_review_code',
  'qwen.qwen_explain_code',
  'qwen_integration.qwen_generate_code',
  'qwen_integration.qwen_review_code',
  'qwen_integration.qwen_explain_code'
];

console.log('Verifying new tool registrations...');

for (const tool of newTools) {
  if (toolSchemas[tool]) {
    console.log(`✅ ${tool} is registered.`);
  } else {
    console.error(`❌ ${tool} is NOT registered.`);
    process.exit(1);
  }
}

// Test sanitization
const geminiArgs = { prompt: 'Hello Gemini' };
try {
  const sanitized = sanitizeToolCall('gemini.query', geminiArgs);
  if (sanitized.prompt === 'Hello Gemini') {
    console.log('✅ gemini.query sanitization works.');
  }
} catch (e) {
  console.error('❌ gemini.query sanitization failed:', e.message);
  process.exit(1);
}

const qwenArgs = { prompt: 'Generate code', language: 'javascript' };
try {
  const sanitized = sanitizeToolCall('qwen.qwen_generate_code', qwenArgs);
  if (sanitized.prompt === 'Generate code' && sanitized.language === 'javascript') {
    console.log('✅ qwen.qwen_generate_code sanitization works.');
  }

  const sanitized2 = sanitizeToolCall('qwen_integration.qwen_generate_code', qwenArgs);
  if (sanitized2.prompt === 'Generate code' && sanitized2.language === 'javascript') {
    console.log('✅ qwen_integration.qwen_generate_code sanitization works.');
  }
} catch (e) {
  console.error('❌ qwen sanitization failed:', e.message);
  process.exit(1);
}

console.log('All verifications passed!');
