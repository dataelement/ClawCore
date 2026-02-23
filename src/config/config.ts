import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import os from "node:os";

export interface ClawCoreConfig {
  llm: {
    baseUrl: string;
    apiKey: string;
    model: string;
  };
  heartbeat: {
    enabled: boolean;
    intervalMinutes: number;
  };
  workspace: string;
}

/**
 * Resolve the Desktop path cross-platform:
 * - macOS: ~/Desktop
 * - Windows: %USERPROFILE%\Desktop
 * Falls back to home directory if Desktop doesn't exist.
 */
function resolveDesktopDir(): string {
  const home = os.homedir();
  const desktopPath = path.join(home, "Desktop");

  try {
    // Check if Desktop directory actually exists
    if (fsSync.existsSync(desktopPath) && fsSync.statSync(desktopPath).isDirectory()) {
      return desktopPath;
    }
  } catch {
    // Desktop not accessible
  }

  // Fallback: use home directory
  return home;
}

const DEFAULT_CONFIG: ClawCoreConfig = {
  llm: {
    baseUrl: "https://api.openai.com/v1",
    apiKey: "",
    model: "gpt-4o",
  },
  heartbeat: {
    enabled: true,
    intervalMinutes: 60,
  },
  workspace: path.join(resolveDesktopDir(), "ClawCore"),
};

export function resolveWorkspaceDir(override?: string): string {
  return override ?? DEFAULT_CONFIG.workspace;
}

export function resolveConfigPath(workspaceDir: string): string {
  return path.join(workspaceDir, "config.json");
}

export async function loadConfig(workspaceDir: string): Promise<ClawCoreConfig> {
  const configPath = resolveConfigPath(workspaceDir);
  try {
    const raw = await fs.readFile(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      llm: { ...DEFAULT_CONFIG.llm, ...parsed.llm },
      heartbeat: { ...DEFAULT_CONFIG.heartbeat, ...parsed.heartbeat },
      workspace: workspaceDir,
    };
  } catch {
    return { ...DEFAULT_CONFIG, workspace: workspaceDir };
  }
}

export async function saveConfig(config: ClawCoreConfig): Promise<void> {
  const configPath = resolveConfigPath(config.workspace);
  const { workspace, ...rest } = config;
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(rest, null, 2) + "\n", "utf-8");
}
