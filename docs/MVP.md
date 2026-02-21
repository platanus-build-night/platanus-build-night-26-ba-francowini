# Bilardeando — MVP Definition

## Overview

Fantasy football platform for Argentine football. Users build a squad, earn points based on real player performance, interact via **WhatsApp AI bot**, and pay through **Mercado Pago**.

---

## 1. Core Game Mechanics

### Squad

| Slot | Count | Points multiplier |
|---|---|---|
| Starters | 11 | 1x |
| Bench | 7 | 0.5x |
| **Total** | **18** | |

### Ownership & Budget

- **Shared ownership** — any user can pick any player; no exclusivity per league.
- Each user has a **virtual budget** to build their squad.
- Each real player has a **market value** (price).
- Users must build their 18-player squad within the budget cap.
- **Starting budget: $150M** (virtual currency, no relation to real money).
- **Player values range: $1M–$15M** depending on quality/stats.
- Users can **purchase additional budget with real money** via Mercado Pago.
- Player values may fluctuate between matchdays based on performance (post-MVP refinement).

### Captain

- One starter is designated as **Captain** — earns **2x points** instead of 1x.
- One starter is designated as **Captain Substitute** — inherits the 2x multiplier if the Captain did not play in the matchday.
- Users choose Captain and Captain Substitute when setting their lineup (can change during OPEN phase).

### Squad Building

- **Free pick from catalog** — users browse/search all available players and add them to their squad within budget.
- Users must select a **formation** (e.g., 4-3-3, 4-4-2, 3-5-2) that determines the required number of players per position (GK, DEF, MID, FWD).
- The formation constrains starter slots; bench players fill remaining positions freely up to 18 total.
- Squad is only valid when it matches the chosen formation and is within budget.
- **Formation can be changed during OPEN phase** — must still have valid players for the new formation.

### Substitutions (During Matchday)

- Once a matchday starts (LOCK), **formation is frozen** and no external transfers allowed.
- Bench players **always score at 0.5x** — they contribute points regardless of substitution.
- A user may pay to **swap a starter with a bench player of the same position** (e.g., DEF ↔ DEF) only if **both** players' matches have **not yet begun**.
- The swapped-in player becomes starter (1x), the swapped-out goes to bench (0.5x).
- **All substitutions cost $2,000 ARS** (fixed fee, paid via Mercado Pago) — no free subs for any tier.
- Same-position constraint keeps the formation intact during the matchday.

### Transfers (OPEN Phase)

- During the **OPEN phase** (between matchdays), users can freely buy/sell players from the catalog within their budget.
- **Sell tax: 10%** — when selling a player, the user recovers 90% of the player's current market value. Prevents risk-free player flipping.

### Scoring

- Points come **directly from the stats provider API** — the API provides a per-player match rating/score.
- **No custom scoring engine** — the platform consumes the API's player scores as-is (starters at 1x, bench at 0.5x).
- Scores update **when a match ends** (not real-time during the match).
- The stats API must provide a **numeric player rating per match** (not just raw stats).

### Matchday lifecycle

```
1. LOCK     — First match kicks off → squad, formation, captain ALL frozen
2. LIVE     — Matches in progress (no changes allowed)
3. RESULTS  — Last match ends → scores ingested from API → points assigned
4. OPEN     — Window opens: sell players (10% tax), buy budget with
              real money, buy new players, change formation, set captain
```

- **LOCK→RESULTS**: the only permitted action is a paid same-position swap (starter ↔ bench) if both players' matches haven't started. Formation stays frozen.
- **OPEN phase ends** when the first match of the next matchday kicks off (returns to LOCK).

---

## 2. Tournament Structure

### General Tournament (Free)
- One specific tournament (e.g. Copa de la Liga 2026).
- Open to all registered users.
- Global leaderboard.
- **No AI features** for free users.

### Private Leagues (Paid)
- Users create private leagues and invite friends via **shareable link** (e.g., bilardeando.com/liga/abc123) — easy to paste in WhatsApp groups.
- **Buy-in: $10,000 to $100,000 ARS** per player, in **$5,000 steps** (creator selects).
- **Platform rake**: **5%** taken from total pool before prize distribution.
- **League size: 3–20 players.**
- **Poker-style prize distribution** — top-heavy, more positions paid as league size grows:
  - 3–6 players: pays top 1–2
  - 7–15 players: pays top 3
  - 16–20 players: pays top 4
  - 1st place always gets the largest share.
