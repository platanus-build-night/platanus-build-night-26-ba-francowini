#!/usr/bin/env node
/**
 * Transforms raw API-Football data into clean, DB-ready JSON files.
 *
 * Input:  data/raw/   (from fetch-api-football.mjs)
 * Output: data/processed/teams.json, data/processed/players.json
 *
 * - Merges squad data with ranking stats (goals, assists, cards, rating)
 * - Calculates fantasy prices using the formula from API-RESEARCH.md
 * - Assigns team tiers for price multipliers
 *
 * Usage: node data/scripts/process-data.mjs
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = resolve(__dirname, '../raw');
const OUT_DIR = resolve(__dirname, '../processed');

mkdirSync(OUT_DIR, { recursive: true });

// ─── Team Tiers ─────────────────────────────────────────────────────────────
// Tier 1: Big clubs (higher player values)
// Tier 2: Mid-table established clubs
// Tier 3: Smaller / newly promoted clubs
const TEAM_TIERS = {
  // Tier 1 — "Grandes" + recent champions
  451: 1, // Boca Juniors
  435: 1, // River Plate
  436: 1, // Racing Club
  453: 1, // Independiente
  460: 1, // San Lorenzo
  438: 1, // Vélez Sarsfield
  450: 1, // Estudiantes L.P.

  // Tier 2 — Established first division
  434: 2, // Gimnasia L.P.
  437: 2, // Rosario Central
  440: 2, // Belgrano Córdoba
  441: 2, // Unión Santa Fe
  442: 2, // Defensa y Justicia
  445: 2, // Huracán
  446: 2, // Lanús
  449: 2, // Banfield
  455: 2, // Atlético Tucumán
  456: 2, // Talleres Córdoba
  457: 2, // Newell's Old Boys
  458: 2, // Argentinos Jrs

  // Tier 3 — Smaller / recently promoted
  439: 3, // Godoy Cruz
  452: 3, // Tigre
  473: 3, // Independiente Rivadavia
  474: 3, // Sarmiento Junín
  476: 3, // Deportivo Riestra
  478: 3, // Instituto Córdoba
  1064: 3, // Platense
  1065: 3, // Central Córdoba de Santiago
  2432: 3, // Barracas Central
};

const TIER_MULTIPLIER = { 1: 1.25, 2: 1.0, 3: 0.8 };

// ─── Position config ────────────────────────────────────────────────────────
const POSITION_MAP = {
  'Goalkeeper': 'GK',
  'Defender': 'DEF',
  'Midfielder': 'MID',
  'Attacker': 'FWD',
};

// ─── Load raw data ──────────────────────────────────────────────────────────

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function loadRanking(filename) {
  const filepath = resolve(RAW_DIR, filename);
  if (!existsSync(filepath)) return [];
  const data = loadJson(filepath);
  return data.response || [];
}

// ─── Process teams ──────────────────────────────────────────────────────────

function processTeams() {
  const raw = loadJson(resolve(RAW_DIR, 'teams.json'));
  return (raw.response || []).map(entry => ({
    apiId: entry.team.id,
    name: entry.team.name,
    code: entry.team.code,
    logo: entry.team.logo,
    founded: entry.team.founded,
    national: entry.team.national,
    venue: entry.venue ? {
      name: entry.venue.name,
      city: entry.venue.city,
      capacity: entry.venue.capacity,
      image: entry.venue.image,
    } : null,
    tier: TEAM_TIERS[entry.team.id] || 3,
  }));
}

// ─── Build stats index from rankings ────────────────────────────────────────

function buildStatsIndex() {
  const statsMap = new Map(); // playerId -> stats

  function mergeStats(playerId, stats) {
    const existing = statsMap.get(playerId) || {};
    statsMap.set(playerId, { ...existing, ...stats });
  }

  // Top scorers
  for (const entry of loadRanking('topscorers.json')) {
    const leagueStats = entry.statistics?.find(s => s.league?.id === 128);
    if (!leagueStats) continue;
    mergeStats(entry.player.id, {
      rating: parseFloat(leagueStats.games?.rating) || null,
      appearances: leagueStats.games?.appearences || 0,
      minutes: leagueStats.games?.minutes || 0,
      goals: leagueStats.goals?.total || 0,
      assists: leagueStats.goals?.assists || 0,
      yellowCards: leagueStats.cards?.yellow || 0,
      redCards: leagueStats.cards?.red || 0,
      shots: leagueStats.shots?.total || 0,
      shotsOn: leagueStats.shots?.on || 0,
      passes: leagueStats.passes?.total || 0,
      passAccuracy: leagueStats.passes?.accuracy || null,
      dribbles: leagueStats.dribbles?.attempts || 0,
      dribblesSuccess: leagueStats.dribbles?.success || 0,
      tackles: leagueStats.tackles?.total || 0,
      saves: leagueStats.goals?.saves || 0,
    });
  }

  // Top assists (may have players not in scorers list)
  for (const entry of loadRanking('topassists.json')) {
    const leagueStats = entry.statistics?.find(s => s.league?.id === 128);
    if (!leagueStats) continue;
    mergeStats(entry.player.id, {
      rating: parseFloat(leagueStats.games?.rating) || statsMap.get(entry.player.id)?.rating || null,
      appearances: leagueStats.games?.appearences || statsMap.get(entry.player.id)?.appearances || 0,
      minutes: leagueStats.games?.minutes || statsMap.get(entry.player.id)?.minutes || 0,
      goals: leagueStats.goals?.total ?? statsMap.get(entry.player.id)?.goals ?? 0,
      assists: leagueStats.goals?.assists || 0,
      yellowCards: leagueStats.cards?.yellow ?? statsMap.get(entry.player.id)?.yellowCards ?? 0,
      redCards: leagueStats.cards?.red ?? statsMap.get(entry.player.id)?.redCards ?? 0,
    });
  }

  // Top yellow cards
  for (const entry of loadRanking('topyellowcards.json')) {
    const leagueStats = entry.statistics?.find(s => s.league?.id === 128);
    if (!leagueStats) continue;
    const existing = statsMap.get(entry.player.id) || {};
    mergeStats(entry.player.id, {
      ...existing,
      yellowCards: leagueStats.cards?.yellow || 0,
      redCards: leagueStats.cards?.red ?? existing.redCards ?? 0,
      appearances: leagueStats.games?.appearences || existing.appearances || 0,
    });
  }

  // Top red cards
  for (const entry of loadRanking('topredcards.json')) {
    const leagueStats = entry.statistics?.find(s => s.league?.id === 128);
    if (!leagueStats) continue;
    const existing = statsMap.get(entry.player.id) || {};
    mergeStats(entry.player.id, {
      ...existing,
      redCards: leagueStats.cards?.red || 0,
      yellowCards: leagueStats.cards?.yellow ?? existing.yellowCards ?? 0,
      appearances: leagueStats.games?.appearences || existing.appearances || 0,
    });
  }

  return statsMap;
}

// ─── Fantasy Price Calculation ──────────────────────────────────────────────
//
// Two-tier approach:
//   Players WITH real stats  → power score normalized to $7M–$15M
//   Players WITHOUT stats    → position + tier + age mapped to $1M–$7M
//
// This ensures top performers are clearly differentiated and every
// stat player is worth more than any no-stat player.

/** Compute a raw power score for a player with real stats. */
function computePowerScore(stats) {
  let score = 0;
  score += (stats.goals || 0) * 3;
  score += (stats.assists || 0) * 2;
  score += Math.max(0, ((stats.rating || 6) - 6.0)) * 5;
  score += Math.min(stats.appearances || 0, 30) * 0.1;
  return score;
}

