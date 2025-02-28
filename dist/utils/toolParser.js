"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolParamNames = exports.toolUseNames = void 0;
exports.parseAssistantMessage = parseAssistantMessage;
exports.toolUseNames = [
    "execute_command",
    "read_file",
    "write_to_file",
    "replace_in_file",
    "search_files",
    "list_files",
    "list_code_definition_names",
    "browser_action",
    "use_mcp_tool",
    "access_mcp_resource",
    "ask_followup_question",
    "plan_mode_response",
    "attempt_completion",
];
exports.toolParamNames = [
    "command",
    "requires_approval",
    "path",
    "content",
    "diff",
    "regex",
    "file_pattern",
    "recursive",
    "action",
    "url",
    "coordinate",
    "text",
    "server_name",
    "tool_name",
    "arguments",
    "uri",
    "question",
    "response",
    "result",
];
const parseToolToSystemPrompt = (messages, tools) => {
    let systemPrompt = '';
    const systemMessages = messages.filter(message => message.role === 'system');
    systemPrompt += systemMessages.map(message => message.content).join('\n');
    systemPrompt += ` \n
    ====
    
    TOOL USE
    
    You have access to a set of tools that are executed upon the user's approval. You can use one tool per message, and will receive the result of that tool use in the user's response. You use tools step-by-step to accomplish a given task, with each tool use informed by the result of the previous tool use.
    
    # Tool Use Formatting
    
    Tool use is formatted using XML-style tags. The tool name is enclosed in opening and closing tags, and each parameter is similarly enclosed within its own set of tags. Here's the structure:
    
    <tool_name>
    <parameter1_name>value1</parameter1_name>
    <parameter2_name>value2</parameter2_name>
    ...
    </tool_name>
    
    For example:
    
    <read_file>
    <path>src/main.js</path>
    </read_file>
    
    Always adhere to this format for the tool use to ensure proper parsing and execution.
    
    # Tools \n`;
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
    messages = messages.map(message => message.role === 'system' ? { ...message, content: systemPrompt + prompt } : message);
    console.log(JSON.stringify(messages));
    return messages;
};
function parseAssistantMessage(assistantMessage, tools) {
    const toolNames = tools.map(tool => tool.function.name);
    let contentBlocks = [];
    let currentTextContent = undefined;
    let currentTextContentStartIndex = 0;
    let currentToolUse = undefined;
    let currentToolUseStartIndex = 0;
    let currentParamName = undefined;
    let currentParamValueStartIndex = 0;
    let accumulator = "";
    for (let i = 0; i < assistantMessage.length; i++) {
        const char = assistantMessage[i];
        accumulator += char;
        // there should not be a param without a tool use
        if (currentToolUse && currentParamName) {
            const currentParamValue = accumulator.slice(currentParamValueStartIndex);
            const paramClosingTag = `</${currentParamName}>`;
            if (currentParamValue.endsWith(paramClosingTag)) {
                // end of param value
                currentToolUse.params[currentParamName] = currentParamValue.slice(0, -paramClosingTag.length).trim();
                currentParamName = undefined;
                continue;
            }
            else {
                // partial param value is accumulating
                continue;
            }
        }
        // no currentParamName
        if (currentToolUse) {
            const currentToolValue = accumulator.slice(currentToolUseStartIndex);
            const toolUseClosingTag = `</${currentToolUse.name}>`;
            if (currentToolValue.endsWith(toolUseClosingTag)) {
                // end of a tool use
                currentToolUse.partial = false;
                contentBlocks.push(currentToolUse);
                currentToolUse = undefined;
                continue;
            }
            else {
                const possibleParamOpeningTags = exports.toolParamNames.map((name) => `<${name}>`);
                for (const paramOpeningTag of possibleParamOpeningTags) {
                    if (accumulator.endsWith(paramOpeningTag)) {
                        // start of a new parameter
                        currentParamName = paramOpeningTag.slice(1, -1);
                        currentParamValueStartIndex = accumulator.length;
                        break;
                    }
                }
                // there's no current param, and not starting a new param
                // special case for write_to_file where file contents could contain the closing tag, in which case the param would have closed and we end up with the rest of the file contents here. To work around this, we get the string between the starting content tag and the LAST content tag.
                const contentParamName = "content";
                if (currentToolUse.name === "write_to_file" && accumulator.endsWith(`</${contentParamName}>`)) {
                    const toolContent = accumulator.slice(currentToolUseStartIndex);
                    const contentStartTag = `<${contentParamName}>`;
                    const contentEndTag = `</${contentParamName}>`;
                    const contentStartIndex = toolContent.indexOf(contentStartTag) + contentStartTag.length;
                    const contentEndIndex = toolContent.lastIndexOf(contentEndTag);
                    if (contentStartIndex !== -1 && contentEndIndex !== -1 && contentEndIndex > contentStartIndex) {
                        currentToolUse.params[contentParamName] = toolContent.slice(contentStartIndex, contentEndIndex).trim();
                    }
                }
                // partial tool value is accumulating
                continue;
            }
        }
        // no currentToolUse
        let didStartToolUse = false;
        const possibleToolUseOpeningTags = exports.toolUseNames.map((name) => `<${name}>`);
        for (const toolUseOpeningTag of possibleToolUseOpeningTags) {
            if (accumulator.endsWith(toolUseOpeningTag)) {
                // start of a new tool use
                currentToolUse = {
                    type: "tool_use",
                    name: toolUseOpeningTag.slice(1, -1),
                    params: {},
                    partial: true,
                };
                currentToolUseStartIndex = accumulator.length;
                // this also indicates the end of the current text content
                if (currentTextContent) {
                    currentTextContent.partial = false;
                    // remove the partially accumulated tool use tag from the end of text (<tool)
                    currentTextContent.content = currentTextContent.content
                        .slice(0, -toolUseOpeningTag.slice(0, -1).length)
                        .trim();
                    contentBlocks.push(currentTextContent);
                    currentTextContent = undefined;
                }
                didStartToolUse = true;
                break;
            }
        }
        if (!didStartToolUse) {
            // no tool use, so it must be text either at the beginning or between tools
            if (currentTextContent === undefined) {
                currentTextContentStartIndex = i;
            }
            currentTextContent = {
                type: "text",
                content: accumulator.slice(currentTextContentStartIndex).trim(),
                partial: true,
            };
        }
    }
    if (currentToolUse) {
        // stream did not complete tool call, add it as partial
        if (currentParamName) {
            // tool call has a parameter that was not completed
            currentToolUse.params[currentParamName] = accumulator.slice(currentParamValueStartIndex).trim();
        }
        contentBlocks.push(currentToolUse);
    }
    // Note: it doesnt matter if check for currentToolUse or currentTextContent, only one of them will be defined since only one can be partial at a time
    if (currentTextContent) {
        // stream did not complete text content, add it as partial
        contentBlocks.push(currentTextContent);
    }
    return convertToOpenAIFormat(contentBlocks);
}
function generateToolCallId() {
    return 'call_' + Math.random().toString(36).substr(2, 16); // Generates a random unique ID
}
function convertToOpenAIFormat(input) {
    return [input.reduce((acc, item) => {
            if (item.type === 'text') {
                acc.message.content += item.content + ' ';
            }
            else {
                acc.message.tool_calls.push({
                    id: generateToolCallId(),
                    type: 'function',
                    function: {
                        name: item.name,
                        arguments: JSON.stringify(item.params)
                    }
                });
            }
            return acc;
        }, {
            message: {
                role: 'assistant',
                content: '',
                tool_calls: [],
                function_call: null,
                refusal: null
            }
        })];
}
exports.default = parseToolToSystemPrompt;
