import axios from 'axios';
import { handleError } from '../../utils/errorHandler';
import { OpenAI as OpenAIApi, AzureOpenAI } from 'openai';
import type { ChatCompletion, ChatCompletionChunk, ChatCompletionCreateParams, ChatCompletionMessageParam, ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam, ChatCompletionAssistantMessageParam, ChatCompletionFunctionMessageParam } from 'openai/resources/chat';
import type { Stream } from 'openai/streaming';
import type { BaseProvider, LLMProvider, ChatCompletionOptions, ChatCompletionResponse, Provider, ChatMessage } from '../../types';

function transformMessages(messages: ChatMessage[]): ChatCompletionMessageParam[] {
  return messages.map(message => {
    if (message.role === 'function') {
      const functionMessage: ChatCompletionFunctionMessageParam = {
        role: 'function',
        name: message.name || 'unknown',
        content: message.content || ''
      };
      return functionMessage;
    }
    
    if (message.role === 'assistant' && message.tool_calls) {
      const assistantMessage: ChatCompletionAssistantMessageParam = {
        role: 'assistant',
        content: message.content || '',
        tool_calls: message.tool_calls
      };
      return assistantMessage;
    }
    
    if (message.role === 'system') {
      const systemMessage: ChatCompletionSystemMessageParam = {
        role: 'system',
        content: message.content || ''
      };
      return systemMessage;
    }
    
    const userMessage: ChatCompletionUserMessageParam = {
      role: 'user',
      content: message.content || ''
    };
    return userMessage;
  });
}

class OpenAI implements LLMProvider {
  private options: BaseProvider;
  private client: OpenAIApi | AzureOpenAI;
  private embeddingModels: string[];
  private chatModels: string[];
  public model: string | null;
  public device_map: string | null;
  public apiKey: string | null;
  public apiEndpoint: string | null;
  public provider: "openai";

  constructor(
    model: string | null = null,
    device_map: string | null = null,
    apiKey: string | null = null,
    apiEndpoint: string | null = null
  ) {
    this.embeddingModels = ["text-embedding-3-small", "text-embedding-3-large", "text-embedding-ada-002"];
    this.chatModels = ["gpt-4", "gpt-3.5-turbo"];
    this.model = model;
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint ?? "https://api.openai.com/v1";
    this.provider = "openai";
    
    this.options = { model, device_map, apiKey, apiEndpoint: this.apiEndpoint };

    if (this.options.apiEndpoint?.toLowerCase().includes("azure.com")) {
      this.client = new AzureOpenAI({
        baseURL: apiEndpoint,
        apiKey: apiKey ?? undefined,
        apiVersion: "2024-02-15-preview",
      });
    } else {
      this.client = new OpenAIApi({
        baseURL: this.apiEndpoint,
        apiKey: apiKey ?? undefined,
      });
    }
  }

  async createCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    try {
      const completion = await this.client.chat.completions.create({
        messages: transformMessages(options.messages),
        model: options.model || this.model || "gpt-3.5-turbo",
        temperature: options.temperature,
        top_p: options.top_p,
        max_tokens: options.max_tokens,
        stream: options.stream,
        tools: options.tools,
        stop: options.stop,
      });

      return completion as unknown as ChatCompletionResponse;
    } catch (error) {
      throw handleError(error);
    }
  }

  async getModels(): Promise<any> {
    try {
      const response = await this.client.models.list();
      return response.data
        .filter(model => this.chatModels.includes(model.id))
        .map(model => ({
          id: model.id,
          name: model.id,
          provider: "OpenAI",
          type: "chat"
        }));
    } catch (error) {
      throw handleError(error);
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