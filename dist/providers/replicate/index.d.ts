import type { BaseProvider } from '../../types';
declare class ReplicateHandler implements BaseProvider {
    private client;
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
                content: object;
            };
        }[];
    }>;
    private formatPrompt;
    getModels(): Promise<{
        id: string;
        provider: string;
        type: string;
    }[]>;
}
export default ReplicateHandler;
