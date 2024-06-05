const axios = require("axios");

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
        : "https://codeboltproxy.arrowai.workers.dev/v1";
  }

  async createCompletion(options) {
    try {
      console.log(options.messages);
      const response = await axios.post(
       `${this.apiEndpoint}/chat/completions`,
        {
          model: options.model, // Default model if not provided
          messages: options.messages, // Expecting an array of messages
        },
        {
          headers: {
            "Content-Type": "application/json",
            'Authorization': `${this.apiKey}` // Use the API key from the instance variable
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error generating completion:", error);
      return error;
    }
  }
  async getModels() {
    try {
      const response = await axios.get(`${this.apiEndpoint}/models`, {
        headers: {
          "Content-Type": "application/json",
          "x-codebolt-key": `${this.apiKey}`,
        },
      });
      let allModels = response.data.data.map((model) => {
        model.provider = "Codebot";
        return model;
      });
      return allModels;
    } catch (error) {
      console.error("Error fetching models:", error);
      return error;
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
            'x-codebolt-key': `${this.apiKey}`
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error creating embedding:", error);
      return error;
    }
  }
}

module.exports = OpenAI;
