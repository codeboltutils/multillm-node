import type { BaseProvider } from '../../types';
declare class OpenRouter implements BaseProvider {
    private options;
    model: string | null;
    device_map: string | null;
    apiKey: string | null;
    apiEndpoint: string | null;
    constructor(model?: string | null, device_map?: string | null, apiKey?: string | null, apiEndpoint?: string | null);
    createCompletion(options: any): Promise<any>;
    getModels(): Promise<any>;
}
export default OpenRouter;
