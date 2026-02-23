# Contributing to ClawCore 🦐

Thank you for your interest in contributing to ClawCore! This document provides guidelines to make the contribution process smooth.

## 🙋 Not a Developer? You Can Still Contribute!

You don't need to write code to make ClawCore better. **If you have an idea for a feature, describe it in natural language — the maintainer will implement it for you.**

How to contribute a feature idea:

1. Go to [GitHub Issues](https://github.com/dataelement/ClawCore/issues) and create a new issue
2. Add the label **`💡feature-idea`** to your issue
3. Think of yourself as a **product manager** — describe your idea as clearly and completely as possible:
   - What problem does it solve?
   - How should it work from the user's perspective?
   - Any edge cases or special scenarios?

The more detailed your description, the better the result. Plain language is all you need — no technical jargon required.

## Getting Started

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ClawCore.git
   cd ClawCore
   npm install
   ```
3. **Create a branch** for your feature or fix:
   ```bash
   git checkout -b feat/my-feature
   ```

## Development

```bash
npm run dev     # Run in development mode (tsx)
npm run build   # Compile TypeScript
```

### Project Structure

```
src/
├── agent/          # Core agent loop, soul, heartbeat
├── config/         # Configuration management
├── llm/            # LLM provider (OpenAI-compatible)
├── memory/         # Index-based memory system
├── skills/         # Skill loader and writer
├── tools/          # Tool definitions and executor
├── workspace/      # User folder, workbench, doc parser
└── index.ts        # CLI entry point
```

## Guidelines

### Code Style

- **TypeScript** with strict mode
- **ESM modules** (import/export, not require)
- Use `async/await` for all async operations
- Add JSDoc comments for exported functions

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new skill auto-discovery
fix: prevent symlink path traversal
docs: update Chinese README
refactor: simplify heartbeat timer logic
```

### Pull Requests

1. Keep PRs focused — one feature or fix per PR
2. Update both `README.md` and `README_CN.md` if your change affects documentation
3. Ensure `npm run build` passes with no errors
4. Describe what your change does and why

### Adding Tools

When adding a new tool:

1. Define the tool schema in `src/tools/definitions.ts`
2. Add the handler in `src/tools/executor.ts`
3. Update both READMEs with the new tool
4. Ensure proper permission checks (especially `assertInsideWorkspace`)

### Adding Skills

Built-in skills go in `templates/` (copied on first run). User/AI-created skills live in the workspace `skills/` directory.

## Reporting Issues

- Use [GitHub Issues](https://github.com/dataelement/ClawCore/issues)
- Include your Node.js version, OS, and LLM provider
- For bugs, include steps to reproduce

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
