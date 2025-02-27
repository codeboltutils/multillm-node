"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const replicate_1 = __importDefault(require("replicate"));
const errorHandler_1 = require("../../utils/errorHandler");
class ReplicateHandler {
    constructor(model = null, device_map = null, apiKey = null, apiEndpoint = null) {
        this.model = model;
        this.device_map = device_map;
        this.apiKey = apiKey;
        this.apiEndpoint = apiEndpoint;
        this.client = new replicate_1.default({ auth: apiKey || '' });
    }
    async createCompletion(options) {
        try {
            const messages = options.messages.map((msg) => ({
                role: msg.role,
                content: msg.content
            }));
            const output = await this.client.run((this.model || "meta/llama-2-70b-chat:latest"), {
                input: {
                    prompt: this.formatPrompt(messages),
                    max_new_tokens: options.max_tokens || 100,
                    temperature: options.temperature || 0.7
                }
            });
            return {
                choices: [{
                        message: {
                            role: 'assistant',
                            content: output
                        }
                    }]
            };
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(error);
        }
    }
    formatPrompt(messages) {
        return messages.map(msg => {
            const role = msg.role === 'assistant' ? 'Assistant' : 'Human';
            return `${role}: ${msg.content}`;
        }).join('\n') + '\nAssistant:';
    }
    async getModels() {
        return [
            {
                id: "meta/llama-2-70b-chat:latest",
                provider: "Replicate",
                type: "chat"
            }
        ];
    }
}
exports.default = ReplicateHandler;
