import axios from 'axios';
import { handleError } from '../../utils/errorHandler';
import type { BaseProvider, LLMProvider, ChatCompletionOptions, ChatCompletionResponse, Provider, ChatMessage } from '../../types';

interface HuggingFaceMessage {
  role: string;
  content: string;
}

function transformMessages(messages: ChatMessage[]): string {
  // Convert messages to a format that HuggingFace models expect
  let prompt = messages.map(message => {
    const role = message.role === 'assistant' ? 'Assistant' : 
                message.role === 'system' ? 'System' : 
                message.role === 'function' ? 'Function' : 'Human';
    
    // Handle function calls and results
    if (message.role === 'assistant' && message.tool_calls) {
      const toolCalls = message.tool_calls.map(tool => 
        `Call function: ${tool.function.name} with args: ${tool.function.arguments}`
      ).join('\n');
      return `${role}: ${message.content || ''}\n${toolCalls}`;
    }
    
    // Handle function responses
    if (message.role === 'function') {
      return `${role} ${message.name}: ${message.content}`;
    }
    
    return `${role}: ${message.content}`;
  }).join('\n');

  // Add available tools to the prompt if provided
  return prompt + '\nAssistant:';
}

function parseToolCalls(text: string): any[] | null {
  // Simple regex to detect function calls in the format: Call function: name with args: {...}
  const regex = /Call function: (\w+) with args: ({[^}]+})/g;
  const matches = [...text.matchAll(regex)];
  
  if (matches.length === 0) {
    return null;
  }

  return matches.map((match, index) => {
    try {
      const name = match[1];
      const args = JSON.parse(match[2]);
      return {
        id: `call_${index}`,
        type: 'function',
        function: {
          name,
          arguments: JSON.stringify(args)
        }
      };
    } catch (e) {
      console.warn('Failed to parse tool call:', e);
      return null;
    }
  }).filter(Boolean);
}

class HuggingFace implements LLMProvider {
  private defaultModels: string[];
  public model: string | null;
  public device_map: string | null;
  public apiKey: string | null;
  public apiEndpoint: string | null;
  public provider: "huggingface";

  constructor(
    model: string | null = null,
    device_map: string | null = null,
    apiKey: string | null = null,
    apiEndpoint: string | null = null
  ) {
    this.defaultModels = [
      "meta-llama/Llama-2-70b-chat-hf",
      "mistralai/Mixtral-8x7B-Instruct-v0.1",
      "tiiuae/falcon-180B-chat",
      "HuggingFaceH4/zephyr-7b-beta",
      "google/gemma-7b-it",
      "01-ai/Yi-34B-Chat"
    ];
    this.model = model || "mistralai/Mixtral-8x7B-Instruct-v0.1";
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint ?? "https://api-inference.huggingface.co/models";
    this.provider = "huggingface";
  }

  async createCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    try {
      const modelId = options.model || this.model || "mistralai/Mixtral-8x7B-Instruct-v0.1";
      
      // Add tools to the system message if provided
      let messages = [...options.messages];
      if (options.tools?.length) {
        const toolsDesc = options.tools.map(tool => 
          `Available function: ${tool.function.name}\nDescription: ${tool.function.description}\nParameters: ${JSON.stringify(tool.function.parameters, null, 2)}`
        ).join('\n\n');
        
        messages.unshift({
          role: 'system',
          content: `You have access to the following functions:\n${toolsDesc}\n\nTo use a function, respond with: Call function: <name> with args: <arguments as JSON>`
        });
      }

      const prompt = transformMessages(messages);

      const response = await axios.post(
        `${this.apiEndpoint}/${modelId}`,
        {
          inputs: prompt,
          parameters: {
            temperature: options.temperature,
            max_new_tokens: options.max_tokens,
            top_p: options.top_p,
            stop: options.stop,
            return_full_text: false
          }
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`
          }
        }
      );

      // Extract the generated text from the response
      const generatedText = response.data[0]?.generated_text || '';
      
      // Check for tool calls in the response
      const toolCalls = parseToolCalls(generatedText);
      
      return {
        id: `hf-${Date.now()}`,
        object: 'chat.completion',
        created: Date.now(),
        model: modelId,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: toolCalls ? null : generatedText.trim(),
            tool_calls: toolCalls || undefined
          },
          finish_reason: toolCalls ? 'tool_calls' : 'stop'
        }],
        usage: {
          prompt_tokens: response.data.usage?.prompt_tokens || 0,
          completion_tokens: response.data.usage?.completion_tokens || 0,
          total_tokens: (response.data.usage?.prompt_tokens || 0) + (response.data.usage?.completion_tokens || 0)
        }
      };
    } catch (error) {
      throw handleError(error);
    }
  }

  async getModels(): Promise<any> {
    return this.defaultModels.map(modelId => ({
      id: modelId,
      name: modelId,
      provider: "HuggingFace",
      type: "chat"
    }));
  }
}

export default HuggingFace; 