import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

/**
 * Skills system: load SKILL.md files and build progressive disclosure prompts.
 */

export interface SkillEntry {
  name: string;
  description: string;
  location: string; // path to SKILL.md
  metadata?: Record<string, unknown>;
}

/** Resolve skills directory */
export function resolveSkillsDir(workspaceDir: string): string {
  return path.join(workspaceDir, "skills");
}

/** Load all skills from the skills directory */
export async function loadSkills(workspaceDir: string): Promise<SkillEntry[]> {
  const skillsDir = resolveSkillsDir(workspaceDir);
  const skills: SkillEntry[] = [];

  try {
    const entries = await fs.readdir(skillsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skillMdPath = path.join(skillsDir, entry.name, "SKILL.md");
      try {
        const content = await fs.readFile(skillMdPath, "utf-8");
        const parsed = matter(content);

        skills.push({
          name: (parsed.data.name as string) ?? entry.name,
          description: (parsed.data.description as string) ?? "",
          location: skillMdPath,
          metadata: parsed.data.metadata as Record<string, unknown> | undefined,
        });
      } catch {
        // No SKILL.md or can't parse, skip
      }
    }
  } catch {
    // Skills directory doesn't exist
  }

  return skills;
}

/** Build the skills prompt for system prompt injection (progressive disclosure) */
export function buildSkillsPrompt(skills: SkillEntry[]): string {
  if (skills.length === 0) {
    return "";
  }

  const lines = [
    "<available_skills>",
    ...skills.map(
      (s) =>
        `<skill name="${s.name}" location="${s.location}">` +
        `<description>${s.description}</description>` +
        `</skill>`,
    ),
    "</available_skills>",
  ];

  return lines.join("\n");
}

/** Read full SKILL.md content for a specific skill */
export async function readSkillContent(skillPath: string): Promise<string> {
  return fs.readFile(skillPath, "utf-8");
}

/** Ensure skills directory exists */
export async function ensureSkillsDir(workspaceDir: string): Promise<void> {
  await fs.mkdir(resolveSkillsDir(workspaceDir), { recursive: true });
}
