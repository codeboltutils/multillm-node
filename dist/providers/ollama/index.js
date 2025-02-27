"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const errorHandler_1 = require("../../utils/errorHandler");
class Ollama {
    constructor(model = null, device_map = null, apiKey = null, apiEndpoint = "http://localhost:11434") {
        this.chatModels = ["llama2", "mistral", "codellama", "mixtral"];
        this.model = model || "llama2";
        this.device_map = device_map;
        this.apiKey = apiKey;
        this.apiEndpoint = apiEndpoint;
        this.options = { model: this.model, device_map, apiKey, apiEndpoint };
    }
    async createCompletion(options) {
        try {
            const response = await axios_1.default.post(`${this.apiEndpoint}/api/chat`, {
                model: this.model,
                messages: options.messages,
                stream: false
            });
            return {
                choices: [{
                        message: {
                            role: 'assistant',
                            content: response.data.message.content
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
            const response = await axios_1.default.get(`${this.apiEndpoint}/api/tags`);
            return response.data.models.map((model) => ({
                id: model.name,
                provider: "Ollama",
                type: "chat"
            }));
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(error);
        }
    }
}
exports.default = Ollama;
