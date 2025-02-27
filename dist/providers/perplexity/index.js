"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const models_1 = __importDefault(require("./models"));
class Perplexity {
    constructor(model = null, device_map = null, apiKey = null, apiEndpoint = null) {
        this.model = model;
        this.device_map = device_map;
        this.apiKey = apiKey;
        this.apiEndpoint = apiEndpoint !== null && apiEndpoint !== void 0 ? apiEndpoint : 'https://gateway.ai.cloudflare.com/v1/8073e84dbfc4e2bc95666192dcee62c0/codebolt/perplexity-ai';
    }
    async createCompletion(options) {
        try {
            console.log(options.messages);
            const response = await axios_1.default.post(`${this.apiEndpoint}/chat/completions`, {
                model: options.model,
                messages: options.messages,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
            });
            return response.data;
        }
        catch (error) {
            console.error('Error generating completion:', error);
            return error;
        }
    }
    async getModels() {
        try {
            return models_1.default;
        }
        catch (error) {
            console.error('Error fetching models:', error);
            return [];
        }
    }
}
exports.default = Perplexity;
