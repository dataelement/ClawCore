import OpenAI from "openai";
import type { ChatMessage, LLMResponse, ToolDefinition } from "./types.js";

export interface LLMProvider {
  chat(params: {
    messages: ChatMessage[];
    tools?: ToolDefinition[];
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
  };
}
