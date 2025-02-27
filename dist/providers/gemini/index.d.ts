import type { BaseProvider } from '../../types';
declare class Gemini implements BaseProvider {
    private options;
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
export default Gemini;
