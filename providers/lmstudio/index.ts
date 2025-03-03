import axios from 'axios';
import { handleError } from '../../utils/errorHandler';
import type { BaseProvider, LLMProvider, ChatCompletionOptions, ChatCompletionResponse, Provider, ChatMessage } from '../../types';
import parseToolToSystemPrompt, { parseAssistantMessage } from './../../utils/toolParser'

interface LMStudioMessage {
  role: string;
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
  messages: ChatMessage[];
  tools: Tool[];
  supportTools?: boolean;
}

type FinishReason = 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;

interface LMStudioResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
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
  public apiKey: string | null;
  public apiEndpoint: string | null;
  public provider: "lmstudio";

  constructor(
    model: string | null = null,
    device_map: string | null = null,
    apiEndpoint: string | null = null
  ) {
    this.defaultModels = ["local-model"];
    this.model = model;
    this.device_map = device_map;
    this.apiKey = null;
    this.apiEndpoint = apiEndpoint ?? 'http://localhost:1234/v1';
    this.provider = "lmstudio";
  }

  private normalizeFinishReason(reason: string | null): 'stop' | 'length' | 'tool_calls' | 'content_filter' | null {
    if (!reason) return null;
    const validReasons = ['stop', 'length', 'tool_calls', 'content_filter'] as const;
    return validReasons.includes(reason as any) ? reason as 'stop' | 'length' | 'tool_calls' | 'content_filter' : 'stop';
  }

  async createCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    try {
      const response = await axios.post<LMStudioResponse>(
        `${this.apiEndpoint}/chat/completions`,
        {
          ...options,
          model: options.model || this.model || 'local-model',
          messages: options.messages
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const message: ChatMessage = {
        role: 'assistant',
        content: response.data.choices[0].message.content,
      };

      return {
        id: response.data.id || 'chat-' + Date.now(),
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: this.model || 'local-model',
        choices: [
          {
            index: 0,
            message,
            finish_reason: this.normalizeFinishReason(response.data.choices[0].finish_reason)
          }
        ],
        usage: response.data.usage || {
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
      id: 10,
      logo: "lmstudio-logo.png",
      name: "LM Studio",
      apiUrl: this.apiEndpoint || "http://localhost:1234/v1",
      keyAdded: true, // No API key needed
      category: 'localProviders'
    }];
  }

  async getModels(): Promise<any> {
    return this.defaultModels.map(modelId => ({
      id: modelId,
      name: modelId,
      provider: 'LMStudio',
      type: 'chat'
    }));
  }
}

export default LMStudio; 