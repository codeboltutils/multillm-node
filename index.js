const axios = require('axios');

class Multillm {
 constructor(provider, model = null, device_map = null,apiKey = null, apiEndpoint = null) {
  this.provider = provider;
  this.device_map = device_map;
  this.apiKey=apiKey;
  this.model = model;
  this.apiEndpoint = apiEndpoint;
  if (this.provider === 'openai') {
    const OpenAI = require('./providers/openai');
    return new OpenAI(this.model, this.device_map,this.apiKey, this.apiEndpoint);
  } else {
    throw new Error(`Unsupported provider: ${this.provider}`);
  }
 }
}

module.exports = Multillm;