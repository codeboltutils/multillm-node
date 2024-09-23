const { Anthropic } = require("@anthropic-ai/sdk");
  const anthropicDefaultModelId = "claude-3-5-sonnet-20240620"
 const anthropicModels = {
	"claude-3-5-sonnet-20240620": {
		maxTokens: 8192,
		contextWindow: 200_000,
		supportsImages: true,
		supportsPromptCache: true,
		inputPrice: 3.0, // $3 per million input tokens
		outputPrice: 15.0, // $15 per million output tokens
		cacheWritesPrice: 3.75, // $3.75 per million tokens
		cacheReadsPrice: 0.3, // $0.30 per million tokens
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
} ;// as const assertion makes the object deeply readonly


class AnthropicHandler {
    constructor(model = null,
        device_map = null,
        apiKey = null,
        apiEndpoint = null) {
        this.options =  this.options =  {model,device_map,apiKey,apiEndpoint};;
        this.client = new Anthropic({
            baseURL: apiEndpoint || "https://api.anthropic.com",
            apiKey: apiKey,
        });
    }
    async createCompletion(createParams) {
        const modelId = createParams.model
        switch (modelId) {
            case "claude-3-5-sonnet-20240620":
            case "claude-3-opus-20240229":
            case "claude-3-haiku-20240307": {
                const userMsgIndices = createParams.messages.reduce(
                    (acc, msg, index) => (msg.role === "user" ? [...acc, index] : acc),
                    []
                );
                const lastUserMsgIndex = userMsgIndices[userMsgIndices.length - 1] ?? -1;
                const secondLastMsgUserIndex = userMsgIndices[userMsgIndices.length - 2] ?? -1;
                const message = await this.client.beta.promptCaching.messages.create({
                    model: modelId,
                    max_tokens: this.getModel(modelId).info.maxTokens,
                    system: [{ text: systemPrompt, type: "text", cache_control: { type: "ephemeral" } }],
                    messages: messages.map((message, index) => {
                        if (index === lastUserMsgIndex || index === secondLastMsgUserIndex) {
                            return {
                                ...message,
                                content:
                                    typeof message.content === "string"
                                        ? [
                                            {
                                                type: "text",
                                                text: message.content,
                                                cache_control: { type: "ephemeral" },
                                            },
                                        ]
                                        : message.content.map((content, contentIndex) =>
                                            contentIndex === message.content.length - 1
                                                ? { ...content, cache_control: { type: "ephemeral" } }
                                                : content
                                        ),
                            };
                        }
                        return message;
                    }),
                    tools,
                    tool_choice: { type: "auto" },
                }, (() => {
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
                })());
                return { message };
            }
            default: {
                const message = await this.client.messages.create(createParams);
                return { message };
            }
        }
    }
    getModel(modelId){
		
		if (modelId && modelId in anthropicModels) {
			const id = modelId ;
			return { id, info: anthropicModels[id] }
		}
		return { id: anthropicDefaultModelId, info: anthropicModels[anthropicDefaultModelId] }
	}
    async getModels() {
        return [
            {
              "id": "claude-3-5-sonnet-20240620",
              "provider":"Anthropic",
              "max_tokens": 8192,
              "context_window": 200000,
              "supports_images": true,
              "supports_prompt_cache": true,
              "pricing": {
                "input_price_per_million_tokens": 3.0,
                "output_price_per_million_tokens": 15.0,
                "cache_writes_price_per_million_tokens": 3.75,
                "cache_reads_price_per_million_tokens": 0.3
              }
            },
            {
              "id": "claude-3-opus-20240229",
              "max_tokens": 4096,
              "provider":"Anthropic",
              "context_window": 200000,
              "supports_images": true,
              "supports_prompt_cache": true,
              "pricing": {
                "input_price_per_million_tokens": 15.0,
                "output_price_per_million_tokens": 75.0,
                "cache_writes_price_per_million_tokens": 18.75,
                "cache_reads_price_per_million_tokens": 1.5
              }
            },
            {
              "id": "claude-3-haiku-20240307",
              "max_tokens": 4096,
              "provider":"Anthropic",
              "context_window": 200000,
              "supports_images": true,
              "supports_prompt_cache": true,
              "pricing": {
                "input_price_per_million_tokens": 0.25,
                "output_price_per_million_tokens": 1.25,
                "cache_writes_price_per_million_tokens": 0.3,
                "cache_reads_price_per_million_tokens": 0.03
              }
            }
          ]
    }
}

module.exports=AnthropicHandler