/**
 * Two-pass price assignment.
 * Pass 1: compute raw scores for all stat players, find min/max.
 * Pass 2: normalize stat players to $7–$15M, no-stat players to $1–$7M.
 *
 * @param {Array} players - array of player objects (mutated in place)
 * @param {Map} teamMap   - apiId → team object
 */
function assignFantasyPrices(players, teamMap) {
  const POSITION_MULT = { GK: 0.85, DEF: 0.95, MID: 1.05, FWD: 1.15 };

  // ── Pass 1: power scores for stat players ──
  const statPlayers = players.filter(p => p.hasRealStats);
  const rawScores = new Map();
  // Threshold: players below this are "card-only" regulars, not offensive stars
  const STAR_THRESHOLD = 10;

  for (const p of statPlayers) {
    const raw = computePowerScore(p.stats);
    const posMult = POSITION_MULT[p.position] || 1.0;
    const tier = teamMap.get(p.teamApiId)?.tier || 3;
    const tierMult = TIER_MULTIPLIER[tier] || 1.0;
    rawScores.set(p.apiId, raw * posMult * tierMult);
  }

  // Only use real stars (above threshold) for the normalization range
  const starScores = [...rawScores.entries()].filter(([, s]) => s >= STAR_THRESHOLD);
  const minScore = Math.min(...starScores.map(([, s]) => s));
  const maxScore = Math.max(...starScores.map(([, s]) => s));

  // ── Pass 2: assign prices ──
  for (const p of players) {
    if (p.hasRealStats && rawScores.has(p.apiId)) {
      const raw = rawScores.get(p.apiId);

      if (raw >= STAR_THRESHOLD) {
        // Real star: normalize to $8–$15M with sqrt curve
        const normalized = maxScore > minScore
          ? (raw - minScore) / (maxScore - minScore)
          : 0.5;
        const curved = Math.sqrt(normalized);
        const price = 8.0 + curved * 7.0; // $8M–$15M
        p.fantasyPrice = Math.round(price * 10) / 10;
      } else {
        // Card-only / low-contribution regular: $5–$7.5M
        // They're confirmed starters (high appearances) but not offensive threats
        const tier = teamMap.get(p.teamApiId)?.tier || 3;
        const tierMult = TIER_MULTIPLIER[tier] || 1.0;
        const apps = p.stats?.appearances || 0;
        const appBonus = Math.min(apps, 35) / 35; // 0–1 based on appearances
        const price = 5.0 + appBonus * 2.0 * tierMult; // $5M–$7.5M
        p.fantasyPrice = Math.round(Math.min(7.5, price) * 10) / 10;
      }
    } else {
      // No real stats — distribute in $1M–$7M based on position + tier + age
      const BASE = { GK: 2.0, DEF: 3.0, MID: 3.5, FWD: 4.0 };
      const base = BASE[p.position] || 3.0;
      const tier = teamMap.get(p.teamApiId)?.tier || 3;
      const tierMult = TIER_MULTIPLIER[tier] || 1.0;

      // Age factor: prime age worth more
      const age = p.age || 25;
      let ageFactor = 1.0;
      if (age >= 24 && age <= 30) ageFactor = 1.15;
      else if (age >= 21 && age < 24) ageFactor = 1.05;
      else if (age < 21) ageFactor = 0.95;
      else if (age > 33) ageFactor = 0.8;
      else if (age > 30) ageFactor = 0.9;

      // Starters (low shirt numbers) tend to be more valuable
      let numberBonus = 1.0;
      if (p.number && p.number <= 11) numberBonus = 1.08;
      else if (p.number && p.number <= 20) numberBonus = 1.03;

      let price = base * tierMult * ageFactor * numberBonus;
      // Clamp to $1–$7M (never overlap with stat players)
      price = Math.min(6.9, Math.max(1.0, price));
      p.fantasyPrice = Math.round(price * 10) / 10;
    }
  }
}

