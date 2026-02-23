import type { ToolDefinition } from "../llm/types.js";

/**
 * Tool definitions for ClawCore agent.
 * These define the JSON schemas for function calling.
 */

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "read_file",
      description:
        "Read file contents. Can read files from user/ (read-only), memory/, workbench/, and skills/ directories. " +
        "Supports text files and documents (PDF, Word, Excel). " +
        "For user/ files, content is read-only. Use copy_to_workbench to work with copies.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description:
              "File path relative to the workspace root (e.g. 'user/resume.pdf', 'memory/preferences.md', 'workbench/task/result.md')",
          },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description:
        "Write content to a file. ONLY allowed in memory/ and workbench/ directories. " +
        "Cannot write to user/ (read-only). Creates parent directories if needed.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description:
              "File path relative to workspace root (e.g. 'workbench/my-task/output.md', 'memory/notes.md')",
          },
          content: {
            type: "string",
            description: "File content to write",
          },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_dir",
      description:
        "List contents of a directory. Works in user/, memory/, workbench/, and skills/.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description:
              "Directory path relative to workspace root (e.g. 'user/', 'workbench/', 'memory/')",
          },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "copy_to_workbench",
      description:
        "Copy a file from user/ folder into a specific task folder in workbench/. " +
        "Use this when you need to process or modify a user file — always work on the copy, never the original.",
      parameters: {
        type: "object",
        properties: {
          source_path: {
            type: "string",
            description: "Source file path relative to workspace (must be in user/)",
          },
          task_folder: {
            type: "string",
            description: "Name of the task folder in workbench/ to copy into",
          },
        },
        required: ["source_path", "task_folder"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description:
        "Create a new task folder in the workbench. Each task gets its own folder with a _TASK.md metadata file. " +
        "User-requested tasks get a date prefix. Agent-initiated tasks get a 🤖 prefix.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Short descriptive name for the task",
          },
          description: {
            type: "string",
            description: "Brief description of what this task will accomplish",
          },
          source: {
            type: "string",
            enum: ["user", "agent"],
            description: "'user' for user-requested tasks, 'agent' for self-initiated tasks",
          },
        },
        required: ["name", "source"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_task_status",
      description: "Update the status of a task in the workbench.",
      parameters: {
        type: "object",
        properties: {
          task_folder: {
            type: "string",
            description: "Name of the task folder in workbench/",
          },
          status: {
            type: "string",
            enum: ["in_progress", "completed", "archived"],
            description: "New status for the task",
          },
        },
        required: ["task_folder", "status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "archive_task",
      description: "Move a completed task folder to the _archive/ directory.",
      parameters: {
        type: "object",
        properties: {
          task_folder: {
            type: "string",
            description: "Name of the task folder to archive",
          },
        },
        required: ["task_folder"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "memory_read",
      description:
        "Read a specific memory file. Check MEMORY_INDEX.md first to find relevant files.",
      parameters: {
        type: "object",
        properties: {
          file_name: {
            type: "string",
            description: "Memory file name (e.g. 'preferences.md', '2026-02-23.md')",
          },
        },
        required: ["file_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "memory_write",
      description:
        "Write or update a memory file. Automatically updates MEMORY_INDEX.md. " +
        "Use date format (YYYY-MM-DD.md) for diary entries, descriptive names for evergreen knowledge.",
      parameters: {
        type: "object",
        properties: {
          file_name: {
            type: "string",
            description: "Memory file name (e.g. 'preferences.md', '2026-02-23.md')",
          },
          content: {
            type: "string",
            description: "Content to write to the memory file",
          },
          summary: {
            type: "string",
            description: "One-line summary for the MEMORY_INDEX.md entry",
          },
        },
        required: ["file_name", "content", "summary"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "memory_index",
      description: "View the current memory index (MEMORY_INDEX.md) to see what memories exist.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_skill",
      description: "Read the full SKILL.md content of a specific skill to understand how to use it.",
      parameters: {
        type: "object",
        properties: {
          skill_path: {
            type: "string",
            description: "Path to the SKILL.md file",
          },
        },
        required: ["skill_path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_skill",
      description:
        "Create a new skill. Provide the skill name and complete SKILL.md content (with YAML frontmatter). " +
        "This creates a skills/<name>/SKILL.md file and logs the action to SKILL_LOG.md. " +
        "Use this to accumulate capabilities over time — every useful pattern you learn can become a skill.",
      parameters: {
        type: "object",
        properties: {
          skill_name: {
            type: "string",
            description: "Short kebab-case name (e.g. 'pdf-summary', 'code-review')",
          },
          content: {
            type: "string",
            description: "Complete SKILL.md content, including YAML frontmatter with name and description",
          },
          summary: {
            type: "string",
            description: "One-line summary of this skill for the changelog",
          },
        },
        required: ["skill_name", "content", "summary"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_skill",
      description:
        "Update an existing skill's SKILL.md content. Logs the modification to SKILL_LOG.md.",
      parameters: {
        type: "object",
        properties: {
          skill_name: {
            type: "string",
            description: "Name of the skill folder to update",
          },
          content: {
            type: "string",
            description: "Updated SKILL.md content",
          },
          summary: {
            type: "string",
            description: "One-line summary of what changed for the changelog",
          },
        },
        required: ["skill_name", "content", "summary"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "exec",
      description:
        "Execute a shell command. Use responsibly — prefer file tools for reading/writing. " +
        "Useful for running scripts, installing packages, or other system operations.",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "Shell command to execute",
          },
          cwd: {
            type: "string",
            description: "Working directory (relative to workspace root, defaults to workbench/)",
          },
        },
        required: ["command"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_soul",
      description:
        "Update your SOUL.md file. IMPORTANT: Always tell the user when you modify this file — it's your soul, and they should know.",
      parameters: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "New content for SOUL.md",
          },
        },
        required: ["content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_identity",
      description:
        "Update your IDENTITY.md file with your name, creature type, vibe, and emoji.",
      parameters: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "New content for IDENTITY.md",
          },
        },
        required: ["content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "complete_bootstrap",
      description:
        "Delete BOOTSTRAP.md to signal that the first-run setup is complete. " +
        "Only call this after you've established your identity and updated IDENTITY.md.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];
