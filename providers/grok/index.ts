import axios from 'axios';
import { handleError } from '../../utils/errorHandler';
import type { BaseProvider } from '../../types';

interface GrokOptions extends BaseProvider {
  model: string | null;
  device_map: string | null;
  apiKey: string | null;
  apiEndpoint: string | null;
}

class Grok implements BaseProvider {
  private options: GrokOptions;
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
    this.chatModels = ["grok-2"];
    this.model = model || "grok-2";
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint;
    
    this.options = { model: this.model, device_map, apiKey, apiEndpoint };
  }

  async createCompletion(options: any) {
    try {
      const response = await axios.post(`${this.apiEndpoint}/v1/chat/completions`, {
        model: this.model,
        messages: options.messages,
        stream: false
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        choices: [{
          message: {
            role: 'assistant',
            content: response.data.choices[0].message.content
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
        provider: "Grok",
        type: "chat"
      }));
    } catch (error) {
      return handleError(error);
    }
  }
}

export default Grok; 