// ─── Process players ────────────────────────────────────────────────────────

function processPlayers(teams, statsIndex) {
  const players = [];
  const squadsDir = resolve(RAW_DIR, 'squads');

  for (const team of teams) {
    const squadFile = resolve(squadsDir, `${team.apiId}.json`);
    if (!existsSync(squadFile)) {
      console.warn(`  WARNING: No squad file for ${team.name} (${team.apiId})`);
      continue;
    }

    const squadData = loadJson(squadFile);
    const squadPlayers = squadData.response?.[0]?.players || [];

    for (const p of squadPlayers) {
      const position = POSITION_MAP[p.position] || 'MID'; // default to MID if unknown
      const stats = statsIndex.get(p.id) || null;

      const player = {
        apiId: p.id,
        name: p.name,
        photo: p.photo,
        age: p.age,
        number: p.number,
        position,
        teamApiId: team.apiId,
        teamName: team.name,
        stats: stats ? {
          rating: stats.rating,
          appearances: stats.appearances,
          minutes: stats.minutes,
          goals: stats.goals,
          assists: stats.assists,
          yellowCards: stats.yellowCards,
          redCards: stats.redCards,
          shots: stats.shots || null,
          shotsOn: stats.shotsOn || null,
          passes: stats.passes || null,
          passAccuracy: stats.passAccuracy || null,
          tackles: stats.tackles || null,
          saves: stats.saves || null,
        } : null,
        hasRealStats: stats !== null,
        fantasyPrice: 0, // calculated in assignFantasyPrices pass
      };

      players.push(player);
    }
  }

  return players;
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  console.log('=== Process API-Football Data ===\n');

  // Process teams
  console.log('Processing teams...');
  const teams = processTeams();
  console.log(`  ${teams.length} teams processed`);

  // Build stats index from rankings
  console.log('Building stats index from rankings...');
  const statsIndex = buildStatsIndex();
  console.log(`  ${statsIndex.size} players with real stats`);

  // Process players
  console.log('Processing players...');
  const players = processPlayers(teams, statsIndex);
  console.log(`  ${players.length} total players`);

  // Assign fantasy prices (two-pass: normalize stat players, then no-stat players)
  console.log('Calculating fantasy prices...');
  const teamMap = new Map(teams.map(t => [t.apiId, t]));
  assignFantasyPrices(players, teamMap);

  // Stats breakdown
  const withStats = players.filter(p => p.hasRealStats);
  const byPosition = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  for (const p of players) byPosition[p.position]++;

  console.log(`\n  Position breakdown:`);
  console.log(`    GK:  ${byPosition.GK}`);
  console.log(`    DEF: ${byPosition.DEF}`);
  console.log(`    MID: ${byPosition.MID}`);
  console.log(`    FWD: ${byPosition.FWD}`);
  console.log(`\n  Players with real stats: ${withStats.length}`);

  // Price distribution
  const prices = players.map(p => p.fantasyPrice).sort((a, b) => a - b);
  console.log(`\n  Price range: $${prices[0]}M - $${prices[prices.length - 1]}M`);
  console.log(`  Median price: $${prices[Math.floor(prices.length / 2)]}M`);
  console.log(`  Avg price: $${(prices.reduce((s, p) => s + p, 0) / prices.length).toFixed(1)}M`);

  // Top 10 most expensive
  const topByPrice = [...players].sort((a, b) => b.fantasyPrice - a.fantasyPrice).slice(0, 10);
  console.log(`\n  Top 10 most expensive:`);
  for (const p of topByPrice) {
    const statsStr = p.hasRealStats ? `(${p.stats.goals}G ${p.stats.assists}A, rating ${p.stats.rating})` : '(no stats)';
    console.log(`    $${p.fantasyPrice}M - ${p.name} (${p.position}, ${p.teamName}) ${statsStr}`);
  }

  // Save processed data
  console.log('\nSaving processed data...');

  writeFileSync(resolve(OUT_DIR, 'teams.json'), JSON.stringify(teams, null, 2), 'utf-8');
  console.log(`  Saved: data/processed/teams.json (${teams.length} teams)`);

  writeFileSync(resolve(OUT_DIR, 'players.json'), JSON.stringify(players, null, 2), 'utf-8');
  console.log(`  Saved: data/processed/players.json (${players.length} players)`);

  console.log('\n=== DONE ===');
  console.log('Files ready for DB seeding in data/processed/');
}

main();
