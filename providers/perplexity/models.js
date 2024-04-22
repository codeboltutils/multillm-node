 const perplexityModels=
[
   
      {
        "name": "llama-3-8b-instruct",
        "parameter_count": "8B",
        "context_length": 8192,
        "type": "Chat Completion"
      },
      {
        "name": "llama-3-70b-instruct",
        "parameter_count": "70B",
        "context_length": 8192,
        "type": "Chat Completion"
      },
      {
        "name": "codellama-70b-instruct",
        "parameter_count": "70B",
        "context_length": 16384,
        "type": "Chat Completion"
      },
      {
        "name": "mistral-7b-instruct",
        "parameter_count": "7B",
        "context_length": 16384,
        "type": "Chat Completion"
      },
      {
        "name": "mixtral-8x7b-instruct",
        "parameter_count": "8x7B",
        "context_length": 16384,
        "type": "Chat Completion"
      },
      {
        "name": "mixtral-8x22b-instruct",
        "parameter_count": "8x22B",
        "context_length": 16384,
        "type": "Chat Completion"
      }
    ]
  
  module.exports = perplexityModels