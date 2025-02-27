import { GoogleGenerativeAI } from '@google/generative-ai';
import { handleError } from '../../utils/errorHandler';
import type { BaseProvider } from '../../types';

interface GeminiOptions extends BaseProvider {
  model: string | null;
  device_map: string | null;
  apiKey: string | null;
  apiEndpoint: string | null;
}

class Gemini implements BaseProvider {
  private options: GeminiOptions;
  private client: GoogleGenerativeAI;
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
    this.chatModels = ["gemini-pro", "gemini-pro-vision"];
    this.model = model || "gemini-pro";
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint;
    
    this.options = { model: this.model, device_map, apiKey, apiEndpoint };
    this.client = new GoogleGenerativeAI(apiKey || '');
  }

  async createCompletion(options: any) {
    try {
      const model = this.client.getGenerativeModel({ model: this.model || 'gemini-pro' });
      
      const response = await model.generateContent(options.messages.map((msg: any) => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      })));

      const result = response.response;
      return {
        choices: [{
          message: {
            role: 'assistant',
            content: result.text()
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
        provider: "Gemini",
        type: "chat"
      }));
    } catch (error) {
      return handleError(error);
    }
  }
}

export default Gemini; 