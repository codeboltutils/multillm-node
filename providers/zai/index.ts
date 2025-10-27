// import axios from 'axios';
// import { handleError } from '../../utils/errorHandler';
// import type { BaseProvider, LLMProvider, ChatCompletionOptions, ChatCompletionResponse, ChatMessage } from '../../types';

// function transformMessages(messages: ChatMessage[]): any[] {
//   return messages.map(message => {
//     if (message.role === 'function') {
//       return {
//         role: 'function',
//         name: message.name || 'unknown',
//         content: message.content || ''
//       };
//     }
    
//     if (message.role === 'assistant' && message.tool_calls) {
//       return {
//         role: 'assistant',
//         content: message.content || '',
//         tool_calls: message.tool_calls
//       };
//     }
    
//     if (message.role === 'system') {
//       return {
//         role: 'system',
//         content: message.content || ''
//       };
//     }
    
//     return {
//       role: 'user',
//       content: message.content || ''
//     };
//   });
// }

// class ZAi implements LLMProvider {
//   private options: BaseProvider;
//   private embeddingModels: string[];
//   private chatModels: string[];
//   public model: string | null;
//   public device_map: string | null;
//   public apiKey: string | null;
//   public apiEndpoint: string | null;
//   public provider: "openai";

//   constructor(
//     model: string | null = null,
//     device_map: string | null = null,
//     apiKey: string | null = null,
//     apiEndpoint: string | null = null
//   ) {
//     this.embeddingModels = ["text-embedding-3-small", "text-embedding-3-large", "text-embedding-ada-002"];
//     this.chatModels = ["glm-4.5", "gpt-4", "gpt-3.5-turbo"];
//     this.model = model;
//     this.device_map = device_map;
//     this.apiKey = apiKey;
//     this.apiEndpoint =  "https://api.z.ai/api/coding/paas/v4";
//     this.provider = "openai";
    
//     this.options = { model, device_map, apiKey, apiEndpoint: this.apiEndpoint };
//   }

//   async createCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
//     try {
//       const data = {
//         model: options.model || this.model || "glm-4.5",
//         messages: options.messages,
//         temperature: options.temperature,
//         top_p: options.top_p,
//         max_tokens: options.max_tokens,
//         stream: options.stream,
//         tools: options.tools,
//         stop: options.stop,
//       };

//       const config = {
//         method: 'post',
//         maxBodyLength: Infinity,
//         url: `${this.apiEndpoint}/chat/completions`,
//         headers: { 
//           'Content-Type': 'application/json', 
//           'Authorization': `Bearer ${this.apiKey}`
//         },
//         data: data
//       };

//       const response = await axios.request(config);
//       return response.data as ChatCompletionResponse;
//     } catch (error) {
//       throw handleError(error);
//     }
//   }

//   async getModels(): Promise<any> {
//     try {
//       // Return static glm-4.6 model instead of fetching from API
//       return [{
//         id: 'glm-4.6',
//         name: 'glm-4.6',
//         provider: 'zai',
//         type: 'chat'
//       }];
//     } catch (error) {
//       throw handleError(error);
//     }
//   }

//   async createEmbedding(input: string | string[], model: string) {
//     try {
//       const response = await axios.post(
//         `${this.apiEndpoint}/embeddings`,
//         {
//           input,
//           model
//         },
//         {
//           headers: {
//             "Content-Type": "application/json",
//             'Authorization': `Bearer ${this.apiKey}`
//           },
//         }
//       );

//       return response.data;
//     } catch (error) {
//       return handleError(error);
//     }
//   }
// }

// export default ZAi;


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

class ZAi implements LLMProvider {
  private options: BaseProvider;
  private client: OpenAIApi | AzureOpenAI;
  private embeddingModels: string[];
  private chatModels: string[];
  public model: string | null;
  public device_map: string | null;
  public apiKey: string | null;
  public apiEndpoint: string | null;
  public provider: "zai";

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
    this.apiEndpoint = "https://api.z.ai/api/coding/paas/v4";
    this.provider = "zai";
    
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
        // @ts-ignore
        messages: options.messages,
        model:'glm-4.6', //||options.model || this.model || "glm-4.6",
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
        return [{
        id: 'glm-4.6',
        name: 'glm-4.6',
        provider: 'zai',
        type: 'chat'
      }];
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

export default ZAi; 