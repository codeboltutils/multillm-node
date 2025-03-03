import axios from 'axios';
import { handleError } from '../../utils/errorHandler';
import type { 
  BaseProvider, 
  LLMProvider, 
  ChatCompletionOptions, 
  ChatCompletionResponse, 
  Provider, 
  ChatMessage
} from '../../types';

interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

interface FunctionCall {
  name: string;
  arguments: string;
}

interface ChatCompletionOptionsWithTools extends ChatCompletionOptions {
  tools?: any[];
  functions?: any[];
  tool_choice?: any;
  function_call?: any;
}

interface ExtendedChatMessage extends ChatMessage {
  function_call?: FunctionCall;
  tool_calls?: ToolCall[];
}

interface MistralMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

interface MistralChoice {
  index: number;
  message: MistralMessage;
  finish_reason: string;
}

interface MistralStreamChoice {
  index: number;
  delta: {
    role?: string;
    content?: string;
  };
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
}

interface MistralStreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: MistralStreamChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

function transformMessages(messages: ExtendedChatMessage[]): MistralMessage[] {
  return messages.map(message => {
    const baseMessage: MistralMessage = {
      role: message.role === 'function' || message.role === 'tool' ? 'tool' : 
            message.role === 'assistant' ? 'assistant' : 
            message.role === 'system' ? 'system' : 'user',
      content: message.content || null
    };

    if (message.function_call || message.tool_calls) {
      baseMessage.tool_calls = (message.function_call ? [{
        id: `call_${Date.now()}`,
        type: 'function',
        function: {
          name: message.function_call.name,
          arguments: message.function_call.arguments
        }
      }] : message.tool_calls);
    }

    if (message.tool_call_id) {
      baseMessage.tool_call_id = message.tool_call_id;
    }

    return baseMessage;
  });
}

class MistralAI implements LLMProvider {
  public model: string | null;
  public device_map: string | null;
  public apiKey: string | null;
  public apiEndpoint: string | null;
  public provider: "mistral";

  constructor(
    model: string | null = null,
    device_map: string | null = null,
    apiKey: string | null = null,
    apiEndpoint: string | null = null
  ) {
    this.model = model || "mistral-large-latest";
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint ?? "https://api.mistral.ai/v1";
    this.provider = "mistral";
  }

  async createCompletion(options: ChatCompletionOptionsWithTools): Promise<ChatCompletionResponse> {
    try {
      const response = await axios.post(
        `${this.apiEndpoint}/chat/completions`,
        {
          model: options.model || this.model || "mistral-large-latest",
          messages: transformMessages(options.messages),
          temperature: options.temperature,
          max_tokens: options.max_tokens,
          top_p: options.top_p,
          stream: options.stream,
          stop: options.stop,
          tools: options.tools || options.functions,
          tool_choice: options.tool_choice || options.function_call
        },
        {
          headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${this.apiKey}`,
          },
          responseType: options.stream ? 'stream' : 'json'
        }
      );

      if (options.stream) {
        const stream = response.data;
        return new Promise((resolve, reject) => {
          const streamResponse: ChatCompletionResponse = {
            id: '',
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model: options.model || this.model || "mistral-large-latest",
            choices: [],
            usage: {
              prompt_tokens: 0,
              completion_tokens: 0,
              total_tokens: 0
            }
          };

          stream.on('data', (chunk: Buffer) => {
            try {
              const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = JSON.parse(line.slice(6));
                  if (data.choices && Array.isArray(data.choices)) {
                    streamResponse.choices = data.choices.map((choice: any) => ({
                      index: choice.index,
                      delta: choice.delta,
                      finish_reason: choice.finish_reason
                    }));
                  }
                  if (data.usage) {
                    streamResponse.usage = data.usage;
                  }
                }
              }
            } catch (error) {
              reject(handleError(error));
            }
          });

          stream.on('end', () => {
            resolve(streamResponse);
          });

          stream.on('error', (error: unknown) => {
            reject(handleError(error));
          });
        });
      }

      // Transform Mistral response to standard format
      return {
        id: response.data.id,
        object: 'chat.completion',
        created: response.data.created,
        model: response.data.model,
        choices: response.data.choices.map((choice: MistralChoice) => ({
          index: choice.index,
          message: {
            role: choice.message.role,
            content: choice.message.content,
            tool_calls: choice.message.tool_calls,
            tool_call_id: choice.message.tool_call_id
          },
          finish_reason: choice.finish_reason
        })),
        usage: response.data.usage
      };
    } catch (error) {
      throw handleError(error);
    }
  }

  getProviders(): Provider[] {
    return [{
      id: 3,
      logo: "mistral-logo.png",
      name: "Mistral",
      apiUrl: this.apiEndpoint || "https://api.mistral.ai/v1",
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
          },
        }
      );

      return response.data.data.map((model: { id: string }) => ({
        id: model.id,
        name: model.id,
        provider: "Mistral",
        type: "chat"
      }));
    } catch (error) {
      throw handleError(error);
    }
  }
}

export default MistralAI; 