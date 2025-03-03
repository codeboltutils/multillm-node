import Anthropic from '@anthropic-ai/sdk';
import type { Message, MessageParam, ContentBlock, TextBlock, Tool } from '@anthropic-ai/sdk/resources/messages';
import type { BaseProvider, ToolSchema, LLMProvider, ChatCompletionOptions, ChatCompletionResponse, Provider, ChatMessage } from '../../types';

function transformMessages(messages: ChatMessage[]): MessageParam[] {
  return messages.map(message => {
    if (message.tool_calls && Array.isArray(message.tool_calls)) {
      return {
        role: 'assistant' as const,
        content: [
          ...(message.content ? [{
            type: 'text' as const,
            text: message.content,
          }] : []),
          ...message.tool_calls.map(toolCall => ({
            type: 'tool_use' as const,
            id: toolCall.id,
            name: toolCall.function.name,
            input: JSON.parse(toolCall.function.arguments)
          }))
        ]
      };
    }
    
    return {
      role: message.role as 'assistant' | 'user',
      content: typeof message.content === 'string' 
        ? [{ type: 'text' as const, text: message.content }]
        : message.content || []
    };
  });
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
            content: content,
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
      const messages = transformMessages(options.messages);
      
      const response = await this.client.messages.create({
        model: options.model || this.model || anthropicDefaultModelId,
        max_tokens: options.max_tokens || 1024,
        messages,
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

  getProviders(): Provider[] {
    return [{
      id: 1,
      logo: '',
      name: 'Anthropic',
      apiUrl: this.apiEndpoint || '',
      keyAdded: Boolean(this.apiKey && this.apiKey.length > 0),
      category: 'cloudProviders'
    }];
  }
}

export default AnthropicAI; 