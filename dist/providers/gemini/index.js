"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const errorHandler_1 = require("../../utils/errorHandler");
class Gemini {
    constructor(model = null, device_map = null, apiKey = null, apiEndpoint = null) {
        this.chatModels = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro"];
        this.model = model || "gemini-1.5-flash";
        this.device_map = device_map;
        this.apiKey = apiKey;
        this.apiEndpoint = apiEndpoint;
        this.options = { model: this.model, device_map, apiKey, apiEndpoint };
    }
    async createCompletion(options) {
        try {
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            };
            // Convert messages to Google AI format
            const messages = options.messages.map((msg) => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            }));
            const requestBody = {
                model: this.model,
                contents: messages,
                generationConfig: {
                    temperature: options.temperature || 0.7,
                    topP: options.top_p || 1,
                    topK: options.top_k || 40,
                    maxOutputTokens: options.max_tokens || 1024,
                }
            };
            // Use the Cloudflare AI Gateway endpoint
            const response = await axios_1.default.post(`${this.apiEndpoint}/models/${this.model}:generateContent`, requestBody, { headers });
            // Format response to match expected structure
            return {
                choices: [{
                        message: {
                            role: 'assistant',
                            content: response.data.candidates[0].content.parts[0].text
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
                provider: "Gemini",
                type: "chat"
            }));
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(error);
        }
    }
}
exports.default = Gemini;
