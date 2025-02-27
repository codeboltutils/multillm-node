import type { Message, MessageParam } from '@anthropic-ai/sdk/resources/messages';
import type { PromptCachingBetaMessage } from '@anthropic-ai/sdk/resources/beta/prompt-caching';
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
interface AnthropicCreateParams {
    messages: MessageParam[];
    system: Array<{
        text: string;
    }>;
    tools?: any[];
    model: string;
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
    createCompletion(createParams: AnthropicCreateParams): Promise<{
        message: Message | PromptCachingBetaMessage;
    } | Error>;
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
