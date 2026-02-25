import OpenAI from "openai";
import type { ChatMessage, LLMResponse, ToolCall, ToolDefinition } from "./types.js";

export interface LLMProvider {
  chat(params: {
    messages: ChatMessage[];
    tools?: ToolDefinition[];
  }): Promise<LLMResponse>;

  chatStream(params: {
    messages: ChatMessage[];
    tools?: ToolDefinition[];
    onTextChunk: (chunk: string) => void;
  }): Promise<LLMResponse>;
}

export function createOpenAIProvider(params: {
  baseUrl: string;
  apiKey: string;
  model: string;
}): LLMProvider {
  const client = new OpenAI({
    baseURL: params.baseUrl,
    apiKey: params.apiKey,
  });

  return {
    async chat({ messages, tools }) {
      const response = await client.chat.completions.create({
        model: params.model,
        messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        tools: tools as OpenAI.Chat.Completions.ChatCompletionTool[] | undefined,
        tool_choice: tools && tools.length > 0 ? "auto" : undefined,
      });

      const choice = response.choices[0];
      if (!choice) {
        throw new Error("No response from LLM");
      }

      return {
        content: choice.message.content,
        toolCalls: (choice.message.tool_calls ?? []).map((tc) => ({
          id: tc.id,
          type: "function" as const,
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments,
          },
        })),
        finishReason: choice.finish_reason ?? "stop",
      };
    },

    async chatStream({ messages, tools, onTextChunk }) {
      const stream = await client.chat.completions.create({
        model: params.model,
        messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        tools: tools as OpenAI.Chat.Completions.ChatCompletionTool[] | undefined,
        tool_choice: tools && tools.length > 0 ? "auto" : undefined,
        stream: true,
      });

      let content = "";
      const toolCallMap = new Map<number, { id: string; name: string; arguments: string }>();
      let finishReason = "stop";

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (!delta) continue;

        // Text content
        if (delta.content) {
          content += delta.content;
          onTextChunk(delta.content);
        }

        // Tool calls (accumulated across chunks)
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const existing = toolCallMap.get(tc.index);
            if (existing) {
              existing.arguments += tc.function?.arguments ?? "";
            } else {
              toolCallMap.set(tc.index, {
                id: tc.id ?? "",
                name: tc.function?.name ?? "",
                arguments: tc.function?.arguments ?? "",
              });
            }
          }
        }

        if (chunk.choices[0]?.finish_reason) {
          finishReason = chunk.choices[0].finish_reason;
        }
      }

      const toolCalls: ToolCall[] = Array.from(toolCallMap.values()).map((tc) => ({
        id: tc.id,
        type: "function" as const,
        function: { name: tc.name, arguments: tc.arguments },
      }));

      return { content: content || null, toolCalls, finishReason };
    },
  };
}
