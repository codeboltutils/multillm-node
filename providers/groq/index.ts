import { Groq } from 'groq-sdk';
import { handleError } from '../../utils/errorHandler';
import type { BaseProvider } from '../../types';

interface GroqOptions extends BaseProvider {
  model: string | null;
  device_map: string | null;
  apiKey: string | null;
  apiEndpoint: string | null;
}

class GroqProvider implements BaseProvider {
  private options: GroqOptions;
  private client: Groq;
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
      "mixtral-8x7b-32768",
      "llama2-70b-4096",
      "gemma-7b-it"
    ];
    this.model = model || "mixtral-8x7b-32768";
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint;
    
    this.options = { model: this.model, device_map, apiKey, apiEndpoint };
    this.client = new Groq({
      apiKey: apiKey || ''
    });
  }

  async createCompletion(options: any) {
    try {
      const completion = await this.client.chat.completions.create({
        messages: options.messages,
        model: this.model || "mixtral-8x7b-32768",
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2000,
        stream: false
      });

      return {
        choices: [{
          message: {
            role: 'assistant',
            content: completion.choices[0].message.content
          }
        }]
      };
    } catch (error) {
      return handleError(error);
    }
  }

  async getModels() {
    try {
      return this.chatModels.map(modelId => ({
        id: modelId,
        provider: "Groq",
        type: "chat"
      }));
    } catch (error) {
      return handleError(error);
    }
  }
}

export default GroqProvider; 