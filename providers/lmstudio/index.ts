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

interface Model {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  provider?: string;
}

class LMStudio implements BaseProvider {
  private embeddingModels: string[];
  public model: string | null;
  public device_map: string | null;
  public apiKey: null = null;
  public apiEndpoint: string;

  constructor(
    model: string | null = null,
    device_map: string | null = null,
    apiEndpoint: string | null = null
  ) {
    this.model = model;
    this.device_map = device_map;
    this.embeddingModels = [];
    this.apiEndpoint = apiEndpoint ?? "http://localhost:1234/v1";
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
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error generating completion:", error);
      return error as Error;
    }
  }

  async getModels(): Promise<Model[] | Error> {
    try {
      const response = await axios.get<{ data: Model[] }>(
        `${this.apiEndpoint}/models`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const allModels = response.data.data.map((model) => ({
        ...model,
        provider: "Local Provider",
      }));
      return allModels;
    } catch (error) {
      console.error("Error fetching models:", error);
      return error as Error;
    }
  }
}

export default LMStudio; 