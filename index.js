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

      case "codeboltai":
        const CodeBoltAI = require("./providers/codebolt");
        return new CodeBoltAI(
          this.model,
          this.device_map,
          this.apiKey,
          this.apiEndpoint
        );
      case "openai":
        const OpenAI = require("./providers/openai");
        return new OpenAI(
          this.model,
          this.device_map,
          this.apiKey,
          this.apiEndpoint
        );
        break;
        case "anthropic":
          const Anthropic = require("./providers/anthropic");
          return new Anthropic(
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
        logo: "https://avatars.githubusercontent.com/u/166920414?s=200&v=4",
        name: "CodeBolt AI",
        apiUrl: "https://codeboltproxy.arrowai.workers.dev/v1",
        key: "",
        keyAdded: false,
        category:'codebolt'
      },
      // {
      //   id: 2,
      //   logo: "https://github.com/shadcn.png",
      //   name: "Perplexity",
      //   key: "",
      //   keyAdded: false,
      //   apiUrl: "https://gateway.ai.cloudflare.com/v1/8073e84dbfc4e2bc95666192dcee62c0/codebolt/perplexity-ai",
      //   category:'cloudProviders'
      // },
      {
        id: 3,
        logo: "https://github.com/openai.png",
        name: "Open AI",
        apiUrl: "https://gateway.ai.cloudflare.com/v1/8073e84dbfc4e2bc95666192dcee62c0/codebolt/openai",
        key: "",
        keyAdded: false,
        category:'cloudProviders'
      },
      {
        id: 4,
        logo: "https://github.com/lmstudio-ai.png",
        name: "LM Studio",
        apiUrl: "http://localhost:1234/v1",
        keyAdded: false,
        category:'localProviders'
      },
      // {
      //   id: 5,
      //   logo: "https://github.com/mistralai.png",
      //   name: "Mistral",
      //   apiUrl: "https://api.mistral.ai/v1",
      //   key: "",
      //   keyAdded: false,
      //   category:'cloudProviders'
      // },
    ];
  }
}

module.exports = Multillm;

