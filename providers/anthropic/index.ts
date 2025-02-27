import Anthropic from '@anthropic-ai/sdk';
import type { Message, MessageParam } from '@anthropic-ai/sdk/resources/messages';
import type { PromptCachingBetaMessage, PromptCachingBetaMessageParam } from '@anthropic-ai/sdk/resources/beta/prompt-caching';
import type { BaseProvider } from '../../types';

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

const anthropicDefaultModelId = "claude-3-5-sonnet-20240620";

const anthropicModels: AnthropicModels = {
  "claude-3-5-sonnet-20240620": {
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
      baseURL: apiEndpoint || "https://gateway.ai.cloudflare.com/v1/8073e84dbfc4e2bc95666192dcee62c0/codebolt/anthropic",
      apiKey: apiKey ?? undefined,
    });
  }

  async createCompletion(createParams: AnthropicCreateParams): Promise<{ message: Message | PromptCachingBetaMessage } | Error> {
    const { messages, system: systemPrompt, tools, model } = createParams;
    console.log("message is"+JSON.stringify(createParams));
    const modelId = model;

    try {
      switch (modelId) {
        case "claude-3-5-sonnet-20240620":
        case "claude-3-opus-20240229":
        case "claude-3-haiku-20240307": {
          const userMsgIndices = messages.reduce<number[]>(
            (acc, msg, index) => (msg.role === "user" ? [...acc, index] : acc),
            []
          );
          const lastUserMsgIndex = userMsgIndices[userMsgIndices.length - 1] ?? -1;
          const secondLastMsgUserIndex = userMsgIndices[userMsgIndices.length - 2] ?? -1;

          const requestParams: any = {
            model: modelId,
            max_tokens: this.getModel().info.maxTokens,
            temperature: 0.2,
            system: [{ text: systemPrompt[0].text, type: "text" as const, cache_control: { type: "ephemeral" as const } }],
            messages: messages.map((message, index) => {
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
                } as PromptCachingBetaMessageParam;
              }
              return message as PromptCachingBetaMessageParam;
            })
          };

          // Only add tools and tool_choice if tools are provided
          if (tools && tools.length > 0) {
            requestParams.tools = tools;
            requestParams.tool_choice = { type: "auto" as const };
          }

          const message = await this.client.beta.promptCaching.messages.create(
            requestParams,
            (() => {
              switch (modelId) {
                case "claude-3-5-sonnet-20240620":
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
          return { message };
        }
        default: {
          const requestParams: any = {
            model: modelId,
            max_tokens: this.getModel().info.maxTokens,
            temperature: 0.2,
            system: [{ text: systemPrompt[0].text, type: "text" as const }],
            messages: messages.map(msg => ({
              ...msg,
              content: typeof msg.content === "string" ? [{ type: "text" as const, text: msg.content }] : msg.content
            }))
          };

          // Only add tools and tool_choice if tools are provided
          if (tools && tools.length > 0) {
            requestParams.tools = tools;
            requestParams.tool_choice = { type: "auto" as const };
          }

          const message = await this.client.messages.create(requestParams);
          return { message };
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
        id: "claude-3-5-sonnet-20240620",
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