import Anthropic from '@anthropic-ai/sdk';
import { handleError } from '../../utils/errorHandler';
import type {
  BaseProvider,
  LLMProvider,
  ChatCompletionOptions,
  ChatCompletionResponse,
  ChatMessage,
  Tool,
  ToolCall,
  AnthropicMessage,
  AnthropicContent,
  AnthropicTool,
  AnthropicRequest,
  AnthropicResponse,
  Choice,
  Usage
} from '../../types';

class AnthropicProvider implements LLMProvider {
  private options: BaseProvider;
  private embeddingModels: string[];
  private chatModels: string[];
  private client: Anthropic;
  public model: string | null;
  public device_map: string | null;
  public apiKey: string | null;
  public apiEndpoint: string | null;
  public provider: "anthropic";

  constructor(
    model: string | null = null,
    device_map: string | null = null,
    apiKey: string | null = null,
    apiEndpoint: string | null = null
  ) {
    this.embeddingModels = []; // Anthropic doesn't provide embedding models
    this.chatModels = [
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-5-sonnet-20250114", // Latest Claude 3.5 Sonnet
      "claude-3-5-haiku-20250107", // Latest Claude 3.5 Haiku
      "claude-sonnet-4-20250514", // Claude Sonnet 4
      "claude-opus-4-20250514", // Claude Opus 4
      "claude-3-7-sonnet-20250219" // Claude 3.7 Sonnet
    ];
    this.model = model;
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint ?? "https://api.anthropic.com/v1";
    this.provider = "anthropic";
    
    // Initialize Anthropic client
    this.client = new Anthropic({
      apiKey: this.apiKey || undefined,
      baseURL: this.apiEndpoint
    });
    
    this.options = { model, device_map, apiKey, apiEndpoint: this.apiEndpoint };
  }

  /**
   * Transform OpenAI messages to Anthropic format
   */
  private transformMessagesToAnthropic(messages: ChatMessage[]): { messages: AnthropicMessage[], system?: string } {
    const anthropicMessages: AnthropicMessage[] = [];
    const systemMessages: string[] = [];

    for (const message of messages) {
      if (message.role === 'system') {
        // Anthropic handles system messages separately - collect all system messages
        if (message.content) {
          systemMessages.push(message.content);
        }
        continue;
      }

      if (message.role === 'function' || message.role === 'tool') {
        // Convert function/tool messages to tool_result content
        // Use tool_call_id if available, otherwise use name or message name
        const toolUseId = message.tool_call_id || message.name || 'unknown';
        
        anthropicMessages.push({
          role: 'user',
          content: [{
            type: 'tool_result',
            tool_use_id: toolUseId,
            content: message.content || '',
            is_error: false // You can modify this based on your error handling logic
          }]
        });
        continue;
      }

      if (message.role === 'assistant') {
        const content: AnthropicContent[] = [];
        
        // Add text content if present
        if (message.content && message.content.trim()) {
          content.push({
            type: 'text',
            text: message.content
          });
        }

        // Add tool calls if present
        if (message.tool_calls && message.tool_calls.length > 0) {
          for (const toolCall of message.tool_calls) {
            let parsedInput: any = {};
            try {
              // Handle both string and already parsed arguments
              if (typeof toolCall.function.arguments === 'string') {
                parsedInput = JSON.parse(toolCall.function.arguments || '{}');
              } else {
                parsedInput = toolCall.function.arguments || {};
              }
            } catch (error) {
              console.warn(`Failed to parse tool call arguments for ${toolCall.function.name}:`, toolCall.function.arguments);
              parsedInput = {};
            }
            
            content.push({
              type: 'tool_use',
              id: toolCall.id,
              name: toolCall.function.name,
              input: parsedInput
            });
          }
        }

        // Only add assistant message if there's content
        if (content.length > 0) {
          anthropicMessages.push({
            role: 'assistant',
            content: content.length === 1 && content[0].type === 'text' 
              ? content[0].text! 
              : content
          });
        }
        continue;
      }

      if (message.role === 'user') {
        anthropicMessages.push({
          role: 'user',
          content: message.content || ''
        });
        continue;
      }
    }

    // Ensure messages alternate between user and assistant
    // Anthropic requires strict alternation
    const alternatingMessages: AnthropicMessage[] = [];
    let lastRole: 'user' | 'assistant' | null = null;

    for (const message of anthropicMessages) {
      if (message.role !== lastRole) {
        alternatingMessages.push(message);
        lastRole = message.role;
      } else {
        // If we have consecutive messages from the same role, merge them
        const lastMessage = alternatingMessages[alternatingMessages.length - 1];
        if (lastMessage) {
          // Merge content
          if (typeof lastMessage.content === 'string' && typeof message.content === 'string') {
            lastMessage.content = lastMessage.content + '\n\n' + message.content;
          } else {
            // Convert to array format and merge
            const lastContent = typeof lastMessage.content === 'string' 
              ? [{ type: 'text' as const, text: lastMessage.content }] 
              : lastMessage.content;
            const currentContent = typeof message.content === 'string' 
              ? [{ type: 'text' as const, text: message.content }] 
              : message.content;
            
            lastMessage.content = [...lastContent, ...currentContent];
          }
        }
      }
    }

    // Combine all system messages into one
    const systemMessage = systemMessages.length > 0 ? systemMessages.join('\n\n') : undefined;
    
    return { messages: alternatingMessages, system: systemMessage };
  }

