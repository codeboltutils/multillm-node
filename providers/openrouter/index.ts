import axios from 'axios';
import { handleError } from '../../utils/errorHandler';
import type { BaseProvider } from '../../types';

interface OpenRouterOptions extends BaseProvider {
  model: string | null;
  device_map: string | null;
  apiKey: string | null;
  apiEndpoint: string | null;
}

class OpenRouter implements BaseProvider {
  private options: OpenRouterOptions;
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
    this.model = model;
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint ?? "https://gateway.ai.cloudflare.com/v1/8073e84dbfc4e2bc95666192dcee62c0/codebolt/openrouter";
    
    this.options = { model, device_map, apiKey, apiEndpoint: this.apiEndpoint };
  }

  async createCompletion(options: any): Promise<any> {
    try {
      const { messages, model, temperature, max_tokens, stream, tools, tool_choice, ...rest } = options;
      
      const requestBody: any = {
        messages,
        model: (model || this.model),
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 1024,
        stream: stream || false,
        ...rest
      };

      // Add tools and tool_choice if provided
      if (tools && tools.length > 0) {
        requestBody.tools = tools;
        if (tool_choice) {
          requestBody.tool_choice = tool_choice;
        }
      }

      const response = await axios.post(
        `${this.apiEndpoint}/chat/completions`,
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`,
            "HTTP-Referer": "https://arrowai.com", // Replace with your actual domain
            "X-Title": "MultiLLM Node"
          }
        }
      );

      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }

  async getModels() {
    try {
      const response = await axios.get(`${this.apiEndpoint}/models`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          "HTTP-Referer": "https://arrowai.com", // Replace with your actual domain
          "X-Title": "MultiLLM Node"
        }
      });

      const models = response.data.data.map((model: any) => {
        return {
          id: model.id,
          name: model.id,
          provider: model.provider || "OpenRouter",
          type: "chat"
        };
      });

      return models;
    } catch (error) {
      return handleError(error);
    }
  }
}

export default OpenRouter; 