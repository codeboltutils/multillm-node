import Anthropic from '@anthropic-ai/sdk';
import type { Message, MessageParam, ContentBlock, TextBlock } from '@anthropic-ai/sdk/resources/messages';
import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import type { BaseProvider, ToolSchema, LLMProvider, ChatCompletionOptions, ChatCompletionResponse, Provider, ChatMessage } from '../../types';

function transformMessages(messages: ChatMessage[]): MessageParam[] {
  return messages.map(message => {
    if (message.tool_calls && Array.isArray(message.tool_calls)) {
      const toolCalls = message.tool_calls.map((toolCall) => ({
        role: 'assistant' as const,
        content: [
          ...(message.content ? [{
            type: 'text' as const,
            text: message.content,
          }] : []),
          {
            type: 'tool_use' as const,
            id: toolCall.id,
            name: toolCall.function.name,
            input: JSON.parse(toolCall.function.arguments)
          }
        ]
      }));
      return toolCalls[0]; // Return first tool call message
    }
    return {
      role: message.role as 'assistant' | 'user',
      content: message.content || ''
    };
  });
}

<<<<<<< HEAD
=======

>>>>>>> fc67efa (changes)
function convertFunctionFormat(array: any[]): ToolSchema[] {
  return array.map((item: { type: string; function?: { name: string; description: string; parameters: any } }) => {
    if (item.type === "function" && item.function) {
      return {
        name: item.function.name,
        description: item.function.description,
        input_schema: item.function.parameters
      } as ToolSchema;
    }
    return null;
  }).filter(Boolean) as ToolSchema[];
}

interface AnthropicModelInfo {
  maxTokens: number;
  contextWindow: number;
  supportsImages: boolean;
  supportsPromptCache: boolean;
  inputPrice: number;
  outputPrice: number;
  cacheWritesPrice: number;
  cacheReadsPrice: number;
}

interface AnthropicModels {
  [key: string]: AnthropicModelInfo;
}

interface AnthropicCreateParams {
  messages: MessageParam[];
  system: Array<{ text: string }>;
  tools?: Tool[];
  model: string;
}

const anthropicDefaultModelId = "claude-3-7-sonnet-20250219";

const anthropicModels: AnthropicModels = {
  "claude-3-7-sonnet-20250219": {
    maxTokens: 8192,
    contextWindow: 200_000,
    supportsImages: true,
    supportsPromptCache: true,
    inputPrice: 3.0,
    outputPrice: 15.0,
    cacheWritesPrice: 3.75,
    cacheReadsPrice: 0.3,
  },
  "claude-3-opus-20240229": {
    maxTokens: 4096,
    contextWindow: 200_000,
    supportsImages: true,
    supportsPromptCache: true,
    inputPrice: 15.0,
    outputPrice: 75.0,
    cacheWritesPrice: 18.75,
    cacheReadsPrice: 1.5,
  },
  "claude-3-haiku-20240307": {
    maxTokens: 4096,
    contextWindow: 200_000,
    supportsImages: true,
    supportsPromptCache: true,
    inputPrice: 0.25,
    outputPrice: 1.25,
    cacheWritesPrice: 0.3,
    cacheReadsPrice: 0.03,
  },
};

