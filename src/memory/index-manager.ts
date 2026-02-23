import fs from "node:fs/promises";
import path from "node:path";

/**
 * Memory index manager: simple index-based memory system.
 * Uses MEMORY_INDEX.md as a table of contents for memory files.
 */

export function resolveMemoryDir(workspaceDir: string): string {
  return path.join(workspaceDir, "memory");
}

export function resolveMemoryIndexPath(workspaceDir: string): string {
  return path.join(resolveMemoryDir(workspaceDir), "MEMORY_INDEX.md");
}

/** Check if a path is inside the memory folder */
export function isMemoryPath(filePath: string, workspaceDir: string): boolean {
  const memDir = resolveMemoryDir(workspaceDir);
  const resolved = path.resolve(filePath);
  return resolved.startsWith(memDir + path.sep) || resolved === memDir;
}

/** Load the memory index content */
export async function loadMemoryIndex(workspaceDir: string): Promise<string> {
  try {
    return await fs.readFile(resolveMemoryIndexPath(workspaceDir), "utf-8");
  } catch {
    return "";
  }
}

/** Read a specific memory file */
export async function readMemoryFile(
  fileName: string,
  workspaceDir: string,
): Promise<string> {
  const memDir = resolveMemoryDir(workspaceDir);
  const filePath = path.resolve(memDir, fileName);

  if (!filePath.startsWith(memDir)) {
    throw new Error("Access denied: path is outside memory folder");
  }

  return fs.readFile(filePath, "utf-8");
}

/** Write or update a memory file and update the index */
export async function writeMemoryFile(params: {
  fileName: string;
  content: string;
  summary: string;
  workspaceDir: string;
}): Promise<void> {
  const { fileName, content, summary, workspaceDir } = params;
  const memDir = resolveMemoryDir(workspaceDir);
  const filePath = path.join(memDir, fileName);

  // Write the memory file
  await fs.mkdir(memDir, { recursive: true });
  await fs.writeFile(filePath, content, "utf-8");

  // Update the index
  await updateMemoryIndex(workspaceDir, fileName, summary);
}

/** Update an entry in MEMORY_INDEX.md */
async function updateMemoryIndex(
  workspaceDir: string,
  fileName: string,
  summary: string,
): Promise<void> {
  const indexPath = resolveMemoryIndexPath(workspaceDir);
  let indexContent: string;

  try {
    indexContent = await fs.readFile(indexPath, "utf-8");
  } catch {
    indexContent = "# Memory Index\n\n## Evergreen Knowledge\n\n## Recent\n";
  }

  const entryLine = `- [${fileName.replace(/\.md$/, "")}](${fileName}) — ${summary}`;
  const escapedFileName = fileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const existingLineRegex = new RegExp(`^- \\[.*\\]\\(${escapedFileName}\\).*$`, "m");

  if (existingLineRegex.test(indexContent)) {
    // Update existing entry
    indexContent = indexContent.replace(existingLineRegex, entryLine);
  } else {
    // Add new entry: determine section based on filename pattern
    const isDateFile = /^\d{4}-\d{2}-\d{2}\.md$/.test(fileName);
    const section = isDateFile ? "## Recent" : "## Evergreen Knowledge";
    const sectionIndex = indexContent.indexOf(section);

    if (sectionIndex !== -1) {
      const insertPos = indexContent.indexOf("\n", sectionIndex) + 1;
      // Find the next non-empty line or section after the header
      let nextContentPos = insertPos;
      while (
        nextContentPos < indexContent.length &&
        indexContent[nextContentPos] === "\n"
      ) {
        nextContentPos++;
      }
      indexContent =
        indexContent.slice(0, nextContentPos) +
        entryLine + "\n" +
        indexContent.slice(nextContentPos);
    } else {
      indexContent += "\n" + entryLine + "\n";
    }
  }

  await fs.writeFile(indexPath, indexContent, "utf-8");
}

/** Delete a memory entry */
export async function deleteMemoryFile(
  fileName: string,
  workspaceDir: string,
): Promise<void> {
  const memDir = resolveMemoryDir(workspaceDir);
  const filePath = path.join(memDir, fileName);

  try {
    await fs.unlink(filePath);
  } catch {
    // file doesn't exist
  }

  // Remove from index
  const indexPath = resolveMemoryIndexPath(workspaceDir);
  try {
    let indexContent = await fs.readFile(indexPath, "utf-8");
    const escapedFileName = fileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const lineRegex = new RegExp(`^- \\[.*\\]\\(${escapedFileName}\\).*\\n?`, "m");
    indexContent = indexContent.replace(lineRegex, "");
    await fs.writeFile(indexPath, indexContent, "utf-8");
  } catch {
    // index doesn't exist
  }
}

/** List all memory files */
export async function listMemoryFiles(
  workspaceDir: string,
): Promise<string[]> {
  const memDir = resolveMemoryDir(workspaceDir);
  try {
    const entries = await fs.readdir(memDir);
    return entries.filter((e) => e.endsWith(".md") && e !== "MEMORY_INDEX.md");
  } catch {
    return [];
  }
}

/** Ensure memory directory and index exist */
export async function ensureMemoryDir(workspaceDir: string): Promise<void> {
  const memDir = resolveMemoryDir(workspaceDir);
  await fs.mkdir(memDir, { recursive: true });
}
