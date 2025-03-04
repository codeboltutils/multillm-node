export function handleError(error: unknown): { error: { message: string; type?: string; code?: string } } {
  console.error('Error:', error);
  
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response: { data: any; status: number; headers: any } };
    console.error('Response data:', axiosError.response.data);
    console.error('Response status:', axiosError.response.status);
    console.error('Response headers:', axiosError.response.headers);
    return { 
      error: {
        message: axiosError.response.data.message || 'An unknown error occurred',
        type: axiosError.response.data.type || 'error',
        code: axiosError.response.data.code
      }
    };
  } else if (error && typeof error === 'object' && 'request' in error) {
    console.error('Request:', (error as { request: any }).request);
    return { 
      error: {
        message: 'No response received from server',
        type: 'error'
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