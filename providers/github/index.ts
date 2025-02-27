import { Octokit } from '@octokit/rest';
import { handleError } from '../../utils/errorHandler';
import type { BaseProvider } from '../../types';

interface GitHubOptions extends BaseProvider {
  model: string | null;
  device_map: string | null;
  apiKey: string | null;
  apiEndpoint: string | null;
}

class GitHub implements BaseProvider {
  private options: GitHubOptions;
  private client: Octokit;
  private chatModels: string[];
  public model: string | null;
  public device_map: string | null;
  public apiKey: string | null;
  public apiEndpoint: string | null;

  constructor(
    model: string | null = null,
    device_map: string | null = null,
    apiKey: string | null = null,
    apiEndpoint: string | null = "https://api.github.com/copilot/chat"
  ) {
    this.chatModels = ["copilot-chat"];
    this.model = model || "copilot-chat";
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint;
    
    this.options = { model: this.model, device_map, apiKey, apiEndpoint };
    this.client = new Octokit({
      auth: apiKey || undefined,
      baseUrl: apiEndpoint || undefined
    });
  }

  async createCompletion(options: any) {
    try {
      const response = await this.client.request('POST /chat/completions', {
        messages: options.messages,
        model: this.model || "copilot-chat",
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2000,
        stream: false
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
        provider: "GitHub",
        type: "chat"
      }));
    } catch (error) {
      return handleError(error);
    }
  }
}

export default GitHub; 