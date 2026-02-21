# Tasks: Bilardeando MVP

**Input**: Design documents from `docs/` and `.specify/memory/`
**Prerequisites**: MVP.md (spec + plan), API-RESEARCH.md (research), constitution.md (principles)

**Tests**: Not explicitly requested — test tasks omitted. Add them if TDD is desired.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US8)
- All paths relative to project root

## User Stories (from MVP.md)

| ID | Priority | Title | Demo Requirement |
|---|---|---|---|
| US1 | P1 | Auth & User Setup | Working web app login |
| US2 | P1 | Squad Builder | Squad builder with formation + budget |
| US3 | P1 | Matchday & Scoring | Mock matchday simulation + scoring |
| US4 | P1 | Leaderboard | Global rankings |
| US5 | P2 | Transfers & Substitutions | Mercado Pago swap purchase flow |
| US6 | P2 | Wallet & Payments | Balance loading + MP webhook |
| US7 | P3 | Private Leagues | Create/join leagues with buy-in |
| US8 | P3 | WhatsApp Bot | Interactive bot + AI tip demo |

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the Next.js project, install dependencies, create directory structure

- [x] T001 Initialize Next.js 14 project with TypeScript, Tailwind CSS, and App Router in project root
- [x] T002 Install and configure shadcn/ui with retro ESPN 2003 theme: dark green (#1a472a), gold (#c5a000), white, dark gray (#333). Thick 2-3px borders, 0-2px border-radius, beveled button styles, alternating table row colors in tailwind.config.ts and src/app/globals.css
- [x] T003 [P] Install core dependencies: next-auth @auth/prisma-adapter prisma @prisma/client mercadopago lucide-react in package.json
- [x] T004 [P] Create .env.example with placeholders for DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, MERCADOPAGO_ACCESS_TOKEN, MERCADOPAGO_PUBLIC_KEY, API_FOOTBALL_KEY, ANTHROPIC_API_KEY in .env.example
- [x] T005 [P] Create project directory structure: src/services/, src/providers/, src/components/{ui,player,squad,matchday,leaderboard,transfers,leagues,wallet}, src/lib/, src/types/, src/mock-data/, prisma/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, auth framework, mock data layer, shared components — MUST complete before any user story

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Define complete Prisma schema with all models (User, Account, Session, Team, Player, Squad, SquadPlayer, Matchday, Match, PlayerMatchStats, MatchdayPoints, SquadPlayerPoints, Transaction, League, LeagueMember) and enums (Position, MatchdayStatus, MatchStatus, TransactionType, TransactionStatus, LeagueStatus) in prisma/schema.prisma
- [x] T007 Generate Prisma client and run initial migration in prisma/migrations/
- [x] T008 [P] Create Prisma client singleton in src/lib/db.ts
- [x] T009 [P] Create shared TypeScript types and interfaces (Formation, PlayerFilters, SquadValidation, MatchdayView, LeaderboardEntry) in src/types/index.ts
- [x] T010 [P] Create formation definitions with position slot counts for all supported formations (4-3-3, 4-4-2, 3-5-2, 3-4-3, 4-5-1, 5-3-2, 5-4-1) in src/lib/formations.ts
- [x] T011 [P] Create stats provider interface (getTeams, getPlayers, getMatchStats, getPlayerRating) in src/providers/stats-provider.interface.ts
- [x] T012 [P] Implement mock stats provider with hardcoded Argentine league data in src/providers/mock-stats-provider.ts
- [x] T013 Create mock data JSON files (28 teams, 889 players from API-Football pipeline, 2 matchdays with 28 match results and 616 player stats) in src/mock-data/matches.json, src/mock-data/stats.json — teams/players read from data/processed/
- [x] T014 Create database seed script that loads mock data into Prisma (teams, players, matchdays, matches, player stats, demo users with pre-built squads) in prisma/seed.ts
- [x] T015 [P] Configure NextAuth.js with CredentialsProvider and JWT sessions (demo login against seeded users) in src/lib/auth.ts
- [x] T016 [P] Create NextAuth API route handler in src/app/api/auth/[...nextauth]/route.ts
- [x] T017 [P] Create base API helper utilities (withAuth wrapper, error response builder, request validation) in src/lib/api-helpers.ts
- [x] T018 [P] Create Mercado Pago payment service interface and mock implementation (createPaymentLink, handleWebhook, getPaymentStatus) in src/services/payment.service.ts

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel

---

## Phase 3: User Story 1 — Auth & User Setup (Priority: P1)

**Goal**: Users can login with demo credentials, view/edit their profile

**Independent Test**: Navigate to /login, pick a demo user, see profile page with user info and $150M starting budget

### Implementation for User Story 1

- [x] T019 [P] [US1] Create SessionProvider wrapper component in src/components/providers/session-provider.tsx
- [x] T020 [US1] Add SessionProvider and retro fonts (Barlow Condensed for headers, DM Sans for body) to root layout in src/app/layout.tsx
- [x] T021 [P] [US1] Create landing page with hero section, app description, and CTA to login in src/app/page.tsx
- [x] T022 [P] [US1] Create login page with demo user selector (3 seeded users) in src/app/(auth)/login/page.tsx
- [x] T023 [US1] Create auth middleware to protect /squad, /matchday, /leaderboard, /transfers, /leagues, /wallet, /profile routes in src/middleware.ts
- [x] T024 [US1] Create app shell layout with top navigation bar (Squad, Matchday, Leaderboard, Transfers, Leagues, Wallet, Profile links) and user menu in src/app/(dashboard)/layout.tsx
- [x] T025 [P] [US1] Create user profile page showing name, email, virtual budget, real balance, and account creation date in src/app/(dashboard)/profile/page.tsx
- [x] T026 [US1] Create user profile API route (GET current user, PATCH update name/email) in src/app/api/user/route.ts

**Checkpoint**: User can login with demo credentials, see navigation, view profile with $150M budget

---

## Phase 4: User Story 2 — Squad Builder (Priority: P1)

**Goal**: Users can browse the player catalog, pick a formation, build an 18-player squad (11 starters + 7 bench) within budget, and designate captain + captain substitute

**Independent Test**: Login, navigate to /squad, browse players by position/team, select 4-3-3 formation, add 18 players within $150M budget, set captain, see squad on pitch visualization

### Implementation for User Story 2

- [x] T027 [P] [US2] Create player card component showing photo, name, position badge, team, rating, market value in src/components/player/player-card.tsx
- [x] T028 [P] [US2] Create player catalog component with search, position filter, team filter, sort by value/rating in src/components/player/player-catalog.tsx
- [x] T029 [P] [US2] Create formation selector component with visual preview of each formation in src/components/squad/formation-selector.tsx
- [x] T030 [P] [US2] Create pitch visualization component showing 11 starters positioned on a football pitch according to formation in src/components/squad/pitch-view.tsx
- [x] T031 [P] [US2] Create bench list component showing 7 bench players with 0.5x indicator in src/components/squad/bench-list.tsx
- [x] T032 [P] [US2] Create budget bar component showing remaining budget out of $150M in src/components/squad/budget-bar.tsx
- [x] T033 [US2] Create squad service with buildSquad, validateFormation, calculateBudget, setCaptain, getSquadByUser methods in src/services/squad.service.ts
- [x] T034 [US2] Create players API route (GET with search, position, team query params, pagination) in src/app/api/players/route.ts
- [x] T035 [US2] Create squad API routes (GET current squad, POST create squad, PUT update squad, PUT set formation) in src/app/api/squad/route.ts
- [x] T036 [US2] Create squad player API routes (POST add player, DELETE remove player, PATCH set captain/captainSub/starter) in src/app/api/squad/players/route.ts
- [x] T037 [US2] Create squad builder page composing catalog, formation selector, pitch view, bench list, and budget bar in src/app/(dashboard)/squad/page.tsx
- [x] T038 [US2] Add strict squad validation logic to squad.service.ts: enforce formation slot counts per position, budget cap ($150M), max 18 players, exactly 1 captain, exactly 1 captain sub, no duplicate players. This extends T033's stubs with full validation rules

**Checkpoint**: User can build a complete, valid squad with formation, captain, and budget management

---

## Phase 5: User Story 3 — Matchday & Scoring (Priority: P1)

**Goal**: Users can view the current matchday with match results, see their squad's points breakdown (1x starters, 0.5x bench, 2x captain), and trigger a demo matchday simulation

**Independent Test**: Login with seeded user, navigate to /matchday, see matches with scores, see squad points with correct multipliers, trigger simulation endpoint to advance matchday

### Implementation for User Story 3

- [x] T039 [P] [US3] Create matchday service with getCurrentMatchday, getMatchdayResults, advanceMatchdayStatus, calculateSquadPoints methods in src/services/matchday.service.ts
- [x] T040 [P] [US3] Create scoring service with calculatePlayerPoints (raw rating from stats), applyMultiplier (1x/0.5x/2x), calculateTotalSquadPoints methods in src/services/scoring.service.ts
- [x] T041 [P] [US3] Create match card component showing home vs away teams, scores, status, and kickoff time in src/components/matchday/match-card.tsx
- [x] T042 [P] [US3] Create squad points breakdown component showing each player with raw points, multiplier, and final points in src/components/matchday/squad-points.tsx
- [x] T043 [P] [US3] Create matchday status badge component showing OPEN/LOCK/LIVE/RESULTS with color coding in src/components/matchday/status-badge.tsx
- [x] T044 [US3] Create matchday API routes (GET current matchday, GET matchday by id with matches and stats) in src/app/api/matchday/route.ts
- [x] T045 [US3] Create matchday points API route (GET user's squad points for a matchday) in src/app/api/matchday/[id]/points/route.ts
- [x] T046 [US3] Create matchday simulation API endpoint (POST triggers LOCK→RESULTS transition, ingests mock scores, calculates all users' points) in src/app/api/matchday/simulate/route.ts
- [x] T047 [US3] Create matchday page composing match cards, squad points breakdown, matchday status, and simulation button (demo only) in src/app/(dashboard)/matchday/page.tsx

**Checkpoint**: User can view matchday, see scores, see squad points with correct multipliers, simulate a matchday

---

## Phase 6: User Story 4 — Leaderboard (Priority: P1)

**Goal**: Users can view the general tournament leaderboard with cumulative points across all matchdays

**Independent Test**: Login, navigate to /leaderboard, see ranked list of users with total points, current user highlighted

### Implementation for User Story 4

- [x] T048 [P] [US4] Create leaderboard service with getGeneralLeaderboard (sum MatchdayPoints per user, ordered by total desc) in src/services/leaderboard.service.ts
- [x] T049 [P] [US4] Create leaderboard table component showing rank, user name, total points, matchday-by-matchday breakdown in src/components/leaderboard/leaderboard-table.tsx
- [x] T050 [US4] Create leaderboard API route (GET general leaderboard with pagination) in src/app/api/leaderboard/route.ts
- [x] T051 [US4] Create leaderboard page with general tournament table and current user highlight in src/app/(dashboard)/leaderboard/page.tsx

**Checkpoint**: User can see global rankings with accumulated points

---

## Phase 7: User Story 5 — Transfers & Substitutions (Priority: P2)

**Goal**: During OPEN phase, users can buy/sell players (10% sell tax). During LOCK phase, users can make paid same-position swaps ($2,000 ARS via Mercado Pago) if both players' matches haven't started

**Independent Test**: During OPEN, sell a player (verify 90% return), buy a replacement within budget. During LOCK, swap a starter with a bench player of same position, pay via MP sandbox link

### Implementation for User Story 5

- [x] T052 [P] [US5] Create transfer service with buyPlayer (check budget), sellPlayer (apply 10% tax), validateTransfer (check matchday status) methods in src/services/transfer.service.ts
- [ ] T053 [P] [US5] Create substitution service with validateSwap (same position, matches not started), createSwapPayment (MP link), executeSwap methods in src/services/substitution.service.ts
- [x] T054 [P] [US5] Create transfer list component showing available players to buy and current squad with sell option in src/components/transfers/transfer-list.tsx
- [ ] T055 [P] [US5] Create substitution dialog component showing eligible swap pairs (same position, unstarted matches) with pay button in src/components/squad/substitution-dialog.tsx
- [x] T056 [US5] Create transfer API routes (POST buy player, POST sell player) in src/app/api/transfers/route.ts
- [ ] T057 [US5] Create substitution API routes (GET eligible swaps, POST create swap with MP payment link) in src/app/api/squad/substitute/route.ts
- [x] T058 [US5] Create transfers page composing transfer list with buy/sell functionality and matchday-aware UI (disable during LOCK) in src/app/(dashboard)/transfers/page.tsx
- [ ] T059 [US5] Integrate Mercado Pago Checkout Pro for substitution fee ($2,000 ARS): generate payment link, redirect user, handle success callback in src/services/substitution.service.ts

**Checkpoint**: User can buy/sell players during OPEN, make paid substitutions during LOCK via MP

---

## Phase 8: User Story 6 — Wallet & Payments (Priority: P2)

**Goal**: Users can load ARS balance via Mercado Pago, view transaction history, service fee waived at $20,000+ balance

**Independent Test**: Navigate to /wallet, click load balance, pay via MP sandbox, see balance updated, view transaction in history

### Implementation for User Story 6

- [x] T060 [P] [US6] Create wallet service with getBalance, loadBalance (create MP payment link), getTransactions, checkFeeWaiver methods in src/services/wallet.service.ts
- [x] T061 [P] [US6] Create balance display component with load balance button in src/components/wallet/balance-card.tsx
- [x] T062 [P] [US6] Create transaction history table component in src/components/wallet/transaction-history.tsx
- [x] T063 [US6] Create wallet API routes (GET balance + transactions, POST load balance request) in src/app/api/wallet/route.ts
- [x] T064 [US6] Create Mercado Pago webhook handler (POST receive payment notifications, update transaction status, credit user balance) in src/app/api/webhooks/mercadopago/route.ts
- [x] T065 [US6] Create wallet page composing balance card, load balance flow, budget purchase, and transaction history in src/app/(dashboard)/wallet/page.tsx
- [x] T090 [P] [US6] Create virtual budget purchase service with tiered pricing ($5M = $1,000 ARS, $10M = $1,800 ARS, $20M = $3,000 ARS), MP payment link generation, and budget credit after webhook confirmation in src/services/budget-purchase.service.ts
- [x] T091 [US6] Create budget purchase API route (GET available tiers, POST create purchase with MP payment link) in src/app/api/wallet/budget/route.ts
- [x] T092 [P] [US6] Create budget purchase UI component showing tier options with prices and buy buttons in src/components/wallet/budget-purchase.tsx
- [x] T093 [US6] Implement 3% service fee logic on wallet load and budget purchase transactions: apply fee to payment amount, skip fee when user balance ≥ $20,000 ARS, display fee breakdown in UI before confirming payment in src/services/wallet.service.ts and src/services/budget-purchase.service.ts
- [x] T094 [P] [US8] Create AI unlock purchase flow: $500 ARS one-time payment via MP Checkout Pro, set user.aiUnlocked flag on webhook confirmation, gate AI handler behind flag in src/services/bot/ai-unlock.service.ts and update T089 paywall check to use persisted flag

**Checkpoint**: User can load balance via MP, purchase additional virtual budget, see transactions, service fee 3% (waived at $20k+), unlock AI features for $500 ARS

---

## Phase 9: User Story 7 — Private Leagues (Priority: P3)

**Goal**: Users can create private leagues with buy-in ($10k–$100k ARS), share invite links, join and pay, see league leaderboard. Auto-cancel if <3 players by start matchday

**Independent Test**: Create a league with $10k buy-in, copy invite link, join with another user, pay via MP, see league leaderboard. Verify auto-cancel with <3 players

### Implementation for User Story 7

- [x] T066 [P] [US7] Create league service with createLeague, joinLeague, getLeagueLeaderboard, calculatePrizeDistribution, checkAutoCancel methods in src/services/league.service.ts
- [x] T067 [P] [US7] Create league card component showing name, buy-in, player count, status in src/components/leagues/league-card.tsx
- [x] T068 [P] [US7] Create create-league form component with name, buy-in slider ($10k–$100k in $5k steps), start/end matchday selectors, max players in src/components/leagues/create-league-form.tsx
- [x] T069 [P] [US7] Create league leaderboard component (reuses leaderboard-table with league-scoped data) in src/components/leagues/league-leaderboard.tsx
- [x] T070 [US7] Create leagues API routes (GET my leagues, POST create league) in src/app/api/leagues/route.ts
- [x] T071 [US7] Create league detail API route (GET league by code with members and leaderboard) in src/app/api/leagues/[code]/route.ts
- [x] T072 [US7] Create league join API route (POST join league, generate MP payment link for buy-in) in src/app/api/leagues/[code]/join/route.ts
- [x] T073 [US7] Create leagues list page showing my leagues and create league option in src/app/(dashboard)/leagues/page.tsx
- [x] T074 [US7] Create league detail page with leaderboard, invite link copy, and member list in src/app/(dashboard)/leagues/[code]/page.tsx
- [x] T075 [US7] Implement poker-style prize distribution logic with 5% platform rake deducted before distribution (3–6: top 1–2, 7–15: top 3, 16–20: top 4) in src/services/league.service.ts
- [x] T076 [US7] Implement auto-cancel logic: if <3 paid members by start matchday LOCK, refund all buy-ins and set status CANCELLED in src/services/league.service.ts

**Checkpoint**: Users can create/join paid leagues, see league leaderboard, auto-cancel works

---

## Phase 10: User Story 8 — WhatsApp Bot (Priority: P3)

**Goal**: Users can interact with a WhatsApp bot to view squad, scores, leaderboard, make substitutions. Paid users get AI recommendations via Claude API

**Independent Test**: Send "mi equipo" to bot, receive squad summary. Send "puntaje" to get matchday score. Trigger AI tip (paid user)

### Implementation for User Story 8

- [x] T077 [P] [US8] Create WhatsApp service interface (sendMessage, receiveMessage, parseIntent) with mock implementation in src/services/whatsapp.service.ts
- [x] T078 [P] [US8] Create bot intent handlers for free tier: viewSquad, viewScores, viewLeaderboard, makeSubstitution in src/services/bot/intent-handlers.ts
- [x] T079 [P] [US8] Create bot message formatter (squad as text table, scores summary, leaderboard top 10) in src/services/bot/message-formatter.ts
- [ ] T080 [US8] Create WhatsApp webhook API route (POST receive messages, parse intent, dispatch to handler, send response) in src/app/api/webhooks/whatsapp/route.ts
- [x] T081 [US8] Implement AI recommendation handler using Claude API with guardrails (only fantasy-football queries, predefined intents, reject off-topic) in src/services/bot/ai-handler.ts
- [x] T082 [US8] Create bot configuration with intent patterns and response templates in src/services/bot/bot-config.ts
- [x] T089 [US8] Add AI paywall check: verify user has paid for AI features before dispatching to ai-handler, return upgrade prompt for free users in src/services/bot/intent-handlers.ts

**Checkpoint**: WhatsApp bot responds to squad/score/leaderboard queries, AI tips work for paid users only

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: UI polish, demo preparation, and final integration

- [ ] T083 [P] Add loading skeleton components for squad, matchday, leaderboard, wallet pages in src/components/ui/skeletons.tsx
- [ ] T084 [P] Add empty state components (no squad yet, no matchdays yet, no leagues yet) in src/components/ui/empty-states.tsx
- [ ] T085 [P] Add error boundary and toast notification system in src/components/ui/error-boundary.tsx
- [ ] T086 Responsive design pass for all pages — desktop-first layout (min 1024px), retro ESPN aesthetic consistency check: thick borders, beveled buttons, alternating row colors, tab nav. Ensure data tables are readable at 1024px+ and degrade gracefully at 768px
- [ ] T087 Create demo seed + simulation script: seeds DB, creates demo users with squads, simulates 2 matchdays in scripts/demo-setup.ts
- [ ] T088 End-to-end smoke test of hackathon demo flow: login → build squad → view matchday → simulate → leaderboard → MP swap → WhatsApp bot

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) — BLOCKS all user stories
- **US1 Auth (Phase 3)**: Depends on Foundational (Phase 2) — provides login for all other stories
- **US2 Squad Builder (Phase 4)**: Depends on Foundational + US1 (needs auth + player data)
- **US3 Matchday (Phase 5)**: Depends on Foundational + US1 (needs auth + matchday data). Can start in parallel with US2 if using seeded squads
- **US4 Leaderboard (Phase 6)**: Depends on US3 (needs matchday points data)
- **US5 Transfers (Phase 7)**: Depends on US2 (needs squad) + US3 (needs matchday lifecycle)
- **US6 Wallet (Phase 8)**: Depends on Foundational + US1 (needs auth). Can start in parallel with US2-US4
- **US7 Private Leagues (Phase 9)**: Depends on US4 (leaderboard) + US6 (payments)
- **US8 WhatsApp Bot (Phase 10)**: Depends on US1-US5 (references all core features)
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies (Strict)

```
Phase 1 (Setup)
  └→ Phase 2 (Foundational)
       ├→ US1 (Auth) ←── all other stories depend on this
       │    ├→ US2 (Squad Builder)
       │    │    ├→ US5 (Transfers) ←── needs squad + matchday
       │    │    └→ US3 (Matchday & Scoring)
       │    │         ├→ US4 (Leaderboard) ←── needs points
       │    │         └→ US5 (Transfers) ←── needs matchday lifecycle
       │    ├→ US6 (Wallet) ←── independent of US2-US4
       │    │    └→ US7 (Private Leagues) ←── needs payments
       │    └→ US4 (Leaderboard)
       │         └→ US7 (Private Leagues) ←── needs leaderboard logic
       └→ US8 (WhatsApp Bot) ←── needs most core features
```

### Within Each User Story

1. Services before API routes
2. API routes before page components
3. Reusable components can be built in parallel with services [P]
4. Page composition after all parts are ready

### Parallel Opportunities

**After Phase 2 (Foundational) completes, these can run in parallel by different agents:**

| Agent | Stories | Rationale |
|---|---|---|
| Agent A | US1 (Auth) | Must be first — all others need auth |
| Agent B | US6 (Wallet) | Independent of squad/matchday, just needs auth |

**After US1 (Auth) completes:**

| Agent | Stories | Rationale |
|---|---|---|
| Agent A | US2 (Squad Builder) | Core feature, unblocks US5 |
| Agent B | US3 (Matchday) | Core feature, uses seeded data |
| Agent C | US4 (Leaderboard) | Can start with mock points data |

**After US2 + US3 complete:**

| Agent | Stories | Rationale |
|---|---|---|
| Agent A | US5 (Transfers) | Needs squad + matchday |
| Agent B | US7 (Private Leagues) | If US4 + US6 done |
| Agent C | US8 (WhatsApp Bot) | Can start with core features |

---

## Parallel Example: Phase 2 (Foundational)

```bash
# These can all run in parallel (different files):
Agent A: T008 (db.ts) + T009 (types) + T010 (formations.ts)
Agent B: T011 (stats interface) + T012 (mock provider) + T013 (mock data JSON)
Agent C: T015 (auth config) + T016 (auth route) + T017 (API helpers)
Agent D: T018 (payment service)

# Then sequentially (depends on above):
Any Agent: T014 (seed script — needs schema + mock data)
```

## Parallel Example: User Story 2 (Squad Builder)

```bash
# Components can be built in parallel (different files):
Agent A: T027 (player-card) + T028 (player-catalog)
Agent B: T029 (formation-selector) + T030 (pitch-view) + T031 (bench-list) + T032 (budget-bar)

# Service + API in sequence:
Any Agent: T033 (squad service) → T035 (squad API) → T036 (squad player API)
Any Agent: T034 (players API) — parallel with above

# Page last (composes everything):
Any Agent: T037 (squad page) → T038 (validation logic)
```

---

## Implementation Strategy

### MVP First (US1 + US2 + US3 + US4)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks everything)
3. Complete US1: Auth (CRITICAL — blocks all user-facing stories)
4. Complete US2: Squad Builder — core product feature
5. Complete US3: Matchday & Scoring — the "game" itself
6. Complete US4: Leaderboard — proves the game loop works
7. **STOP AND VALIDATE**: Demo the full loop: register → build squad → simulate matchday → see leaderboard
8. Deploy to Vercel

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. + US1 (Auth) → Users can login
3. + US2 (Squad Builder) → Users can build squads (**first demo-worthy milestone**)
4. + US3 (Matchday) + US4 (Leaderboard) → Full game loop works (**MVP demo**)
5. + US5 (Transfers) + US6 (Wallet) → Monetization flows work (**MP demo**)
6. + US7 (Private Leagues) → Social features work
7. + US8 (WhatsApp Bot) → Multi-channel experience (**complete demo**)

### Hackathon Agent Strategy

With multiple Claude Code instances (via `hack` command):

1. **One agent** completes Phase 1 + Phase 2 on main (or first feature branch merged quickly)
2. Once foundation is merged:
   - `hack auth "US1 auth and login"` → Agent A
   - `hack wallet "US6 wallet and payments"` → Agent B (independent)
3. Once auth is merged:
   - `hack squad-builder "US2 squad builder"` → Agent A
   - `hack matchday "US3 matchday and scoring"` → Agent C
   - `hack leaderboard "US4 leaderboard"` → Agent D
4. Once squad + matchday merged:
   - `hack transfers "US5 transfers and subs"` → Agent A
   - `hack leagues "US7 private leagues"` → Agent B
   - `hack whatsapp "US8 whatsapp bot"` → Agent C
5. **All agents** → Phase 11 Polish

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All external services (stats API, Mercado Pago, WhatsApp) MUST use interfaces with mock implementations (Constitution Principle IV)
- Never commit secrets — use .env.example only (Constitution Principle II)
- Always work in worktrees, never on main (Constitution Principle V)
- Desktop-first layout — WhatsApp covers mobile experience (MVP.md §8)
- Mock data: 4 teams, ~80 players, 2 simulated matchdays (MVP.md §10)
- Player values: $1M–$15M, starting budget $150M — avg $8.3M/player, forces squad-building trade-offs (MVP.md §1)
- Auth: Credential-based demo login with 3 seeded users (MVP.md §9) — Google OAuth deferred to post-MVP
- Platform rake: 5% deducted from league pool before prize distribution (MVP.md §2)
- Virtual budget purchase: $5M=$1k ARS, $10M=$1.8k ARS, $20M=$3k ARS (MVP.md §3)
- Visual style: Retro ESPN/Yahoo Sports 2003 — thick borders, beveled buttons, gold/green palette (Constitution I)
