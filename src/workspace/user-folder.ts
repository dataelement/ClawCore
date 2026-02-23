import fs from "node:fs/promises";
import path from "node:path";
import { parseDocument, getFileTypeDescription, isReadableFile } from "./doc-parser.js";

/**
 * User folder manager: read-only access to user's personal files.
 * The agent can ONLY read and copy files from this folder.
 */

export function resolveUserDir(workspaceDir: string): string {
  return path.join(workspaceDir, "user");
}

export function resolveUserProfilePath(workspaceDir: string): string {
  return path.join(resolveUserDir(workspaceDir), "USER_PROFILE.md");
}

/** Check if a path is inside the user folder */
export function isUserPath(filePath: string, workspaceDir: string): boolean {
  const userDir = resolveUserDir(workspaceDir);
  const resolved = path.resolve(filePath);
  return resolved.startsWith(userDir + path.sep) || resolved === userDir;
}

/** Read a file from the user folder (read-only) */
export async function readUserFile(filePath: string, workspaceDir: string): Promise<string> {
  const resolved = path.resolve(filePath);
  if (!isUserPath(resolved, workspaceDir)) {
    throw new Error(`Access denied: ${filePath} is not in the user folder`);
  }
  return parseDocument(resolved);
}

/** List contents of user folder */
export async function listUserDir(
  subPath: string,
  workspaceDir: string,
): Promise<Array<{ name: string; type: "file" | "dir"; size?: number; fileType?: string }>> {
  const userDir = resolveUserDir(workspaceDir);
  const targetDir = subPath ? path.join(userDir, subPath) : userDir;

  const resolved = path.resolve(targetDir);
  if (!resolved.startsWith(userDir)) {
    throw new Error("Access denied: path is outside user folder");
  }

  try {
    const entries = await fs.readdir(resolved, { withFileTypes: true });
    const results: Array<{ name: string; type: "file" | "dir"; size?: number; fileType?: string }> = [];

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue; // skip hidden files

      if (entry.isDirectory()) {
        results.push({ name: entry.name, type: "dir" });
      } else {
        const fullPath = path.join(resolved, entry.name);
        const stat = await fs.stat(fullPath);
        results.push({
          name: entry.name,
          type: "file",
          size: stat.size,
          fileType: getFileTypeDescription(entry.name),
        });
      }
    }

    return results;
  } catch {
    return [];
  }
}

/** Load USER_PROFILE.md content (agent reads on startup) */
export async function loadUserProfile(workspaceDir: string): Promise<string | null> {
  try {
    return await fs.readFile(resolveUserProfilePath(workspaceDir), "utf-8");
  } catch {
    return null;
  }
}

/** Ensure user directory exists */
export async function ensureUserDir(workspaceDir: string): Promise<void> {
  await fs.mkdir(resolveUserDir(workspaceDir), { recursive: true });
}
