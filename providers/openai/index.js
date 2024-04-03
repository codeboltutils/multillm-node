const axios = require('axios');

class OpenAI {
 constructor(model = null, device_map = null, apiKey = null) {
      this.model = model;
      this.device_map = device_map;
      this.apiKey = apiKey; // Store the API key as an instance variable
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
        }, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}` // Use the API key from the instance variable
          }
        });

        return response.data;
      } catch (error) {
        console.error('Error generating completion:', error);
        return null;
      }
 }
}

module.exports = OpenAI;