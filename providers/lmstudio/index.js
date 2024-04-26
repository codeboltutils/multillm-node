const axios = require("axios");

class LMStudio {
  constructor(
    model = null,
    device_map = null,
   
    apiEndpoint = null
  ) {
    this.model = model;
    this.device_map = device_map;
  
    this.apiEndpoint =
      apiEndpoint != null
        ? `${apiEndpoint}`
        : "http://localhost:1234/v1/chat/completions";
  }

  async createCompletion(options) {
    try {
      console.log(options.messages);
      const response = await axios.post(
        this.apiEndpoint,
        {
          model: options.model, // Default model if not provided
          messages: options.messages, // Expecting an array of messages
        },
        {
          headers: {
            "Content-Type": "application/json",
            //  'Authorization': `Bearer ${this.apiKey}` // Use the API key from the instance variable
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
      const response = await axios.get("http://localhost:1234/v1/models", {
        headers: {
          "Content-Type": "application/json",
        //"Authorization": `Bearer ${this.apiKey}`,
        },
      });
      let allModels = response.data.data.map((model) => {
        model.provider = "Local Provider";
        return model;
      });
      return allModels;
    } catch (error) {
      console.error("Error fetching models:", error);
      return error;
    }
  }
}

module.exports = LMStudio;


