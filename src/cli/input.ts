import { EventEmitter } from "node:events";
import path from "node:path";
import fs from "node:fs/promises";
import chalk from "chalk";

/**
 * Custom CLI input handler with:
 * - Option+Enter (⌥+Enter) for newline insertion
 * - `"""` toggle for multiline block mode
 * - File drag-and-drop detection (paths dropped into terminal)
 */

export interface InputEvents {
    message: [text: string];
    file: [filePath: string];
    exit: [];
}

export class CliInput extends EventEmitter {
    private buffer: string = "";
    private multilineMode: boolean = false;
    private promptStr: string;
    private userDir: string;

    constructor(params: { prompt: string; userDir: string }) {
        super();
        this.promptStr = params.prompt;
        this.userDir = params.userDir;
    }

    /** Start listening for input */
    start(): void {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding("utf-8");
        this.showPrompt();

        process.stdin.on("data", (chunk: string) => {
            this.handleData(chunk);
        });
    }

    /** Stop listening */
    stop(): void {
        process.stdin.setRawMode(false);
        process.stdin.pause();
    }

    /** Temporarily disable raw mode (for sub-prompts like exec confirmation) */
    pause(): void {
        process.stdin.setRawMode(false);
    }

    /** Re-enable raw mode after pause */
    resume(): void {
        process.stdin.setRawMode(true);
    }

    private showPrompt(): void {
        if (this.multilineMode) {
            process.stdout.write(chalk.dim("... "));
        } else {
            process.stdout.write(this.promptStr);
        }
    }

    private handleData(chunk: string): void {
        // Ctrl+C — exit
        if (chunk === "\x03") {
            process.stdout.write("\n");
            this.emit("exit");
            return;
        }

        // Ctrl+D — exit
        if (chunk === "\x04") {
            process.stdout.write("\n");
            this.emit("exit");
            return;
        }

        // Option+Enter (ESC followed by CR) — insert newline
        if (chunk === "\x1b\r" || chunk === "\x1b\n") {
            this.buffer += "\n";
            process.stdout.write("\n");
            process.stdout.write(chalk.dim("... "));
            return;
        }

        // Shift+Enter in kitty terminal protocol — insert newline
        if (chunk === "\x1b[13;2u") {
            this.buffer += "\n";
            process.stdout.write("\n");
            process.stdout.write(chalk.dim("... "));
            return;
        }

        // Enter (CR) — submit or continue multiline
        if (chunk === "\r" || chunk === "\n") {
            process.stdout.write("\n");

            // Check for """ toggle
            if (this.buffer.trim() === '"""') {
                this.multilineMode = true;
                this.buffer = "";
                process.stdout.write(chalk.dim("📝 Multiline mode (enter \"\"\" to send)\n"));
                this.showPrompt();
                return;
            }

            // In multiline mode, """ on its own line sends the buffer
            if (this.multilineMode && this.buffer.trimEnd().endsWith('"""')) {
                this.multilineMode = false;
                const text = this.buffer.trimEnd().slice(0, -3).trimEnd();
                this.buffer = "";
                if (text) {
                    this.processInput(text);
                } else {
                    this.showPrompt();
                }
                return;
            }

            // In multiline mode, Enter just adds a newline
            if (this.multilineMode) {
                this.buffer += "\n";
                this.showPrompt();
                return;
            }

            // Normal mode: submit
            const text = this.buffer.trim();
            this.buffer = "";
            if (text) {
                this.processInput(text);
            } else {
                this.showPrompt();
            }
            return;
        }

        // Backspace
        if (chunk === "\x7f" || chunk === "\b") {
            if (this.buffer.length > 0) {
                this.buffer = this.buffer.slice(0, -1);
                process.stdout.write("\b \b");
            }
            return;
        }

        // Ctrl+U — clear line
        if (chunk === "\x15") {
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            this.buffer = "";
            this.showPrompt();
            return;
        }

        // Escape alone — ignore (don't print)
        if (chunk === "\x1b") {
            return;
        }

        // Arrow keys and other escape sequences — ignore
        if (chunk.startsWith("\x1b[")) {
            return;
        }

        // Paste detection: if chunk contains multiple chars with newlines, handle as paste
        if (chunk.length > 1 && chunk.includes("\n")) {
            const lines = chunk.split("\n");
            for (let i = 0; i < lines.length; i++) {
                this.buffer += lines[i];
                process.stdout.write(lines[i]);
                if (i < lines.length - 1) {
                    this.buffer += "\n";
                    process.stdout.write("\n" + chalk.dim("... "));
                }
            }
            return;
        }

        // Regular character(s)
        this.buffer += chunk;
        process.stdout.write(chunk);
    }

    private processInput(text: string): void {
        // Check for exit commands
        const lower = text.toLowerCase();
        if (lower === "exit" || lower === "quit") {
            this.emit("exit");
            return;
        }

        // Check if input looks like a file path (drag-and-drop detection)
        const cleanPath = text.replace(/^['"]|['"]$/g, "").trim(); // strip quotes from drag
        if (this.looksLikeFilePath(cleanPath)) {
            this.handleFileDrop(cleanPath);
            return;
        }

        // Regular message
        this.emit("message", text);
    }

    private looksLikeFilePath(text: string): boolean {
        // Must be a single "line" (no spaces that look like conversation)
        if (text.includes("\n")) return false;
        // Must start with / or ~ (absolute path) and not contain common sentence patterns
        if (!text.startsWith("/") && !text.startsWith("~")) return false;
        // Must have a file extension or end with /
        if (text.includes(" ") && !text.includes("\\ ")) return false;
        return true;
    }

    private async handleFileDrop(filePath: string): Promise<void> {
        // Resolve ~ and escaped spaces
        const resolved = filePath
            .replace(/^~/, process.env.HOME ?? "")
            .replace(/\\ /g, " ");

        try {
            const stat = await fs.stat(resolved);
            if (!stat.isFile()) {
                process.stdout.write(chalk.yellow("⚠️  Not a file: " + resolved + "\n"));
                this.showPrompt();
                return;
            }

            const fileName = path.basename(resolved);
            const dest = path.join(this.userDir, fileName);

            // Check if file already exists
            try {
                await fs.access(dest);
                process.stdout.write(chalk.yellow(`⚠️  ${fileName} already exists in user/\n`));
                this.showPrompt();
                return;
            } catch {
                // Doesn't exist, good
            }

            await fs.copyFile(resolved, dest);
            const sizeKb = (stat.size / 1024).toFixed(1);
            process.stdout.write(
                chalk.green(`✓ Copied to user/${fileName} (${sizeKb} KB)\n`),
            );
            this.emit("file", dest);
        } catch {
            // Not a valid path, treat as regular message
            this.emit("message", filePath);
        }
        this.showPrompt();
    }

    /** Show the prompt again (called externally after processing) */
    showInputPrompt(): void {
        this.showPrompt();
    }
}
