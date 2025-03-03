import type { Provider, SupportedProvider, LLMProvider } from './types.ts';

// Import providers
import CodeBoltAI from './providers/codebolt/index';
import OpenAI from './providers/openai/index';
import Anthropic from './providers/anthropic/index';
import Perplexity from './providers/perplexity/index';
import LMStudio from './providers/lmstudio/index';
import MistralAI from './providers/mistral/index';
import Gemini from './providers/gemini/index';
import Ollama from './providers/ollama/index';
import OpenRouter from './providers/openrouter/index';

class Multillm implements LLMProvider {
  public provider: SupportedProvider;
  public device_map: string | null;
  public apiKey: string | null;
  public model: string | null;
  public apiEndpoint: string | null;
  private instance: LLMProvider;

  constructor(
    provider: SupportedProvider,
    model: string | null = null,
    device_map: string | null = null,
    apiKey: string | null = null,
    apiEndpoint: string | null = null
  ) {
    this.provider = provider;
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.model = model;
    this.apiEndpoint = apiEndpoint;

    switch (this.provider) {
      case "codeboltai": {
        this.instance = new CodeBoltAI(this.model, this.device_map, this.apiKey, this.apiEndpoint);
        break;
      }
      case "openai": {
        this.instance = new OpenAI(this.model, this.device_map, this.apiKey, this.apiEndpoint);
        break;
      }
      case "anthropic": {
        this.instance = new Anthropic(this.model, this.device_map, this.apiKey, this.apiEndpoint);
        break;
      }
      case "perplexity": {
        this.instance = new Perplexity(this.model, this.device_map, this.apiKey, this.apiEndpoint);
        break;
      }
      case "lmstudio": {
        this.instance = new LMStudio(this.model, this.device_map, this.apiEndpoint);
        break;
      }
      case "mistral": {
        this.instance = new MistralAI(this.model, this.device_map, this.apiKey, this.apiEndpoint);
        break;
      }
      case "gemini": {
        this.instance = new Gemini(this.model, this.device_map, this.apiKey, this.apiEndpoint);
        break;
      }
      case "ollama": {
        this.instance = new Ollama(this.model, this.device_map, this.apiKey, this.apiEndpoint);
        break;
      }
      case "openrouter": {
        this.instance = new OpenRouter(this.model, this.device_map, this.apiKey, this.apiEndpoint);
        break;
      }
      default: {
        console.log(`Unsupported provider: ${this.provider}`);
        throw new Error(`Unsupported provider: ${this.provider}`);
      }
    }
  }

  async createCompletion(options: any): Promise<any> {
    return this.instance.createCompletion(options);
  }

  async getModels(): Promise<any> {
    return this.instance.getModels();
  }

  getProviders(): Provider[] {
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
        key: "",
        category: 'cloudProviders',
      }
    ];
  }
}

export default Multillm;