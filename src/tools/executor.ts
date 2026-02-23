import fs from "node:fs/promises";
import path from "node:path";
import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";
import { parseDocument } from "../workspace/doc-parser.js";
import { isUserPath } from "../workspace/user-folder.js";
import {
  isWorkbenchPath,
  resolveWorkbenchDir,
  createTaskFolder,
  updateTaskStatus,
  archiveTask,
  copyToWorkbench,
} from "../workspace/workbench.js";
import {
  isMemoryPath,
  loadMemoryIndex,
  readMemoryFile,
  writeMemoryFile,
} from "../memory/index-manager.js";
import {
  saveSoul,
  saveIdentity,
  completeBootstrap,
} from "../agent/soul.js";
import { readSkillContent } from "../skills/loader.js";

const execAsync = promisify(execCb);

/**
 * Tool executor: dispatches tool calls to the appropriate handler.
 */
export async function executeTool(params: {
  name: string;
  args: Record<string, unknown>;
  workspaceDir: string;
}): Promise<string> {
  const { name, args, workspaceDir } = params;

  try {
    switch (name) {
      case "read_file":
        return await handleReadFile(args.path as string, workspaceDir);
      case "write_file":
        return await handleWriteFile(
          args.path as string,
          args.content as string,
          workspaceDir,
        );
      case "list_dir":
        return await handleListDir(args.path as string, workspaceDir);
      case "copy_to_workbench":
        return await handleCopyToWorkbench(
          args.source_path as string,
          args.task_folder as string,
          workspaceDir,
        );
      case "create_task":
        return await handleCreateTask(
          args.name as string,
          (args.source as "user" | "agent") ?? "user",
          args.description as string | undefined,
          workspaceDir,
        );
      case "update_task_status":
        return await handleUpdateTaskStatus(
          args.task_folder as string,
          args.status as "in_progress" | "completed" | "archived",
          workspaceDir,
        );
      case "archive_task":
        return await handleArchiveTask(args.task_folder as string, workspaceDir);
      case "memory_read":
        return await handleMemoryRead(args.file_name as string, workspaceDir);
      case "memory_write":
        return await handleMemoryWrite(
          args.file_name as string,
          args.content as string,
          args.summary as string,
          workspaceDir,
        );
      case "memory_index":
        return await handleMemoryIndex(workspaceDir);
      case "read_skill":
        return await readSkillContent(args.skill_path as string);
      case "exec":
        return await handleExec(
          args.command as string,
            args.cwd as string | undefined,
          workspaceDir,
        );
      case "update_soul":
        return await handleUpdateSoul(args.content as string, workspaceDir);
      case "update_identity":
        return await handleUpdateIdentity(args.content as string, workspaceDir);
      case "complete_bootstrap":
        await completeBootstrap(workspaceDir);
        return "Bootstrap completed. BOOTSTRAP.md has been deleted. You are now fully initialized.";
      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

async function handleReadFile(filePath: string, workspaceDir: string): Promise<string> {
  const resolved = path.resolve(workspaceDir, filePath);
  // Ensure the file is within the workspace
  if (!resolved.startsWith(workspaceDir)) {
    return "Error: Access denied — path is outside workspace.";
  }
  return parseDocument(resolved);
}

async function handleWriteFile(
  filePath: string,
  content: string,
  workspaceDir: string,
): Promise<string> {
  const resolved = path.resolve(workspaceDir, filePath);

  if (!resolved.startsWith(workspaceDir)) {
    return "Error: Access denied — path is outside workspace.";
  }

  if (isUserPath(resolved, workspaceDir)) {
    return "Error: Cannot write to user/ folder — it is read-only. Use copy_to_workbench to copy files, then edit copies in workbench/.";
  }

  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, content, "utf-8");
  return `File written: ${filePath}`;
}

async function handleListDir(dirPath: string, workspaceDir: string): Promise<string> {
  const resolved = path.resolve(workspaceDir, dirPath);
  if (!resolved.startsWith(workspaceDir)) {
    return "Error: Access denied — path is outside workspace.";
  }

  try {
    const entries = await fs.readdir(resolved, { withFileTypes: true });
    const lines: string[] = [];

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      if (entry.isDirectory()) {
        lines.push(`📁 ${entry.name}/`);
      } else {
        const stat = await fs.stat(path.join(resolved, entry.name));
        const sizeKb = (stat.size / 1024).toFixed(1);
        lines.push(`📄 ${entry.name} (${sizeKb} KB)`);
      }
    }

    return lines.length > 0 ? lines.join("\n") : "(empty directory)";
  } catch {
    return `Error: Directory not found: ${dirPath}`;
  }
}

async function handleCopyToWorkbench(
  sourcePath: string,
  taskFolder: string,
  workspaceDir: string,
): Promise<string> {
  const resolvedSource = path.resolve(workspaceDir, sourcePath);

  if (!isUserPath(resolvedSource, workspaceDir)) {
    return "Error: copy_to_workbench only works for files in user/ folder.";
  }

  const taskDir = path.join(resolveWorkbenchDir(workspaceDir), taskFolder);
  try {
    await fs.access(taskDir);
  } catch {
    return `Error: Task folder '${taskFolder}' does not exist. Create it first with create_task.`;
  }

  const destPath = await copyToWorkbench({ sourcePath: resolvedSource, taskDir });
  return `Copied to: ${path.relative(workspaceDir, destPath)}`;
}

async function handleCreateTask(
  name: string,
  source: "user" | "agent",
  description: string | undefined,
  workspaceDir: string,
): Promise<string> {
  const taskDir = await createTaskFolder({ workspaceDir, taskName: name, source, description });
  return `Task created: ${path.relative(workspaceDir, taskDir)}`;
}

async function handleUpdateTaskStatus(
  taskFolder: string,
  status: "in_progress" | "completed" | "archived",
  workspaceDir: string,
): Promise<string> {
  if (status === "archived") {
    return handleArchiveTask(taskFolder, workspaceDir);
  }
  const taskDir = path.join(resolveWorkbenchDir(workspaceDir), taskFolder);
  await updateTaskStatus(taskDir, status);
  return `Task '${taskFolder}' status updated to: ${status}`;
}

async function handleArchiveTask(
  taskFolder: string,
  workspaceDir: string,
): Promise<string> {
  const taskDir = path.join(resolveWorkbenchDir(workspaceDir), taskFolder);
  const dest = await archiveTask(taskDir, workspaceDir);
  return `Task archived to: ${path.relative(workspaceDir, dest)}`;
}

async function handleMemoryRead(fileName: string, workspaceDir: string): Promise<string> {
  return readMemoryFile(fileName, workspaceDir);
}

async function handleMemoryWrite(
  fileName: string,
  content: string,
  summary: string,
  workspaceDir: string,
): Promise<string> {
  await writeMemoryFile({ fileName, content, summary, workspaceDir });
  return `Memory written: ${fileName} (index updated)`;
}

async function handleMemoryIndex(workspaceDir: string): Promise<string> {
  const index = await loadMemoryIndex(workspaceDir);
  return index || "(Memory index is empty)";
}

async function handleExec(
  command: string,
  cwd: string | undefined,
  workspaceDir: string,
): Promise<string> {
  const resolvedCwd = cwd
    ? path.resolve(workspaceDir, cwd)
    : resolveWorkbenchDir(workspaceDir);

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: resolvedCwd,
      timeout: 30_000,
      maxBuffer: 1024 * 1024,
    });
    const output = [
      stdout.trim() ? `stdout:\n${stdout.trim()}` : "",
      stderr.trim() ? `stderr:\n${stderr.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
    return output || "(no output)";
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; message?: string };
    return `Command failed: ${error.message ?? String(err)}\n${error.stderr ?? ""}`.trim();
  }
}

async function handleUpdateSoul(content: string, workspaceDir: string): Promise<string> {
  await saveSoul(workspaceDir, content);
  return "SOUL.md updated. (Remember to tell the user about this change — it's your soul.)";
}

async function handleUpdateIdentity(content: string, workspaceDir: string): Promise<string> {
  await saveIdentity(workspaceDir, content);
  return "IDENTITY.md updated.";
}
