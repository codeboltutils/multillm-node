import Anthropic from '@anthropic-ai/sdk';
import type { Message, MessageParam, ContentBlock, TextBlock, Tool } from '@anthropic-ai/sdk/resources/messages';
import type { BaseProvider, ToolSchema, LLMProvider, ChatCompletionOptions, ChatCompletionResponse, Provider, ChatMessage } from '../../types';
import OpenAI from 'openai';

function transformMessages(openAiMessages: OpenAI.Chat.ChatCompletionMessageParam[]): Anthropic.Messages.MessageParam[] {
  return openAiMessages.map((openAiMessage) => {
    // Handle 'tool' role conversion to 'user' with tool_result
    if (openAiMessage.role === "tool") {
      return {
        role: "user" as const,
        content: [
          {
            type: "tool_result" as const,
            tool_use_id: openAiMessage.tool_call_id || "default_tool_use_id",
            content: typeof openAiMessage.content === "string" ? openAiMessage.content : JSON.stringify(openAiMessage.content),
          },
        ],
      };
    }

    // Handle 'assistant' role with possible tool_calls
    if (openAiMessage.role === "assistant") {
      const content: Anthropic.ContentBlock[] = [];
      // Add text content if present
      if (typeof openAiMessage.content === "string" && openAiMessage.content !== "") {
        content.push({
          type: "text" as const,
          text: openAiMessage.content,
          citations: [],
        });
      }
      // Add tool_use blocks for each tool call
      openAiMessage.tool_calls?.forEach((toolCall) => {
        content.push({
          type: "tool_use" as const,
          id: toolCall.id,
          name: toolCall.function.name,
          input: JSON.parse(toolCall.function.arguments),
        });
      });
      return { role: "assistant" as const, content };
    }

    // Map all roles to either 'user' or 'assistant'
    const role = ((): "user" | "assistant" => {
      const messageRole = openAiMessage.role as string;
      return messageRole === "assistant" ? "assistant" : "user";
    })();

    // Process content, filtering out nulls
    const content = (() => {
      if (typeof openAiMessage.content === "string" && openAiMessage.content !== "") {
        return [{ type: "text" as const, text: openAiMessage.content, citations: [] }];
      } else {
        return (openAiMessage.content || []).map(part => {
          if ('text' in part && part.text !== "") {
            return { type: "text" as const, text: part.text, citations: [] };
          }
          return null;
        }).filter((part): part is { type: "text"; text: string; citations: [] } => 
          part !== null && part.type === "text"
        );
      }
    })();

    return { role, content };
  });
}
export function convertToAnthropicMessages(
  openAiMessages: OpenAI.Chat.ChatCompletionMessageParam[],
): Anthropic.Messages.MessageParam[] {
  const anthropicMessages: Anthropic.Messages.MessageParam[] = []

  for (const openAiMessage of openAiMessages) {
      if (typeof openAiMessage.content === "string" && openAiMessage.content !== "" && openAiMessage.role !== "tool") {
          anthropicMessages.push({
              role: openAiMessage.role as "user" | "assistant", // OpenAI has "system" role, which Anthropic does not support
              content: openAiMessage.content,
          })
      } else if (Array.isArray(openAiMessage.content)) {
          const nonToolMessages: (Anthropic.TextBlockParam | Anthropic.ImageBlockParam)[] = []
          const toolMessages: Anthropic.ToolResultBlockParam[] = []

          for (const part of openAiMessage.content) {
              if (part.type === "text") {
                  nonToolMessages.push({ type: "text", text: part.text })
              } else if (part.type === "image_url") {
                  nonToolMessages.push({
                      type: "image",
                      source: {
                          type: "base64", // Added missing type property
                          media_type: "image/png", // Defaulting to PNG; this should be adjusted as needed
                          data: part.image_url.url.split(",")[1], // Extract base64 data
                      },
                  })
              }
          }

          anthropicMessages.push({
              role: openAiMessage.role as "user" | "assistant",
              content: nonToolMessages,
          })
      }

      if (openAiMessage.role === "assistant" && openAiMessage.tool_calls) {
          const toolMessages: Anthropic.ToolUseBlockParam[] = openAiMessage.tool_calls.map((toolCall) => ({
              type: "tool_use",
              id: toolCall.id,
              name: toolCall.function.name,
              input: JSON.parse(toolCall.function.arguments),
          }))

          anthropicMessages.push({
              role: "assistant",
              content: toolMessages,
          })
      }

      if (openAiMessage.role === "tool") {
          anthropicMessages.push({
              role: "user", // OpenAI has a "tool" role, but Anthropic does not, so map to "user"
              content: [
                  {
                      type: "tool_result",
                      tool_use_id: openAiMessage.tool_call_id!,
                      content: openAiMessage.content as string,
                  },
              ],
          })
      }
  }

  return anthropicMessages
}


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
  model: string;
}

const anthropicDefaultModelId = "claude-3-sonnet-20240229";

const anthropicModels: AnthropicModels = {
  "claude-3-sonnet-20240229": {
    maxTokens: 4096,
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
    output_tokens: number;
  };
}

function convertToolToAnthropicFormat(tool: any): Tool {
  if (tool.type === 'function') {
    return {
      name: tool.function.name,
      description: tool.function.description,
      input_schema: {
        type: 'object',
        properties: tool.function.parameters.properties || {},
        required: tool.function.parameters.required || []
      }
    };
  }
  return {
    name: tool.name,
    description: tool.description,
    input_schema: tool.input_schema
  };
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
      apiKey: this.apiKey || '',
    });
  }

  private convertToOpenAIFormat(response: Message): ChatCompletionResponse {
    let content = '';
    const toolCalls: ChatMessage['tool_calls'] = [];

    if (Array.isArray(response.content)) {
      response.content.forEach((item) => {
        if (item.type === 'text' && 'text' in item) {
          content += item.text;
        } else if (item.type === 'tool_use') {
          toolCalls.push({
            id: item.id || `tool_${Date.now()}`,
            type: 'function',
            function: {
              name: item.name,
              arguments: JSON.stringify(item.input)
            }
          });
        }
      });
    }

    return {
      id: response.id,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: this.model || anthropicDefaultModelId,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: content.replace(/<thinking>\s?/g, "").replace(/\s?<\/thinking>/g, ""),
            tool_calls: toolCalls.length > 0 ? toolCalls : undefined
          },
          finish_reason: response.stop_reason === 'end_turn' ? 'stop' : 'length'
        }
      ],
      usage: {
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens
      }
    };
  }

  async createCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    try {
      
      
      const response = await this.client.messages.create({
        model: options.model || this.model || anthropicDefaultModelId,
        max_tokens: options.max_tokens || 1024,
        messages: convertToAnthropicMessages(options.messages.filter((message: any) => message.role !== "system") as OpenAI.Chat.ChatCompletionMessageParam[]),
        system: [{ text: options.messages.find((message: any) => message.role === 'system')?.content ?? "default system message", type: "text" }],
        temperature: options.temperature,
        top_p: options.top_p,
        tools: options.tools?.map(convertToolToAnthropicFormat)
      });

      return this.convertToOpenAIFormat(response);
    } catch (error) {
      throw error;
    }
  }

  async getModels(): Promise<any> {
    return Object.entries(anthropicModels).map(([id, info]) => ({
      id,
      name: id,
      object: 'model',
      created: 1709251200,
      owned_by: 'anthropic',
      provider: 'Anthropic'
    }));
  }
}

export default AnthropicAI; 




