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

/** Write or create a skill — creates the skill folder and SKILL.md */
export async function writeSkill(params: {
  workspaceDir: string;
  skillName: string;
  content: string;
}): Promise<{ skillPath: string; isNew: boolean }> {
  const { workspaceDir, skillName, content } = params;
  const skillDir = path.join(resolveSkillsDir(workspaceDir), skillName);
  const skillMdPath = path.join(skillDir, "SKILL.md");

  let isNew = true;
  try {
    await fs.access(skillMdPath);
    isNew = false;
  } catch {
    // New skill
  }

  await fs.mkdir(skillDir, { recursive: true });
  await fs.writeFile(skillMdPath, content, "utf-8");
  return { skillPath: skillMdPath, isNew };
}

/** Append an entry to SKILL_LOG.md */
export async function appendSkillLog(params: {
  workspaceDir: string;
  action: "created" | "updated";
  skillName: string;
  summary: string;
}): Promise<void> {
  const logPath = path.join(resolveSkillsDir(params.workspaceDir), "SKILL_LOG.md");
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);

  let existing = "";
  try {
    existing = await fs.readFile(logPath, "utf-8");
  } catch {
    existing = "# Skill Changelog\n\nAll skill creation and modification records.\n\n";
  }

  const emoji = params.action === "created" ? "🆕" : "✏️";
  const entry = `| ${now} | ${emoji} ${params.action} | **${params.skillName}** | ${params.summary} |\n`;

  // Insert table header if not present
  if (!existing.includes("| Time |")) {
    existing += "| Time | Action | Skill | Summary |\n";
    existing += "|------|--------|-------|---------|\n";
  }

  existing += entry;
  await fs.writeFile(logPath, existing, "utf-8");
}

/** Ensure skills directory exists */
export async function ensureSkillsDir(workspaceDir: string): Promise<void> {
  await fs.mkdir(resolveSkillsDir(workspaceDir), { recursive: true });
}
