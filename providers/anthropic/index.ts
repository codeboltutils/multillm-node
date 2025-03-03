import Anthropic from '@anthropic-ai/sdk';
import type { Message, MessageParam, ContentBlock, TextBlock, ToolUseBlock } from '@anthropic-ai/sdk/resources/messages';
import type { PromptCachingBetaMessage, PromptCachingBetaMessageParam } from '@anthropic-ai/sdk/resources/beta/prompt-caching';
import type { BaseProvider, ToolSchema, LLMProvider, ChatCompletionOptions, ChatCompletionResponse, Provider, ChatMessage } from '../../types';
// ... existing code ...

function transformMessages(messages: any[]) {
  return messages.map(message => {

    if (message.tool_calls && Array.isArray(message.tool_calls)) {
      message.tool_calls.forEach((toolCall) => {
        message = {
          role: 'assistant',
          "content": [
            ...(message.content ? [{
              "type": "text",
              "text": message.content,
            }] : []),
            {
              "type": "tool_use",
              id: toolCall.id,
              name: toolCall.function.name,
              input: JSON.parse(toolCall.function.arguments)
            }
          ]
          // Changed from JSON.parse(toolCall.function.arguments)
        };
      });

    }
    return message

  });
}

// // Example usage
// const messages = [
//   {
//     role: "assistant",
//     content: "<thinking>Based on the environment details provided, it seems the project is using a Cloudflare Worker...</thinking>",
//     tool_calls: [
//       {
//         id: "call_7uwcczmgjy9",
//         type: "function",
//         function: {
//           name: "codebolt--list_files",
//           arguments: "{\"path\":\"/Users/ravirawat/Documents/Arrowai/codebolt-edge-api/src/routes\"}"
//         }
//       }
//     ],
//     function_call: null,
//     refusal: null
//   },
//   // Add more message objects as needed
// ];

// console.log(transformMessages(messages));
function convertFunctionFormat(array: any[]): ToolSchema[] {
  return array.map((item: { type: string; function?: { name: string; description: string; parameters: any } }) => {
    if (item.type === "function" && item.function) {
      return {
        name: item.function.name,
        description: item.function.description,
        input_schema: item.function.parameters
      } as ToolSchema; // Ensure the return type matches ToolSchema
    }
    return null;
  }).filter(Boolean) as ToolSchema[]; // Remove null values and assert the type
}
type ClaudeContentText = {
  type: "text";
  text: string;
};

type ClaudeContentToolUse = {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, any>;
};

type ClaudeMessage = {
  id: string;
  type: "message";
  role: "assistant" | "user" | "system";
  model: string;
  content: (ClaudeContentText | ClaudeContentToolUse)[];
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    cache_creation_input_tokens: number;
    cache_read_input_tokens: number;
    output_tokens: number;
  };
};

type OpenAIChoice = {
  index: number;
  message: {
    role: "assistant" | "user" | "system";
    content?: string;
    tool_calls?: {
      id: string;
      type: "function";
      function: {
        name: string;
        arguments: Record<string, any>;
      };
    }[];
  };
  finish_reason: "tool_calls";
};

// ... existing code ...

// ... existing code ...

