import Replicate from 'replicate';
import { handleError } from '../../utils/errorHandler';
import type { BaseProvider, LLMProvider, ChatCompletionOptions, ChatCompletionResponse, Provider, ChatMessage } from '../../types';

const DEFAULT_MODEL = 'meta/llama-2-70b-chat:02e509c789964a7ea8736978a43525956ef40397be9033abf9fd2badfe68c9e3' as const;

interface ReplicateMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function transformMessages(messages: ChatMessage[]): string {
  return messages.map(message => {
    const role = message.role === 'assistant' ? 'Assistant' : 
                message.role === 'system' ? 'System' : 'Human';
    return `${role}: ${message.content}`;
  }).join('\n') + '\nAssistant:';
}

class ReplicateAI implements LLMProvider {
  private client: Replicate;
  public model: string | null;
  public device_map: string | null;
  public apiKey: string | null;
  public apiEndpoint: string | null;
  public provider: "replicate";

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
    this.provider = "replicate";
    this.client = new Replicate({
      auth: this.apiKey || '',
    });
  }

  private formatMessages(messages: ChatMessage[]): string {
    return messages.map(msg => {
      if (msg.role === 'system') {
        return `System: ${msg.content}`;
      } else if (msg.role === 'user') {
        return `Human: ${msg.content}`;
      } else if (msg.role === 'assistant') {
        return `Assistant: ${msg.content}`;
      }
      return msg.content || '';
    }).join('\n');
  }

  async createCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    try {
      const prompt = this.formatMessages(options.messages);
      const modelId = (this.model || DEFAULT_MODEL) as `${string}/${string}:${string}`;
      const output = await this.client.run(
        modelId,
        {
          input: {
            prompt,
            temperature: options.temperature,
            max_tokens: options.max_tokens,
            top_p: options.top_p,
          }
        }
      );

      const content = typeof output === 'string' ? output : Array.isArray(output) ? output.join('') : '';

      return {
        id: 'replicate-' + Date.now(),
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: modelId.split(':')[0],
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content,
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };
    } catch (error) {
      throw error;
    }
  }

  getProviders(): Provider[] {
    return [{
      id: 12,
      logo: "replicate-logo.png",
      name: "Replicate",
      apiUrl: "https://api.replicate.com/v1",
      keyAdded: !!this.apiKey,
      category: 'cloudProviders'
    }];
  }

  async getModels(): Promise<any> {
    return [
      {
        id: 'meta/llama-2-70b-chat',
        object: 'model',
        created: 1677610602,
        owned_by: 'meta',
        provider: 'Replicate'
      },
      {
        id: 'meta/llama-2-13b-chat',
        object: 'model',
        created: 1677610602,
        owned_by: 'meta',
        provider: 'Replicate'
      }
    ];
  }
}

export default ReplicateAI; 