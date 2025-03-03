import { BaseProvider, ChatCompletionOptions, ChatCompletionResponse, LLMProvider } from '../../types';
import { CloudflareAIConfig, CloudflareAIMessage } from './types';

export class CloudflareAIProvider implements LLMProvider {
  model: string | null;
  device_map: string | null;
  apiKey: string | null;
  apiEndpoint: string | null;

  constructor(config: CloudflareAIConfig) {
    this.apiKey = config.apiKey;
    this.apiEndpoint = config.apiEndpoint;
    this.model = config.model || '@cf/meta/llama-3.1-8b-instruct';
    this.device_map = null;
  }

  async createCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    try {
      const response = await fetch(`${this.apiEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: options.messages.map(msg => ({
            role: msg.role,
            content: msg.content || '',
          })),
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
      }

      const data = await response.json();
      
      return {
        id: 'cf-' + Date.now(),
        object: 'chat.completion',
        created: Date.now(),
        model: this.model || '',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: data.response || data.choices?.[0]?.message?.content || '',
          },
          finish_reason: 'stop',
        }],
        usage: data.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`CloudflareAI API Error: ${error.message}`);
      }
      throw error;
    }
  }

  async getModels(): Promise<any> {
    return [{
      id: '@cf/meta/llama-3.1-8b-instruct',
      name: 'Llama 3.1 8B Instruct',
      provider: 'cloudflare',
    }];
  }
}

export default CloudflareAIProvider;