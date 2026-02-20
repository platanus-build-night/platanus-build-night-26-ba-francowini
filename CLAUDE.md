# Hackathon — Multi-Claude Setup

Multiple Claude Code instances are working on this project simultaneously from different terminals. Each instance works in its own worktree to avoid conflicts.

## Before you start working

1. Check the board to see what others are doing:
   ```bash
   board
   ```

2. Create a worktree for your feature:
   ```bash
   hack <feature-name> "short description"
   ```
   This gives you an isolated copy of the code on a new branch.

3. Work inside that worktree:
   ```bash
   cd ~/worktrees/<feature-name>
   ```

## Commands

| Command | What it does |
|---|---|
| `board` | Show all active features and who's working on what |
| `hack <name> "desc"` | Create a new worktree + branch for a feature |
| `hackdone <name>` | Mark a feature as done on the board |
| `sync` | Pull latest main into your current branch |
| `main-log` | Show recent commits on main |

## Rules

1. **ALWAYS run `board` first** to see what's taken
2. **NEVER work directly on main** — use `hack` to create a worktree
3. **Don't edit files another instance is actively changing** — check `board`
4. **Commit frequently** with clear messages
5. **Push your branch** when done so others can see it:
   ```bash
   git push origin feat/<your-feature>
   ```
6. **Merge to main** when your feature is ready:
   ```bash
   git checkout main && git pull origin main
   git merge --no-ff feat/<your-feature>
   git push origin main
   hackdone <your-feature>
   ```
