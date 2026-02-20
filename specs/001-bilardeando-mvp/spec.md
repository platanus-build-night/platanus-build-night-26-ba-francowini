# Feature Specification: Bilardeando MVP

**Feature Branch**: `001-bilardeando-mvp`
**Created**: 2026-02-20
**Status**: Draft
**Input**: User description: "Bilardeando fantasy football MVP — full platform spec covering squad builder, scoring engine, matchday lifecycle, leaderboards, private leagues, WhatsApp bot, Mercado Pago payments, and mock data layer for hackathon demo"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Build a Squad (Priority: P1)

A new user signs up, browses a catalog of Argentine football players, and assembles a squad of 18 players (11 starters + 7 bench). The user can filter and search players by team, position, and stats. Once the squad is complete the user is enrolled in the General Tournament.

**Why this priority**: Without a squad the user cannot participate in anything. This is the core action that makes the entire platform functional.

**Independent Test**: Can be fully tested by creating an account, browsing the player catalog, selecting 18 players across valid positions, and confirming the squad is saved and visible. Delivers the foundational value of team ownership.

**Acceptance Scenarios**:

1. **Given** an authenticated user with no squad, **When** they open the Squad Builder, **Then** they see a catalog of all available players with name, team, position, and recent stats.
2. **Given** the Squad Builder is open, **When** the user selects 11 starters and 7 bench players respecting position constraints, **Then** the system confirms the squad and enrolls them in the General Tournament.
3. **Given** a user has a complete squad, **When** they return to the Squad Builder, **Then** they see their current squad displayed in a formation layout with player cards.
4. **Given** the user tries to save a squad with fewer than 18 players or invalid position distribution, **When** they attempt to confirm, **Then** the system shows a clear validation error explaining what is wrong.

---

### User Story 2 — View Matchday Results and Points (Priority: P1)

After a matchday finishes, the user sees how their squad performed: which players scored, assisted, got cards, kept clean sheets, etc. Each player's fantasy points are calculated and displayed. The user sees their total matchday score and their updated position on the leaderboard.

**Why this priority**: Seeing points and results is the core feedback loop that makes fantasy football engaging. Without it, squad building has no payoff.

**Independent Test**: Can be tested by triggering a mock matchday simulation, verifying that player stats are converted into fantasy points, and confirming the user's total score and leaderboard position update correctly.

**Acceptance Scenarios**:

1. **Given** a matchday has ended and results are processed, **When** the user opens the Matchday View, **Then** they see each player in their squad with individual stats and fantasy points earned.
2. **Given** matchday results are displayed, **When** the user checks the score breakdown, **Then** starters show 1x points and bench players show 0.5x points.
3. **Given** results are processed, **When** the user views the leaderboard, **Then** their position reflects the cumulative points from all matchdays played.

---

### User Story 3 — Leaderboard and Rankings (Priority: P1)

Users see a global leaderboard showing all participants ranked by total fantasy points. The leaderboard displays rank, username, total points, and matchday-by-matchday breakdown. Users in private leagues also see a separate private league leaderboard.

**Why this priority**: Competition is the primary driver of engagement. Users need to see where they stand relative to others.

**Independent Test**: Can be tested by creating multiple users with different scores and verifying the leaderboard sorts correctly, displays accurate data, and allows filtering between general and private league views.

**Acceptance Scenarios**:

1. **Given** multiple users have accumulated points, **When** any user opens the Leaderboard, **Then** they see a ranked list with position, username, and total points.
2. **Given** a user belongs to a private league, **When** they switch to the private league tab, **Then** they see only league members ranked by total points.
3. **Given** a new matchday's results are processed, **When** the user refreshes the leaderboard, **Then** rankings reflect the latest cumulative scores.

---

### User Story 4 — Make Player Swaps (Priority: P2)

Between matchdays (during the OPEN window), a user can replace players in their squad. If a player did not play in the last matchday the user may swap them for free (up to a limited number of free swaps). Additional swaps cost money via Mercado Pago.

**Why this priority**: Swaps keep the game dynamic and are a key monetization lever, but the core experience works without them.

**Independent Test**: Can be tested by simulating a completed matchday where a squad player did not play, attempting a free swap, attempting a paid swap, and verifying the squad updates correctly.

**Acceptance Scenarios**:

