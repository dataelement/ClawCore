import fs from "node:fs/promises";
import path from "node:path";

/**
 * Workbench manager: per-task folder organization.
 * Agent can fully read/write here.
 */

export function resolveWorkbenchDir(workspaceDir: string): string {
  return path.join(workspaceDir, "workbench");
}

export function resolveArchiveDir(workspaceDir: string): string {
  return path.join(resolveWorkbenchDir(workspaceDir), "_archive");
}

/** Check if a path is inside the workbench */
export function isWorkbenchPath(filePath: string, workspaceDir: string): boolean {
  const wbDir = resolveWorkbenchDir(workspaceDir);
  const resolved = path.resolve(filePath);
  return resolved.startsWith(wbDir + path.sep) || resolved === wbDir;
}

/** Create a new task folder in the workbench */
export async function createTaskFolder(params: {
  workspaceDir: string;
  taskName: string;
  source: "user" | "agent";
  description?: string;
}): Promise<string> {
  const { workspaceDir, taskName, source, description } = params;
  const wbDir = resolveWorkbenchDir(workspaceDir);

  const datePrefix = new Date().toISOString().slice(0, 10);
  const sanitized = taskName.replace(/[\/\\:*?"<>|]/g, "_").slice(0, 60);
  const folderName = source === "agent"
    ? `🤖_${datePrefix}_${sanitized}`
    : `${datePrefix}_${sanitized}`;

  const taskDir = path.join(wbDir, folderName);
  await fs.mkdir(taskDir, { recursive: true });

  // Create _TASK.md
  const taskMd = [
    `# Task: ${taskName}`,
    "",
    `- **Status:** in_progress`,
    `- **Created:** ${new Date().toISOString()}`,
    `- **Source:** ${source === "agent" ? "🤖 Agent-initiated" : "👤 User request"}`,
    description ? `- **Description:** ${description}` : "",
    "",
    "## Files",
    "",
    "_(files used in this task will be listed here)_",
  ].filter(Boolean).join("\n") + "\n";

  await fs.writeFile(path.join(taskDir, "_TASK.md"), taskMd, "utf-8");

  return taskDir;
}

/** Update the status in _TASK.md */
export async function updateTaskStatus(
  taskDir: string,
  status: "in_progress" | "completed" | "archived",
): Promise<void> {
  const taskMdPath = path.join(taskDir, "_TASK.md");
  try {
    let content = await fs.readFile(taskMdPath, "utf-8");
    content = content.replace(
      /- \*\*Status:\*\* \w+/,
      `- **Status:** ${status}`,
    );
    await fs.writeFile(taskMdPath, content, "utf-8");
  } catch {
    // _TASK.md doesn't exist, skip
  }
}

/** Move a task folder to the archive */
export async function archiveTask(
  taskDir: string,
  workspaceDir: string,
): Promise<string> {
  const archiveDir = resolveArchiveDir(workspaceDir);
  await fs.mkdir(archiveDir, { recursive: true });

  await updateTaskStatus(taskDir, "archived");

  const folderName = path.basename(taskDir);
  const dest = path.join(archiveDir, folderName);
  await fs.rename(taskDir, dest);

  return dest;
}

/** List all task folders in the workbench (excluding _archive) */
export async function listTasks(
  workspaceDir: string,
): Promise<Array<{ name: string; path: string; isAgent: boolean }>> {
  const wbDir = resolveWorkbenchDir(workspaceDir);
  try {
    const entries = await fs.readdir(wbDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && e.name !== "_archive")
      .map((e) => ({
        name: e.name,
        path: path.join(wbDir, e.name),
        isAgent: e.name.startsWith("🤖"),
      }));
  } catch {
    return [];
  }
}

/** Copy a file from user folder (or anywhere allowed) into a task folder */
export async function copyToWorkbench(params: {
  sourcePath: string;
  taskDir: string;
  fileName?: string;
}): Promise<string> {
  const destName = params.fileName ?? path.basename(params.sourcePath);
  const destPath = path.join(params.taskDir, destName);
  await fs.copyFile(params.sourcePath, destPath);

  // Update _TASK.md to record the file
  const taskMdPath = path.join(params.taskDir, "_TASK.md");
  try {
    let content = await fs.readFile(taskMdPath, "utf-8");
    const filesSection = `- \`${destName}\` (copied from \`${path.basename(params.sourcePath)}\`)`;
    content = content.replace(
      /\(files used in this task will be listed here\)/,
      filesSection,
    );
    await fs.writeFile(taskMdPath, content, "utf-8");
  } catch {
    // ignore
  }

  return destPath;
}

/** Ensure workbench directory exists */
export async function ensureWorkbenchDir(workspaceDir: string): Promise<void> {
  await fs.mkdir(resolveWorkbenchDir(workspaceDir), { recursive: true });
  await fs.mkdir(resolveArchiveDir(workspaceDir), { recursive: true });
}
