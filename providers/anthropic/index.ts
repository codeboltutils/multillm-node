import Anthropic from '@anthropic-ai/sdk';
import type { Message, MessageParam } from '@anthropic-ai/sdk/resources/messages';
import type { PromptCachingBetaMessage, PromptCachingBetaMessageParam } from '@anthropic-ai/sdk/resources/beta/prompt-caching';
import type { BaseProvider, ToolSchema } from '../../types';
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

class AnthropicHandler implements BaseProvider {
  private embeddingModels: string[];
  private options: {
    model: string | null;
    device_map: string | null;
    apiKey: string | null;
    apiEndpoint: string | null;
  };
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
    this.embeddingModels = [];
    this.model = model;
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint;
    this.options = { model, device_map, apiKey, apiEndpoint };
    this.client = new Anthropic({
      baseURL: "https://gateway.ai.cloudflare.com/v1/8073e84dbfc4e2bc95666192dcee62c0/codebolt/anthropic", //|| "https://api.anthropic.com",
      apiKey: apiKey ?? undefined,
    });
  }

  async createCompletion(createParams: any) {
    const { messages, tools, model } = createParams;

    let systemPrompt = messages.find((message: { role: string; content: any }) => message.role === "system")?.content;
    if (messages[0].role === "system") {
      messages.shift();
    }
    console.log("message is");
    console.log(JSON.stringify(createParams));
    const modelId = model;

    messages.forEach((message, index) => {
      if (message.role === "tool" && message.tool_call_id) {
        messages[index] =

        {
          "role": "user",
          "content": [
            {
              type: "tool_result",
              tool_use_id: message.tool_call_id,
              content: message.content // Replace with actual content if needed
            }
          ]
        }


      }
    });
    let transformedMessages = transformMessages(messages)

    try {
      switch (modelId) {
        case "claude-3-7-sonnet-20250219":
        case "claude-3-opus-20240229":
        case "claude-3-haiku-20240307": {
          // ... existing code ...
          const userMsgIndices = messages.reduce(
            (acc: number[], msg: { role: string }, index: number) => (msg.role === "user" ? [...acc, index] : acc),
            [] as number[]
          );
          // ... existing code ...
          const lastUserMsgIndex = userMsgIndices[userMsgIndices.length - 1] ?? -1;
          const secondLastMsgUserIndex = userMsgIndices[userMsgIndices.length - 2] ?? -1;
          let inputMessage = {
            model: modelId,
            max_tokens: 8192, //this.getModel().info.maxTokens,
            temperature: 0.2,
            system: [{ text: systemPrompt, type: "text" as const, cache_control: { type: "ephemeral" as const } }],
            messages: transformedMessages.map((message: any, index: number) => {

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
    } catch (error) {
      return error as Error;
    }
  }

  getModel(modelId?: string) {
    if (modelId && modelId in anthropicModels) {
      return { id: modelId, info: anthropicModels[modelId] };
    }
    return { id: anthropicDefaultModelId, info: anthropicModels[anthropicDefaultModelId] };
  }

  async getModels() {
    return [
      {
        id: "claude-3-7-sonnet-20250219",
        provider: "Anthropic",
        max_tokens: 8192,
        context_window: 200000,
        supports_images: true,
        supports_prompt_cache: true,
        pricing: {
          input_price_per_million_tokens: 3.0,
          output_price_per_million_tokens: 15.0,
          cache_writes_price_per_million_tokens: 3.75,
          cache_reads_price_per_million_tokens: 0.3,
        },
      },
      {
        id: "claude-3-opus-20240229",
        max_tokens: 4096,
        provider: "Anthropic",
        context_window: 200000,
        supports_images: true,
        supports_prompt_cache: true,
        pricing: {
          input_price_per_million_tokens: 15.0,
          output_price_per_million_tokens: 75.0,
          cache_writes_price_per_million_tokens: 18.75,
          cache_reads_price_per_million_tokens: 1.5,
        },
      },
      {
        id: "claude-3-haiku-20240307",
        max_tokens: 4096,
        provider: "Anthropic",
        context_window: 200000,
        supports_images: true,
        supports_prompt_cache: true,
        pricing: {
          input_price_per_million_tokens: 0.25,
          output_price_per_million_tokens: 1.25,
          cache_writes_price_per_million_tokens: 0.3,
          cache_reads_price_per_million_tokens: 0.03,
        },
      },
    ];
  }
}

export default AnthropicHandler; 