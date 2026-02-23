import fs from "node:fs/promises";
import path from "node:path";

/**
 * Heartbeat: simple interval-based scan mechanism.
 * Triggers the agent to review user/ and workbench/ folders periodically.
 */

export interface HeartbeatState {
  lastScanMs: number;
  lastScanResult?: string;
}

const HEARTBEAT_OK = "HEARTBEAT_OK";

export function resolveStatePath(workspaceDir: string): string {
  return path.join(workspaceDir, "state.json");
}

/** Load heartbeat state */
export async function loadHeartbeatState(workspaceDir: string): Promise<HeartbeatState> {
  try {
    const raw = await fs.readFile(resolveStatePath(workspaceDir), "utf-8");
    const parsed = JSON.parse(raw);
    return { lastScanMs: parsed.lastScanMs ?? 0, lastScanResult: parsed.lastScanResult };
  } catch {
    return { lastScanMs: 0 };
  }
}

/** Save heartbeat state */
export async function saveHeartbeatState(
  workspaceDir: string,
  state: HeartbeatState,
): Promise<void> {
  await fs.writeFile(
    resolveStatePath(workspaceDir),
    JSON.stringify(state, null, 2) + "\n",
    "utf-8",
  );
}

/** Check if a heartbeat scan is due */
export function isScanDue(lastScanMs: number, intervalMinutes: number): boolean {
  const intervalMs = intervalMinutes * 60 * 1000;
  return Date.now() - lastScanMs >= intervalMs;
}

/** Build the heartbeat system message sent to the agent */
export function buildHeartbeatPrompt(workspaceDir: string): string {
  return [
    "[Heartbeat Scan] Periodic check triggered.",
    "",
    "Please do the following:",
    `1. Scan the user folder (user/) for any new or modified files since last check.`,
    `2. Review current workbench tasks (workbench/) and their statuses.`,
    `3. Check MEMORY_INDEX.md for any pending items or reminders.`,
    `4. If you find something worth acting on, create a new task in workbench/ with the 🤖 prefix.`,
    `5. If nothing needs attention, respond with exactly: ${HEARTBEAT_OK}`,
    "",
    "Remember: agent-initiated tasks should use create_task with source='agent'.",
  ].join("\n");
}

/** Check if a response is a heartbeat OK */
export function isHeartbeatOk(response: string): boolean {
  return response.trim().includes(HEARTBEAT_OK);
}

export interface HeartbeatRunner {
  start(): void;
  stop(): void;
}

/** Create a heartbeat runner with setInterval */
export function createHeartbeatRunner(params: {
  intervalMinutes: number;
  onHeartbeat: () => Promise<void>;
}): HeartbeatRunner {
  let timer: NodeJS.Timeout | null = null;

  return {
    start() {
      if (timer) return;
      const intervalMs = params.intervalMinutes * 60 * 1000;
      timer = setInterval(() => {
        params.onHeartbeat().catch((err) => {
          console.error("[heartbeat] scan error:", err);
        });
      }, intervalMs);
      // Don't prevent process exit
      timer.unref();
    },
    stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    },
  };
}
