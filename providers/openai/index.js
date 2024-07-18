const axios = require("axios");
const { handleError } = require("../../utils/errorHandler");

class OpenAI {
  constructor(
    model = null,
    device_map = null,
    apiKey = null,
    apiEndpoint = null
  ) {
    this.model = model;
    this.device_map = device_map;
    this.apiKey = apiKey; // Store the API key as an instance variable
    this.apiEndpoint =
      apiEndpoint != null
        ? `${apiEndpoint}`
        : "https://gateway.ai.cloudflare.com/v1/8073e84dbfc4e2bc95666192dcee62c0/codebolt/openai";
  }

  async createCompletion(options) {
    try {
      console.log(options.messages);
      const response = await axios.post(
       `${this.apiEndpoint}/chat/completions`,
        options,
        {
          headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${this.apiKey}` // Use the API key from the instance variable
          },
        }
      );

      return response.data;
    } catch (error) {
      
      return handleError(error);
    }
  }
  async getModels() {
    try {
      const response = await axios.get(`${this.apiEndpoint}/models`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      let allModels = response.data.data.map((model) => {
        model.provider = "OpenAI";
        return model;
      });
      return allModels;
    } catch (error) {
      return handleError(error);
    }
  }

  async createEmbedding(input,model) {
    try {
      const response = await axios.post(
        `${this.apiEndpoint}/embeddings`,
        {
          input,
          model
        },
        {
          headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${this.apiKey}`
          },
        }
      );

      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
}




module.exports = OpenAI;