- **League timing**: creator selects a **start matchday** and **end matchday**. The league can only start on a matchday that hasn't begun yet. Points accumulate only within that range.
- All players must join and pay before the start matchday locks.
- **If fewer than 3 players by start matchday lock**: league is **auto-cancelled** and all buy-ins are **fully refunded** (no rake taken).
- Private leaderboard.

### Future Feature (not MVP)
- **Head-to-head betting** — 1v1 matchups between users with wagers.

---

## 3. Free vs Paid Features

### Free Tier
| Feature | Included |
|---|---|
| Join general tournament | Yes |
| Build & manage squad | Yes |
| View leaderboard | Yes |
| Bench players score at 0.5x | Yes |
| Basic matchday results via WhatsApp | Yes |
| AI features | **No** (unlock for $500 ARS one-time) |

### Paid / Microtransactions
| Feature | Payment model |
|---|---|
| Bench→starter substitution (promote to 1x) | Per-sub fee |
| Additional squad budget | Direct purchase via MP ($5M virtual = $1,000 ARS, $10M = $1,800 ARS, $20M = $3,000 ARS) |
| AI assistant (injury alerts, recommendations) | $500 ARS one-time unlock via MP |
| Private league creation | Minimum buy-in |
| Service fee waiver | Load $20,000+ ARS → 3% fee waived, balance usable for bets |

### Monetization levers
- **Service fee**: **3%** on wallet load and budget purchase transactions (waived when user balance ≥ $20,000 ARS).
- **Microtransactions** for swaps and premium features.
- **Rake on private leagues**: 5% of buy-in pool.

---

## 4. WhatsApp Bot (Interactive)

### Provider
- Budget-friendly option: **Gupshup** or **360dialog** (to evaluate).
- Must support WhatsApp Business API.

### Capabilities

| Interaction | Free | Paid |
|---|---|---|
| View my squad | Yes | Yes |
| View matchday scores | Yes | Yes |
| View leaderboard position | Yes | Yes |
| Make a substitution (paid) | Yes | Yes |
| AI: Injury alert + swap suggestion | No | Yes |
| AI: Matchday predictions | No | Yes |
| AI: "Who should I pick?" advice | No | Yes |

### AI Chat Design
- **Heavily guardrailed** — not a free-form chatbot.
- Predefined intents with strict boundaries.
- Uses Claude API under the hood.
- Only responds to fantasy-football-related queries.
- Rejects off-topic conversations gracefully.

---

## 5. Payments — Mercado Pago

### Integration
- **Simple payment links** (Checkout Pro redirect) — no embedded checkout for MVP.
- User clicks link → pays in MP → webhook confirms → balance/feature unlocked.

### Flows
1. **Buy swaps** — User requests extra swap → gets MP payment link → pays → swap unlocked.
2. **Join private league** — User joins league → gets MP payment link for buy-in → pays → added to league.
3. **Load balance** — User loads ARS into their account → fee waived at $20,000+.

### No recurring payments for MVP.

---

## 6. Data & Stats Provider

### Requirements
- Argentine league coverage (Liga Profesional).
- Match results, lineups, player stats (goals, assists, cards, minutes played, etc.).
- Post-match data availability.

