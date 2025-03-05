import axios from 'axios';
import { handleError } from '../../utils/errorHandler';
import { AwsClient } from 'aws4fetch';
import type { BaseProvider, LLMProvider, ChatCompletionOptions, ChatCompletionResponse, Provider, ChatMessage, AWSConfig } from '../../types';
import * as crypto from 'crypto';
import { json } from 'stream/consumers';

// Ensure crypto is available globally for aws4fetch
if (typeof global.crypto === 'undefined') {
  (global as any).crypto = crypto;
}

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
  content: string | Array<{ text: string }>;
}

function transformMessages(messages: ChatMessage[]): BedrockMessage[] {
  if (!messages || messages.length === 0) {
    throw new Error('Messages array cannot be empty');
  }
  return messages.map(message => ({
    role: message.role === 'function' || message.role === 'tool' ? 'user' :
      message.role === 'assistant' ? 'assistant' :
        message.role === 'system' ? 'system' : 'user',
    content: message.content ? [{ text: message.content }] : ''
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
  private awsClient: AwsClient;
  private cfAccountId: string;
  private gatewayName: string;

  constructor(
    model: string | null = null,
    device_map: string | null = null,
    apiKey: string | null = null,
    apiEndpoint: string | null = null,
    awsConfig: AWSConfig |any = {}
  ) {
   

    console.log(awsConfig)
    if (!apiEndpoint) {
      throw new Error('API endpoint is required for Bedrock provider');
    }

    this.defaultModels = [
      "apac.amazon.nova-lite-v1:0",
      "apac.amazon.nova-pro-v1:0",
      "anthropic.claude-3-sonnet-20240229-v1:0",
      "anthropic.claude-3-haiku-20240307-v1:0",
      "anthropic.claude-instant-v1",
      "meta.llama2-70b-chat-v1",
      "amazon.titan-text-express-v1",
      "cohere.command-text-v14"
    ];
    this.model = model || "apac.amazon.nova-lite-v1:0";
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint;
    this.provider = "bedrock";
    this.cfAccountId = "8073e84dbfc4e2bc95666192dcee62c0";
    this.gatewayName = "codebolt";

    // Initialize AWS client with provided config or environment variables
    this.awsClient = new AwsClient({
      accessKeyId:awsConfig.accessKeyId || process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: awsConfig.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || '',
      region: awsConfig.region || 'ap-south-1',
      service: 'bedrock'
    });
  }

  async createCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    try {
      const modelId = options.model || this.model || "apac.amazon.nova-lite-v1:0";
      const messages = transformMessages(options.messages);
      const region = this.awsClient.region || 'ap-south-1';

      // Prepare request body according to Bedrock format
      const requestData = {
        inferenceConfig: {
          max_new_tokens: options.max_tokens || 1000
        },
        messages: messages,
        // tools: options.tools ? transformTools(options.tools) : undefined
      };

      console.log(JSON.stringify(requestData, null, 2));
      const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
      };

      // Create the original Bedrock URL
      const bedrockUrl = new URL(
        `https://bedrock-runtime.${region}.amazonaws.com/model/${modelId}/invoke`
      );

      // Sign the request
      const presignedRequest = await this.awsClient.sign(bedrockUrl.toString(), {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestData)
      });

      // Create the Cloudflare AI Gateway URL
      const cfUrl = new URL(presignedRequest.url);
      cfUrl.host = "gateway.ai.cloudflare.com";
      cfUrl.pathname = `/v1/${this.cfAccountId}/${this.gatewayName}/aws-bedrock/bedrock-runtime/${region}/model/${modelId}/invoke`;

      // Make request to Cloudflare AI Gateway
      const response = await fetch(cfUrl, {
        method: "POST",
        headers: presignedRequest.headers,
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Error: ${errorText}`);
      }

      const data = await response.json();

      // Handle the response
      let content = '';
      let toolCalls;

      if (data.content && data.content[0]) {
        const responseContent = data.content[0];
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