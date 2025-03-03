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

class Gemini implements LLMProvider {
  private chatModels: string[];
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
    this.chatModels = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro"];
    this.model = model || "gemini-1.5-flash";
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint ?? "https://generativelanguage.googleapis.com/v1";
    this.provider = "gemini";
  }

  async createCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      };

      const requestBody = {
        model: options.model || this.model || "gemini-1.5-flash",
        contents: transformMessages(options.messages),
        generationConfig: {
          temperature: options.temperature || 0.7,
          topP: options.top_p || 1,
          maxOutputTokens: options.max_tokens || 1024,
        }
      };

      const response = await axios.post(
        `${this.apiEndpoint}/models/${requestBody.model}:generateContent`, 
        requestBody,
        { headers }
      );

      // Transform Gemini response to standard format
      return {
        id: `gemini-${Date.now()}`,
        object: 'chat.completion',
        created: Date.now(),
        model: requestBody.model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: response.data.candidates[0].content.parts[0].text
          },
          finish_reason: response.data.candidates[0].finishReason || 'stop'
        }],
        usage: {
          prompt_tokens: response.data.usageMetadata?.promptTokenCount || 0,
          completion_tokens: response.data.usageMetadata?.candidatesTokenCount || 0,
          total_tokens: (response.data.usageMetadata?.promptTokenCount || 0) + 
                       (response.data.usageMetadata?.candidatesTokenCount || 0)
        }
      };
    } catch (error) {
      throw handleError(error);
    }
  }

  getProviders(): Provider[] {
    return [{
      id: 4,
      logo: "gemini-logo.png",
      name: "Google Gemini",
      apiUrl: this.apiEndpoint || "https://generativelanguage.googleapis.com/v1",
      keyAdded: !!this.apiKey,
      category: 'cloudProviders'
    }];
  }

  async getModels() {
    try {
      return this.chatModels.map(modelId => ({
        id: modelId,
        name: modelId,
        provider: "Gemini",
        type: "chat"
      }));
    } catch (error) {
      throw handleError(error);
    }
  }
}

export default Gemini; 