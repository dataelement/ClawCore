import type { LLMProvider } from "../llm/provider.js";
import type { ChatMessage, ToolCall } from "../llm/types.js";
import { TOOL_DEFINITIONS } from "../tools/definitions.js";
import { executeTool } from "../tools/executor.js";
import { buildSystemPrompt } from "./system-prompt.js";
import {
  buildHeartbeatPrompt,
  isHeartbeatOk,
  loadHeartbeatState,
  saveHeartbeatState,
  isScanDue,
  createHeartbeatRunner,
  type HeartbeatRunner,
} from "./heartbeat.js";

const MAX_TOOL_ROUNDS = 20;

export interface AgentCallbacks {
  onAssistantText: (text: string) => void;
  onToolCall: (name: string, args: Record<string, unknown>) => void;
  onToolResult: (name: string, result: string) => void;
  onHeartbeatStart: () => void;
  onHeartbeatEnd: (result: string) => void;
}

export class Agent {
  private llm: LLMProvider;
  private workspaceDir: string;
  private conversationHistory: ChatMessage[] = [];
  private callbacks: AgentCallbacks;
  private heartbeatRunner: HeartbeatRunner | null = null;
  /** True while the agent is processing a user message or heartbeat */
  private busy = false;
  /** If a heartbeat fires while busy, defer it */
  private heartbeatPending = false;

  constructor(params: {
    llm: LLMProvider;
    workspaceDir: string;
    callbacks: AgentCallbacks;
  }) {
    this.llm = params.llm;
    this.workspaceDir = params.workspaceDir;
    this.callbacks = params.callbacks;
  }

  /** Initialize the agent: build system prompt and start heartbeat */
  async init(heartbeatIntervalMinutes?: number): Promise<void> {
    const systemPrompt = await buildSystemPrompt(this.workspaceDir);
    this.conversationHistory = [{ role: "system", content: systemPrompt }];

    // Check if a heartbeat scan is due on startup
    if (heartbeatIntervalMinutes && heartbeatIntervalMinutes > 0) {
      const state = await loadHeartbeatState(this.workspaceDir);
      if (isScanDue(state.lastScanMs, heartbeatIntervalMinutes)) {
        await this.runHeartbeat();
      }

      // Start periodic heartbeat
      this.heartbeatRunner = createHeartbeatRunner({
        intervalMinutes: heartbeatIntervalMinutes,
        onHeartbeat: () => this.tryHeartbeat(),
      });
      this.heartbeatRunner.start();
    }
  }

  /** Process a user message and return the assistant's response */
  async chat(userMessage: string): Promise<string> {
    this.busy = true;
    try {
      this.conversationHistory.push({ role: "user", content: userMessage });
      const result = await this.runAgentLoop();
      return result;
    } finally {
      this.busy = false;
      // If a heartbeat was deferred, run it now
      if (this.heartbeatPending) {
        this.heartbeatPending = false;
        this.tryHeartbeat();
      }
    }
  }

  /** Attempt heartbeat — defer if agent is busy */
  private async tryHeartbeat(): Promise<void> {
    if (this.busy) {
      this.heartbeatPending = true;
      return;
    }
    await this.runHeartbeat();
  }

  /** Run the agent loop: LLM call → tool calls → repeat until text response */
  private async runAgentLoop(): Promise<string> {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await this.llm.chat({
        messages: this.conversationHistory,
        tools: TOOL_DEFINITIONS,
      });

      // If there are tool calls, execute them
      if (response.toolCalls.length > 0) {
        this.conversationHistory.push({
          role: "assistant",
          content: response.content,
          tool_calls: response.toolCalls,
        });

        for (const toolCall of response.toolCalls) {
          const args = JSON.parse(toolCall.function.arguments);
          this.callbacks.onToolCall(toolCall.function.name, args);

          const result = await executeTool({
            name: toolCall.function.name,
            args,
            workspaceDir: this.workspaceDir,
          });

          this.callbacks.onToolResult(toolCall.function.name, result);

          this.conversationHistory.push({
            role: "tool",
            content: result,
            tool_call_id: toolCall.id,
          });
        }

        continue; // Go back for another LLM call
      }

      // Text response — done
      const text = response.content ?? "";
      this.conversationHistory.push({ role: "assistant", content: text });
      this.callbacks.onAssistantText(text);
      return text;
    }

    const fallback = "I've reached the maximum number of tool call rounds. Let me know if you'd like me to continue.";
    this.conversationHistory.push({ role: "assistant", content: fallback });
    return fallback;
  }

  /** Run a heartbeat scan */
  private async runHeartbeat(): Promise<void> {
    this.busy = true;
    try {
      this.callbacks.onHeartbeatStart();

      const heartbeatPrompt = buildHeartbeatPrompt(this.workspaceDir);
      this.conversationHistory.push({ role: "user", content: heartbeatPrompt });

      const response = await this.runAgentLoop();

      // Save scan state
      await saveHeartbeatState(this.workspaceDir, {
        lastScanMs: Date.now(),
        lastScanResult: isHeartbeatOk(response) ? "ok" : "action_taken",
      });

      this.callbacks.onHeartbeatEnd(
        isHeartbeatOk(response) ? "No action needed" : response,
      );
    } finally {
      this.busy = false;
    }
  }

  /** Stop heartbeat and clean up */
  stop(): void {
    this.heartbeatRunner?.stop();
  }
}