1. **Given** the matchday is in the OPEN phase and a squad player did not play, **When** the user selects that player for swap, **Then** they can pick a replacement from available players at no cost (if free swaps remain).
2. **Given** the user has exhausted free swaps, **When** they attempt another swap, **Then** the system shows the cost and offers a Mercado Pago payment link.
3. **Given** the user completes payment for a paid swap, **When** the payment webhook confirms, **Then** the swap is executed and the squad updates.
4. **Given** the matchday is in the LOCK or LIVE phase, **When** the user tries to make a swap, **Then** the system blocks the action with a message explaining the transfer window is closed.

---

### User Story 5 — Authentication via Phone Number (Priority: P2)

A user registers and logs in using their phone number. They receive a one-time password (OTP) via WhatsApp to verify their identity. Optionally, returning web users can also sign in with Google OAuth.

**Why this priority**: Authentication is required for all personalized features but is not the core value proposition. Standard OTP flow is well-understood.

**Independent Test**: Can be tested by entering a phone number, receiving an OTP, entering the code, and verifying access to the authenticated dashboard.

**Acceptance Scenarios**:

1. **Given** a new user, **When** they enter their phone number, **Then** they receive an OTP via WhatsApp within 30 seconds.
2. **Given** the user enters a valid OTP, **When** they submit it, **Then** they are authenticated and redirected to the Squad Builder (if no squad) or their dashboard.
3. **Given** the user enters an invalid OTP, **When** they submit it, **Then** they see an error and can retry (up to 3 attempts before cooldown).
4. **Given** a returning user on the web, **When** they choose Google sign-in, **Then** they are authenticated via OAuth and linked to their existing account.

---

### User Story 6 — Private Leagues (Priority: P2)

A user creates a private league with a name and a minimum buy-in amount. They share an invite link with friends. Friends join the league by paying the buy-in via Mercado Pago. The league has its own leaderboard. At the end of the tournament the prize pool is distributed to the top finishers.

**Why this priority**: Private leagues drive social engagement and are a key monetization channel, but the platform is functional with just the general tournament.

**Independent Test**: Can be tested by creating a league, sharing the invite, having another user join and pay, and verifying both users see the private leaderboard.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they create a private league with a name and buy-in amount, **Then** the league is created and they receive a shareable invite link.
2. **Given** a user clicks an invite link, **When** they pay the buy-in via Mercado Pago, **Then** they are added to the league and appear on the private leaderboard.
3. **Given** a private league has active members, **When** a matchday ends, **Then** the private leaderboard updates with member rankings.
4. **Given** the tournament ends, **When** final standings are calculated, **Then** the prize pool is distributed to top finishers (distribution rules visible when creating the league).

---

### User Story 7 — WhatsApp Bot Interactions (Priority: P3)

Users interact with the Bilardeando WhatsApp bot to check their squad, see matchday scores, view their leaderboard position, and make swaps — all without opening the web app. Paid users also receive AI-powered features: injury alerts, matchday predictions, and player recommendations.

**Why this priority**: The WhatsApp bot is a differentiator and covers the mobile experience, but the web app provides full functionality on its own.

**Independent Test**: Can be tested by sending predefined messages to the bot and verifying correct responses for squad view, scores, leaderboard, and swap commands.

**Acceptance Scenarios**:

1. **Given** a registered user messages the bot, **When** they send "mi equipo" (or equivalent command), **Then** the bot replies with their current squad lineup.
2. **Given** a matchday has ended, **When** the user asks for scores, **Then** the bot replies with their total points and per-player breakdown.
3. **Given** a free user asks for AI advice, **When** the bot receives the request, **Then** it responds explaining this is a paid feature with instructions to upgrade.
4. **Given** a paid user asks "who should I pick?", **When** the bot processes the request, **Then** it replies with a guardrailed recommendation based on upcoming fixtures and recent form.

---

### User Story 8 — Wallet and Payments (Priority: P3)

Users manage their in-app balance through a wallet screen. They can load funds via Mercado Pago, view transaction history, and see their current balance. A service fee applies to transactions unless the user has loaded 20,000+ ARS.

**Why this priority**: The wallet supports monetization features (paid swaps, private leagues) but is not needed for the free-tier core experience.

