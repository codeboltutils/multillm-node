import axios from 'axios';
import { handleError } from '../../utils/errorHandler';
import type { BaseProvider, LLMProvider, ChatCompletionOptions, ChatCompletionResponse, Provider, ChatMessage } from '../../types';

interface PerplexityMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function transformMessages(messages: ChatMessage[]): PerplexityMessage[] {
  return messages.map(message => ({
    role: message.role === 'function' || message.role === 'tool' ? 'user' : 
          message.role === 'assistant' ? 'assistant' : 
          message.role === 'system' ? 'system' : 'user',
    content: message.content || ''
  }));
}

class Perplexity implements LLMProvider {
  private defaultModels: string[];
  public model: string | null;
  public device_map: string | null;
  public apiKey: string | null;
  public apiEndpoint: string | null;
  public provider: "perplexity";

  constructor(
    model: string | null = null,
    device_map: string | null = null,
    apiKey: string | null = null,
    apiEndpoint: string | null = null
  ) {
    this.defaultModels = [
      "pplx-7b-online",
      "pplx-70b-online",
      "pplx-7b-chat",
      "pplx-70b-chat",
      "codellama-34b-instruct",
      "mistral-7b-instruct",
      "mixtral-8x7b-instruct"
    ];
    this.model = model || "pplx-7b-chat";
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint ?? "https://api.perplexity.ai";
    this.provider = "perplexity";
  }

  async createCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    try {
      const response = await axios.post(
        `${this.apiEndpoint}/chat/completions`,
        {
          model: options.model || this.model || "pplx-7b-chat",
          messages: transformMessages(options.messages),
          temperature: options.temperature,
          max_tokens: options.max_tokens,
          top_p: options.top_p,
          stream: options.stream,
          stop: options.stop
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`
          }
        }
      );

      return {
        id: response.data.id,
        object: 'chat.completion',
        created: Date.now(),
        model: response.data.model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: response.data.choices[0].message.content
          },
          finish_reason: response.data.choices[0].finish_reason
        }],
        usage: response.data.usage
      };
    } catch (error) {
      throw handleError(error);
    }
  }

  getProviders(): Provider[] {
    return [{
      id: 6,
      logo: "perplexity-logo.png",
      name: "Perplexity AI",
      apiUrl: this.apiEndpoint || "https://api.perplexity.ai",
      keyAdded: !!this.apiKey,
      category: 'cloudProviders'
    }];
  }

  async getModels() {
    return this.defaultModels.map(modelId => ({
      id: modelId,
      name: modelId,
      provider: "Perplexity",
      type: "chat"
    }));
  }
}

export default Perplexity; 