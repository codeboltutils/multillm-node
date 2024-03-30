const axios = require('axios');

class Multillm {
 constructor(provider, model = null, device_map = null) {
    this.provider = provider;
    this.model = model;
    this.device_map = device_map;
    this.apiEndpoint = this.getApiEndpoint(provider);
 }

 getApiEndpoint(provider) {
    switch (provider) {
      case 'openai':
        return 'https://api.openai.com/v1/engines/davinci-codex/completions';
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
 }

 static async createCompletion(options) {
    try {
      const response = await axios.post(this.apiEndpoint, {
        model: this.model || options.model,
        prompt: options.prompt,
        max_tokens: options.max_tokens,
        device_map: this.device_map || options.device_map,
      });

      return response.data;
    } catch (error) {
      console.error('Error generating completion:', error);
      return null;
    }
 }
}

module.exports = Multillm;