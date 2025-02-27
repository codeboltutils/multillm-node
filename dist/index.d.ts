import type { Provider, SupportedProvider, LLMProvider } from './types.ts';
declare class Multillm implements LLMProvider {
    provider: SupportedProvider;
    device_map: string | null;
    apiKey: string | null;
    model: string | null;
    apiEndpoint: string | null;
    private instance;
    constructor(provider: SupportedProvider, model?: string | null, device_map?: string | null, apiKey?: string | null, apiEndpoint?: string | null);
    createCompletion(options: any): Promise<any>;
    getModels(): Promise<any>;
    getProviders(): Provider[];
}
export = Multillm;
