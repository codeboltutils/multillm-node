import type { BaseProvider } from '../../types';
declare class CloudflareProvider implements BaseProvider {
    private options;
    private client;
    private chatModels;
    model: string | null;
    device_map: string | null;
    apiKey: string | null;
    apiEndpoint: string | null;
    constructor(model?: string | null, device_map?: string | null, apiKey?: string | null, apiEndpoint?: string | null, accountId?: string | null);
    private formatPrompt;
    createCompletion(options: any): Promise<{
        error: string;
    } | {
        choices: {
            message: {
                role: string;
                content: any;
            };
        }[];
    }>;
    getModels(): Promise<{
        error: string;
    } | {
        id: string;
        provider: string;
        type: string;
    }[]>;
}
export default CloudflareProvider;
