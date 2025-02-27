import { HfInference } from '@huggingface/inference';
import { handleError } from '../../utils/errorHandler';
import type { BaseProvider } from '../../types';
import axios from 'axios';

interface HuggingFaceOptions extends BaseProvider {
  model: string | null;
  device_map: string | null;
  apiKey: string | null;
  apiEndpoint: string | null;
}

class HuggingFace implements BaseProvider {
  private options: HuggingFaceOptions;
  private client: HfInference;
  private chatModels: string[];
  public model: string | null;
  public device_map: string | null;
  public apiKey: string | null;
  public apiEndpoint: string | null;

  constructor(
    model: string | null = null,
    device_map: string | null = null,
    apiKey: string | null = null,
    apiEndpoint: string | null = null
  ) {
    this.chatModels = [
      "meta-llama/Llama-2-70b-chat-hf",
      "mistralai/Mixtral-8x7B-Instruct-v0.1",
      "tiiuae/falcon-180B-chat",
      "codellama/CodeLlama-34b-Instruct-hf",
      "google/gemma-7b-it"
    ];
    this.model = model || "meta-llama/Llama-2-70b-chat-hf";
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint || "https://gateway.ai.cloudflare.com/v1/8073e84dbfc4e2bc95666192dcee62c0/codebolt/huggingface";
    
    this.options = { model: this.model, device_map, apiKey, apiEndpoint: this.apiEndpoint };
    this.client = new HfInference(apiKey || '');
  }

  async createCompletion(options: any) {
    try {
      const messages = options.messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }));

      try {
        const response = await axios.post(
          `${this.apiEndpoint}/models/${this.model}/text-generation`,
          {
            inputs: this.formatPrompt(messages),
            parameters: {
              max_new_tokens: options.max_tokens || 2000,
              temperature: options.temperature || 0.7,
              top_p: options.top_p || 0.95,
              return_full_text: false
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        return {
          choices: [{
            message: {
              role: 'assistant',
              content: response.data.generated_text
            }
          }]
        };
      } catch (error) {
        console.warn('Cloudflare Gateway failed, falling back to direct HuggingFace API:', error);
        const response = await this.client.textGeneration({
          model: this.model || "meta-llama/Llama-2-70b-chat-hf",
          inputs: this.formatPrompt(messages),
          parameters: {
            max_new_tokens: options.max_tokens || 2000,
            temperature: options.temperature || 0.7,
            top_p: options.top_p || 0.95,
            return_full_text: false
          }
        });

        return {
          choices: [{
            message: {
              role: 'assistant',
              content: response.generated_text
            }
          }]
        };
      }
    } catch (error) {
      return handleError(error);
    }
  }

  private formatPrompt(messages: any[]): string {
    return messages.map(msg => {
      const role = msg.role === 'assistant' ? 'Assistant' : 'Human';
      return `${role}: ${msg.content}`;
    }).join('\\n') + '\\nAssistant:';
  }

  async getModels() {
    try {
      return this.chatModels.map(modelId => ({
        id: modelId,
        provider: "HuggingFace",
        type: "chat"
      }));
    } catch (error) {
      return handleError(error);
    }
  }
}

export default HuggingFace; 