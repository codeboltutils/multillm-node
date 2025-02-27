"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
// Import providers
const index_1 = __importDefault(require("./providers/codebolt/index"));
const index_2 = __importDefault(require("./providers/openai/index"));
const index_3 = __importDefault(require("./providers/anthropic/index"));
const index_4 = __importDefault(require("./providers/perplexity/index"));
const index_5 = __importDefault(require("./providers/lmstudio/index"));
const index_6 = __importDefault(require("./providers/mistral/index"));
class Multillm {
    constructor(provider, model = null, device_map = null, apiKey = null, apiEndpoint = null) {
        this.provider = provider;
        this.device_map = device_map;
        this.apiKey = apiKey;
        this.model = model;
        this.apiEndpoint = apiEndpoint;
        switch (this.provider) {
            case "codeboltai": {
                this.instance = new index_1.default(this.model, this.device_map, this.apiKey, this.apiEndpoint);
                break;
            }
            case "openai": {
                this.instance = new index_2.default(this.model, this.device_map, this.apiKey, this.apiEndpoint);
                break;
            }
            case "anthropic": {
                this.instance = new index_3.default(this.model, this.device_map, this.apiKey, this.apiEndpoint);
                break;
            }
            case "perplexity": {
                this.instance = new index_4.default(this.model, this.device_map, this.apiKey, this.apiEndpoint);
                break;
            }
            case "lmstudio": {
                this.instance = new index_5.default(this.model, this.device_map, this.apiEndpoint);
                break;
            }
            case "mistral": {
                this.instance = new index_6.default(this.model, this.device_map, this.apiKey, this.apiEndpoint);
                break;
            }
            default: {
                console.log(`Unsupported provider: ${this.provider}`);
                throw new Error(`Unsupported provider: ${this.provider}`);
            }
        }
    }
    async createCompletion(options) {
        return this.instance.createCompletion(options);
    }
    async getModels() {
        return this.instance.getModels();
    }
    getProviders() {
        return [
            {
                id: 1,
                logo: "https://avatars.githubusercontent.com/u/166920414?s=200&v=4",
                name: "CodeBolt AI",
                apiUrl: "https://codeboltproxy.arrowai.workers.dev/v1",
                key: "",
                keyAdded: false,
                category: 'codebolt'
            },
            {
                id: 3,
                logo: "https://github.com/openai.png",
                name: "Open AI",
                apiUrl: "https://gateway.ai.cloudflare.com/v1/8073e84dbfc4e2bc95666192dcee62c0/codebolt/openai",
                key: "",
                keyAdded: false,
                category: 'cloudProviders'
            },
            {
                id: 4,
                logo: "https://github.com/lmstudio-ai.png",
                name: "LM Studio",
                apiUrl: "http://localhost:1234/v1",
                keyAdded: false,
                category: 'localProviders',
            },
            {
                id: 5,
                logo: "https://github.com/anthropics.png",
                name: "Anthropic",
                apiUrl: "https://api.anthropic.com",
                keyAdded: false,
                category: 'cloudProviders',
            }
        ];
    }
}
module.exports = Multillm;
