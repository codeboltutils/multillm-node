import axios from 'axios';
import { handleError } from '../../utils/errorHandler';
import type { BaseProvider, LLMProvider, ChatCompletionOptions, ChatCompletionResponse, Provider, ChatMessage } from '../../types';

interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

function transformMessages(messages: ChatMessage[]): GeminiMessage[] {
  return messages.map(message => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content || '' }]
  }));
}

export class Gemini implements LLMProvider {
  private chatModels = ['gemini-2.0-flash', 'gemini-pro', 'gemini-pro-vision'];
  public model: string | null;
  public device_map: string | null;
  public apiKey: string | null;
  public apiEndpoint: string | null;
  public provider: "gemini";

  constructor(
    model: string | null = null,
    device_map: string | null = null,
    apiKey: string | null = null,
    apiEndpoint: string | null = null
  ) {
    this.model = model || 'gemini-2.0-flash';
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint ?? 'https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/google-ai-studio';
    this.provider = "gemini";
  }

  get name(): string {
    return 'gemini';
  }

  get id(): number {
    return 2;
  }

  get logo(): string {
    return 'gemini-logo.png';
  }

  get category(): 'cloudProviders' | 'localProviders' | 'codebolt' {
    return 'cloudProviders';
  }

  get keyAdded(): boolean {
    return !!this.apiKey;
  }

  private transformToGeminiRequest(options: ChatCompletionOptions) {
    return {
      contents: transformMessages(options.messages),
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_NONE"
        }
      ],
      generationConfig: {
        temperature: options.temperature,
        topP: options.top_p,
        maxOutputTokens: options.max_tokens,
        topK: 40,
        stopSequences: options.stop ? (Array.isArray(options.stop) ? options.stop : [options.stop]) : []
      }
    };
  }

  private transformFromGeminiResponse(response: any, modelName: string): ChatCompletionResponse {
    return {
      id: `gemini-${Date.now()}`,
      object: 'chat.completion',
      created: Date.now(),
      model: modelName,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: response.data.candidates[0].content.parts[0].text
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: response.data.usageMetadata?.promptTokenCount || 0,
        completion_tokens: response.data.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: (response.data.usageMetadata?.promptTokenCount || 0) + (response.data.usageMetadata?.candidatesTokenCount || 0)
      }
    };
  }

  async createCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('API key is required for Gemini');
      }

      if (!options.messages || options.messages.length === 0) {
        throw new Error('At least one message is required');
      }

      const modelName = options.model || this.model || 'gemini-pro';

      // Validate model name before making the API call
      if (!this.chatModels.includes(modelName)) {
        throw new Error(`Model ${modelName} not found. Available models: ${this.chatModels.join(', ')}`);
      }

      try {
        const response = await axios.post(
          `${this.apiEndpoint}/v1/models/${modelName}:generateContent`,
          this.transformToGeminiRequest(options),
          {
            headers: {
              'x-goog-api-key': this.apiKey,
              'Content-Type': 'application/json'
            }
          }
        );

        return this.transformFromGeminiResponse(response, modelName);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401 || error.response?.status === 403) {
            throw new Error('Invalid API key');
          }
          if (error.response?.status === 404) {
            throw new Error(`Model ${modelName} not found`);
          }
          throw new Error(error.response?.data?.error?.message || error.message);
        }
        throw error;
      }
    } catch (error) {
      throw error;
    }
  }

  async getModels(): Promise<any> {
    return this.chatModels.map(modelId => ({
      id: modelId,
      name: modelId,
      provider: 'gemini',
      type: 'chat'
    }));
  }

  getProviders(): Provider[] {
    return [{
      id: 7,
      logo: "gemini-logo.png",
      name: "gemini",
      apiUrl: this.apiEndpoint || "https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/google-ai-studio",
      keyAdded: !!this.apiKey,
      category: 'cloudProviders'
    }];
  }
}

export default Gemini; 