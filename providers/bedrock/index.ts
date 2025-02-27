import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { handleError } from '../../utils/errorHandler';
import type { BaseProvider } from '../../types';
import axios from 'axios';

interface BedrockOptions extends BaseProvider {
  model: string | null;
  device_map: string | null;
  apiKey: string | null;
  apiEndpoint: string | null;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

class Bedrock implements BaseProvider {
  private options: BedrockOptions;
  private client: BedrockRuntimeClient;
  private chatModels: string[];
  public model: string | null;
  public device_map: string | null;
  public apiKey: string | null;
  public apiEndpoint: string | null;

  constructor(
    model: string | null = null,
    device_map: string | null = null,
    apiKey: string | null = null,
    apiEndpoint: string | null = null,
    region: string = "us-east-1",
    accessKeyId?: string,
    secretAccessKey?: string
  ) {
    this.chatModels = [
      "anthropic.claude-v2",
      "anthropic.claude-v2:1",
      "anthropic.claude-3-sonnet-20240229-v1:0",
      "meta.llama2-13b-chat-v1",
      "meta.llama2-70b-chat-v1",
      "amazon.titan-text-express-v1"
    ];
    this.model = model || "anthropic.claude-v2";
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint || "https://gateway.ai.cloudflare.com/v1/8073e84dbfc4e2bc95666192dcee62c0/codebolt/aws/bedrock-runtime";
    
    this.options = { 
      model: this.model,
      device_map,
      apiKey,
      apiEndpoint: this.apiEndpoint,
      region,
      accessKeyId,
      secretAccessKey
    };

    // Initialize AWS client for fallback
    this.client = new BedrockRuntimeClient({
      region: region,
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || ''
      }
    });
  }

  private formatPrompt(messages: any[]): string {
    if (this.model?.startsWith('anthropic.')) {
      return messages.map(msg => {
        const role = msg.role === 'assistant' ? 'Assistant' : 'Human';
        return `\\n\\n${role}: ${msg.content}`;
      }).join('') + '\\n\\nAssistant:';
    } else if (this.model?.startsWith('meta.')) {
      return messages.map(msg => {
        const role = msg.role === 'assistant' ? 'Assistant' : 'Human';
        return `[${role}]: ${msg.content}\\n`;
      }).join('') + '[Assistant]:';
    } else {
      // Default format for Titan and other models
      return messages.map(msg => msg.content).join('\\n');
    }
  }

  async createCompletion(options: any) {
    try {
      const prompt = this.formatPrompt(options.messages);
      
      let body: any = {};
      if (this.model?.startsWith('anthropic.')) {
        body = {
          prompt,
          max_tokens: options.max_tokens || 2000,
          temperature: options.temperature || 0.7,
          anthropic_version: "bedrock-2023-05-31"
        };
      } else if (this.model?.startsWith('meta.')) {
        body = {
          prompt,
          max_gen_len: options.max_tokens || 2000,
          temperature: options.temperature || 0.7
        };
      } else {
        body = {
          inputText: prompt,
          textGenerationConfig: {
            maxTokenCount: options.max_tokens || 2000,
            temperature: options.temperature || 0.7
          }
        };
      }

      try {
        // Try using Cloudflare Gateway first
        const response = await axios.post(
          `${this.apiEndpoint}/model/${this.model}`,
          body,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        let content = '';
        if (this.model?.startsWith('anthropic.')) {
          content = response.data.completion;
        } else if (this.model?.startsWith('meta.')) {
          content = response.data.generation;
        } else {
          content = response.data.results[0].outputText;
        }

        return {
          choices: [{
            message: {
              role: 'assistant',
              content: content
            }
          }]
        };
      } catch (error) {
        // Fallback to direct AWS Bedrock if Cloudflare fails
        console.warn('Cloudflare Gateway failed, falling back to direct AWS Bedrock:', error);
        const command = new InvokeModelCommand({
          modelId: this.model || 'anthropic.claude-v2',
          body: JSON.stringify(body)
        });

        const response = await this.client.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));

        let content = '';
        if (this.model?.startsWith('anthropic.')) {
          content = responseBody.completion;
        } else if (this.model?.startsWith('meta.')) {
          content = responseBody.generation;
        } else {
          content = responseBody.results[0].outputText;
        }

        return {
          choices: [{
            message: {
              role: 'assistant',
              content: content
            }
          }]
        };
      }
    } catch (error) {
      return handleError(error);
    }
  }

  async getModels() {
    try {
      return this.chatModels.map(modelId => ({
        id: modelId,
        provider: "Bedrock",
        type: "chat"
      }));
    } catch (error) {
      return handleError(error);
    }
  }
}

export default Bedrock; 