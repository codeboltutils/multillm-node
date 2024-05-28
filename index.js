class Multillm {
  constructor(
    provider,
    model = null,
    device_map = null,
    apiKey = null,
    apiEndpoint = null
  ) {
    this.provider = provider;
    this.device_map = device_map;
    this.apiKey = apiKey;
    this.model = model;
    this.apiEndpoint = apiEndpoint;

    switch (this.provider) {
      case "openai":
        const OpenAI = require("./providers/openai");
        return new OpenAI(
          this.model,
          this.device_map,
          this.apiKey,
          this.apiEndpoint
        );
        break;
      case "perplexity":
        const Perplexity = require("./providers/perplexity");
        return new Perplexity(
          this.model,
          this.device_map,
          this.apiKey,
          this.apiEndpoint
        );
        break;
      case "lmstudio":
        const LMStudio = require("./providers/lmstudio");
        return new LMStudio(
          this.model,
          this.device_map,

          this.apiEndpoint
        );
        break;
      case "mistral":
        const MistralAI = require("./providers/mistral");
        return new MistralAI(
          this.model,
          this.device_map,
          this.apiKey,
          this.apiEndpoint
        );

      default:
        console.log(`Unsupported provider: ${this.provider}`);
        return this; // or any other default value or action you want to take
    }
  }

  getProviders() {
    return [
      {
        id: 1,
        logo: "https://github.com/shadcn.png",
        name: "Perplexity",
        key: "",
        keyAdded: false,
        apiUrl: "https://api.perplexity.com/v1",
      },
      {
        id: 2,
        logo: "https://github.com/openai.png",
        name: "Open AI",
        apiUrl: "https://api.openai.com/v1",
        key: "",
        keyAdded: false,
      },
      {
        id: 3,
        logo: "https://github.com/lmstudio-ai.png",
        name: "LM Studio",
        apiUrl: "http://localhost:1234/v1",
        keyAdded:false
      },
      {
        id: 4,
        logo: "https://github.com/mistralai.png",
        name: "Mistral",
        apiUrl: "https://api.mistral.ai/v1",
        key: "",
        keyAdded: false,
      },
    ];
  }
}

module.exports = Multillm;
