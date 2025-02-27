import axios from 'axios';
import { handleError } from '../../utils/errorHandler';
import type { BaseProvider } from '../../types';

interface OllamaOptions extends BaseProvider {
  model: string | null;
  device_map: string | null;
  apiKey: string | null;
  apiEndpoint: string | null;
}

class Ollama implements BaseProvider {
  private options: OllamaOptions;
  private chatModels: string[];
  public model: string | null;
  public device_map: string | null;
  public apiKey: string | null;
  public apiEndpoint: string | null;

  constructor(
    model: string | null = null,
    device_map: string | null = null,
    apiKey: string | null = null,
    apiEndpoint: string | null = "http://localhost:11434"
  ) {
    this.chatModels = ["llama2", "mistral", "codellama", "mixtral"];
    this.model = model || "llama2";
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint;
    
    this.options = { model: this.model, device_map, apiKey, apiEndpoint };
  }

  async createCompletion(options: any) {
    try {
      const response = await axios.post(`${this.apiEndpoint}/api/chat`, {
        model: this.model,
        messages: options.messages,
        stream: false
      });

      return {
        choices: [{
          message: {
            role: 'assistant',
            content: response.data.message.content
          }
        }]
      };
    } catch (error) {
      return handleError(error);
    }
  }

  async getModels() {
    try {
      const response = await axios.get(`${this.apiEndpoint}/api/tags`);
      return response.data.models.map((model: any) => ({
        id: model.name,
        provider: "Ollama",
        type: "chat"
      }));
    } catch (error) {
      return handleError(error);
    }
  }
}

export default Ollama; 