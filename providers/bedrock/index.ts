import axios from 'axios';
import { handleError } from '../../utils/errorHandler';
import type { BaseProvider, LLMProvider, ChatCompletionOptions, ChatCompletionResponse, Provider, ChatMessage } from '../../types';

type Tool = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
};

interface BedrockMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function transformMessages(messages: ChatMessage[]): BedrockMessage[] {
  return messages.map(message => ({
    role: message.role === 'function' || message.role === 'tool' ? 'user' : 
          message.role === 'assistant' ? 'assistant' : 
          message.role === 'system' ? 'system' : 'user',
    content: message.content || ''
  }));
}

function transformTools(tools?: Tool[]): Tool[] | undefined {
  if (!tools) return undefined;
  
  return tools.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.function.name,
      description: tool.function.description,
      parameters: tool.function.parameters
    }
  }));
}

class Bedrock implements LLMProvider {
  private defaultModels: string[];
  public model: string | null;
  public device_map: string | null;
  public apiKey: string | null;
  public apiEndpoint: string | null;
  public provider: "bedrock";

  constructor(
    model: string | null = null,
    device_map: string | null = null,
    apiKey: string | null = null,
    apiEndpoint: string | null = null
  ) {
    this.defaultModels = [
      "anthropic.claude-3-sonnet-20240229",
      "anthropic.claude-3-haiku-20240307",
      "anthropic.claude-instant-v1",
      "meta.llama2-70b-chat-v1",
      "amazon.titan-text-express-v1",
      "cohere.command-text-v14"
    ];
    this.model = model || "anthropic.claude-3-sonnet-20240229";
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint ?? "https://bedrock-runtime.us-east-1.amazonaws.com/v1";
    this.provider = "bedrock";
  }

  async createCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    try {
      const modelId = options.model || this.model || "anthropic.claude-3-sonnet-20240229";
      const messages = transformMessages(options.messages);

      // Different models have different request formats
      let requestBody;
      if (modelId.startsWith('anthropic.')) {
        requestBody = {
          anthropic_version: "bedrock-2023-05-31",
          messages: messages,
          max_tokens: options.max_tokens || 1024,
          temperature: options.temperature,
          top_p: options.top_p,
          stop_sequences: options.stop,
          tools: options.tools ? transformTools(options.tools) : undefined
        };
      } else if (modelId.startsWith('meta.')) {
        requestBody = {
          prompt: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
          max_gen_len: options.max_tokens,
          temperature: options.temperature,
          top_p: options.top_p
        };
      } else if (modelId.startsWith('amazon.')) {
        requestBody = {
          inputText: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
          textGenerationConfig: {
            maxTokenCount: options.max_tokens,
            temperature: options.temperature,
            topP: options.top_p,
            stopSequences: options.stop
          }
        };
      } else if (modelId.startsWith('cohere.')) {
        requestBody = {
          prompt: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
          max_tokens: options.max_tokens,
          temperature: options.temperature,
          p: options.top_p,
          stop_sequences: options.stop
        };
      }

      const response = await axios.post(
        `${this.apiEndpoint}/models/${modelId}/invoke`,
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`
          }
        }
      );

      // Transform response based on model
      let content = '';
      let toolCalls;
      
      if (modelId.startsWith('anthropic.')) {
        const responseContent = response.data.content[0];
        content = responseContent.text || '';
        
        // Handle tool calls in the response
        if (responseContent.tool_calls) {
          toolCalls = responseContent.tool_calls.map((call: any) => ({
            id: `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: call.type,
            function: {
              name: call.function.name,
              arguments: call.function.arguments
            }
          }));
        }
      } else if (modelId.startsWith('meta.')) {
        content = response.data.generation;
      } else if (modelId.startsWith('amazon.')) {
        content = response.data.results[0].outputText;
      } else if (modelId.startsWith('cohere.')) {
        content = response.data.generations[0].text;
      }

      return {
        id: `bedrock-${Date.now()}`,
        object: 'chat.completion',
        created: Date.now(),
        model: modelId,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: content,
            tool_calls: toolCalls
          },
          finish_reason: toolCalls ? 'tool_calls' : 'stop'
        }],
        usage: {
          prompt_tokens: response.data.usage?.input_tokens || 0,
          completion_tokens: response.data.usage?.output_tokens || 0,
          total_tokens: (response.data.usage?.input_tokens || 0) + (response.data.usage?.output_tokens || 0)
        }
      };
    } catch (error) {
      throw handleError(error);
    }
  }

  getProviders(): Provider[] {
    return [{
      id: 8,
      logo: "bedrock-logo.png",
      name: "AWS Bedrock",
      apiUrl: this.apiEndpoint || "https://bedrock-runtime.us-east-1.amazonaws.com/v1",
      keyAdded: !!this.apiKey,
      category: 'cloudProviders'
    }];
  }

  async getModels() {
    return this.defaultModels.map(modelId => ({
      id: modelId,
      name: modelId,
      provider: "Bedrock",
      type: "chat"
    }));
  }
}

export default Bedrock; 