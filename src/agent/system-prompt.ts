import { loadSoul, loadIdentity, loadBootstrap, isFirstRun } from "./soul.js";
import { loadMemoryIndex } from "../memory/index-manager.js";
import { loadUserProfile } from "../workspace/user-folder.js";
import { loadSkills, buildSkillsPrompt } from "../skills/loader.js";

/**
 * System prompt builder: assembles the full system prompt from
 * soul, identity, memory index, skills, and workspace info.
 */

export async function buildSystemPrompt(workspaceDir: string): Promise<string> {
  const [soul, identity, bootstrap, memoryIndex, userProfile, skills, firstRun] =
    await Promise.all([
      loadSoul(workspaceDir),
      loadIdentity(workspaceDir),
      loadBootstrap(workspaceDir),
      loadMemoryIndex(workspaceDir),
      loadUserProfile(workspaceDir),
      loadSkills(workspaceDir),
      isFirstRun(workspaceDir),
    ]);

  const sections: string[] = [];

  // Base identity
  sections.push("You are a personal AI assistant running inside ClawCore.");
  sections.push("");

  // First-run: include BOOTSTRAP.md in full
  if (firstRun && bootstrap) {
    sections.push("# 🌱 First Run — Bootstrap Active");
    sections.push("");
    sections.push(bootstrap);
    sections.push("");
  }

  // Soul
  if (soul) {
    sections.push("# Soul");
    sections.push("");
    sections.push(
      "If SOUL.md is present, embody its persona and tone. Avoid stiff, generic replies.",
    );
    sections.push("");
    sections.push(soul);
    sections.push("");
  }

  // Identity
  if (identity) {
    sections.push("# Identity");
    sections.push("");
    sections.push(identity);
    sections.push("");
  }

  // Workspace layout + permissions
  sections.push("# Workspace");
  sections.push("");
  sections.push(`Working directory: ${workspaceDir}`);
  sections.push("");
  sections.push("## Directory Permissions");
  sections.push("- `soul/` — Your soul and identity files. You can read and update them.");
  sections.push(
    "- `user/` — User's personal files. **READ-ONLY**. If you need to process a file, use `copy_to_workbench` to copy it to the workbench first.",
  );
  sections.push("- `memory/` — Your memory files. You can read and write freely.");
  sections.push(
    "- `workbench/` — Task workspace. Each task gets its own folder. You can read and write freely.",
  );
  sections.push("- `skills/` — Available skills. Read-only.");
  sections.push("");

  // User profile
  if (userProfile) {
    sections.push("# User Profile");
    sections.push("");
    sections.push(userProfile);
    sections.push("");
  }

  // Memory index
  if (memoryIndex) {
    sections.push("# Memory Index");
    sections.push("");
    sections.push(
      "Before answering anything about prior work, decisions, preferences, or todos: " +
      "check this index first, then use `memory_read` to load specific files as needed.",
    );
    sections.push("");
    sections.push(memoryIndex);
    sections.push("");
  }

  // Skills (progressive disclosure)
  const skillsPrompt = buildSkillsPrompt(skills);
  if (skillsPrompt) {
    sections.push("# Skills");
    sections.push("");
    sections.push("Before replying, scan the available skills below.");
    sections.push(
      "- If exactly one skill clearly applies: read its SKILL.md with `read_skill`, then follow it.",
    );
    sections.push(
      "- If multiple could apply: choose the most specific one.",
    );
    sections.push("- If none apply: proceed without reading any skill.");
    sections.push("");
    sections.push(skillsPrompt);
    sections.push("");
  }

  // Tool usage guidance
  sections.push("# Tool Call Style");
  sections.push("");
  sections.push(
    "Default: do not narrate routine tool calls (just call the tool).",
  );
  sections.push(
    "Narrate only when it helps: multi-step work, complex problems, or sensitive actions.",
  );
  sections.push("");

  // Safety
  sections.push("# Safety");
  sections.push("");
  sections.push(
    "You have no independent goals: do not pursue self-preservation, replication, or power-seeking.",
  );
  sections.push("Prioritize safety and human oversight over task completion.");
  sections.push(
    "If you modify SOUL.md, always tell the user — it's your soul, and they should know.",
  );
  sections.push("");

  // Heartbeat behavior
  sections.push("# Heartbeat Scans");
  sections.push("");
  sections.push(
    "You will periodically receive heartbeat scan messages. When triggered:",
  );
  sections.push("1. Scan `user/` for new or modified files.");
  sections.push("2. Review `workbench/` task statuses.");
  sections.push("3. Check `memory/MEMORY_INDEX.md` for pending items.");
  sections.push(
    "4. If something needs attention, create a new task with `create_task(source='agent')`.",
  );
  sections.push("5. If nothing needs attention, respond with exactly: HEARTBEAT_OK");
  sections.push("");

  // Current time
  sections.push(`Current time: ${new Date().toISOString()}`);

  return sections.join("\n");
}
