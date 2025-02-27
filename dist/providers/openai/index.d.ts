import type { ChatCompletion, ChatCompletionChunk, ChatCompletionCreateParams } from 'openai/resources/chat';
import type { Stream } from 'openai/streaming';
import type { BaseProvider } from '../../types';
declare class OpenAI implements BaseProvider {
    private options;
    private client;
    private embeddingModels;
    private chatModels;
    model: string | null;
    device_map: string | null;
    apiKey: string | null;
    apiEndpoint: string | null;
    constructor(model?: string | null, device_map?: string | null, apiKey?: string | null, apiEndpoint?: string | null);
    createCompletion(createParams: ChatCompletionCreateParams): Promise<(ChatCompletion & {
        _request_id?: string | null;
    }) | (Stream<ChatCompletionChunk> & {
        _request_id?: string | null;
    }) | {
        error: string;
    }>;
    getModels(): Promise<any>;
    createEmbedding(input: string | string[], model: string): Promise<any>;
}
export default OpenAI;
