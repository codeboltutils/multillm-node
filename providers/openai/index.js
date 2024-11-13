const axios = require("axios");
const { handleError } = require("../../utils/errorHandler");

const openai = require("openai").default;
const { AzureOpenAI } = require("openai");


class OpenAI {
  options;
  client;
  embeddingModels;
  constructor(model = null,
    device_map = null,
    apiKey = null,
    apiEndpoint = null) {
    this.embeddingModels = ["text-embedding-3-small", "text-embedding-3-large", "text-embedding-ada-002"]

    this.model = model;
    this.device_map = device_map;
    this.apiKey = apiKey; // Store the API key as an instance variable
    this.apiEndpoint =
      apiEndpoint != null
        ? `${apiEndpoint}`
        : "https://gateway.ai.cloudflare.com/v1/8073e84dbfc4e2bc95666192dcee62c0/codebolt/openai";
    this.options = { model, device_map, apiKey, apiEndpoint }; // Ensure options is defined
    // Azure API shape slightly differs from the core API shape: https://github.com/openai/openai-node?tab=readme-ov-file#microsoft-azure-openai
    this.options.apiEndpoint = this.apiEndpoint;
    if (this.options.apiEndpoint && this.options.apiEndpoint.toLowerCase().includes("azure.com")) {
      this.client = new AzureOpenAI({
        baseURL: apiEndpoint,
        apiKey: apiKey,
        // https://learn.microsoft.com/en-us/azure/ai-services/openai/api-version-deprecation
        // https://learn.microsoft.com/en-us/azure/ai-services/openai/reference#api-specs
        apiVersion: "2024-08-01-preview",
      });
    } else {
      this.client = new openai({
        baseURL: apiEndpoint,
        apiKey: apiKey,
      });
    }

  }
  async createCompletion(createParams) {
    // console.log(createParams)
    try {
      const completion = await this.client.chat.completions.create(createParams);
      console.log("completion")
      return completion
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
        if (this.embeddingModels.includes(model.id)) {
          model.type = "embedding";
        }
        return model;
      });
      return allModels;
    } catch (error) {
      return handleError(error);
    }
  }

  async createEmbedding(input, model) {
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




module.exports = OpenAI





