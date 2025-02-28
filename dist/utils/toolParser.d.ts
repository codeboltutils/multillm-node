export type AssistantMessageContent = TextContent | ToolUse;
export interface TextContent {
    type: "text";
    content: string;
    partial: boolean;
}
export declare const toolUseNames: readonly ["execute_command", "read_file", "write_to_file", "replace_in_file", "search_files", "list_files", "list_code_definition_names", "browser_action", "use_mcp_tool", "access_mcp_resource", "ask_followup_question", "plan_mode_response", "attempt_completion"];
export type ToolUseName = (typeof toolUseNames)[number];
export declare const toolParamNames: readonly ["command", "requires_approval", "path", "content", "diff", "regex", "file_pattern", "recursive", "action", "url", "coordinate", "text", "server_name", "tool_name", "arguments", "uri", "question", "response", "result"];
export type ToolParamName = (typeof toolParamNames)[number];
export interface ToolUse {
    type: "tool_use";
    name: ToolUseName;
    params: Partial<Record<ToolParamName, string>>;
    partial: boolean;
}
interface ToolFunction {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: {
            command: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
}
interface Tool {
    type: string;
    function: ToolFunction;
}
type Message = {
    role: 'user' | 'assistant' | 'system';
    content: string | ContentItem[];
};
type ContentItem = {
    type: "text";
    text: string;
};
declare const parseToolToSystemPrompt: (messages: Message[], tools: Tool[]) => Message[];
export declare function parseAssistantMessage(assistantMessage: string, tools: Tool[]): {
    message: {
        role: string;
        content: string;
        tool_calls: {
            id: string;
            type: string;
            function: {
                name: string;
                arguments: string;
            };
        }[];
        function_call: any;
        refusal: any;
    };
}[];
export default parseToolToSystemPrompt;
