import { EventEmitter } from "node:events";
import readline from "node:readline";
import path from "node:path";
import fs from "node:fs/promises";
import chalk from "chalk";

/**
 * CLI input handler using readline (reliable, no raw mode issues).
 * Supports:
 * - `"""` multiline block mode
 * - File drag-and-drop detection
 */

export class CliInput extends EventEmitter {
    private rl: readline.Interface | null = null;
    private promptStr: string;
    private userDir: string;
    private multilineMode = false;
    private multilineBuffer: string[] = [];

    constructor(params: { prompt: string; userDir: string }) {
        super();
        this.promptStr = params.prompt;
        this.userDir = params.userDir;
    }

    /** Start listening for input */
    start(): void {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: this.promptStr,
        });

        this.rl.prompt();

        this.rl.on("line", (line: string) => {
            this.handleLine(line);
        });

        this.rl.on("close", () => {
            this.emit("exit");
        });
    }

    /** Stop listening */
    stop(): void {
        this.rl?.close();
        this.rl = null;
    }

    /** Show the prompt again (called externally after processing) */
    showInputPrompt(): void {
        this.rl?.prompt();
    }

    private handleLine(line: string): void {
        // --- Multiline mode ---
        if (this.multilineMode) {
            if (line.trim() === '"""') {
                // End multiline: send accumulated buffer
                this.multilineMode = false;
                const text = this.multilineBuffer.join("\n").trim();
                this.multilineBuffer = [];
                if (text) {
                    this.processInput(text);
                } else {
                    this.rl?.prompt();
                }
            } else {
                this.multilineBuffer.push(line);
                process.stdout.write(chalk.dim("... "));
            }
            return;
        }

        // --- Start multiline mode ---
        if (line.trim() === '"""') {
            this.multilineMode = true;
            this.multilineBuffer = [];
            console.log(chalk.dim('📝 Multiline mode — type """ on a new line to send'));
            process.stdout.write(chalk.dim("... "));
            return;
        }

        // --- Normal single-line input ---
        const text = line.trim();
        if (!text) {
            this.rl?.prompt();
            return;
        }

        this.processInput(text);
    }

    private processInput(text: string): void {
        // Check for exit commands
        const lower = text.toLowerCase();
        if (lower === "exit" || lower === "quit") {
            this.emit("exit");
            return;
        }

        // Check if input looks like a file path (drag-and-drop detection)
        const cleanPath = text.replace(/^['"]|['"]$/g, "").trim();
        if (this.looksLikeFilePath(cleanPath)) {
            this.handleFileDrop(cleanPath);
            return;
        }

        // Regular message
        this.emit("message", text);
    }

    private looksLikeFilePath(text: string): boolean {
        if (text.includes("\n")) return false;
        if (!text.startsWith("/") && !text.startsWith("~")) return false;
        if (text.includes(" ") && !text.includes("\\ ")) return false;
        return true;
    }

    private async handleFileDrop(filePath: string): Promise<void> {
        const resolved = filePath
            .replace(/^~/, process.env.HOME ?? "")
            .replace(/\\ /g, " ");

        try {
            const stat = await fs.stat(resolved);
            if (!stat.isFile()) {
                console.log(chalk.yellow("⚠️  Not a file: " + resolved));
                this.rl?.prompt();
                return;
            }

            const fileName = path.basename(resolved);
            const dest = path.join(this.userDir, fileName);

            try {
                await fs.access(dest);
                console.log(chalk.yellow(`⚠️  ${fileName} already exists in user/`));
                this.rl?.prompt();
                return;
            } catch {
                // Doesn't exist, good
            }

            await fs.copyFile(resolved, dest);
            const sizeKb = (stat.size / 1024).toFixed(1);
            console.log(chalk.green(`✓ Copied to user/${fileName} (${sizeKb} KB)`));
            this.emit("file", dest);
        } catch {
            this.emit("message", filePath);
        }
        this.rl?.prompt();
    }
}