type OpenAIMessage = {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: OpenAIChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

function convertToOpenAIFormat(claudeResponse) {
  const messages = [];
  const toolCalls = [];

  claudeResponse.content.forEach((item, index) => {
    if (item.type === "text") {
      messages.push(item.text);
    } else if (item.type === "tool_use") {
      toolCalls.push({
        id: item.id,
        type: "function",
        function: {
          name: item.name,
          arguments: JSON.stringify(item.input)
        }
      });
    }
  });

  const openAIResponse = {
    id: claudeResponse.id,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: claudeResponse.model,
    choices: [
      {
        index: 0,
        message: {
          role: claudeResponse.role,
          content: messages.join("\n"),
          tool_calls: null
        },
        finish_reason: claudeResponse.stop_reason
      }
    ],
    usage: claudeResponse.usage
  };
  if (toolCalls.length > 0) {
    openAIResponse.choices[0].message = {
      ...openAIResponse.choices[0].message,
      tool_calls: toolCalls
    };
  }

  return openAIResponse;
}



// console.log(JSON.stringify(convertClaudeToOpenAI(claudeJson), null, 2));

// ... existing code ...
// ... existing code ...
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
  tools?: any[];
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

interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

function transformToAnthropicMessages(messages: ChatMessage[]): MessageParam[] {
  return messages.map(message => {
    const content: ContentBlock[] = [];
    
    if (message.content) {
      content.push({
        type: 'text' as const,
        text: message.content
      });
    }

    if (message.tool_calls) {
      message.tool_calls.forEach((toolCall: ToolCall) => {
        content.push({
          type: 'tool_use' as const,
          tool_name: toolCall.function.name,
          tool_input: JSON.parse(toolCall.function.arguments)
        });
      });
    }

    return {
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: content.length > 0 ? content : ''
    };
  });
}

function convertToStandardResponse(anthropicResponse: Message): ChatCompletionResponse {
  const toolCalls: ToolCall[] = [];
  let messageContent = '';

  if (Array.isArray(anthropicResponse.content)) {
    anthropicResponse.content.forEach(item => {
      if (item.type === 'text') {
        messageContent += (item as TextBlock).text + '\n';
      } else if (item.type === 'tool_use') {
        const toolUse = item as any; // Using any here since Anthropic types don't fully match our needs
        toolCalls.push({
          id: toolUse.id || `tool_${Date.now()}`,
          type: 'function',
          function: {
            name: toolUse.tool_name,
            arguments: JSON.stringify(toolUse.tool_input)
          }
        });
      }
    });
  }

  return {
    id: anthropicResponse.id,
    object: 'chat.completion',
    created: Date.now(),
    model: anthropicResponse.model,
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: messageContent.trim(),
        tool_calls: toolCalls.length > 0 ? toolCalls : undefined
      },
      finish_reason: anthropicResponse.stop_reason || null
    }],
    usage: {
      prompt_tokens: anthropicResponse.usage.input_tokens,
      completion_tokens: anthropicResponse.usage.output_tokens,
      total_tokens: anthropicResponse.usage.input_tokens + anthropicResponse.usage.output_tokens
    }
  };
}

class AnthropicHandler implements LLMProvider {
  private client: Anthropic;
  public model: string | null;
  public device_map: string | null;
  public apiKey: string | null;
  public apiEndpoint: string | null;
  public provider: "anthropic";

  constructor(
    model: string | null = null,
    device_map: string | null = null,
    apiKey: string | null = null,
    apiEndpoint: string | null = null
  ) {
    this.model = model || "claude-3-sonnet-20240229";
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint;
    this.provider = "anthropic";
    
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY
    });
  }

  async createCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    try {
      const anthropicMessages = transformToAnthropicMessages(options.messages);
      const systemMessage = options.messages.find(m => m.role === 'system')?.content;
      
      const response = await this.client.messages.create({
        model: options.model || this.model || "claude-3-sonnet-20240229",
        messages: anthropicMessages,
        temperature: options.temperature,
        max_tokens: options.max_tokens,
        system: systemMessage,
        tools: options.tools?.map(tool => ({
          type: 'function' as const,
          function: {
            name: tool.function.name,
            description: tool.function.description,
            parameters: tool.function.parameters
          }
        }))
      });

      return convertToStandardResponse(response);
    } catch (error) {
      throw error;
    }
  }

  getProviders(): Provider[] {
    return [{
      id: 2,
      logo: "anthropic-logo.png",
      name: "Anthropic",
      apiUrl: "https://api.anthropic.com",
      keyAdded: !!this.apiKey,
      category: 'cloudProviders'
    }];
  }

  async getModels() {
    return [
      {
        id: "claude-3-opus-20240229",
        name: "Claude 3 Opus",
        provider: "Anthropic",
        type: "chat"
      },
      {
        id: "claude-3-sonnet-20240229",
        name: "Claude 3 Sonnet",
        provider: "Anthropic",
        type: "chat"
      },
      {
        id: "claude-3-haiku-20240307",
        name: "Claude 3 Haiku",
        provider: "Anthropic",
        type: "chat"
      }
    ];
  }
}

export default AnthropicHandler; 