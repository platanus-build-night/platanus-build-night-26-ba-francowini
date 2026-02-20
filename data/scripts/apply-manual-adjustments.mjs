#!/usr/bin/env node
/**
 * Applies manual adjustments to processed player data based on
 * real-world research (Feb 2026 current status).
 *
 * Updates:
 * - Fantasy prices based on current form/status
 * - Club transfers (players who moved)
 * - Adds missing high-profile players
 * - Flags declining/retired players
 *
 * Usage: node data/scripts/apply-manual-adjustments.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROCESSED_DIR = resolve(__dirname, '../processed');

const teamsFile = resolve(PROCESSED_DIR, 'teams.json');
const playersFile = resolve(PROCESSED_DIR, 'players.json');

const teams = JSON.parse(readFileSync(teamsFile, 'utf-8'));
const players = JSON.parse(readFileSync(playersFile, 'utf-8'));

const teamByName = Object.fromEntries(teams.map(t => [t.name, t]));
const teamById = Object.fromEntries(teams.map(t => [t.apiId, t]));

// ─── Price adjustments by apiId ─────────────────────────────────────────────
// Based on Feb 2026 research: current form, transfers, age, injuries
const PRICE_ADJUSTMENTS = {
  // ══ STARS — adjusted based on 2025/2026 form ══

  // A. Martínez (Racing) — still the best, extended to 2028, €122M clause. KEEP $15M
  70749: { price: 15.0 },

  // B. Romero (Vélez) — 33yo, 4G 2A in 2026, solid but slower. Slight decrease
  10149: { price: 13.5 },

  // M. Merentiel (Boca) — 50+ goals for Boca, still top, Liga MX interest. KEEP high
  6327: { price: 13.5 },

  // E. Cavani (Boca) — 39yo, constant injuries, barely plays, retiring 2026. HUGE drop
  274: { price: 4.0, notes: 'Retiring 2026, constant injuries, minimal minutes' },

  // J. Quintero (River) — returned to River mid-2025, 33yo, still creative but no longer dominant
  6005: { price: 9.5 },

  // F. Colidio (River) — 0G 1A in early 2026, quiet start, 6.57 rating. Drop
  214: { price: 8.5, notes: 'Quiet 2026 start, 0G 1A, below-average rating' },

  // M. Moreno (Lanús) — Copa Sudamericana champion, best form of career, 20G 20A in 83 matches. BUMP
  6217: { price: 14.0, notes: 'Copa Sudamericana champion 2025, career-best form' },

  // W. Bou (Lanús) — 32yo, 3G in 11 matches 2026, reduced role. Drop
  11405: { price: 9.5, notes: 'Reduced role at 32, Copa Sudamericana squad player' },

  // G. Carrillo (Estudiantes) — won Clausura + Trofeo de Campeones 2025, fewer goals but titles. Slight drop
  47421: { price: 12.0, notes: '2x champion 2025, fewer goals but vital contributor' },

  // G. Ávalos (Independiente) — excellent 2026 start, 3G 2A in 5 matches. BUMP
  6483: { price: 13.5, notes: 'Excellent 2026 start, 3G 2A in 5 matches' },

  // S. Villa (Indep. Rivadavia) — Copa Argentina champion, Flamengo deal pending. BUMP
  2494: { price: 11.0, notes: 'Copa Argentina winner, Flamengo transfer pending' },

  // S. Solari (Racing) — improved 2025, 3G in 13 matches but injuries. KEEP
  170127: { price: 10.0 },

  // G. Martirena (Racing) — very good, Gremio/Spartak interested, €5M valuation. KEEP
  197520: { price: 10.5 },

  // A. Lescano (Argentinos) — young (24), €7.5M market value. KEEP
  358383: { price: 12.0 },

  // F. Jara (Instituto, loan from Belgrano) — 37yo, 1G in 360 min, declining hard
  35670: { price: 7.0, notes: '37yo, declining, 1G in 360 min in 2026' },

  // I. Ramírez (on loan at Sport Recife, Brazil) — relegated team, poor form
  51560: { price: 5.0, notes: 'On loan at relegated Sport Recife, poor form' },

  // V. Malcorra (now at Independiente from Central) — 38yo, still productive but aging
  35921: { price: 8.0, notes: '38yo, moved to Independiente, 7G 6A at Central in 2025' },

  // W. Alarcón (Boca) — fringe player, barely plays, Paredes/Ascacíbar ahead of him
  11424: { price: 5.0, notes: 'Fringe player at Boca, minimal minutes, Colo-Colo interested' },

  // M. Estigarribia (Unión) — inconsistent finishing, decent but not elite
  27613: { price: 9.0 },

  // J. Herrera (Riestra) — 34yo, transitioning to sub role, 6G in 17 matches
  59355: { price: 8.0, notes: '34yo, club legend but now sub role' },

  // R. Botta (now at Defensa from Talleres) — 36yo, moments of magic but aging
  6615: { price: 7.5, notes: '36yo, moved to Defensa y Justicia, spectacular volley vs Riestra' },

  // I. Fernández (Gimnasia) — steady midfielder, not star level
  5997: { price: 7.0 },

  // G. Lodico (Instituto) — renewed through 2027, slow 2026 start (59 min)
  6211: { price: 7.0 },

  // ══ REGULARS — card-ranking players, adjusted ══

  // É. Banega (now at Defensa from Newell's) — 37yo, barely plays (39 min, 0G 0A). Drop hard
  2050: { price: 3.5, notes: '37yo, 39 minutes played in 2026, minimal impact' },

  // S. Ascacíbar (Boca) — USD 6M signing, prime age (28), but data is from Estudiantes
  26305: { price: 7.5, notes: 'USD 6M move to Boca, competitive midfield with Paredes/Herrera' },

  // I. Marcone (Independiente) — 35yo, solid, consistent starter
  2474: { price: 6.5 },

  // ══ UNDERPRICED STARS — well-known players priced too low ══

  // Á. Di María (Rosario Central) — WORLD CUP WINNER, 10G in 22 matches. Currently $3M = absurd
  266: { price: 14.0, notes: 'World Cup winner, 10G in 22 matches since returning. Superstar.' },

  // L. Paredes (Boca) — WORLD CUP WINNER, key signing from Roma. Currently $4.3M
  271: { price: 10.0, notes: 'World Cup winner, key Boca signing from AS Roma, contract to 2028' },

  // V. Carboni (Racing) — Inter Milan loan, targeting 2026 WC with Argentina. Currently $4.2M
  341646: { price: 7.5, notes: 'Inter Milan loanee, Argentina U-squad, high potential' },

  // S. Driussi (River) — $10M signing but disappointing, injured Feb 2026. Currently $6.2M
  1222: { price: 5.0, notes: 'Disappointing since return from MLS, recurring injuries, "failed signing"' },

  // M. Salas (River) — $9.5M signing from Racing! Currently $6.2M
  11493: { price: 9.0, notes: '$9.5M signing from Racing, high expectations at River' },

  // A. Moreno / Aníbal Moreno (River) — $7M from Palmeiras. Currently $5.4M
  6347: { price: 8.0, notes: '$7M signing from Palmeiras, key River midfielder' },

  // F. Vera (River) — Atlético Mineiro loan. Currently $5.2M
  6725: { price: 6.5, notes: 'Loan from Atlético Mineiro, regular River starter' },

  // Á. Romero (Boca) — Paraguayan international, first 2026 signing. Currently $4.5M
  2521: { price: 6.5, notes: 'Boca first signing for 2026, Paraguayan international' },

  // I. Pussetto (Independiente) — from Pumas UNAM. Currently $5.8M
  30812: { price: 6.5 },

  // M. Rojo (Racing) — 35yo, from Boca, recognizable name. Currently $3.2M — OK for his level
  890: { price: 4.0, notes: 'Veteran defender, moved from Boca to Racing mid-2025' },

  // L. Janson (Boca) — squad winger. Currently $4.9M — reasonable
  6161: { price: 5.5 },
};

// ─── New players to add (missing from API data) ─────────────────────────────
const NEW_PLAYERS = [
  {
    apiId: 99901, // synthetic ID
    name: 'A. Bareiro',
    photo: 'https://media.api-sports.io/football/players/11418.png',
    age: 29,
    number: null,
    position: 'FWD',
    teamApiId: 451, // Boca Juniors
    teamName: 'Boca Juniors',
    stats: null,
    hasRealStats: false,
    fantasyPrice: 8.5,
    notes: 'Just signed Feb 2026 from Fortaleza for $3M. Paraguayan striker, ex-River.',
    manuallyAdded: true,
  },
  {
    apiId: 99902, // synthetic ID
    name: 'O. Romero',
    photo: null,
    age: 33,
    number: null,
    position: 'MID',
    teamApiId: 445, // Huracán
    teamName: 'Huracan',
    stats: null,
    hasRealStats: false,
    fantasyPrice: 7.0,
    notes: 'Signed Feb 2026. Paraguayan, 2024 Libertadores winner with Botafogo. Twin of Ángel Romero.',
    manuallyAdded: true,
  },
];

// ─── Apply adjustments ──────────────────────────────────────────────────────

let adjustedCount = 0;
let addedCount = 0;

for (const p of players) {
  const adj = PRICE_ADJUSTMENTS[p.apiId];
  if (adj) {
    const oldPrice = p.fantasyPrice;
    p.fantasyPrice = adj.price;
    if (adj.notes) p.notes = adj.notes;
    p.manuallyAdjusted = true;
    adjustedCount++;
    const diff = adj.price - oldPrice;
    const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '=';
    console.log(`  ${arrow} ${p.name.padEnd(22)} $${oldPrice}M → $${adj.price}M  (${p.teamName})`);
  }
}

// Add missing players
for (const newPlayer of NEW_PLAYERS) {
  const existing = players.find(p => p.apiId === newPlayer.apiId);
  if (!existing) {
    players.push(newPlayer);
    addedCount++;
    console.log(`  + ADDED: ${newPlayer.name} (${newPlayer.teamName}) $${newPlayer.fantasyPrice}M`);
  }
}

// ─── Save ───────────────────────────────────────────────────────────────────

writeFileSync(playersFile, JSON.stringify(players, null, 2), 'utf-8');

console.log(`\n=== DONE ===`);
console.log(`Adjusted: ${adjustedCount} players`);
console.log(`Added: ${addedCount} new players`);
console.log(`Total: ${players.length} players`);
console.log(`Saved: data/processed/players.json`);