  /**
   * Transform OpenAI tools to Anthropic format
   */
  private transformToolsToAnthropic(tools?: Tool[]): AnthropicTool[] | undefined {
    if (!tools || tools.length === 0) return undefined;

    return tools.map(tool => ({
      name: tool.function.name,
      description: tool.function.description,
      input_schema: tool.function.parameters || {}
    }));
  }

  /**
   * Transform Anthropic response to OpenAI format
   */
  private transformResponseToOpenAI(anthropicResponse: AnthropicResponse): ChatCompletionResponse {
    const message: ChatMessage = {
      role: 'assistant',
      content: ''
    };

    const toolCalls: ToolCall[] = [];
    let textContent = '';

    // Process all content blocks from Anthropic response
    for (const content of anthropicResponse.content) {
      if (content.type === 'text') {
        textContent += content.text || '';
      } else if (content.type === 'tool_use') {
        toolCalls.push({
          id: content.id || `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'function',
          function: {
            name: content.name || '',
            arguments: JSON.stringify(content.input || {})
          }
        });
      }
    }

    // Set message content - if there's text content, use it; otherwise null for tool-only responses
    message.content = textContent || null;
    
    // Add tool calls if present
    if (toolCalls.length > 0) {
      message.tool_calls = toolCalls;
    }

    const choice = {
      index: 0,
      message,
      finish_reason: this.mapStopReason(anthropicResponse.stop_reason)
    };

    const usage: Usage = {
      prompt_tokens: anthropicResponse.usage.input_tokens,
      completion_tokens: anthropicResponse.usage.output_tokens,
      total_tokens: anthropicResponse.usage.input_tokens + anthropicResponse.usage.output_tokens
    };

    return {
      id: anthropicResponse.id,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: anthropicResponse.model,
      choices: [choice],
      usage
    };
  }

  /**
   * Map Anthropic stop reasons to OpenAI finish reasons
   */
  private mapStopReason(stopReason: string): 'stop' | 'length' | 'tool_calls' | 'content_filter' | null {
    switch (stopReason) {
      case 'end_turn':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'tool_use':
        return 'tool_calls';
      case 'stop_sequence':
        return 'stop';
      default:
        return 'stop';
    }
  }

  /**
   * Map OpenAI tool choice to Anthropic format
   */
  private mapToolChoice(toolChoice?: ChatCompletionOptions['tool_choice']) {
    if (!toolChoice || toolChoice === 'auto') {
      return { type: 'auto' as const };
    }
    if (toolChoice === 'none') {
      return undefined; // Anthropic doesn't have explicit 'none', just omit tool_choice
    }
    if (typeof toolChoice === 'object' && toolChoice.type === 'function') {
      return {
        type: 'tool' as const,
        name: toolChoice.function.name
      };
    }
    // Handle 'required' or any other string values as 'any'
    if (typeof toolChoice === 'string') {
      return { type: 'any' as const };
    }
    return { type: 'auto' as const };
  }

  async createCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    try {
      // Validate API key
      if (!this.apiKey) {
        throw new Error("Anthropic API key is required. Please set your API key.");
      }

      const { messages, system } = this.transformMessagesToAnthropic(options.messages);
      const tools = this.transformToolsToAnthropic(options.tools);
      
      // Validate that we have messages
      if (!messages || messages.length === 0) {
        throw new Error("At least one message is required");
      }

      // Ensure first message is from user (Anthropic requirement)
      if (messages[0].role !== 'user') {
        throw new Error("First message must be from user");
      }
      
      const anthropicRequest: AnthropicRequest = {
        model: options.model || this.model || "claude-3-5-sonnet-20241022",
        max_tokens: options.max_tokens || 4096,
        messages,
        temperature: options.temperature,
        top_p: options.top_p,
        stream: options.stream || false
      };

      if (system) {
        anthropicRequest.system = system;
      }

      if (tools && tools.length > 0) {
        anthropicRequest.tools = tools;
        const toolChoice = this.mapToolChoice(options.tool_choice);
        if (toolChoice) {
          anthropicRequest.tool_choice = toolChoice;
        }
      }

      if (options.stop) {
        anthropicRequest.stop_sequences = Array.isArray(options.stop) ? options.stop : [options.stop];
      }

      // Create the request object, filtering out undefined values
      const requestPayload: any = {
        model: anthropicRequest.model,
        max_tokens: anthropicRequest.max_tokens,
        messages: anthropicRequest.messages,
        stream: anthropicRequest.stream
      };

      if (anthropicRequest.system) {
        requestPayload.system = anthropicRequest.system;
      }
      
      if (anthropicRequest.temperature !== undefined) {
        requestPayload.temperature = anthropicRequest.temperature;
      }
      
      if (anthropicRequest.top_p !== undefined) {
        requestPayload.top_p = anthropicRequest.top_p;
      }
      
      if (anthropicRequest.tools && anthropicRequest.tools.length > 0) {
        requestPayload.tools = anthropicRequest.tools;
      }
      
      if (anthropicRequest.tool_choice) {
        requestPayload.tool_choice = anthropicRequest.tool_choice;
      }
      
      if (anthropicRequest.stop_sequences && anthropicRequest.stop_sequences.length > 0) {
        requestPayload.stop_sequences = anthropicRequest.stop_sequences;
      }

      const response = await this.client.messages.create(requestPayload);

      return this.transformResponseToOpenAI(response as any);
    } catch (error) {
      // Enhanced error handling with context
      const handledError = handleError(error);
      
      // Add provider context to the error
      if (handledError.error) {
        handledError.error.provider = 'anthropic';
        handledError.error.model = options.model || this.model || "claude-3-5-sonnet-20241022";
        
        // Add specific guidance for common Anthropic errors
        if (handledError.error.message?.includes('credit balance is too low')) {
          handledError.error.suggestion = 'Please check your Anthropic account billing and add credits to continue using the API.';
        } else if (handledError.error.message?.includes('rate limit')) {
          handledError.error.suggestion = 'Rate limit exceeded. Please wait before making another request.';
        } else if (handledError.error.message?.includes('invalid_request_error')) {
          handledError.error.suggestion = 'Please check your request parameters and ensure they meet Anthropic API requirements.';
        }
      }
      
      throw handledError;
    }
  }

  async getModels(): Promise<any> {
    // Anthropic doesn't have a models endpoint, so return static list
    return this.chatModels.map(model => ({
      id: model,
      name: model,
      provider: "Anthropic",
      type: "chat"
    }));
  }

  async createEmbedding(input: string | string[], model: string): Promise<any> {
    throw new Error("Anthropic does not support embeddings. Use OpenAI or another provider for embeddings.");
  }
}

export default AnthropicProvider;