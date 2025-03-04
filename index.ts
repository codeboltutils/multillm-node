import type { Provider, SupportedProvider, LLMProvider, ProviderConfig } from './types';

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
import HuggingFace from './providers/huggingface/index';
import ReplicateAI from './providers/replicate/index';
import Bedrock from './providers/bedrock/index';
import CloudflareAI from './providers/cloudflare/index';
import Groq from './providers/groq/index';
import Grok from './providers/grok/index';
import Replicate from './providers/replicate/index';
import DeepseekAI from './providers/deepseek/index';

class Multillm implements LLMProvider {
  public provider: SupportedProvider;
  public device_map: string | null;
  public apiKey: string | null;
  public model: string | null;
  public apiEndpoint: string | null;
  public config: ProviderConfig;
  private instance: LLMProvider;

  constructor(
    provider: SupportedProvider,
    model: string | null = null,
    device_map: string | null = null,
    apiKey: string | null = null,
    apiEndpoint: string | null = null,
    config: ProviderConfig = {}
  ) {
    this.provider = provider;
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.model = model;
    this.apiEndpoint = apiEndpoint;
    this.config = config;

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
      case "huggingface": {
        this.instance = new HuggingFace(this.model, this.device_map, this.apiKey, this.apiEndpoint);
        break;
      }
      case "grok": {
        this.instance = new Grok(this.model, this.device_map, this.apiKey, this.apiEndpoint);
        break;
      }
      case "replicate": {
        this.instance = new Replicate(this.model, this.device_map, this.apiKey, this.apiEndpoint);
        break;
      }
      case "groq": {
        this.instance = new Groq(this.model, this.device_map, this.apiKey, this.apiEndpoint);
        break;
      }
      case "bedrock": {
        this.instance = new Bedrock(this.model, this.apiKey, this.apiEndpoint, config.aws);
        break;
      }
      case "cloudflare": {
        this.instance = new CloudflareAI({
          apiKey: this.apiKey || '',
          apiEndpoint: this.apiEndpoint || '',
          model: this.model || '@cf/meta/llama-3.1-8b-instruct'
        });
        break;
      }
      case "deepseek": {
        this.instance = new DeepseekAI(this.model, this.device_map, this.apiKey, this.apiEndpoint);
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
}

export function getProviders(): Provider[] {
  const providers: Provider[] = [
    {
      id: 1,
      logo: "https://avatars.githubusercontent.com/u/166920414?s=200&v=4",
      name: "CodeBolt AI",
      apiUrl: "https://codeboltproxy.arrowai.workers.dev/v1",
      category: 'codebolt'
    },
    {
      id: 2,
      logo: "https://github.com/openai.png",
      name: "Open AI",
      apiUrl: "https://gateway.ai.cloudflare.com/v1/8073e84dbfc4e2bc95666192dcee62c0/codebolt/openai",
      category: 'cloudProviders'
    },
    {
      id: 3,
      logo: "https://github.com/lmstudio-ai.png",
      name: "LM Studio",
      apiUrl: "http://localhost:1234/v1",
      category: 'localProviders'
    },
    {
      id: 4,
      logo: "https://github.com/anthropics.png",
      name: "Anthropic",
      apiUrl: "https://api.anthropic.com",
      category: 'cloudProviders'
    },
    {
      id: 5,
      logo: "https://github.com/deepseek-ai.png",
      name: "Deepseek",
      apiUrl: "https://api.deepseek.com/v1",
      category: 'cloudProviders'
    },
    {
      id: 6,
      logo: "https://github.com/mistralai.png",
      name: "Mistral",
      apiUrl: "https://api.mistral.ai/v1",
      category: 'cloudProviders'
    },
    {
      id: 7,
      logo: "https://github.com/google.png",
      name: "Gemini",
      apiUrl: "https://gateway.ai.cloudflare.com/v1/8073e84dbfc4e2bc95666192dcee62c0/codebolt/google-ai-studio",
      category: 'cloudProviders'
    },
    {
      id: 8,
      logo: "https://github.com/ollama/ollama/raw/main/docs/ollama.png",
      name: "Ollama",
      apiUrl: "http://localhost:11434",
      category: 'localProviders'
    },
    {
      id: 9,
      logo: "https://openrouter.ai/favicon.ico",
      name: "OpenRouter",
      apiUrl: "https://openrouter.ai/api/v1",
      category: 'cloudProviders'
    },
    {
      id: 10,
      logo: "https://huggingface.co/front/assets/huggingface_logo.svg",
      name: "HuggingFace",
      apiUrl: "https://api-inference.huggingface.co/models",
      category: 'cloudProviders'
    },
    {
      id: 11,
      logo: "https://github.com/grok-ai.png",
      name: "Grok",
      apiUrl: "https://api.grok.x.ai/v1",
      category: 'cloudProviders'
    },
    {
      id: 12,
      logo: "https://replicate.com/favicon.ico",
      name: "Replicate",
      apiUrl: "https://api.replicate.com/v1",
      category: 'cloudProviders'
    },
    {
      id: 13,
      logo: "https://github.com/perplexity-ai.png",
      name: "Perplexity",
      apiUrl: "https://api.perplexity.ai",
      category: 'cloudProviders'
    },
    {
      id: 14,
      logo: "https://d1.awsstatic.com/logos/aws-logo-lockups/poweredbyaws/PB_AWS_logo_RGB_REV_SQ.8c88ac215fe4e441cbd3b3be1d023927390ec2d5.png",
      name: "AWS Bedrock",
      apiUrl: "https://bedrock-runtime.us-east-1.amazonaws.com/v1",
      category: 'cloudProviders'
    },
    {
      id: 15,
      logo: "https://github.com/cloudflare.png",
      name: "Cloudflare AI",
      apiUrl: "https://gateway.ai.cloudflare.com/v1",
      category: 'cloudProviders'
    }
  ];

  return providers;
}

export default Multillm;