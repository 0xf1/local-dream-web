# Project Rules & Architecture Guidelines

## Dev environment tips
- NEVER include directories `venv/` and `__pycache__/` in file listings.
- Frontend script located in `web-sources/` directory.
- Backend Server script (`start-server.py`) and configurations (`config_default.py`, `config_user.py`) located in the root directory.
- JS Architecture strict limit of 250 lines per file. Use ES Modules (`import`/`export`) and always explicitly include the `.js` extension in paths (e.g., `import { x } from './utils.js'`). Separate data/API logic from UI rendering.

## PowerShell File Listing Guidelines
- Use `Get-ChildItem -Recurse | Where-Object { $_.FullName -notmatch '(venv|__pycache__)' }` instead of `tree` (which may not be installed).
- For formatted tree-like output, use: `Get-ChildItem -Path . -Recurse | Where-Object { $_.FullName -notmatch '(venv|__pycache__)' } | Select-Object FullName`.
- To list files by extension: `Get-ChildItem -Path . -Recurse | Where-Object { $_.FullName -notmatch '(venv|__pycache__)' } | Where-Object {$_.Extension} | Group-Object Extension | Select-Object Name, Count`.
- NEVER use Unix-style commands (`find`, `ls`) — they won't work in PowerShell.

## Environment & Shell
- Runtime OS: Windows 11 with PowerShell 7 (pwsh).
- Tech Stack: Vanilla JS (Pure, ONLY Native Browser JS) for Frontend. Python 3 (Virtual Environment) for Backend.
- No Build Tools: Node.js, npm, npx, yarn, and TypeScript are NOT installed and NOT supported. Never convert code or create `.ts` files.

## DOM & Lifecycle
- Modules must implement a cleanup function (remove event listeners, clear timers) to prevent memory leaks.
- Prioritize event delegation by attaching a single listener to the parent container.

## Commit Conventions
- Commit Messages: Follow standard conventional commits format (e.g., `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`) for all changes. Keep messages brief and clear. English only. Imperative mood: `add login` not `added login`. Max 72 characters.
