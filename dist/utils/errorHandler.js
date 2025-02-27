"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleError = handleError;
function handleError(error) {
    console.error('Error:', error);
    if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error;
        console.error('Response data:', axiosError.response.data);
        console.error('Response status:', axiosError.response.status);
        console.error('Response headers:', axiosError.response.headers);
        return { error: axiosError.response.data.error || axiosError.response.data };
    }
    else if (error && typeof error === 'object' && 'request' in error) {
        console.error('Request:', error.request);
        return { error: 'No response received from server' };
    }
    else if (error instanceof Error) {
        console.error('Error message:', error.message);
        return { error: error.message || 'An unknown error occurred' };
    }
    else {
        return { error: 'An unknown error occurred' };
    }
}
