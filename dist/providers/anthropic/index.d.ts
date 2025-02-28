import type { BaseProvider } from '../../types';
interface AnthropicModelInfo {
    maxTokens: number;
    contextWindow: number;
    supportsImages: boolean;
    supportsPromptCache: boolean;
    inputPrice: number;
    outputPrice: number;
    cacheWritesPrice: number;
    cacheReadsPrice: number;
}
declare class AnthropicHandler implements BaseProvider {
    private embeddingModels;
    private options;
    private client;
    model: string | null;
    device_map: string | null;
    apiKey: string | null;
    apiEndpoint: string | null;
    constructor(model?: string | null, device_map?: string | null, apiKey?: string | null, apiEndpoint?: string | null);
    createCompletion(createParams: any): Promise<Error | {
        id: any;
        object: string;
        created: number;
        model: any;
        choices: {
            index: number;
            message: {
                role: any;
                content: string;
                tool_calls: any;
            };
            finish_reason: any;
        }[];
        usage: any;
    }>;
    getModel(modelId?: string): {
        id: string;
        info: AnthropicModelInfo;
    };
    getModels(): Promise<{
        id: string;
        provider: string;
        max_tokens: number;
        context_window: number;
        supports_images: boolean;
        supports_prompt_cache: boolean;
        pricing: {
            input_price_per_million_tokens: number;
            output_price_per_million_tokens: number;
            cache_writes_price_per_million_tokens: number;
            cache_reads_price_per_million_tokens: number;
        };
    }[]>;
}
export default AnthropicHandler;