**Independent Test**: Can be tested by initiating a balance load, completing payment in Mercado Pago sandbox, and verifying the balance updates and transaction appears in history.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they open the Wallet screen, **Then** they see their current balance and transaction history.
2. **Given** the user chooses to load funds, **When** they select an amount and click pay, **Then** they are redirected to Mercado Pago. After payment confirms, their balance updates.
3. **Given** a user with less than 20,000 ARS balance, **When** they make a transaction, **Then** a service fee is applied and displayed before confirmation.
4. **Given** a user with 20,000+ ARS balance, **When** they make a transaction, **Then** no service fee is applied.

---

### Edge Cases

- What happens when the stats provider API is down or returns incomplete data? The system falls back to the mock data layer and displays a notice to users.
- What happens when a user's entire starting 11 did not play in a matchday? The user receives 0 points for starters and only bench points (0.5x) for bench players who played. Free swaps apply to the next window.
- What happens when a Mercado Pago payment webhook is delayed or fails? The system retries webhook processing and holds the transaction in a "pending" state visible to the user. The feature (swap, league join) is not unlocked until confirmation.
- What happens when two users try to swap in the same player at the same time? Players are not exclusive — multiple users can have the same player in their squad (no draft exclusivity in the general tournament).
- What happens when a matchday is rescheduled or cancelled? An admin can manually mark the matchday status and trigger re-scoring or skip it. Affected users are notified.
- What happens when a user loses access to their WhatsApp number? They can sign in via Google OAuth on the web and update their phone number from their profile.

## Requirements *(mandatory)*

### Functional Requirements

**Squad Management**
- **FR-001**: System MUST allow users to build a squad of exactly 18 players (11 starters + 7 bench) from a catalog of Argentine Liga Profesional players.
- **FR-002**: System MUST enforce position constraints on squad composition (e.g., 1 goalkeeper, defenders, midfielders, forwards matching a valid formation).
- **FR-003**: System MUST display each player with name, team, position, and recent performance stats.
- **FR-004**: System MUST allow users to view their squad in a football formation layout (e.g., 4-3-3, 4-4-2).

**Scoring & Matchdays**
- **FR-005**: System MUST calculate fantasy points from player stats: goals, assists, clean sheets, yellow cards, red cards, saves, minutes played.
- **FR-006**: System MUST apply a 1x points multiplier to starters and 0.5x to bench players.
- **FR-007**: System MUST enforce the matchday lifecycle: LOCK (at first kickoff) → LIVE (matches in progress) → RESULTS (scoring runs) → OPEN (swaps allowed).
- **FR-008**: System MUST process and display scores after all matches in a matchday conclude.

**Leaderboard**
- **FR-009**: System MUST maintain a global leaderboard ranked by cumulative fantasy points.
- **FR-010**: System MUST maintain separate leaderboards for each private league.
- **FR-011**: System MUST update leaderboards after every matchday's results are processed.

**Transfers & Swaps**
- **FR-012**: System MUST allow users to swap players who did not play in the previous matchday during the OPEN phase.
- **FR-013**: System MUST provide a limited number of free swaps per matchday (1 free swap).
- **FR-014**: System MUST charge for additional swaps via Mercado Pago payment links.
- **FR-015**: System MUST block all squad changes during LOCK and LIVE phases.

**Authentication**
- **FR-016**: System MUST authenticate users via phone number with OTP delivered through WhatsApp.
- **FR-017**: System MUST support Google OAuth as an alternative sign-in method for web users.
- **FR-018**: System MUST link WhatsApp and Google OAuth accounts by phone number.

**Private Leagues**
- **FR-019**: System MUST allow users to create private leagues with a name and minimum buy-in amount.
- **FR-020**: System MUST generate shareable invite links for private leagues.
- **FR-021**: System MUST collect buy-in payments via Mercado Pago before adding a user to a private league.
- **FR-022**: System MUST distribute the prize pool to top finishers when the tournament ends.

**WhatsApp Bot**
- **FR-023**: System MUST provide a WhatsApp bot that responds to commands for viewing squad, scores, leaderboard position, and making swaps.
- **FR-024**: System MUST restrict AI-powered features (injury alerts, predictions, recommendations) to paid users only.
- **FR-025**: System MUST guardrail the AI chat to respond only to fantasy-football-related queries and reject off-topic conversations.

