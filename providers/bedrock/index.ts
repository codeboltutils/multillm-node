import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import axios from 'axios';
import type { BaseProvider, LLMProvider, ChatCompletionOptions, ChatCompletionResponse, Provider, ChatMessage, AWSConfig } from '../../types';

interface Tool {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, any>;
      required: string[];
    };
  };
}

interface Message {
  role: string;
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

function transformMessages(messages: Message[]): any[] {
  if (!messages || messages.length === 0) {
    throw new Error('Messages array cannot be empty');
  }
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content || ''
  }));
}

function transformTools(tools: Tool[]): any[] {
  if (!tools) return [];
  return tools.map(tool => ({
    type: tool.type,
    function: {
      name: tool.function.name,
      description: tool.function.description,
      parameters: {
        type: tool.function.parameters.type,
        properties: tool.function.parameters.properties,
        required: tool.function.parameters.required
      }
    }
  }));
}

class Bedrock implements LLMProvider {
  public model: string;
  public apiKey: string | null;
  public apiEndpoint: string | null;
  public provider: "bedrock";
  public device_map: string | null;
  private client: BedrockRuntimeClient;

  constructor(
    model: string | null,
    apiKey: string | null,
    apiEndpoint: string | null,
    awsConfig?: AWSConfig
  ) {
    this.model = model || 'anthropic.claude-3-sonnet-20240229-v1:0';
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint;
    this.provider = "bedrock";
    this.device_map = null;
    
    // Initialize AWS client with provided or environment variable credentials
    this.client = new BedrockRuntimeClient({
      credentials: {
        accessKeyId: awsConfig?.accessKeyId || process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: awsConfig?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || ''
      },
      region: awsConfig?.region || process.env.AWS_REGION || 'us-east-1'
    });
  }

  async createCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    const {
      messages,
      model = this.model,
      max_tokens = 1000,
      temperature = 0.7,
      top_p = 0.9,
      tools,
      stream = false
    } = options;

    // Extract account ID and gateway ID from the endpoint
    const cfUrl = new URL(this.apiEndpoint || 'https://gateway.ai.cloudflare.com');

    // Use the endpoint URL directly
    const cloudflareUrl = this.apiEndpoint || 'https://gateway.ai.cloudflare.com';

    // Prepare the request body according to Bedrock format
    const requestBody = {
      messages: transformMessages(messages),
      max_tokens,
      temperature,
      top_p,
      ...(tools && { tools: transformTools(tools as Tool[]) })
    };

    // Make the request to Cloudflare AI Gateway
    const response = await axios.post(cloudflareUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'User-Agent': 'multillm-node/1.0.0',
        'Host': 'gateway.ai.cloudflare.com',
        'X-Forwarded-Host': 'gateway.ai.cloudflare.com',
        'X-Forwarded-Proto': 'https',
        'Origin': 'https://gateway.ai.cloudflare.com',
        'CF-Access-Client-Id': this.apiKey,
        'CF-Access-Client-Secret': this.apiKey
      }
    });

    // Extract content and tool calls from the response
    const responseData = response.data;
    return {
      id: `bedrock-${Date.now()}`,
      object: 'chat.completion',
      created: Date.now(),
      model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: responseData.content || '',
          tool_calls: responseData.tool_calls || []
        },
        finish_reason: responseData.finish_reason || 'stop'
      }],
      usage: {
        prompt_tokens: responseData.usage?.prompt_tokens || 0,
        completion_tokens: responseData.usage?.completion_tokens || 0,
        total_tokens: responseData.usage?.total_tokens || 0
      }
    };
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
    return [{
      id: this.model,
      name: this.model,
      provider: "Bedrock",
      type: "chat"
    }];
  }
}

export default Bedrock;