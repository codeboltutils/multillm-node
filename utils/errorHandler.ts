import type { LLMErrorResponse } from '../types';

export function handleError(error: unknown): LLMErrorResponse {
  console.error('Error:', error);
  
  // Handle Anthropic SDK errors specifically
  if (error && typeof error === 'object' && 'message' in error) {
    const errorObj = error as any;
    
    // Check if it's an Anthropic API error with a specific structure
    if (errorObj.message && typeof errorObj.message === 'string') {
      // Try to parse Anthropic error format: "400 {json}"
      const anthropicErrorMatch = errorObj.message.match(/^\d{3}\s+(.+)$/);
      if (anthropicErrorMatch) {
        try {
          const errorData = JSON.parse(anthropicErrorMatch[1]);
          if (errorData.error && errorData.error.message) {
            return {
              error: {
                message: errorData.error.message,
                type: errorData.error.type || 'anthropic_error',
                code: errorData.error.code || errorObj.status?.toString()
              }
            };
          }
        } catch (parseError) {
          // If JSON parsing fails, fall through to general error handling
        }
      }
      
      // Return the original error message if it doesn't match Anthropic format
      return {
        error: {
          message: errorObj.message,
          type: errorObj.type || 'error',
          code: errorObj.code || errorObj.status?.toString()
        }
      };
    }
  }
  
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response: { data: any; status: number; headers: any } };
    console.error('Response data:', axiosError.response.data);
    console.error('Response status:', axiosError.response.status);
    console.error('Response headers:', axiosError.response.headers);
    return { 
      error: {
        message: axiosError.response.data.message || 'An unknown error occurred',
        type: axiosError.response.data.type || 'error',
        code: axiosError.response.data.code || axiosError.response.status?.toString()
      }
    };
  } else if (error && typeof error === 'object' && 'request' in error) {
    console.error('Request:', (error as { request: any }).request);
    return { 
      error: {
        message: 'No response received from server',
        type: 'network_error'
      }
    };
  } else if (error instanceof Error) {
    console.error('Error message:', error.message);
    return { 
      error: {
        message: error.message || 'An unknown error occurred',
        type: 'error'
      }
    };
  } else {
    return { 
      error: {
        message: 'An unknown error occurred',
        type: 'error'
      }
    };
  }
} 