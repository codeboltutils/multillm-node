"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rest_1 = require("@octokit/rest");
const errorHandler_1 = require("../../utils/errorHandler");
class GitHub {
    constructor(model = null, device_map = null, apiKey = null, apiEndpoint = "https://api.github.com/copilot/chat") {
        this.chatModels = ["copilot-chat"];
        this.model = model || "copilot-chat";
        this.device_map = device_map;
        this.apiKey = apiKey;
        this.apiEndpoint = apiEndpoint;
        this.options = { model: this.model, device_map, apiKey, apiEndpoint };
        this.client = new rest_1.Octokit({
            auth: apiKey || undefined,
            baseUrl: apiEndpoint || undefined
        });
    }
    async createCompletion(options) {
        try {
            const response = await this.client.request('POST /chat/completions', {
                messages: options.messages,
                model: this.model || "copilot-chat",
                temperature: options.temperature || 0.7,
                max_tokens: options.max_tokens || 2000,
                stream: false
            });
            return {
                choices: [{
                        message: {
                            role: 'assistant',
                            content: response.data.choices[0].message.content
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
                provider: "GitHub",
                type: "chat"
            }));
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(error);
        }
    }
}
exports.default = GitHub;
