export interface Provider {
  id: number;
  logo: string;
  name: string;
  apiUrl: string;
  key?: string;
  keyAdded: boolean;
  category: 'codebolt' | 'cloudProviders' | 'localProviders';
}

export type SupportedProvider = 
  | "codeboltai"
  | "openai"
  | "anthropic"
  | "perplexity"
  | "lmstudio"
  | "mistral"
  | "gemini"
  | "grok"
  | "ollama"
  | "bedrock"
  | "huggingface"
  | "github"
  | "groq"
  | "replicate"
  | "openrouter"
  | "cloudflare";

export interface BaseProvider {
  model: string | null;
  device_map: string | null;
  apiKey?: string | null;
  apiEndpoint: string | null;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
  content: string | null;
  name?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
  tool_call_id?: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: Array<{
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: Record<string, any>;
    };
  }>;
  stop?: string | string[];
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LLMProvider extends BaseProvider {
  provider?: SupportedProvider;
  getProviders?(): Provider[];
  createCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse>;
  getModels(): Promise<any>;
} 

export type ToolSchema = {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: {
      [key: string]: {
        type: string;
        description: string;
      };
    };
    required: string[];
  };
};
