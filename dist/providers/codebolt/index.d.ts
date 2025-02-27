import type { BaseProvider } from '../../types';
interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
interface CompletionOptions {
    model: string;
    messages: Message[];
    [key: string]: any;
}
interface CompletionResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: Message;
        finish_reason: string;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}
interface Model {
    id: string;
    object: string;
    created: number;
    owned_by: string;
    provider?: string;
    type?: string;
}
interface EmbeddingResponse {
    object: string;
    data: Array<{
        object: string;
        embedding: number[];
        index: number;
    }>;
    model: string;
    usage: {
        prompt_tokens: number;
        total_tokens: number;
    };
}
declare class CodeBoltAI implements BaseProvider {
    private embeddingModels;
    model: string | null;
    device_map: string | null;
    apiKey: string | null;
    apiEndpoint: string;
    constructor(model?: string | null, device_map?: string | null, apiKey?: string | null, apiEndpoint?: string | null);
    createCompletion(options: CompletionOptions): Promise<CompletionResponse | {
        error: string;
    }>;
    getModels(): Promise<Model[] | {
        error: string;
    }>;
    createEmbedding(input: string | string[], model: string): Promise<EmbeddingResponse | {
        error: string;
    }>;
}
export default CodeBoltAI;
