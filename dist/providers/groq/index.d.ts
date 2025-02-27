import type { BaseProvider } from '../../types';
declare class GroqProvider implements BaseProvider {
    private options;
    private client;
    private chatModels;
    model: string | null;
    device_map: string | null;
    apiKey: string | null;
    apiEndpoint: string | null;
    constructor(model?: string | null, device_map?: string | null, apiKey?: string | null, apiEndpoint?: string | null);
    createCompletion(options: any): Promise<{
        error: string;
    } | {
        choices: {
            message: {
                role: string;
                content: string | null;
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
export default GroqProvider;
