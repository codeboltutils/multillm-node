import axios from 'axios';
import { handleError } from '../../utils/errorHandler';
import type { BaseProvider, ChatCompletionOptions, ChatCompletionResponse, LLMProvider } from '../../types';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface CompletionOptions {
  model: string;
  messages: Message[];
  [key: string]: any;
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
  type?: string;
}

interface EmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

class CodeBoltAI implements LLMProvider {
  private embeddingModels: string[];
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
    this.apiEndpoint = apiEndpoint ?? "https://codeboltproxy.arrowai.workers.dev/v1";
    this.embeddingModels = ["text-embedding-3-small", "text-embedding-3-large", "text-embedding-ada-002"];
  }

  async createCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    try {
      console.log(options.messages);
      const response = await axios.post<ChatCompletionResponse>(
        `${this.apiEndpoint}/chat/completions`,
        options,
        {
          headers: {
            "Content-Type": "application/json",
            'x-codebolt-key': `${this.apiKey}`,
          },
        }
      );

      // Transform the response to match ChatCompletionResponse
      const transformedResponse: ChatCompletionResponse = {
        ...response.data,
        choices: response.data.choices.map(choice => ({
          ...choice,
          message: {
            ...choice.message,
            content: choice.message.content || null
          },
          finish_reason: choice.finish_reason as "stop" | "length" | "tool_calls" | "content_filter" | null
        }))
      };

      return transformedResponse;
    } catch (error) {
      throw error;
    }
  }

  async getModels(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.apiEndpoint}/models`,
        {
          headers: {
            "Content-Type": "application/json",
            "x-codebolt-key": `${this.apiKey}`,
          },
        }
      );
      const allModels = response.data.data.map((model: any) => ({
        ...model,
        provider: "Codebolt",
        type: this.embeddingModels.includes(model.id) ? "embedding" : undefined,
      }));
      return allModels;
    } catch (error) {
      throw error;
    }
  }

  async createEmbedding(input: string | string[], model: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.apiEndpoint}/embeddings`,
        {
          input,
          model,
        },
        {
          headers: {
            "Content-Type": "application/json",
            'x-codebolt-key': `${this.apiKey}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default CodeBoltAI; 