export interface Provider {
    id: number;
    logo: string;
    name: string;
    apiUrl: string;
    key?: string;
    keyAdded: boolean;
    category: 'codebolt' | 'cloudProviders' | 'localProviders';
}
export type SupportedProvider = "codeboltai" | "openai" | "anthropic" | "perplexity" | "lmstudio" | "mistral" | "gemini" | "grok" | "ollama" | "bedrock" | "huggingface" | "github" | "groq" | "replicate" | "openrouter" | "cloudflare";
export interface BaseProvider {
    model: string | null;
    device_map: string | null;
    apiKey?: string | null;
    apiEndpoint: string | null;
}
export interface LLMProvider extends BaseProvider {
    provider?: SupportedProvider;
    getProviders?(): Provider[];
    createCompletion(options: any): Promise<any>;
    getModels(): Promise<any>;
}
