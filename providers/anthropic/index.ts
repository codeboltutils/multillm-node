import Anthropic from '@anthropic-ai/sdk';
import type { Message, MessageParam, ContentBlock, TextBlock, Tool } from '@anthropic-ai/sdk/resources/messages';
import type { BaseProvider, ToolSchema, LLMProvider, ChatCompletionOptions, ChatCompletionResponse, Provider, ChatMessage } from '../../types';

function transformMessages(messages: ChatMessage[]): MessageParam[] {
  return messages.map(message => ({
    role: message.role as 'assistant' | 'user',
    content: message.content || ''
  }));
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

interface OpenAITool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

function convertToolToAnthropicFormat(tool: OpenAITool): Tool {
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

  private convertToOpenAIFormat(anthropicResponse: AnthropicResponse): ChatCompletionResponse {
    let content = '';
    const toolCalls: ChatMessage['tool_calls'] = [];

    if (Array.isArray(anthropicResponse.content)) {
      anthropicResponse.content.forEach((item) => {
        if (item.type === 'text' && 'text' in item) {
          content += item.text;
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
      content: content,
      tool_calls: toolCalls.length > 0 ? toolCalls : undefined
    };

    return {
      id: anthropicResponse.id,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: this.model || anthropicDefaultModelId,
      choices: [
        {
          index: 0,
          message,
          finish_reason: anthropicResponse.stop_reason === 'end_turn' ? 'stop' : 'length'
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

      const response = await this.client.messages.create({
        model: options.model || this.model || anthropicDefaultModelId,
        max_tokens: options.max_tokens || 1024,
        messages,
        temperature: options.temperature,
        top_p: options.top_p,
        tools: options.tools?.map(convertToolToAnthropicFormat)
      });

      const anthropicResponse: AnthropicResponse = {
        id: response.id,
        model: response.model,
        role: response.role,
        content: response.content,
        stop_reason: response.stop_reason || 'end_turn',
        usage: {
          input_tokens: response.usage.input_tokens,
          completion_tokens: response.usage.output_tokens,
          total_tokens: response.usage.input_tokens + response.usage.output_tokens
        }
      };

      return this.convertToOpenAIFormat(anthropicResponse);
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