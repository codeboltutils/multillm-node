import axios from 'axios';
import { handleError } from '../../utils/errorHandler';
import type { BaseProvider, LLMProvider, ChatCompletionOptions, ChatCompletionResponse, Provider, ChatMessage } from '../../types';
import parseToolToSystemPrompt, { parseAssistantMessage } from './../../utils/toolParser'

interface LMStudioMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function transformMessages(messages: ChatMessage[]): LMStudioMessage[] {
  return messages.map(message => ({
    role: message.role === 'function' || message.role === 'tool' ? 'user' : 
          message.role === 'assistant' ? 'assistant' : 
          message.role === 'system' ? 'system' : 'user',
    content: message.content || ''
  }));
}

interface ToolFunction {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: {
      command: {
        type: string;
        description: string;
      }
    };
    required: string[];
  };
}

interface Tool {
  type: string;
  function: ToolFunction;
}

interface CompletionOptions {
  model: string;
  messages: Message[];
  tools: Tool[]
}

interface CompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: Message;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface Model {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  provider?: string;
}

class LMStudio implements LLMProvider {
  private defaultModels: string[];
  public model: string | null;
  public device_map: string | null;
  public apiKey: null = null;
  public apiEndpoint: string | null;
  public provider: "lmstudio";

  constructor(
    model: string | null = null,
    device_map: string | null = null,
    apiKey: string | null = null,
    apiEndpoint: string | null = null
  ) {
    this.defaultModels = ["local-model"];
    this.model = model || "local-model";
    this.device_map = device_map;
    this.apiKey = null; // LMStudio doesn't use API keys
    this.apiEndpoint = apiEndpoint ?? "http://localhost:1234/v1";
    this.provider = "lmstudio";
  }

  async createCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    try {
      const response = await axios.post(
        `${this.apiEndpoint}/chat/completions`,
        {
          model: options.model || this.model || "local-model",
          messages: transformMessages(options.messages),
          temperature: options.temperature,
          max_tokens: options.max_tokens,
          top_p: options.top_p,
          stream: options.stream,
          stop: options.stop
        },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      return {
        id: `lmstudio-${Date.now()}`,
        object: 'chat.completion',
        created: Date.now(),
        model: options.model || this.model || "local-model",
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: response.data.choices[0].message.content
          },
          finish_reason: response.data.choices[0].finish_reason || 'stop'
        }],
        usage: response.data.usage || {
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
      id: 10,
      logo: "lmstudio-logo.png",
      name: "LM Studio",
      apiUrl: this.apiEndpoint || "http://localhost:1234/v1",
      keyAdded: true, // No API key needed
      category: 'localProviders'
    }];
  }

  async getModels() {
    try {
      const response = await axios.get(
        `${this.apiEndpoint}/models`,
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      return response.data.data.map((model: any) => ({
        id: model.id,
        name: model.id,
        provider: "LM Studio",
        type: "chat"
      }));
    } catch (error) {
      // If we can't fetch models, return default models
      return this.defaultModels.map(modelId => ({
        id: modelId,
        name: modelId,
        provider: "LM Studio",
        type: "chat"
      }));
    }
  }
}

export default LMStudio; 