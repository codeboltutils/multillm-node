import axios from 'axios';
import { handleError } from '../../utils/errorHandler';
import type { BaseProvider, LLMProvider, ChatCompletionOptions, ChatCompletionResponse, Provider, ChatMessage } from '../../types';

interface HuggingFaceMessage {
  role: string;
  content: string;
}

function transformMessages(messages: ChatMessage[]): string {
  // Convert messages to a format that HuggingFace models expect
  return messages.map(message => {
    const role = message.role === 'assistant' ? 'Assistant' : 
                message.role === 'system' ? 'System' : 'Human';
    return `${role}: ${message.content}`;
  }).join('\n') + '\nAssistant:';
}

class HuggingFace implements LLMProvider {
  private defaultModels: string[];
  public model: string | null;
  public device_map: string | null;
  public apiKey: string | null;
  public apiEndpoint: string | null;
  public provider: "huggingface";

  constructor(
    model: string | null = null,
    device_map: string | null = null,
    apiKey: string | null = null,
    apiEndpoint: string | null = null
  ) {
    this.defaultModels = [
      "meta-llama/Llama-2-70b-chat-hf",
      "mistralai/Mixtral-8x7B-Instruct-v0.1",
      "tiiuae/falcon-180B-chat",
      "HuggingFaceH4/zephyr-7b-beta",
      "google/gemma-7b-it",
      "01-ai/Yi-34B-Chat"
    ];
    this.model = model || "mistralai/Mixtral-8x7B-Instruct-v0.1";
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint ?? "https://api-inference.huggingface.co/models";
    this.provider = "huggingface";
  }

  async createCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    try {
      const modelId = options.model || this.model || "mistralai/Mixtral-8x7B-Instruct-v0.1";
      const prompt = transformMessages(options.messages);

      const response = await axios.post(
        `${this.apiEndpoint}/${modelId}`,
        {
          inputs: prompt,
          parameters: {
            temperature: options.temperature,
            max_new_tokens: options.max_tokens,
            top_p: options.top_p,
            stop: options.stop,
            return_full_text: false
          }
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`
          }
        }
      );

      // Extract the generated text from the response
      const generatedText = response.data[0]?.generated_text || '';

      return {
        id: `hf-${Date.now()}`,
        object: 'chat.completion',
        created: Date.now(),
        model: modelId,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: generatedText.trim()
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: response.data.usage?.prompt_tokens || 0,
          completion_tokens: response.data.usage?.completion_tokens || 0,
          total_tokens: (response.data.usage?.prompt_tokens || 0) + (response.data.usage?.completion_tokens || 0)
        }
      };
    } catch (error) {
      throw handleError(error);
    }
  }

  getProviders(): Provider[] {
    return [{
      id: 9,
      logo: "huggingface-logo.png",
      name: "Hugging Face",
      apiUrl: this.apiEndpoint || "https://api-inference.huggingface.co/models",
      keyAdded: !!this.apiKey,
      category: 'cloudProviders'
    }];
  }

  async getModels() {
    return this.defaultModels.map(modelId => ({
      id: modelId,
      name: modelId,
      provider: "HuggingFace",
      type: "chat"
    }));
  }
}

export default HuggingFace; 