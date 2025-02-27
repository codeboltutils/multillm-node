import axios from 'axios';
import { handleError } from '../../utils/errorHandler';
import { OpenAI as OpenAIApi, AzureOpenAI } from 'openai';
import type { ChatCompletion, ChatCompletionChunk, ChatCompletionCreateParams } from 'openai/resources/chat';
import type { Stream } from 'openai/streaming';
import type { BaseProvider } from '../../types';

interface OpenAIOptions extends BaseProvider {
  model: string | null;
  device_map: string | null;
  apiKey: string | null;
  apiEndpoint: string | null;
}

class OpenAI implements BaseProvider {
  private options: OpenAIOptions;
  private client: OpenAIApi | AzureOpenAI;
  private embeddingModels: string[];
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
    this.embeddingModels = ["text-embedding-3-small", "text-embedding-3-large", "text-embedding-ada-002"];
    this.chatModels = ["gpt-4o-mini", "gpt-4o"];
    this.model = model;
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint ?? "https://gateway.ai.cloudflare.com/v1/8073e84dbfc4e2bc95666192dcee62c0/codebolt/openai";
    
    this.options = { model, device_map, apiKey, apiEndpoint: this.apiEndpoint };

    if (this.options.apiEndpoint?.toLowerCase().includes("azure.com")) {
      this.client = new AzureOpenAI({
        baseURL: apiEndpoint,
        apiKey: apiKey ?? undefined,
        apiVersion: "2024-08-01-preview",
      });
    } else {
      this.client = new OpenAIApi({
        baseURL: apiEndpoint,
        apiKey: apiKey ?? undefined,
      });
    }
  }

  async createCompletion(
    createParams: ChatCompletionCreateParams
  ): Promise<
    | (ChatCompletion & { _request_id?: string | null })
    | (Stream<ChatCompletionChunk> & { _request_id?: string | null })
    | { error: string }
  > {
    try {
      const completion = await this.client.chat.completions.create(createParams);
      console.log("completion");
      return completion;
    } catch (error) {
      return handleError(error);
    }
  }

  async getModels() {
    try {
      const response = await axios.get(`${this.apiEndpoint}/models`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      const allModels = response.data.data.map((model: { id: string; provider?: string; type?: string }) => {
        model.provider = "OpenAI";
        if (this.embeddingModels.includes(model.id)) {
          model.type = "embedding";
        }
        if (this.chatModels.includes(model.id)) {
          model.type = "chat";
        }
        return model;
      });
      return allModels;
    } catch (error) {
      return handleError(error);
    }
  }

  async createEmbedding(input: string | string[], model: string) {
    try {
      const response = await axios.post(
        `${this.apiEndpoint}/embeddings`,
        {
          input,
          model
        },
        {
          headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${this.apiKey}`
          },
        }
      );

      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
}

export default OpenAI; 