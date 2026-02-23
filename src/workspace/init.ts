import fs from "node:fs/promises";
import path from "node:path";
import { initSoulDir } from "../agent/soul.js";
import { ensureUserDir } from "./user-folder.js";
import { ensureWorkbenchDir } from "./workbench.js";
import { ensureMemoryDir } from "../memory/index-manager.js";
import { ensureSkillsDir } from "../skills/loader.js";

/**
 * Initialize the ClawCore workspace: create all directories and seed
 * template files on first run.
 */
export async function initWorkspace(
  workspaceDir: string,
  templateDir: string,
): Promise<void> {
  // Create the workspace root
  await fs.mkdir(workspaceDir, { recursive: true });

  // Initialize all subdirectories
  await Promise.all([
    initSoulDir(workspaceDir, templateDir),
    ensureUserDir(workspaceDir),
    ensureWorkbenchDir(workspaceDir),
    ensureMemoryDir(workspaceDir),
    ensureSkillsDir(workspaceDir),
  ]);

  // Seed USER_PROFILE.md if missing
  const userProfileDest = path.join(workspaceDir, "user", "USER_PROFILE.md");
  try {
    await fs.access(userProfileDest);
  } catch {
    const templatePath = path.join(templateDir, "USER_PROFILE.md");
    try {
      const content = await fs.readFile(templatePath, "utf-8");
      await fs.writeFile(userProfileDest, content, "utf-8");
    } catch {
      // Template not found, skip
    }
  }

  // Seed MEMORY_INDEX.md if missing
  const memIndexDest = path.join(workspaceDir, "memory", "MEMORY_INDEX.md");
  try {
    await fs.access(memIndexDest);
  } catch {
    const templatePath = path.join(templateDir, "MEMORY_INDEX.md");
    try {
      const content = await fs.readFile(templatePath, "utf-8");
      await fs.writeFile(memIndexDest, content, "utf-8");
    } catch {
      // Template not found, skip
    }
  }
}
