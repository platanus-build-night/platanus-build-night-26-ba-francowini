# Gran DT — MVP Definition

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

### Substitutions

- If a starter or bench player **did not play** in the matchday, the user can swap them out.
- Each swap has a **cost** (microtransaction via Mercado Pago).
- Free-tier users get a limited number of free swaps per matchday (TBD — e.g. 1 free).

### Scoring

- Points come from the **stats provider API** (goals, assists, clean sheets, cards, saves, etc.).
- A **scoring engine** processes raw stats into fantasy points.
- Scores update **when a match ends** (not real-time during the match).

### Matchday lifecycle

```
1. LOCK     — Lineups lock at kickoff of the first match of the matchday
2. LIVE     — Matches in progress (no changes allowed)
3. RESULTS  — Matches end → scoring engine runs → points assigned
4. OPEN     — Transfer/swap window opens for next matchday
```

---

## 2. Tournament Structure

### General Tournament (Free)
- One specific tournament (e.g. Copa de la Liga 2026).
- Open to all registered users.
- Global leaderboard.
- **No AI features** for free users.

### Private Leagues (Paid)
- Users create private leagues and invite friends.
- **Minimum buy-in required** (collected via Mercado Pago).
- Prize pool distributed to top N at end of tournament.
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
| Limited free swaps per matchday | Yes |
| Basic matchday results via WhatsApp | Yes |
| AI features | **No** |

### Paid / Microtransactions
| Feature | Payment model |
|---|---|
| Extra swaps (when player didn't play) | Per-swap fee |
| AI assistant (injury alerts, recommendations) | Pay to unlock |
| Private league creation | Minimum buy-in |
| Service fee waiver | Load $20,000+ ARS → fee waived, balance usable for bets |

### Monetization levers
- **Service fee** on transactions (waived at $20,000+ balance).
- **Microtransactions** for swaps and premium features.
- **Rake on private leagues** (small % of buy-in pool).

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
| Make a swap | Yes (limited) | Yes (paid extras) |
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

1. **Landing / Login** — Sign up with phone number (WhatsApp identity).
2. **Squad Builder** — Pick 11 starters + 7 bench from player catalog.
3. **Matchday View** — Live scores, your squad's points, match status.
4. **Leaderboard** — General ranking + private league rankings.
5. **Transfers / Swaps** — Replace players who didn't play (with cost).
6. **Private Leagues** — Create/join leagues with buy-in.
7. **Wallet / Balance** — View balance, load funds, transaction history.
8. **Profile** — User info, linked WhatsApp number.

**Desktop-first** — WhatsApp covers the mobile experience.

---

## 9. Authentication

- **Phone number (WhatsApp)** as primary identity.
- OTP verification via WhatsApp.
- Optional: Google OAuth as secondary login for web.

---

## 10. Hackathon Demo Plan

For the hackathon presentation, we need:

1. **Working web app** with squad builder and leaderboard.
2. **Mock matchday simulation** — trigger a "matchday end" that calculates scores.
3. **WhatsApp bot demo** — show interactive squad management + AI tip.
4. **Mercado Pago flow** — show a swap purchase with real (sandbox) payment link.
5. **Scoring engine** — demonstrate points calculation from mock stats.

### Data mocks needed
- 4 teams, ~80 players with stats.
- 2 simulated matchdays with results.
- Pre-built squads for demo users.

---

## 11. Out of Scope (Post-MVP)

- Real-time in-match score updates.
- Head-to-head betting / mano a mano.
- Referral system.
- Mobile native app.
- Full Argentine league coverage (all teams).
- Advanced analytics dashboard.
- Recurring subscriptions.
