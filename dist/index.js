"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Import providers
const index_1 = __importDefault(require("./providers/codebolt/index"));
const index_2 = __importDefault(require("./providers/openai/index"));
const index_3 = __importDefault(require("./providers/anthropic/index"));
const index_4 = __importDefault(require("./providers/perplexity/index"));
const index_5 = __importDefault(require("./providers/lmstudio/index"));
const index_6 = __importDefault(require("./providers/mistral/index"));
const index_7 = __importDefault(require("./providers/gemini/index"));
const index_8 = __importDefault(require("./providers/ollama/index"));
const index_9 = __importDefault(require("./providers/openrouter/index"));
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
            case "gemini": {
                this.instance = new index_7.default(this.model, this.device_map, this.apiKey, this.apiEndpoint);
                break;
            }
            case "ollama": {
                this.instance = new index_8.default(this.model, this.device_map, this.apiKey, this.apiEndpoint);
                break;
            }
            case "openrouter": {
                this.instance = new index_9.default(this.model, this.device_map, this.apiKey, this.apiEndpoint);
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
                id: 2,
                logo: "https://github.com/openai.png",
                name: "Open AI",
                apiUrl: "https://gateway.ai.cloudflare.com/v1/8073e84dbfc4e2bc95666192dcee62c0/codebolt/openai",
                key: "",
                keyAdded: false,
                category: 'cloudProviders'
            },
            {
                id: 3,
                logo: "https://github.com/lmstudio-ai.png",
                name: "LM Studio",
                apiUrl: "http://localhost:1234/v1",
                keyAdded: false,
                category: 'localProviders',
            },
            {
                id: 4,
                logo: "https://github.com/anthropics.png",
                name: "Anthropic",
                apiUrl: "https://api.anthropic.com",
                keyAdded: false,
                category: 'cloudProviders',
            },
            {
                id: 5,
                logo: "https://github.com/perplexity-ai.png",
                name: "Perplexity",
                apiUrl: "https://api.perplexity.ai",
                keyAdded: false,
                category: 'cloudProviders',
            },
            {
                id: 6,
                logo: "https://github.com/mistralai.png",
                name: "Mistral AI",
                apiUrl: "https://api.mistral.ai/v1",
                keyAdded: false,
                category: 'cloudProviders',
            },
            {
                id: 7,
                logo: "https://github.com/google.png",
                name: "Gemini",
                apiUrl: "https://gateway.ai.cloudflare.com/v1/8073e84dbfc4e2bc95666192dcee62c0/codebolt/google-ai-studio",
                keyAdded: false,
                category: 'cloudProviders',
            },
            {
                id: 8,
                logo: "https://github.com/ollama/ollama/raw/main/docs/ollama.png",
                name: "Ollama",
                apiUrl: "http://localhost:11434",
                keyAdded: false,
                category: 'localProviders',
            },
            {
                id: 9,
                logo: "https://openrouter.ai/favicon.ico",
                name: "OpenRouter",
                apiUrl: "https://openrouter.ai/api/v1",
                keyAdded: false,
                category: 'cloudProviders',
            }
        ];
    }
}
exports.default = Multillm;
