"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
// ... existing code ...
function transformMessages(messages) {
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
        return message;
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
function convertFunctionFormat(array) {
    return array.map((item) => {
        if (item.type === "function" && item.function) {
            return {
                name: item.function.name,
                description: item.function.description,
                input_schema: item.function.parameters
            }; // Ensure the return type matches ToolSchema
        }
        return null;
    }).filter(Boolean); // Remove null values and assert the type
}
function convertToOpenAIFormat(claudeResponse) {
    const messages = [];
    const toolCalls = [];
    claudeResponse.content.forEach((item, index) => {
        if (item.type === "text") {
            messages.push(item.text);
        }
        else if (item.type === "tool_use") {
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
const anthropicDefaultModelId = "claude-3-7-sonnet-20250219";
const anthropicModels = {
    "claude-3-7-sonnet-20250219": {
        maxTokens: 8192,
        contextWindow: 200000,
        supportsImages: true,
        supportsPromptCache: true,
        inputPrice: 3.0,
        outputPrice: 15.0,
        cacheWritesPrice: 3.75,
        cacheReadsPrice: 0.3,
    },
    "claude-3-opus-20240229": {
        maxTokens: 4096,
        contextWindow: 200000,
        supportsImages: true,
        supportsPromptCache: true,
        inputPrice: 15.0,
        outputPrice: 75.0,
        cacheWritesPrice: 18.75,
        cacheReadsPrice: 1.5,
    },
    "claude-3-haiku-20240307": {
        maxTokens: 4096,
        contextWindow: 200000,
        supportsImages: true,
        supportsPromptCache: true,
        inputPrice: 0.25,
        outputPrice: 1.25,
        cacheWritesPrice: 0.3,
        cacheReadsPrice: 0.03,
    },
};
class AnthropicHandler {
    constructor(model = null, device_map = null, apiKey = null, apiEndpoint = null) {
        this.embeddingModels = [];
        this.model = model;
        this.device_map = device_map;
        this.apiKey = apiKey;
        this.apiEndpoint = apiEndpoint;
        this.options = { model, device_map, apiKey, apiEndpoint };
        this.client = new sdk_1.default({
            baseURL: "https://gateway.ai.cloudflare.com/v1/8073e84dbfc4e2bc95666192dcee62c0/codebolt/anthropic", //|| "https://api.anthropic.com",
            apiKey: apiKey !== null && apiKey !== void 0 ? apiKey : undefined,
        });
    }
    async createCompletion(createParams) {
        var _a, _b, _c;
        const { messages, tools, model } = createParams;
        let systemPrompt = (_a = messages.find((message) => message.role === "system")) === null || _a === void 0 ? void 0 : _a.content;
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
                    };
            }
        });
        let transformedMessages = transformMessages(messages);
        try {
            switch (modelId) {
                case "claude-3-7-sonnet-20250219":
                case "claude-3-opus-20240229":
                case "claude-3-haiku-20240307": {
                    // ... existing code ...
                    const userMsgIndices = messages.reduce((acc, msg, index) => (msg.role === "user" ? [...acc, index] : acc), []);
                    // ... existing code ...
                    const lastUserMsgIndex = (_b = userMsgIndices[userMsgIndices.length - 1]) !== null && _b !== void 0 ? _b : -1;
                    const secondLastMsgUserIndex = (_c = userMsgIndices[userMsgIndices.length - 2]) !== null && _c !== void 0 ? _c : -1;
                    let inputMessage = {
                        model: modelId,
                        max_tokens: 8192, //this.getModel().info.maxTokens,
                        temperature: 0.2,
                        system: [{ text: systemPrompt, type: "text", cache_control: { type: "ephemeral" } }],
                        messages: transformedMessages.map((message, index) => {
                            if (index === lastUserMsgIndex || index === secondLastMsgUserIndex) {
                                return {
                                    ...message,
                                    content: typeof message.content === "string"
                                        ? [
                                            {
                                                type: "text",
                                                text: message.content,
                                                cache_control: { type: "ephemeral" },
                                            },
                                        ]
                                        : message.content.map((content, contentIndex) => contentIndex === message.content.length - 1
                                            ? { ...content, cache_control: { type: "ephemeral" } }
                                            : content),
                                };
                            }
                            else if (message.role !== "system") {
                                return message;
                            }
                        }),
                        tools: convertFunctionFormat(tools) || [],
                        tool_choice: { type: "auto" },
                    };
                    console.log("message to claud ai");
                    console.log(JSON.stringify(inputMessage));
                    const message = await this.client.beta.promptCaching.messages.create(inputMessage, (() => {
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
                    })());
                    console.log(JSON.stringify(message));
                    return convertToOpenAIFormat(message);
                }
                default: {
                    const message = await this.client.messages.create({
                        model: modelId,
                        max_tokens: 1024, // this.getModel().info.maxTokens,
                        temperature: 0.2,
                        system: [{ text: systemPrompt[0].text, type: "text" }],
                        messages: messages.map((msg) => ({
                            ...msg,
                            content: typeof msg.content === "string" ? [{ type: "text", text: msg.content }] : msg.content
                        })),
                        tools: convertFunctionFormat(tools) || [],
                        tool_choice: { type: "auto" },
                    });
                    return convertToOpenAIFormat(message);
                }
            }
        }
        catch (error) {
            return error;
        }
    }
    getModel(modelId) {
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
exports.default = AnthropicHandler;
