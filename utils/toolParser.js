const parseToolToSystemPrompt = (systemPrompt) => {
    let tools = [
        {
            "type": "function",
            "function": {
                "name": "codebolt--read_file",
                "description": "Read the contents of a file at the specified path. Use this when you need to examine the contents of an existing file, for example to analyze code, review text files, or extract information from configuration files. Automatically extracts raw text from PDF and DOCX files. May not be suitable for other types of binary files, as it returns the raw content as a string.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "The path of the file to read use full path "
                        }
                    },
                    "required": [
                        "path"
                    ]
                }
            }
        }
    ];

    let prompt = tools.map(tool => {
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
}

//     let prompt = `
//   ## read_file
//     Description: Request to read the contents of a file at the specified path. Use this when you need to examine the contents of an existing file you do not know the contents of, for example to analyze code, review text files, or extract information from configuration files. Automatically extracts raw text from PDF and DOCX files. May not be suitable for other types of binary files, as it returns the raw content as a string.
//     Parameters:
//     - path: (required) The path of the file to read (relative to the current working directory c:/btpl/AppCreate/LLMs)
//     Usage:
//     <read_file>
//     <path>File path here</path>
//     </read_file>`
// }


console.log(parseToolToSystemPrompt(''))