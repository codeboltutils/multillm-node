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
                : "https://api.openai.com/v1/chat/completions";
    }

    async createCompletion(options) {
        try {
            console.log("calling open ai",this.apiEndpoint, options,options.model);
            const response = await axios.post(
                this.apiEndpoint,
                {
                    model: options.model, // Default model if not provided
                    prompt: options.message, // Expecting an array of messages
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${this.apiKey}`,
                    },
                }
            );

            return response.data;
        } catch (error) {
            // console.error("Error generating completion:", error);
            return error;
        }
    }
    async getModels() {
        try {
            const response = await axios.get("https://api.openai.com/v1/models", {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey}`,
                },
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching models:", error);
            return error;
        }
    }
}

module.exports = OpenAI;
