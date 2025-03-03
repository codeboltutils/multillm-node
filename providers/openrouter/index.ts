import axios from 'axios';
import { handleError } from '../../utils/errorHandler';
import type { BaseProvider, LLMProvider, ChatCompletionOptions, ChatCompletionResponse, Provider, ChatMessage } from '../../types';

interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function transformMessages(messages: ChatMessage[]): OpenRouterMessage[] {
  return messages.map(message => ({
    role: message.role === 'function' || message.role === 'tool' ? 'user' : 
          message.role === 'assistant' ? 'assistant' : 
          message.role === 'system' ? 'system' : 'user',
    content: message.content || ''
  }));
}

class OpenRouter implements LLMProvider {
  private defaultModels: string[];
  public model: string | null;
  public device_map: string | null;
  public apiKey: string | null;
  public apiEndpoint: string | null;
  public provider: "openrouter";

  constructor(
    model: string | null = null,
    device_map: string | null = null,
    apiKey: string | null = null,
    apiEndpoint: string | null = null
  ) {
    this.defaultModels = [
      "anthropic/claude-3-sonnet",
      "anthropic/claude-3-haiku",
      "meta-llama/llama-2-70b-chat",
      "google/gemini-pro",
      "mistral/mixtral-8x7b",
      "gryphe/mythomist-7b",
      "nousresearch/nous-hermes-2-mixtral-8x7b-dpo"
    ];
    this.model = model || "anthropic/claude-3-sonnet";
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint ?? "https://openrouter.ai/api/v1";
    this.provider = "openrouter";
  }

  async createCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    try {
      const response = await axios.post(
        `${this.apiEndpoint}/chat/completions`,
        {
          model: options.model || this.model || "anthropic/claude-3-sonnet",
          messages: transformMessages(options.messages),
          temperature: options.temperature,
          max_tokens: options.max_tokens,
          top_p: options.top_p,
          stream: options.stream,
          stop: options.stop,
          tools: options.tools
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`,
            "HTTP-Referer": "https://arrowai.com",
            "X-Title": "MultiLLM Node"
          }
        }
      );

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
      throw handleError(error);
    }
  }

  getProviders(): Provider[] {
    return [{
      id: 11,
      logo: "openrouter-logo.png",
      name: "OpenRouter",
      apiUrl: this.apiEndpoint || "https://openrouter.ai/api/v1",
      keyAdded: !!this.apiKey,
      category: 'cloudProviders'
    }];
  }

  async getModels() {
    try {
      const response = await axios.get(
        `${this.apiEndpoint}/models`,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`,
            "HTTP-Referer": "https://arrowai.com",
            "X-Title": "MultiLLM Node"
          }
        }
      );

      return response.data.data.map((model: any) => ({
        id: model.id,
        name: model.name || model.id,
        provider: "OpenRouter",
        type: "chat"
      }));
    } catch (error) {
      // If we can't fetch models, return default models
      return this.defaultModels.map(modelId => ({
        id: modelId,
        name: modelId,
        provider: "OpenRouter",
        type: "chat"
      }));
    }
  }
}

export default OpenRouter; 