"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
class LMStudio {
    constructor(model = null, device_map = null, apiEndpoint = null) {
        this.apiKey = null;
        this.model = model;
        this.device_map = device_map;
        this.embeddingModels = [];
        this.apiEndpoint = apiEndpoint ?? "http://localhost:1234/v1";
    }
    async createCompletion(options) {
        try {
            console.log("The options are:" + JSON.stringify(options));
            const response = await axios_1.default.post(`${this.apiEndpoint}/chat/completions`, {
                model: options.model,
                messages: options.messages,
            }, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            return response.data;
        }
        catch (error) {
            console.error("Error generating completion:", error);
            return error;
        }
    }
    async getModels() {
        try {
            const response = await axios_1.default.get(`${this.apiEndpoint}/models`, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const allModels = response.data.data.map((model) => ({
                ...model,
                provider: "Local Provider",
            }));
            return allModels;
        }
        catch (error) {
            console.error("Error fetching models:", error);
            return error;
        }
    }
}
exports.default = LMStudio;
