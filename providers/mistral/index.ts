import axios from 'axios';
import type { BaseProvider } from '../../types';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface CompletionOptions {
  model: string;
  messages: Message[];
}

interface CompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: Message;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface ModelsResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    created: number;
    owned_by: string;
  }>;
}

class MistralAI implements BaseProvider {
  public model: string | null;
  public device_map: string | null;
  public apiKey: string | null;
  public apiEndpoint: string;

  constructor(
    model: string | null = null,
    device_map: string | null = null,
    apiKey: string | null = null,
    apiEndpoint: string | null = null
  ) {
    this.model = model;
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint ?? "https://api.mistral.ai/v1";
  }

  async createCompletion(options: CompletionOptions): Promise<CompletionResponse | Error> {
    try {
      console.log(options.messages);
      const response = await axios.post<CompletionResponse>(
        `${this.apiEndpoint}/chat/completions`,
        {
          model: options.model,
          messages: options.messages,
        },
        {
          headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error generating completion:", error);
      return error as Error;
    }
  }

  async getModels(): Promise<ModelsResponse | Error> {
    try {
      const response = await axios.get<ModelsResponse>(
        `${this.apiEndpoint}/models`,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching models:", error);
      return error as Error;
    }
  }
}

export default MistralAI; 