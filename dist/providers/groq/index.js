"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const groq_sdk_1 = require("groq-sdk");
const errorHandler_1 = require("../../utils/errorHandler");
class GroqProvider {
    constructor(model = null, device_map = null, apiKey = null, apiEndpoint = null) {
        this.chatModels = [
            "mixtral-8x7b-32768",
            "llama2-70b-4096",
            "gemma-7b-it"
        ];
        this.model = model || "mixtral-8x7b-32768";
        this.device_map = device_map;
        this.apiKey = apiKey;
        this.apiEndpoint = apiEndpoint;
        this.options = { model: this.model, device_map, apiKey, apiEndpoint };
        this.client = new groq_sdk_1.Groq({
            apiKey: apiKey || ''
        });
    }
    async createCompletion(options) {
        try {
            const completion = await this.client.chat.completions.create({
                messages: options.messages,
                model: this.model || "mixtral-8x7b-32768",
                temperature: options.temperature || 0.7,
                max_tokens: options.max_tokens || 2000,
                stream: false
            });
            return {
                choices: [{
                        message: {
                            role: 'assistant',
                            content: completion.choices[0].message.content
                        }
                    }]
            };
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(error);
        }
    }
    async getModels() {
        try {
            return this.chatModels.map(modelId => ({
                id: modelId,
                provider: "Groq",
                type: "chat"
            }));
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(error);
        }
    }
}
exports.default = GroqProvider;
