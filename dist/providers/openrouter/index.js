"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const errorHandler_1 = require("../../utils/errorHandler");
class OpenRouter {
    constructor(model = null, device_map = null, apiKey = null, apiEndpoint = null) {
        this.model = model;
        this.device_map = device_map;
        this.apiKey = apiKey;
        this.apiEndpoint = apiEndpoint ?? "https://openrouter.ai/api/v1";
        this.options = { model, device_map, apiKey, apiEndpoint: this.apiEndpoint };
    }
    async createCompletion(options) {
        try {
            const { messages, model, temperature, max_tokens, stream, tools, tool_choice, ...rest } = options;
            const requestBody = {
                messages,
                model: model || this.model,
                temperature: temperature || 0.7,
                max_tokens: max_tokens || 1024,
                stream: stream || false,
                ...rest
            };
            // Add tools and tool_choice if provided
            if (tools && tools.length > 0) {
                requestBody.tools = tools;
                if (tool_choice) {
                    requestBody.tool_choice = tool_choice;
                }
            }
            const response = await axios_1.default.post(`${this.apiEndpoint}/chat/completions`, requestBody, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey}`,
                    "HTTP-Referer": "https://arrowai.com", // Replace with your actual domain
                    "X-Title": "MultiLLM Node"
                }
            });
            return response.data;
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(error);
        }
    }
    async getModels() {
        try {
            const response = await axios_1.default.get(`${this.apiEndpoint}/models`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey}`,
                    "HTTP-Referer": "https://arrowai.com", // Replace with your actual domain
                    "X-Title": "MultiLLM Node"
                }
            });
            const models = response.data.data.map((model) => {
                return {
                    id: model.id,
                    name: model.name || model.id,
                    provider: model.provider || "OpenRouter",
                    type: "chat"
                };
            });
            return models;
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(error);
        }
    }
}
exports.default = OpenRouter;
