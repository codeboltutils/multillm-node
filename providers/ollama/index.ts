import axios from 'axios';
import { handleError } from '../../utils/errorHandler';
import type { BaseProvider, LLMProvider, ChatCompletionOptions, ChatCompletionResponse, Provider, ChatMessage } from '../../types';

interface OllamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function transformMessages(messages: ChatMessage[]): OllamaMessage[] {
  return messages.map(message => ({
    role: message.role === 'function' || message.role === 'tool' ? 'user' : 
          message.role === 'assistant' ? 'assistant' : 
          message.role === 'system' ? 'system' : 'user',
    content: message.content || ''
  }));
}

class Ollama implements LLMProvider {
  private defaultModels: string[];
  public model: string | null;
  public device_map: string | null;
  public apiKey: string | null;
  public apiEndpoint: string | null;
  public provider: "ollama";

  constructor(
    model: string | null = null,
    device_map: string | null = null,
    apiKey: string | null = null,
    apiEndpoint: string | null = null
  ) {
    this.defaultModels = [
      "llama2",
      "codellama",
      "mistral",
      "mixtral",
      "phi",
      "neural-chat",
      "starling-lm"
    ];
    this.model = model || "mixtral";
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint ?? "http://localhost:11434";
    this.provider = "ollama";
  }

  async createCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    try {
      const response = await axios.post(
        `${this.apiEndpoint}/api/generate`,  // Using generate endpoint instead of chat
        {
          model: options.model || this.model || "mixtral",
          prompt: options.messages.map(msg => `${msg.role}: ${msg.content}`).join('\n'),
          options: {
            temperature: options.temperature,
            top_p: options.top_p,
            num_predict: options.max_tokens,
            stop: options.stop
          },
          stream: false
        }
      );

      // Handle Ollama's response format
      const responseContent = response.data.response || "I apologize, but I couldn't generate a response at this time.";
      
      return {
        id: `ollama-${Date.now()}`,
        object: 'chat.completion',
        created: Date.now(),
        model: options.model || this.model || "mixtral",
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: responseContent
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: response.data.prompt_eval_count || 0,
          completion_tokens: response.data.eval_count || 0,
          total_tokens: (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0)
        }
      };
    } catch (error) {
      throw handleError(error);
    }
  }

  async getModels(): Promise<any> {
    try {
      const response = await axios.get(`${this.apiEndpoint}/api/tags`);
      
      // Combine default models with installed models
      const installedModels = response.data.models || [];
      const allModels = [...new Set([...this.defaultModels, ...installedModels.map((m: any) => m.name)])];
      
      return allModels.map(modelId => ({
        id: modelId,
        name: modelId,
        provider: "Ollama",
        type: "chat"
      }));
    } catch (error) {
      // If we can't reach Ollama, return default models
      return this.defaultModels.map(modelId => ({
        id: modelId,
        name: modelId,
        provider: "Ollama",
        type: "chat"
      }));
    }
  }
}

export default Ollama; 