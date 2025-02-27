"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const errorHandler_1 = require("../../utils/errorHandler");
class CodeBoltAI {
    constructor(model = null, device_map = null, apiKey = null, apiEndpoint = null) {
        this.model = model;
        this.device_map = device_map;
        this.apiKey = apiKey;
        this.apiEndpoint = apiEndpoint !== null && apiEndpoint !== void 0 ? apiEndpoint : "https://codeboltproxy.arrowai.workers.dev/v1";
        this.embeddingModels = ["text-embedding-3-small", "text-embedding-3-large", "text-embedding-ada-002"];
    }
    async createCompletion(options) {
        try {
            console.log(options.messages);
            const response = await axios_1.default.post(`${this.apiEndpoint}/chat/completions`, options, {
                headers: {
                    "Content-Type": "application/json",
                    'x-codebolt-key': `${this.apiKey}`,
                },
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
                    "x-codebolt-key": `${this.apiKey}`,
                },
            });
            const allModels = response.data.data.map((model) => ({
                ...model,
                provider: "Codebolt",
                type: this.embeddingModels.includes(model.id) ? "embedding" : undefined,
            }));
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
                model,
            }, {
                headers: {
                    "Content-Type": "application/json",
                    'x-codebolt-key': `${this.apiKey}`,
                },
            });
            return response.data;
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(error);
        }
    }
}
exports.default = CodeBoltAI;
