import { Ai } from '@cloudflare/ai';
import { handleError } from '../../utils/errorHandler';
import type { BaseProvider } from '../../types';

interface CloudflareOptions extends BaseProvider {
  model: string | null;
  device_map: string | null;
  apiKey: string | null;
  apiEndpoint: string | null;
  accountId?: string;
}

class CloudflareProvider implements BaseProvider {
  private options: CloudflareOptions;
  private client: Ai;
  private chatModels: string[];
  public model: string | null;
  public device_map: string | null;
  public apiKey: string | null;
  public apiEndpoint: string | null;

  constructor(
    model: string | null = null,
    device_map: string | null = null,
    apiKey: string | null = null,
    apiEndpoint: string | null = null,
    accountId: string | null = null
  ) {
    this.chatModels = [
      "@cf/meta/llama-2-7b-chat-int8",
      "@cf/mistral/mistral-7b-instruct-v0.1",
      "@cf/meta/codellama-7b-instruct",
      "@cf/openchat/openchat-3.5-0106"
    ];
    this.model = model || "@cf/meta/llama-2-7b-chat-int8";
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint;
    
    this.options = { 
      model: this.model, 
      device_map, 
      apiKey, 
      apiEndpoint,
      accountId: accountId || undefined
    };

    this.client = new Ai({
      apiToken: apiKey || '',
      accountId: accountId || '',
      endpoint: apiEndpoint || 'https://api.cloudflare.com/client/v4/accounts'
    });
  }

  private formatPrompt(messages: any[]): string {
    return messages.map(msg => {
      const role = msg.role === 'assistant' ? 'Assistant' : 'Human';
      return `${role}: ${msg.content}`;
    }).join('\\n') + '\\nAssistant:';
  }

  async createCompletion(options: any) {
    try {
      const response = await this.client.run('@cf/meta/llama-2-7b-chat-int8', {
        messages: options.messages,
        max_tokens: options.max_tokens || 2000,
        temperature: options.temperature || 0.7,
        stream: false
      });

      // Cast response to any to handle dynamic response structure
      const result = response as any;

      return {
        choices: [{
          message: {
            role: 'assistant',
            content: result.response || result.text || ''
          }
        }]
      };
    } catch (error) {
      return handleError(error);
    }
  }

  async getModels() {
    try {
      return this.chatModels.map(modelId => ({
        id: modelId,
        provider: "Cloudflare",
        type: "chat"
      }));
    } catch (error) {
      return handleError(error);
    }
  }
}

export default CloudflareProvider; 