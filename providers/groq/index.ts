import axios from 'axios';
import { handleError } from '../../utils/errorHandler';
import type { BaseProvider, LLMProvider, ChatCompletionOptions, ChatCompletionResponse, Provider, ChatMessage } from '../../types';

interface GroqErrorResponse {
  error: {
    message: string;
    type?: string;
    code?: string;
  };
}

interface GroqMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function transformMessages(messages: ChatMessage[]): GroqMessage[] {
  return messages.map(message => ({
    role: message.role === 'function' || message.role === 'tool' ? 'user' : 
          message.role === 'assistant' ? 'assistant' : 
          message.role === 'system' ? 'system' : 'user',
    content: message.content || ''
  }));
}

class Groq implements LLMProvider {
  private defaultModels: string[];
  public model: string | null;
  public device_map: string | null;
  public apiKey: string | null;
  public apiEndpoint: string | null;
  public provider: "groq";

  constructor(
    model: string | null = null,
    device_map: string | null = null,
    apiKey: string | null = null,
    apiEndpoint: string | null = null
  ) {
    this.defaultModels = [
      "mixtral-8x7b-32768",
      "llama2-70b-4096",
      "gemma-7b-it"
    ];
    this.model = model || "mixtral-8x7b-32768";
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint ?? "https://api.groq.com/v1";
    this.provider = "groq";
  }

  async createCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    try {
      if (!options.messages || options.messages.length === 0) {
        throw new Error("Messages array must not be empty");
      }

      if (!this.apiKey) {
        throw new Error("API key is required");
      }

      const response = await axios.post(
        `${this.apiEndpoint}/chat/completions`,
        {
          model: options.model || this.model || "mixtral-8x7b-32768",
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

      if (options.stream) {
        return {
          id: 'stream',
          object: 'chat.completion.chunk',
          created: Date.now(),
          model: options.model || this.model || "mixtral-8x7b-32768",
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: ''
            },
            finish_reason: null
          }],
          usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0
          }
        };
      }

      return {
        id: response.data.id,
        object: 'chat.completion',
        created: response.data.created,
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
      const errorResponse = handleError(error) as { error: string | GroqErrorResponse['error'] };
      if (typeof errorResponse.error === 'object' && 'message' in errorResponse.error) {
        throw new Error(errorResponse.error.message);
      } else {
        throw new Error(String(errorResponse.error));
      }
    }
  }

  getProviders(): Provider[] {
    return [{
      id: 7,
      logo: "groq-logo.png",
      name: "groq",
      apiUrl: this.apiEndpoint || "https://api.groq.com/v1",
      keyAdded: !!this.apiKey,
      category: 'cloudProviders'
    }];
  }

  async getModels() {
    return this.defaultModels.map(modelId => ({
      id: modelId,
      name: modelId,
      provider: "Groq",
      type: "chat"
    }));
  }
}

export default Groq; 