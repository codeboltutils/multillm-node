export interface PerplexityModel {
    name: string;
    provider: string;
    parameter_count: string;
    context_length: number;
    type: string;
}
declare const perplexityModels: PerplexityModel[];
export default perplexityModels;
