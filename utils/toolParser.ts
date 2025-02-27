interface ToolParameter {
  type: string;
  description: string;
}

interface ToolParameters {
  type: string;
  properties: Record<string, ToolParameter>;
  required: string[];
}

interface Tool {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: ToolParameters;
  };
}

const parseToolToSystemPrompt = (systemPrompt: string): string => {
  const tools: Tool[] = [
    {
      type: "function",
      function: {
        name: "codebolt--read_file",
        description: "Read the contents of a file at the specified path. Use this when you need to examine the contents of an existing file, for example to analyze code, review text files, or extract information from configuration files. Automatically extracts raw text from PDF and DOCX files. May not be suitable for other types of binary files, as it returns the raw content as a string.",
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "The path of the file to read use full path "
            }
          },
          required: ["path"]
        }
      }
    }
  ];

  const prompt = tools.map(tool => {
    const { name, description, parameters } = tool.function;
    const { properties, required } = parameters;

    return `
  ## ${name}
    Description: ${description}
    Parameters: ${Object.entries(properties).map(([key, value]) => `
    - ${key}: ${required.includes(key) ? '(required) ' : ''}${value.description}`).join('')}
    Usage:
    <${name}>
    ${Object.keys(properties).map(key => `<${key}>${key} here</${key}>`).join('\n    ')}
    </${name}>`;
  }).join('\n');

  return prompt;
};

export { parseToolToSystemPrompt }; 