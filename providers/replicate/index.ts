import Replicate from 'replicate';
import { handleError } from '../../utils/errorHandler';
import type { BaseProvider, LLMProvider, ChatCompletionOptions, ChatCompletionResponse, Provider, ChatMessage } from '../../types';

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

class ReplicateHandler implements LLMProvider {
  private client: Replicate;
  private defaultModels: string[];
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
    this.defaultModels = [
      "meta/llama-2-70b-chat:latest",
      "mistralai/mixtral-8x7b-instruct-v0.1",
      "01-ai/yi-34b-chat:latest",
      "anthropic/claude-3-sonnet:latest"
    ];
    this.model = model || "meta/llama-2-70b-chat:latest";
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint;
    this.provider = "replicate";
    this.client = new Replicate({ auth: apiKey || '' });
  }

  async createCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    try {
      const modelId = options.model || this.model || "meta/llama-2-70b-chat:latest";
      const output = await this.client.run(
        modelId as `${string}/${string}:${string}`,
        {
          input: {
            prompt: transformMessages(options.messages),
            max_new_tokens: options.max_tokens || 1024,
            temperature: options.temperature || 0.7,
            top_p: options.top_p || 1,
            stop_sequences: options.stop
          }
        }
      );

      return {
        id: `replicate-${Date.now()}`,
        object: 'chat.completion',
        created: Date.now(),
        model: modelId,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: typeof output === 'string' ? output : output.join('')
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };
    } catch (error) {
      throw handleError(error);
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

  async getModels() {
    return this.defaultModels.map(modelId => ({
      id: modelId,
      name: modelId,
      provider: "Replicate",
      type: "chat"
    }));
  }
}

export default ReplicateHandler; 