**Payments & Wallet**
- **FR-026**: System MUST integrate with Mercado Pago Checkout Pro (redirect-based payment links) for all payments.
- **FR-027**: System MUST maintain a per-user wallet with balance, transaction history, and fund loading.
- **FR-028**: System MUST apply a service fee on transactions for users with less than 20,000 ARS balance.
- **FR-029**: System MUST waive the service fee for users with 20,000+ ARS balance.

**Data Layer**
- **FR-030**: System MUST abstract all external API calls (stats provider, WhatsApp, Mercado Pago) behind interfaces.
- **FR-031**: System MUST include a mock data layer with at least 4 teams, 80 players, and 2 simulated matchdays for the hackathon demo.
- **FR-032**: System MUST allow seamless switching between mock and real data providers without code changes.

**Web App Screens**
- **FR-033**: System MUST provide the following screens: Landing/Login, Squad Builder, Matchday View, Leaderboard, Transfers/Swaps, Private Leagues, Wallet/Balance, and Profile.
- **FR-034**: System MUST be deployable to Vercel at all times — broken builds on the main branch are prohibited.

### Key Entities

- **User**: Represents a registered player. Key attributes: phone number (primary identity), display name, Google OAuth link (optional), wallet balance, active squad reference.
- **Player**: A real-world footballer from the Argentine Liga Profesional. Key attributes: name, team, position, photo, season stats (goals, assists, clean sheets, cards, saves, minutes).
- **Squad**: A user's team of 18 players. Key attributes: owner (user), list of 11 starters with positions, list of 7 bench players, formation type, creation date.
- **Matchday**: A round of fixtures in the tournament. Key attributes: matchday number, status (LOCK/LIVE/RESULTS/OPEN), list of matches, lock time.
- **Match**: A single game within a matchday. Key attributes: home team, away team, score, status, player performance stats.
- **PlayerMatchStats**: Performance data for a player in a specific match. Key attributes: player, match, goals, assists, clean sheet, yellow cards, red cards, saves, minutes played, fantasy points calculated.
- **League**: A private league created by a user. Key attributes: name, creator, buy-in amount, invite link, member list, prize pool, prize distribution rules.
- **Transaction**: A financial event in a user's wallet. Key attributes: user, amount, type (load/swap-purchase/league-buy-in/prize-payout), status (pending/confirmed/failed), Mercado Pago reference, timestamp.
- **Tournament**: The overarching competition (e.g., Copa de la Liga 2026). Key attributes: name, start date, end date, list of matchdays, general leaderboard.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can sign up and build a complete squad in under 5 minutes on their first visit.
- **SC-002**: Matchday results and updated leaderboard are available to users within 2 minutes of the last match ending.
- **SC-003**: The platform supports at least 500 concurrent users during a matchday without noticeable slowdown.
- **SC-004**: A new user can understand how to build a squad and view the leaderboard without any tutorial or external help.
- **SC-005**: WhatsApp bot responds to user commands within 5 seconds.
- **SC-006**: Payment flows (load funds, buy swap, join league) complete end-to-end with fewer than 3 taps/clicks from intent to confirmation.
- **SC-007**: The hackathon demo runs a full cycle: squad building → matchday lock → mock matchday simulation → scoring → leaderboard update → swap window — in under 10 minutes.
- **SC-008**: 90% of user-initiated actions (squad changes, swaps, payments) succeed on the first attempt without errors.
- **SC-009**: The platform works fully with mock data (no external API dependency) for the hackathon demo.
- **SC-010**: All screens load and are interactive within 2 seconds on a standard connection.

## Assumptions

- The Argentine Liga Profesional schedule and team rosters are available (or will be mocked for the demo).
- Users have WhatsApp installed and an active phone number for registration.
- Mercado Pago sandbox environment is available and functional for payment testing.
- The hackathon demo will use mock data exclusively — no live API provider is required for the demo.
- Players are not exclusive: multiple users can have the same player in their squad (no draft exclusivity in the general tournament).
- 1 free swap per matchday is the default for free-tier users.
- The scoring formula weights and point values will be defined during the planning phase (implementation detail).
- Desktop-first web design; the WhatsApp bot covers the mobile experience.
- The AI features in the WhatsApp bot use the Claude API and are restricted to paid users.
- Service fee percentage will be defined during planning (implementation detail).
- Prize pool distribution rules (e.g., top 3 split) are set by the league creator at creation time.
