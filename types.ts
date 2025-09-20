export interface Provider {
  id: number;
  logo: string;
  name: string;
  apiUrl: string;
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
  | "cloudflare"
  | "deepseek";

export interface AWSConfig {
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
}

export interface ProviderConfig {
  aws?: AWSConfig;
}

export interface BaseProvider {
  model: string | null;
  device_map: string | null;
  apiKey?: string | null;
  apiEndpoint: string | null;
  config?: ProviderConfig;
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
  supportTools?:boolean;
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
  
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    delta?: {
      role?: string;
      content?: string;
    };
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





export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface FunctionCall {
  name: string;
  arguments: string;
}



export interface Tool {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: any;
  };
}



export interface Choice {
  index: number;
  message?: ChatMessage;
  delta?: ChatMessage;
  finish_reason?: 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'function_call';
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}



// Anthropic Types
export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | AnthropicContent[];
}

export interface AnthropicContent {
  type: 'text' | 'tool_use' | 'tool_result';
  text?: string;
  id?: string;
  name?: string;
  input?: any;
  content?: string;
  tool_use_id?: string;
  is_error?: boolean;
}

export interface AnthropicTool {
  name: string;
  description?: string;
  input_schema: any;
}

export interface AnthropicRequest {
  model: string;
  max_tokens: number;
  messages: AnthropicMessage[];
  system?: string;
  temperature?: number;
  top_p?: number;
  tools?: AnthropicTool[];
  tool_choice?: { type: 'auto' | 'any' | 'tool'; name?: string };
  stop_sequences?: string[];
  stream?: boolean;
}

export interface AnthropicResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: AnthropicContent[];
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use';
  stop_sequence?: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// Error handling types
export interface LLMError {
  message: string;
  type?: string;
  code?: string;
  provider?: string;
  model?: string;
  suggestion?: string;
}

export interface LLMErrorResponse {
  error: LLMError;
}
