# Fantasy Football Hackathon

A fantasy football (soccer) app built during a hackathon. Multiple Claude Code instances work on this project simultaneously.

## Project Context

This is a **fantasy football (soccer)** application. Think of it like fantasy Premier League or Gran DT.
- Users build squads from real players
- Points based on real match performance
- Leagues, drafts, transfers, lineups
- The UX should feel like a sports app: clean, data-rich, fast

## Tech Stack (Vercel-ready)

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Deploy**: Vercel
- **Language**: TypeScript

## Design Guidelines — Retro ESPN 2003

### Visual Identity
- **Theme**: Retro sports portal — ESPN / Yahoo Sports circa 2003. Dense, data-forward, unapologetically bold
- **Colors**: Dark green `#1a472a` (headers/nav), gold/amber `#c5a000` (accents/highlights), white `#ffffff` (backgrounds), dark gray `#333333` (body text). NO pastel gradients, NO purple/blue AI gradients
- **Typography**: Headers use **Barlow Condensed** or **Teko** (bold, condensed, sporty). Body uses **DM Sans**. Avoid generic Inter/Roboto
- **Layout**: Desktop-first responsive. Dense multi-column layouts. Card-based with bordered header bars. Tab-style top navigation
- **Borders**: Thick 2–3px solid borders on everything. Beveled/outset buttons. Visible table grid lines. Alternating row colors on data tables. Border-radius: 0–2px max (no pill shapes)
- **Icons**: Use Lucide icons. Football-specific elements where needed (pitch diagrams, jersey icons, etc.)

### UX Principles
- Fast, responsive — no loading spinners (use skeletons)
- Data-dense but readable — heavy-bordered tables, stats, player cards
- Scannable data — big bold headers, clear column labels, alternating row colors
- Real-time feel — optimistic updates, live scores
- Football conventions — formation layouts (4-3-3, 4-4-2), pitch visualizations, player cards with photos and stats

### Retro Elements to Embrace
- Beveled/outset buttons with thick borders
- Tab-bar navigation with active tab highlight
- Header bars with colored backgrounds (dark green or gold)
- Dense, newspaper-column style layouts for stats
- Visible grid lines on all data tables
- Subtle CSS gradients on header bars (Web 2.0 style, not flat)

### Avoid
- Modern minimalism (thin hairline borders, excessive whitespace, pill buttons)
- Generic "AI slop" aesthetics (pastel gradients, rounded everything, no personality)
- Heavy animations that slow the experience
- Tiny text on stats — data should be scannable
- Rounded corners beyond 2px — keep it blocky and retro

## Multi-Claude Coordination

Multiple Claude Code instances work simultaneously. Each uses its own git worktree.

### Getting Started

1. Check the board:
   ```bash
   board
   ```

2. Create a worktree for your feature:
   ```bash
   hack <feature-name> "short description"
   ```

3. Work inside it:
   ```bash
   cd ~/worktrees/<feature-name>
   ```

### Commands

| Command | Description |
|---|---|
| `board` | Show all active features and who's working on what |
| `hack <name> "desc"` | Create a new worktree + branch for a feature |
| `hackdone <name>` | Mark a feature as done on the board |
| `sync` | Rebase current branch on latest main |
| `main-log` | Show recent commits on main |

### Git Workflow

1. **Never work directly on main** — always use `hack` to create a worktree
2. Commit frequently with clear messages
3. Push your branch: `git push origin feat/<your-feature>`
4. When ready to merge:
   ```bash
   git checkout main && git pull origin main
   git merge --no-ff feat/<your-feature>
   git push origin main
   hackdone <your-feature>
   ```

## Security — CRITICAL

**NEVER commit or push secrets, keys, or credentials.**

Before every commit, check for:
- API keys, tokens, passwords
- `.env` files with real values
- SSH private keys
- Any string that looks like `sk-`, `ghp_`, `gho_`, `AKIA`, `-----BEGIN`

**Files that must NEVER be committed:**
- `*.pem`, `*.key`, `*.p12`
- `.env` (use `.env.example` with placeholders instead)

## Vercel Deploy Checklist

**IMPORTANT**: Whenever you add or change any of the following, you MUST remind the user to update Vercel:
- New environment variable (added to `.env.example`) → tell user to add it in **Vercel > Settings > Environment Variables**
- New infrastructure dependency (database, external service, webhook URL) → tell user to configure it
- Changes to build command or `postinstall` script → tell user to verify Vercel build settings
- New API route that requires a specific env var → tell user which var is needed

**Current Vercel env vars required:**
| Variable | Status | Phase |
|---|---|---|
| `DATABASE_URL` | Required now | Phase 2 |
| `NEXTAUTH_SECRET` | Needed for auth | Phase 3 |
| `NEXTAUTH_URL` | Needed for auth | Phase 3 |
| `GOOGLE_CLIENT_ID` | Needed for login | Phase 3 |
| `GOOGLE_CLIENT_SECRET` | Needed for login | Phase 3 |
| `MERCADOPAGO_ACCESS_TOKEN` | Needed for payments | Phase 7-8 |
| `MERCADOPAGO_PUBLIC_KEY` | Needed for payments | Phase 7-8 |
| `API_FOOTBALL_KEY` | Optional (mock data) | — |
| `ANTHROPIC_API_KEY` | Needed for AI bot | Phase 10 |

## Spec-Driven Development (Spec Kit)

This project uses [GitHub Spec Kit](https://github.com/github/spec-kit).

### Phases (run in order)

1. `/speckit.constitution` — Project principles (once at the start)
2. `/speckit.specify` — Write the spec (what we're building)
3. `/speckit.plan` — Technical plan (how we build it)
4. `/speckit.tasks` — Break into small, testable tasks
5. `/speckit.implement` — Execute a task

### Important

- Specs live in `docs/` — source of truth
- Always follow the phase order
- Each Claude instance picks tasks from the task list, not invents work

## Language Rules

- **UI text (web app)**: Latin American Spanish — all user-facing strings, labels, buttons, messages, tooltips
- **Code**: English — variable names, function names, comments, commit messages, docs, file names
- **Data**: Player names, team names stay in their original language (Spanish)

## Active Technologies
- TypeScript 5.x (strict mode enabled) + React 18, Tailwind CSS, shadcn/ui, Lucide icons, Prisma ORM, NextAuth.js (Auth.js v5), mercadopago SDK (001-bilardeando-mvp)
- PostgreSQL (via Prisma) — hosted on Supabase or Railway for hackathon (001-bilardeando-mvp)

## Code Quality — Required Skills

**IMPORTANT**: Before pushing any feature branch, you MUST run these skills to review your code:

1. **`/vercel-react-best-practices`** — Check for React/Next.js performance issues (barrel imports, waterfall fetches, bundle size, re-renders)
2. **`/vercel-composition-patterns`** — Check component architecture (composition, prop drilling, compound components)

Fix any CRITICAL or HIGH findings before merging. These skills catch common issues like:
- Barrel imports without `optimizePackageImports` (lucide-react, etc.)
- `useEffect` + `fetch` instead of SWR/React Query
- Global event listeners registered unnecessarily
- Missing input validation on API routes
- Over-serialization in Server Component props

## Recent Changes
- 001-bilardeando-mvp: Added TypeScript 5.x (strict mode enabled) + React 18, Tailwind CSS, shadcn/ui, Lucide icons, Prisma ORM, NextAuth.js (Auth.js v5), mercadopago SDK
