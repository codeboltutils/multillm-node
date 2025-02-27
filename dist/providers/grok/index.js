"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const errorHandler_1 = require("../../utils/errorHandler");
class Grok {
    constructor(model = null, device_map = null, apiKey = null, apiEndpoint = null) {
        this.chatModels = ["grok-2"];
        this.model = model || "grok-2";
        this.device_map = device_map;
        this.apiKey = apiKey;
        this.apiEndpoint = apiEndpoint;
        this.options = { model: this.model, device_map, apiKey, apiEndpoint };
    }
    async createCompletion(options) {
        try {
            const response = await axios_1.default.post(`${this.apiEndpoint}/v1/chat/completions`, {
                model: this.model,
                messages: options.messages,
                stream: false
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
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
                provider: "Grok",
                type: "chat"
            }));
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(error);
        }
    }
}
exports.default = Grok;
