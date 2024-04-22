class Multillm {
  constructor(provider, model = null, device_map = null, apiKey = null, apiEndpoint = null) {
     this.provider = provider;
     this.device_map = device_map;
     this.apiKey = apiKey;
     this.model = model;
     this.apiEndpoint = apiEndpoint;
 
     switch (this.provider) {
       case 'openai':
         const OpenAI = require('./providers/openai');
         return new OpenAI(this.model, this.device_map, this.apiKey, this.apiEndpoint);
       case 'perplexity':
         const Perplexity = require('./providers/perplexity');
         return new Perplexity(this.model, this.device_map, this.apiKey, this.apiEndpoint);
       case 'mistral':
         const MistralAI = require('./providers/mistral');
         return new MistralAI(this.model, this.device_map, this.apiKey, this.apiEndpoint);
       default:
         throw new Error(`Unsupported provider: ${this.provider}`);
     }
  }
 
  static getProviders() {
     return ['openai', 'perplexity', 'mistral'];
  }
 }
 
 module.exports = Multillm;