### Candidates to evaluate
| Provider | Notes |
|---|---|
| [API-Football](https://www.api-football.com/) | Good Argentine coverage, free tier available |
| [SportMonks](https://www.sportmonks.com/) | Comprehensive, paid |
| [football-data.org](https://www.football-data.org/) | Free tier, limited Argentine data |

### Hackathon Demo
- **Mock data layer** is mandatory.
- All external API calls must be abstracted behind an interface so we can swap real API for mocks seamlessly.
- Mock data includes: sample players, sample matches, sample stats for 2-3 matchdays.

---

## 7. Tech Stack (Proposed)

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js (React) | SSR, fast, great DX |
| Backend/API | Next.js API routes or Express | Keep it simple |
| Database | PostgreSQL | Relational data fits well |
| ORM | Prisma | Type-safe, great migrations |
| WhatsApp | Gupshup / 360dialog | Budget-friendly |
| AI | Claude API | Guardrailed chat assistant |
| Payments | Mercado Pago (payment links) | Simple integration |
| Hosting | Vercel + Supabase (or Railway) | Fast deploy for hackathon |
| Mocks | In-memory / JSON fixtures | Hackathon demo fallback |

---

## 8. Web App — Key Screens

1. **Landing / Login** — Pick a demo user to sign in.
2. **Squad Builder** — Pick 11 starters + 7 bench from player catalog.
3. **Matchday View** — Live scores, your squad's points, match status.
4. **Leaderboard** — General ranking + private league rankings.
5. **Transfers / Swaps** — Replace players who didn't play (with cost).
6. **Private Leagues** — Create/join leagues with buy-in.
7. **Wallet / Balance** — View balance, load funds, transaction history.
8. **Profile** — User info, account details.

**Desktop-first** — WhatsApp covers the mobile experience.

**Visual style**: Retro ESPN / Yahoo Sports circa 2003 — dense data tables, thick borders, beveled buttons, tab navigation, gold/green palette. See constitution Principle I for full guidelines.

---

## 9. Authentication

- **Credential-based demo login** — 3 seeded demo users (Juan, María, Carlos). No OAuth required.
- Google OAuth deferred to post-MVP (simplifies auth stack, no external credentials needed for demo).
- Users are identified by their email address.
- Auth uses NextAuth.js CredentialsProvider with JWT sessions.

---

## 10. Hackathon Demo Plan

For the hackathon presentation, we need:

1. **Working web app** with squad builder and leaderboard.
2. **Mock matchday simulation** — trigger a "matchday end" that calculates scores.
3. **WhatsApp bot demo** — show interactive squad management + AI tip.
4. **Mercado Pago flow** — show a swap purchase with real (sandbox) payment link.
5. **Scoring flow** — demonstrate ingesting player ratings from API (or mock) and computing squad totals.

### Data mocks needed
- 4 teams, ~80 players with stats.
- 2 simulated matchdays with results.
- Pre-built squads for demo users.

---

## Clarifications

### Session 2026-02-20

- Q: Can multiple users have the same player, or is ownership exclusive per league? → A: Shared — any user can pick any player. Additionally, users have a budget and every player has a market value.
- Q: How do users initially build their squad? → A: Free pick from catalog, constrained by a chosen formation (e.g., 4-3-3). Users can also purchase additional budget with real money.
- Q: What can users change in their squad between/during matchdays? → A: During matchday (LOCK onwards), squad is frozen — only bench→starter substitutions for non-playing starters. During OPEN phase, free transfers within budget.
- Q: How many free substitutions per matchday? → A: Zero — all substitutions are paid. Bench always scores at 0.5x. Paid sub promotes bench→starter (1x) only if both matches haven't started.
- Q: What is the starting budget and player value range? → A: $150M virtual budget, players valued $1M–$15M.
- Q: How are fantasy points calculated? → A: No custom scoring engine — use an external API that provides direct player ratings per match. Platform consumes scores as-is.
- Q: When selling a player, does the user recover full value? → A: No — 10% sell tax. User recovers 90% of current market value.
- Q: Is there a captain mechanic? → A: Yes — Captain (2x) + Captain Substitute (inherits 2x if captain didn't play). No vice-captain bonus.
- Q: How do private league buy-ins and prizes work? → A: Buy-in $10k–$100k ARS in $5k steps. Poker-style prize distribution (top-heavy, scales with league size). Platform takes a rake.
- Q: Can users change formation between matchdays? → A: Yes during OPEN. During matchday, formation is frozen but same-position swaps (starter ↔ bench) allowed if both matches haven't started — costs real money.
- Q: What does a mid-matchday substitution cost? → A: Fixed fee of $2,000 ARS per swap.
- Q: How do users invite friends to private leagues? → A: Shareable link (URL) that can be sent via WhatsApp, social media, etc.
- Q: Min/max players in a private league? → A: 3 to 20.
- Q: When does a private league start? → A: At the next not-yet-started matchday. Creator sets start and end matchday. All players must join before start matchday locks.
- Q: What if a private league doesn't reach 3 players? → A: Auto-cancel + full refund, no rake taken.

---

## 11. Out of Scope (Post-MVP)

- Real-time in-match score updates.
- Head-to-head betting / mano a mano.
- Referral system.
- Mobile native app.
- Full Argentine league coverage (all teams).
- Advanced analytics dashboard.
- Recurring subscriptions.
