import type { BaseProvider } from '../../types';
declare class Ollama implements BaseProvider {
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
    getModels(): Promise<any>;
}
export default Ollama;
