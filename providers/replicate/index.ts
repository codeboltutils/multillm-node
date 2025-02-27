import Replicate from 'replicate';
import { handleError } from '../../utils/errorHandler';
import type { BaseProvider } from '../../types';

class ReplicateHandler implements BaseProvider {
  private client: Replicate;
  public model: string | null;
  public device_map: string | null;
  public apiKey: string | null;
  public apiEndpoint: string | null;

  constructor(
    model: string | null = null,
    device_map: string | null = null,
    apiKey: string | null = null,
    apiEndpoint: string | null = null
  ) {
    this.model = model;
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint;
    this.client = new Replicate({ auth: apiKey || '' });
  }

  async createCompletion(options: any) {
    try {
      const messages = options.messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }));

      const output = await this.client.run(
        (this.model || "meta/llama-2-70b-chat:latest") as `${string}/${string}:${string}`,
        {
          input: {
            prompt: this.formatPrompt(messages),
            max_new_tokens: options.max_tokens || 100,
            temperature: options.temperature || 0.7
          }
        }
      );

      return {
        choices: [{
          message: {
            role: 'assistant',
            content: output
          }
        }]
      };
    } catch (error) {
      return handleError(error);
    }
  }

  private formatPrompt(messages: any[]): string {
    return messages.map(msg => {
      const role = msg.role === 'assistant' ? 'Assistant' : 'Human';
      return `${role}: ${msg.content}`;
    }).join('\n') + '\nAssistant:';
  }

  async getModels() {
    return [
      {
        id: "meta/llama-2-70b-chat:latest",
        provider: "Replicate",
        type: "chat"
      }
    ];
  }
}

export default ReplicateHandler; 