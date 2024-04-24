const perplexityModels= require("./models")
class  Perplexity {
    constructor(model = null, device_map = null, apiKey = null, apiEndpoint = null) {
        this.model = model;
        this.device_map = device_map;
        this.apiKey = apiKey; // Store the API key as an instance variable
        //TODO change the api endpoint    
        this.apiEndpoint = apiEndpoint != null ? `${apiEndpoint}` : 'https://api.perplexity.ai/chat/completions';
    }

    async createCompletion(options) {
        try {
            console.log(options.messages);
            const response = await axios.post(this.apiEndpoint, {
                model: options.model , // Default model if not provided
                messages: options.messages, // Expecting an array of messages
            }, {
                headers: {
                    'Content-Type': 'application/json',
                     'Authorization': `Bearer ${this.apiKey}` // Use the API key from the instance variable
                }
            });

            return response.data;
        } catch (error) {
            console.error('Error generating completion:', error);
            return error;
        }
    }
    async getModels() {
        try {
          
            return perplexityModels;
        } catch (error) {
            console.error('Error fetching models:', error);
            return error;
        }
    }
}


module.exports = Perplexity;


