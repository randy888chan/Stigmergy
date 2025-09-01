import axios from 'axios';
import "dotenv/config.js";

export class QwenCodeIntegration {
  constructor() {
    this.apiKey = process.env.QWEN_API_KEY;
    this.baseUrl = process.env.QWEN_BASE_URL || 'https://api.qwen.com/v1';
  }

  async generateCode({ prompt, language = 'javascript', context = '' }) {
    if (!this.apiKey) {
      throw new Error('QWEN_API_KEY not configured');
    }

    const fullPrompt = `${context ? 'Context: ' + context + '\n\n' : ''}Generate ${language} code for: ${prompt}`;

    try {
      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        model: 'qwen-coder-plus',
        messages: [
          {
            role: 'system',
            content: `You are Qwen Code, an expert programmer. Generate clean, efficient ${language} code with comments.`
          },
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        code: response.data.choices[0].message.content,
        language,
        model: 'qwen-coder-plus'
      };
    } catch (error) {
      console.error('Qwen API error:', error.response?.data || error.message);
      throw new Error(`Failed to generate code: ${error.message}`);
    }
  }

  async reviewCode({ code, language = 'javascript' }) {
    if (!this.apiKey) {
      throw new Error('QWEN_API_KEY not configured');
    }

    try {
      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        model: 'qwen-coder-plus',
        messages: [
          {
            role: 'system',
            content: 'You are a code reviewer. Analyze the provided code for bugs, performance issues, and best practices.'
          },
          {
            role: 'user',
            content: `Please review this ${language} code:\n\n${code}`
          }
        ],
        temperature: 0.1,
        max_tokens: 1500
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        review: response.data.choices[0].message.content,
        language,
        model: 'qwen-coder-plus'
      };
    } catch (error) {
      console.error('Qwen API error:', error.response?.data || error.message);
      throw new Error(`Failed to review code: ${error.message}`);
    }
  }

  async explainCode({ code, language = 'javascript' }) {
    if (!this.apiKey) {
      throw new Error('QWEN_API_KEY not configured');
    }

    try {
      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        model: 'qwen-coder-plus',
        messages: [
          {
            role: 'system',
            content: 'You are a code educator. Explain code clearly and comprehensively.'
          },
          {
            role: 'user',
            content: `Please explain this ${language} code in detail:\n\n${code}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        explanation: response.data.choices[0].message.content,
        language,
        model: 'qwen-coder-plus'
      };
    } catch (error) {
      console.error('Qwen API error:', error.response?.data || error.message);
      throw new Error(`Failed to explain code: ${error.message}`);
    }
  }
}

// Export tool functions
export async function qwen_generate_code({ prompt, language = 'javascript', context = '' }) {
  const qwen = new QwenCodeIntegration();
  return await qwen.generateCode({ prompt, language, context });
}

export async function qwen_review_code({ code, language = 'javascript' }) {
  const qwen = new QwenCodeIntegration();
  return await qwen.reviewCode({ code, language });
}

export async function qwen_explain_code({ code, language = 'javascript' }) {
  const qwen = new QwenCodeIntegration();
  return await qwen.explainCode({ code, language });
}

export async function qwen_health_check() {
  const qwen = new QwenCodeIntegration();
  try {
    if (!qwen.apiKey) {
      return { status: 'error', message: 'QWEN_API_KEY not configured' };
    }
    
    // Simple health check
    await qwen.generateCode({ prompt: 'hello world', language: 'javascript' });
    return { status: 'ok', message: 'Qwen Code integration is working' };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}