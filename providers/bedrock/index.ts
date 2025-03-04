import axios from 'axios';
import { handleError } from '../../utils/errorHandler';
import { AwsClient } from 'aws4fetch';
import type { BaseProvider, LLMProvider, ChatCompletionOptions, ChatCompletionResponse, Provider, ChatMessage, AWSConfig } from '../../types';

type Tool = {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, any>;
  };
};

interface BedrockMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function transformMessages(messages: ChatMessage[]): BedrockMessage[] {
  if (!messages || messages.length === 0) {
    throw new Error('Messages array cannot be empty');
  }
  return messages.map(message => ({
    role: message.role === 'function' || message.role === 'tool' ? 'user' : 
          message.role === 'assistant' ? 'assistant' : 
          message.role === 'system' ? 'system' : 'user',
    content: message.content || ''
  }));
}

function transformTools(tools?: Tool[]): Tool[] | undefined {
  if (!tools) return undefined;
  
  return tools.map(tool => {
    if (!tool.function?.name) {
      throw new Error('Tool function name is required');
    }
    return {
      type: 'function' as const,
      function: {
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters
      }
    };
  });
}

class Bedrock implements LLMProvider {
  private defaultModels: string[];
  public model: string | null;
  public device_map: string | null;
  public apiKey: string | null;
  public apiEndpoint: string | null;
  public provider: "bedrock";
  private awsClient: AwsClient;

  constructor(
    model: string | null = null,
    device_map: string | null = null,
    apiKey: string | null = null,
    apiEndpoint: string | null = null,
    awsConfig: AWSConfig = {}
  ) {
    if (!apiKey) {
      throw new Error('API key is required for Bedrock provider');
    }
    if (!apiEndpoint) {
      throw new Error('API endpoint is required for Bedrock provider');
    }

    this.defaultModels = [
      "anthropic.claude-3-sonnet-20240229-v1:0",
      "anthropic.claude-3-haiku-20240307-v1:0",
      "anthropic.claude-instant-v1",
      "meta.llama2-70b-chat-v1",
      "amazon.titan-text-express-v1",
      "cohere.command-text-v14"
    ];
    this.model = model || "anthropic.claude-3-sonnet-20240229-v1:0";
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint;
    this.provider = "bedrock";
    
    // Initialize AWS client with provided config or environment variables
    this.awsClient = new AwsClient({
      accessKeyId: awsConfig.accessKeyId || process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: awsConfig.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || '',
      region: awsConfig.region || 'us-east-1',
      service: 'bedrock'
    });
  }

  async createCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    try {
      const modelId = options.model || this.model || "anthropic.claude-3-sonnet-20240229-v1:0";
      const messages = transformMessages(options.messages);

      // Extract host and path from endpoint
      const url = new URL(this.apiEndpoint || '');
      const host = url.host;

      // Prepare request body according to Bedrock format
      const requestBody = {
        modelId,
        input: {
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          max_tokens: options.max_tokens || 100,
          temperature: options.temperature,
          top_p: options.top_p,
          tools: options.tools ? transformTools(options.tools) : undefined
        }
      };

      // Make request to Cloudflare AI Gateway
      const response = await axios.post(
        this.apiEndpoint || '',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'Host': host,
            'X-API-Key': this.apiKey
          }
        }
      );

      if (!response.data) {
        throw new Error('No response data received from Bedrock');
      }

      // Handle the response
      let content = '';
      let toolCalls;

      if (response.data.content && response.data.content[0]) {
        const responseContent = response.data.content[0];
        content = responseContent.text || '';
        
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
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };
    } catch (error) {
      throw handleError(error);
    }
  }

  getProviders(): Provider[] {
    return [{
      id: 12,
      logo: "https://d1.awsstatic.com/logos/aws-logo-lockups/poweredbyaws/PB_AWS_logo_RGB_REV_SQ.8c88ac215fe4e441cbd3b3be1d023927390ec2d5.png",
      name: "AWS Bedrock",
      apiUrl: this.apiEndpoint || "",
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