interface AnthropicResponse {
  id: string;
  model: string;
  role: string;
  content: ContentBlock[];
  stop_reason: string;
  usage: {
    input_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface AnthropicTool {
  type: 'function';
  name: string;
  description: string;
  parameters: Record<string, any>;
  input_schema?: Record<string, any>;
}

class AnthropicAI implements LLMProvider {
  private client: Anthropic;
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
    this.client = new Anthropic({
<<<<<<< HEAD
      apiKey: this.apiKey || '',
=======
      baseURL: "https://gateway.ai.cloudflare.com/v1/8073e84dbfc4e2bc95666192dcee62c0/codebolt/anthropic", //|| "https://api.anthropic.com",
      apiKey: apiKey ?? undefined,
>>>>>>> fc67efa (changes)
    });
  }

  private convertToOpenAIFormat(anthropicResponse: AnthropicResponse): ChatCompletionResponse {
    const textMessages: string[] = [];
    const toolCalls: ChatMessage['tool_calls'] = [];

    if (Array.isArray(anthropicResponse.content)) {
      anthropicResponse.content.forEach((item) => {
        if (item.type === 'text' && 'text' in item) {
          textMessages.push(item.text);
        } else if (item.type === 'tool_use' && 'tool_name' in item && 'tool_input' in item) {
          toolCalls.push({
            id: `tool_${Date.now()}`,
            type: 'function',
            function: {
              name: item.tool_name as string,
              arguments: JSON.stringify(item.tool_input)
            }
          });
        }
      });
    }

    const message: ChatMessage = {
      role: 'assistant',
      content: textMessages.join("\n"),
      tool_calls: toolCalls.length > 0 ? toolCalls : undefined
    };

    let finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null = null;
    
    switch (anthropicResponse.stop_reason) {
      case 'tool_calls':
        finishReason = 'tool_calls';
        break;
      case 'end_turn':
      case 'stop_sequence':
        finishReason = 'stop';
        break;
      case 'max_tokens':
        finishReason = 'length';
        break;
      default:
        finishReason = null;
    }

    return {
      id: anthropicResponse.id,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: this.model || 'claude-3',
      choices: [
        {
          index: 0,
          message,
          finish_reason: finishReason
        }
      ],
      usage: {
        prompt_tokens: anthropicResponse.usage.input_tokens,
        completion_tokens: anthropicResponse.usage.completion_tokens,
        total_tokens: anthropicResponse.usage.total_tokens
      }
    };
  }

  async createCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    try {
      const messages = transformMessages(options.messages);

<<<<<<< HEAD
      const tools: AnthropicTool[] | undefined = options.tools?.map(tool => ({
        type: 'function' as const,
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters,
        input_schema: tool.function.parameters
      }));

      const response = await this.client.messages.create({
        model: options.model || this.model || 'claude-3-opus-20240229',
        max_tokens: options.max_tokens || 1024,
        messages,
        temperature: options.temperature,
        top_p: options.top_p,
        tools: tools as Tool[] | undefined
      });

      // Convert the response to our expected format
      const anthropicResponse: AnthropicResponse = {
        id: response.id,
        model: response.model,
        role: response.role,
        content: response.content,
        stop_reason: response.stop_reason || '',
        usage: {
          input_tokens: response.usage.input_tokens,
          completion_tokens: response.usage.output_tokens,
          total_tokens: response.usage.input_tokens + response.usage.output_tokens
        }
      };

      return this.convertToOpenAIFormat(anthropicResponse);
=======
              if (index === lastUserMsgIndex || index === secondLastMsgUserIndex) {
                return {
                  ...message,
                  content:
                    typeof message.content === "string"
                      ? [
                        {
                          type: "text" as const,
                          text: message.content,
                          cache_control: { type: "ephemeral" as const },
                        },
                      ]
                      : (message.content as Array<{ type: string; text: string }>).map((content, contentIndex: number) =>
                        contentIndex === message.content.length - 1
                          ? { ...content, cache_control: { type: "ephemeral" as const } }
                          : content
                      ),
                };
              } else if (message.role !== "system") {
                return message;
              }
            }),
            tools: convertFunctionFormat(tools) || [],
            tool_choice: { type: "auto" as const },
          }
          console.log("message to claud ai")

          console.log(JSON.stringify(inputMessage));
          const message = await this.client.beta.promptCaching.messages.create(
            inputMessage,
            (() => {
              switch (modelId) {
                case "claude-3-7-sonnet-20250219":
                  return {
                    headers: {
                      "anthropic-beta": "prompt-caching-2024-07-31",
                    },
                  };
                case "claude-3-haiku-20240307":
                  return {
                    headers: { "anthropic-beta": "prompt-caching-2024-07-31" },
                  };
                default:
                  return undefined;
              }
            })()
          );

          console.log(JSON.stringify(message))
          return convertToOpenAIFormat(message);
        }
        default: {
          const message = await this.client.messages.create({
            model: modelId,
            max_tokens: 1024,// this.getModel().info.maxTokens,
            temperature: 0.2,
            system: [{ text: systemPrompt[0].text, type: "text" as const }],
            messages: messages.map((msg: { content: string | Array<{ type: string; text: string }> }) => ({
              ...msg,
              content: typeof msg.content === "string" ? [{ type: "text" as const, text: msg.content }] : msg.content
            })),
            tools: convertFunctionFormat(tools) || [],
            tool_choice: { type: "auto" as const },
          });
          return convertToOpenAIFormat(message);
        }
      }
>>>>>>> fc67efa (changes)
    } catch (error) {
      throw error;
    }
  }

  async getModels(): Promise<any> {
    return Object.entries(anthropicModels).map(([id, info]) => ({
      id,
      object: 'model',
      created: 1709251200,
      owned_by: 'anthropic',
      provider: 'Anthropic'
    }));
  }

  getProviders(): Provider[] {
    return [{
      id: 1,
      logo: '',
      name: 'Anthropic',
      apiUrl: this.apiEndpoint || '',
      keyAdded: !!this.apiKey,
      category: 'cloudProviders'
    }];
  }
}

export default AnthropicAI; 