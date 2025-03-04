import axios, { AxiosError } from 'axios';
import { handleError } from '../../utils/errorHandler';
import type { BaseProvider, LLMProvider, ChatCompletionOptions, ChatCompletionResponse, Provider, ChatMessage } from '../../types';

interface PerplexityMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  name?: string;
}

interface PerplexityErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
  };
}

function transformMessages(messages: ChatMessage[]): PerplexityMessage[] {
  return messages.map(message => {
    const transformed: PerplexityMessage = {
      role: message.role === 'function' || message.role === 'tool' ? 'assistant' : 
            message.role === 'assistant' ? 'assistant' : 
            message.role === 'system' ? 'system' : 'user',
      content: message.content || ''
    };
    
    if ((message.role === 'function' || message.role === 'tool') && message.name) {
      transformed.content = `[${message.name}]: ${message.content}`;
    }
    
    return transformed;
  });
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
      "sonar-deep-research",
      "sonar-reasoning-pro",
      "sonar-reasoning",
      "sonar-pro",
      "sonar",
      "r1-1776"
    ];
    this.model = model || "sonar";
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint;
    this.provider = "perplexity";
  }

  async createCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    if (!options.messages || options.messages.length === 0) {
      const error = new Error('No messages were received in request');
      error.name = 'PerplexityError';
      throw error;
    }

    try {
      const response = await axios.post(
        `${this.apiEndpoint}/chat/completions`,
        {
          model: options.model || this.model || "sonar",
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
          },
          validateStatus: null
        }
      );

      if (response.status === 401 || response.status === 403) {
        const error = new Error('Invalid API key');
        error.name = 'PerplexityError';
        throw error;
      }

      if (response.status !== 200) {
        const errorMessage = response.data?.error?.message || `Request failed with status code ${response.status}`;
        const error = new Error(errorMessage);
        error.name = 'PerplexityError';
        if (errorMessage.includes('Invalid model')) {
          throw new Error('Invalid model');
        }
        if (errorMessage.includes('No messages were received')) {
          throw new Error('No messages were received in request');
        }
        throw error;
      }

      const baseResponse = {
        id: response.data.id || 'perplexity-' + Date.now(),
        object: 'chat.completion',
        created: response.data.created || Math.floor(Date.now() / 1000),
        model: response.data.model || options.model || this.model || "sonar",
        usage: response.data.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };

      if (options.stream) {
        const content = response.data.choices?.[0]?.message?.content || '';
        return {
          ...baseResponse,
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: content
            },
            delta: {
              role: 'assistant',
              content: content
            },
            finish_reason: response.data.choices?.[0]?.finish_reason || null
          }]
        };
      }

      return {
        ...baseResponse,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: response.data.choices?.[0]?.message?.content || ''
          },
          finish_reason: response.data.choices?.[0]?.finish_reason || null
        }]
      };

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<PerplexityErrorResponse>;
        if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
          const error = new Error('Invalid API key');
          error.name = 'PerplexityError';
          throw error;
        }
        if (axiosError.response?.data?.error?.message) {
          const error = new Error(axiosError.response.data.error.message);
          error.name = 'PerplexityError';
          throw error;
        }
      }
      throw error;
    }
  }

  async getModels(): Promise<any> {
    return this.defaultModels.map(modelId => ({
      id: modelId,
      name: modelId,
      provider: "Perplexity",
      type: "chat"
    }));
  }
}

export default Perplexity; 