import axios from 'axios';
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
    this.chatModels = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro"];
    this.model = model || "gemini-1.5-flash";
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint;
    
    this.options = { model: this.model, device_map, apiKey, apiEndpoint };
  }

  async createCompletion(options: any) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      };

      // Convert messages to Google AI format
      const messages = options.messages.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      const requestBody = {
        model: this.model,
        contents: messages,
        generationConfig: {
          temperature: options.temperature || 0.7,
          topP: options.top_p || 1,
          topK: options.top_k || 40,
          maxOutputTokens: options.max_tokens || 1024,
        }
      };

      // Use the Cloudflare AI Gateway endpoint
      const response = await axios.post(
        `${this.apiEndpoint}/models/${this.model}:generateContent`, 
        requestBody,
        { headers }
      );

      // Format response to match expected structure
      return {
        choices: [{
          message: {
            role: 'assistant',
            content: response.data.candidates[0].content.parts[0].text
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