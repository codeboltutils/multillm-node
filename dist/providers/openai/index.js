"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const errorHandler_1 = require("../../utils/errorHandler");
const openai_1 = require("openai");
class OpenAI {
    constructor(model = null, device_map = null, apiKey = null, apiEndpoint = null) {
        var _a;
        this.embeddingModels = ["text-embedding-3-small", "text-embedding-3-large", "text-embedding-ada-002"];
        this.chatModels = ["gpt-4o-mini", "gpt-4o"];
        this.model = model;
        this.device_map = device_map;
        this.apiKey = apiKey;
        this.apiEndpoint = apiEndpoint !== null && apiEndpoint !== void 0 ? apiEndpoint : "https://gateway.ai.cloudflare.com/v1/8073e84dbfc4e2bc95666192dcee62c0/codebolt/openai";
        this.options = { model, device_map, apiKey, apiEndpoint: this.apiEndpoint };
        if ((_a = this.options.apiEndpoint) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes("azure.com")) {
            this.client = new openai_1.AzureOpenAI({
                baseURL: apiEndpoint,
                apiKey: apiKey !== null && apiKey !== void 0 ? apiKey : undefined,
                apiVersion: "2024-08-01-preview",
            });
        }
        else {
            this.client = new openai_1.OpenAI({
                baseURL: apiEndpoint,
                apiKey: apiKey !== null && apiKey !== void 0 ? apiKey : undefined,
            });
        }
    }
    async createCompletion(createParams) {
        try {
            const completion = await this.client.chat.completions.create(createParams);
            console.log("completion");
            return completion;
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
                    Authorization: `Bearer ${this.apiKey}`,
                },
            });
            const allModels = response.data.data.map((model) => {
                model.provider = "OpenAI";
                if (this.embeddingModels.includes(model.id)) {
                    model.type = "embedding";
                }
                if (this.chatModels.includes(model.id)) {
                    model.type = "chat";
                }
                return model;
            });
            return allModels;
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(error);
        }
    }
    async createEmbedding(input, model) {
        try {
            const response = await axios_1.default.post(`${this.apiEndpoint}/embeddings`, {
                input,
                model
            }, {
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${this.apiKey}`
                },
            });
            return response.data;
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(error);
        }
    }
}
exports.default = OpenAI;
