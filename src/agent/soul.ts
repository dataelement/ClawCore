import fs from "node:fs/promises";
import path from "node:path";

/**
 * Soul manager: loads and manages SOUL.md
 */

export function resolveSoulDir(workspaceDir: string): string {
  return path.join(workspaceDir, "soul");
}

export function resolveSoulPath(workspaceDir: string): string {
  return path.join(resolveSoulDir(workspaceDir), "SOUL.md");
}

export function resolveIdentityPath(workspaceDir: string): string {
  return path.join(resolveSoulDir(workspaceDir), "IDENTITY.md");
}

export function resolveBootstrapPath(workspaceDir: string): string {
  return path.join(resolveSoulDir(workspaceDir), "BOOTSTRAP.md");
}

/** Load SOUL.md content */
export async function loadSoul(workspaceDir: string): Promise<string | null> {
  try {
    return await fs.readFile(resolveSoulPath(workspaceDir), "utf-8");
  } catch {
    return null;
  }
}

/** Save SOUL.md */
export async function saveSoul(workspaceDir: string, content: string): Promise<void> {
  await fs.mkdir(resolveSoulDir(workspaceDir), { recursive: true });
  await fs.writeFile(resolveSoulPath(workspaceDir), content, "utf-8");
}

/** Load IDENTITY.md content */
export async function loadIdentity(workspaceDir: string): Promise<string | null> {
  try {
    return await fs.readFile(resolveIdentityPath(workspaceDir), "utf-8");
  } catch {
    return null;
  }
}

/** Save IDENTITY.md */
export async function saveIdentity(workspaceDir: string, content: string): Promise<void> {
  await fs.mkdir(resolveSoulDir(workspaceDir), { recursive: true });
  await fs.writeFile(resolveIdentityPath(workspaceDir), content, "utf-8");
}

/** Check if BOOTSTRAP.md exists (= first run) */
export async function isFirstRun(workspaceDir: string): Promise<boolean> {
  try {
    await fs.access(resolveBootstrapPath(workspaceDir));
    return true;
  } catch {
    return false;
  }
}

/** Delete BOOTSTRAP.md after first-run completes */
export async function completeBootstrap(workspaceDir: string): Promise<void> {
  try {
    await fs.unlink(resolveBootstrapPath(workspaceDir));
  } catch {
    // already gone
  }
}

/** Load BOOTSTRAP.md content */
export async function loadBootstrap(workspaceDir: string): Promise<string | null> {
  try {
    return await fs.readFile(resolveBootstrapPath(workspaceDir), "utf-8");
  } catch {
    return null;
  }
}

/** Parse identity fields from IDENTITY.md content */
export function parseIdentity(content: string): {
  name?: string;
  creature?: string;
  vibe?: string;
  emoji?: string;
} {
  const result: Record<string, string> = {};

  const nameMatch = content.match(/\*\*Name:\*\*\s*(.+)/);
  if (nameMatch && !nameMatch[1].includes("_(")) {
    result.name = nameMatch[1].trim();
  }

  const creatureMatch = content.match(/\*\*Creature:\*\*\s*(.+)/);
  if (creatureMatch && !creatureMatch[1].includes("_(")) {
    result.creature = creatureMatch[1].trim();
  }

  const vibeMatch = content.match(/\*\*Vibe:\*\*\s*(.+)/);
  if (vibeMatch && !vibeMatch[1].includes("_(")) {
    result.vibe = vibeMatch[1].trim();
  }

  const emojiMatch = content.match(/\*\*Emoji:\*\*\s*(.+)/);
  if (emojiMatch && !emojiMatch[1].includes("_(")) {
    result.emoji = emojiMatch[1].trim();
  }

  return result;
}

/** Initialize soul directory with template files */
export async function initSoulDir(
  workspaceDir: string,
  templateDir: string,
): Promise<void> {
  const soulDir = resolveSoulDir(workspaceDir);
  await fs.mkdir(soulDir, { recursive: true });

  for (const file of ["SOUL.md", "IDENTITY.md", "BOOTSTRAP.md"]) {
    const destPath = path.join(soulDir, file);
    try {
      await fs.access(destPath);
      // file already exists, skip
    } catch {
      const srcPath = path.join(templateDir, file);
      try {
        const content = await fs.readFile(srcPath, "utf-8");
        await fs.writeFile(destPath, content, "utf-8");
      } catch {
        // template not found, skip
      }
    }
  }
}
