const  Anthropic  = require("@anthropic-ai/sdk");
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
    async createCompletion(
        createParams
	) {

        let {messages,system:systemPrompt,tools,model}=createParams;
        console.log("message is")
        console.log(JSON.stringify(createParams))
        const modelId = model;
        try {
            switch (modelId) {
                case "claude-3-5-sonnet-20240620":
                case "claude-3-opus-20240229":
                case "claude-3-haiku-20240307": {
                    /*
                    The latest message will be the new user message, one before will be the assistant message from a previous request, and the user message before that will be a previously cached user message. So we need to mark the latest user message as ephemeral to cache it for the next request, and mark the second to last user message as ephemeral to let the server know the last message to retrieve from the cache for the current request..
                    */
                    const userMsgIndices = messages.reduce(
                        (acc, msg, index) => (msg.role === "user" ? [...acc, index] : acc),
                        [] 
                    )
                    const lastUserMsgIndex = userMsgIndices[userMsgIndices.length - 1] ?? -1
                    const secondLastMsgUserIndex = userMsgIndices[userMsgIndices.length - 2] ?? -1
                    const message = await this.client.beta.promptCaching.messages.create(
                        {
                            model: modelId,
                            max_tokens: this.getModel().info.maxTokens,
                            temperature: 0.2,
                            system: [{ text: systemPrompt[0].text, type: "text", cache_control: { type: "ephemeral" } }], // setting cache breakpoint for system prompt so new tasks can reuse it
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
                                    }
                                }
                                return message
                            }),
                            tools:tools ||[], // cache breakpoints go from tools > system > messages, and since tools dont change, we can just set the breakpoint at the end of system (this avoids having to set a breakpoint at the end of tools which by itself does not meet min requirements for haiku caching)
                            tool_choice: { type: "auto" },
                        },
                        (() => {
                            // prompt caching: https://x.com/alexalbert__/status/1823751995901272068
                            // https://github.com/anthropics/anthropic-sdk-typescript?tab=readme-ov-file#default-headers
                            // https://github.com/anthropics/anthropic-sdk-typescript/commit/c920b77fc67bd839bfeb6716ceab9d7c9bbe7393
                            switch (modelId) {
                                case "claude-3-5-sonnet-20240620":
                                    return {
                                        headers: {
                                            "anthropic-beta": "prompt-caching-2024-07-31",
                                        },
                                    }
                                case "claude-3-haiku-20240307":
                                    return {
                                        headers: { "anthropic-beta": "prompt-caching-2024-07-31" },
                                    }
                                default:
                                    return undefined
                            }
                        })()
                    )
                    return { message }
                }
                default: {
                    const message = await this.client.messages.create({
                        model: modelId,
                        max_tokens: this.getModel().info.maxTokens,
                        temperature: 0.2,
                        system: [{ text: systemPrompt[0].text, type: "text" }],
                        messages,
                        tools:tools ||[], 
                        tool_choice: { type: "auto" },
                    })
                    return { message }
                }
            }
        } catch (error) {
            return error
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

