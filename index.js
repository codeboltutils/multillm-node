const axios = require('axios');

class Multillm {
 constructor(provider, model = null, device_map = null) {
  this.provider = provider;
  if (this.provider === 'openai') {
    const OpenAI = require('./providers/openai');
    return new OpenAI(this.model, this.device_map);
  } else {
    throw new Error(`Unsupported provider: ${this.provider}`);
  }
 }
}

module.exports = Multillm;