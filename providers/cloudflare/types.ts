export interface CloudflareAIConfig {
  apiKey: string;
  apiEndpoint: string;
  model?: string;
}

export interface CloudflareAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CloudflareAIRequest {
  model: string;
  messages: CloudflareAIMessage[];
}

export interface CloudflareAIResponse {
  response: string;
  model: string;
  created_at: string;
} 