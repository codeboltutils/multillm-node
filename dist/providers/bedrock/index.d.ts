import type { BaseProvider } from '../../types';
declare class Bedrock implements BaseProvider {
    private options;
    private client;
    private chatModels;
    model: string | null;
    device_map: string | null;
    apiKey: string | null;
    apiEndpoint: string | null;
    constructor(model?: string | null, device_map?: string | null, apiKey?: string | null, apiEndpoint?: string | null, region?: string, accessKeyId?: string, secretAccessKey?: string);
    private formatPrompt;
    createCompletion(options: any): Promise<{
        error: string;
    } | {
        choices: {
            message: {
                role: string;
                content: string;
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
export default Bedrock;
