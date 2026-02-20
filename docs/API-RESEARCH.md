# Player Data API Research

Research on available APIs for fetching player data (rosters, stats, pricing) for our fantasy football app targeting Argentine Liga Profesional.

## Chosen API: API-Football (api-sports.io)

- **Free tier**: 100 requests/day, no credit card required
- **Coverage**: 1,200+ leagues including Liga Profesional Argentina (league ID `128`)
- **Seasons available on free plan**: 2022–2024 (no current 2025 season)
- **Pricing**: Free → $19/mo (7,500/day) → $29/mo (75,000/day) → $39/mo (150,000/day)

## What Works on the Free Tier (Tested)

| Endpoint | Returns | Requests |
|---|---|---|
| `GET /teams?league=128&season=2024` | All 28 teams with logos, venues, IDs | 1 |
| `GET /players/squads?team={id}` | Full squad: name, photo, position, number, age | 1 per team |
| `GET /players/topscorers?league=128&season=2024` | Top 20 scorers with goals, assists, rating, appearances | 1 |
| `GET /players/topassists?league=128&season=2024` | Top 20 assist leaders with full stats | 1 |
| `GET /players/topyellowcards?league=128&season=2024` | Top 20 most booked players | 1 |
| `GET /players/topredcards?league=128&season=2024` | Top 20 red card leaders | 1 |

### What Does NOT Work on Free Tier

| Endpoint | Issue |
|---|---|
| `GET /players?team={id}&season=2024` | Returns player list but **all stats are NULL** |
| `GET /fixtures/players?fixture={id}` | Per-match player stats — likely empty too |
| Season 2025 | Blocked: "Free plans do not have access to this season" |

## Data Fetching Strategy

### Request Budget (33 of 100 daily requests)

```
Step 1: GET /teams?league=128&season=2024              →  1 request  (28 teams)
Step 2: GET /players/squads?team={id}  × 28 teams      → 28 requests (~34 players each, ~950 total)
Step 3: GET /players/topscorers?league=128&season=2024  →  1 request  (top 20 with full stats)
Step 4: GET /players/topassists?league=128&season=2024  →  1 request  (top 20 with full stats)
Step 5: GET /players/topyellowcards?league=128&season=2024 → 1 request (top 20)
Step 6: GET /players/topredcards?league=128&season=2024 →  1 request  (top 20)
                                                         ─────────
                                                   Total: 33 requests
```

### What We Get

- **~950 players** with name, photo, position, team, shirt number, age
- **Real stats** (rating, goals, assists, cards, appearances) for the **top ~60-80 players** via ranking endpoints
- **67 remaining requests** for the day for updates or additional queries

### Recommended Approach

1. **Run once, cache everything** — Execute the 33 requests once, save to JSON/database
2. **Generate fantasy prices algorithmically** — API-Football does NOT provide market values or fantasy prices
3. **Mock match results** — For the hackathon demo, match results will be mocked locally
4. **Zero runtime dependency** — The app serves all data from cache, no API calls during the demo

## Fantasy Price Calculation

Since no free API provides fantasy prices, we calculate them ourselves based on available data:

- **Top players** (from ranking endpoints): Use real stats — rating, goals, assists, appearances
- **Remaining players** (~870): Assign price based on position + team tier (e.g., a Boca defender > a Barracas Central defender)

### Price Formula (Proposed)

| Factor | Weight |
|---|---|
| Average rating | Base price multiplier |
| Goals scored | +$500K per goal |
| Assists | +$300K per assist |
| Position | Attackers 1.3x, Midfielders 1.1x, Defenders 0.9x, Goalkeepers 0.8x |
| Team tier | Top clubs (Boca, River, Racing, Vélez) get a multiplier boost |
| Minutes played / Appearances | Regulars worth more than bench players |

## Alternatives Considered

| API | Verdict |
|---|---|
| **FPL API** (fantasy.premierleague.com) | Excellent data with prices, but Premier League only — no Argentine football |
| **Transfermarkt API** (unofficial, self-hosted) | Real market values, but no match stats. Extra infra to deploy |
| **Sofascore** (unofficial) | Great stats but against TOS, rate-limited by Cloudflare, fragile |
| **football-data.org** | Argentine league requires paid tier. No per-player stats |
| **SportMonks** | Free tier only covers Danish/Scottish leagues |

## API Authentication

```
Header: x-apisports-key: {YOUR_KEY}
Base URL: https://v3.football.api-sports.io
```

Register at [api-football.com](https://www.api-football.com/) for a free key (no credit card).

## Key IDs

| Entity | ID |
|---|---|
| Liga Profesional Argentina | `128` |
| Copa de la Liga Profesional | `1032` |
| Boca Juniors | `451` |
| River Plate | `435` |
| Racing Club | `436` |
| Independiente | `453` |
| San Lorenzo | `460` |
| Vélez Sarsfield | `438` |
