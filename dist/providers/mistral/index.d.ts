import type { BaseProvider } from '../../types';
interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
interface CompletionOptions {
    model: string;
    messages: Message[];
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
interface ModelsResponse {
    object: string;
    data: Array<{
        id: string;
        object: string;
        created: number;
        owned_by: string;
    }>;
}
declare class MistralAI implements BaseProvider {
    model: string | null;
    device_map: string | null;
    apiKey: string | null;
    apiEndpoint: string;
    constructor(model?: string | null, device_map?: string | null, apiKey?: string | null, apiEndpoint?: string | null);
    createCompletion(options: CompletionOptions): Promise<CompletionResponse | Error>;
    getModels(): Promise<ModelsResponse | Error>;
}
export default MistralAI;
