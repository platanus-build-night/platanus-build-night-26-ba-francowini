#!/usr/bin/env node
/**
 * Fetches all Argentine league data from API-Football and saves raw JSON responses.
 *
 * Usage: node data/scripts/fetch-api-football.mjs
 *
 * Requires: API_FOOTBALL_KEY env var (or .env file in project root)
 * Budget: 33 of 100 daily requests (free tier)
 * Rate limit: 10 requests/minute on free tier — script auto-throttles
 *
 * The script is resumable: it skips files that already have valid data.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '../..');
const RAW_DIR = resolve(__dirname, '../raw');

// Load .env manually (no dotenv dependency)
function loadEnv() {
  const envPath = resolve(PROJECT_ROOT, '.env');
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  }
}

loadEnv();

const API_KEY = process.env.API_FOOTBALL_KEY;
if (!API_KEY) {
  console.error('ERROR: API_FOOTBALL_KEY not set. Add it to .env or export it.');
  process.exit(1);
}

const BASE_URL = 'https://v3.football.api-sports.io';
const LEAGUE_ID = 128; // Liga Profesional Argentina
const SEASON = 2024;
const RATE_LIMIT = 10; // requests per minute on free tier
const RATE_WINDOW_MS = 62_000; // 62s to be safe

let requestCount = 0;
let windowRequestCount = 0;
let windowStartTime = Date.now();

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function throttle() {
  windowRequestCount++;
  if (windowRequestCount >= RATE_LIMIT) {
    const elapsed = Date.now() - windowStartTime;
    const waitTime = RATE_WINDOW_MS - elapsed;
    if (waitTime > 0) {
      console.log(`\n  Rate limit: waiting ${Math.ceil(waitTime / 1000)}s before next batch...\n`);
      await sleep(waitTime);
    }
    windowRequestCount = 0;
    windowStartTime = Date.now();
  }
}

async function apiFetch(endpoint) {
  await throttle();
  requestCount++;
  const url = `${BASE_URL}${endpoint}`;
  console.log(`  [${requestCount}] GET ${endpoint}`);

  const res = await fetch(url, {
    headers: { 'x-apisports-key': API_KEY }
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${endpoint}: ${await res.text()}`);
  }

  const data = await res.json();

  // Check for API errors (rate limit, etc)
  if (data.errors && Object.keys(data.errors).length > 0) {
    if (data.errors.rateLimit) {
      console.log('  Hit rate limit, waiting 65s...');
      await sleep(65_000);
      windowRequestCount = 0;
      windowStartTime = Date.now();
      // Retry once
      requestCount++;
      console.log(`  [${requestCount}] RETRY GET ${endpoint}`);
      const retryRes = await fetch(url, {
        headers: { 'x-apisports-key': API_KEY }
      });
      const retryData = await retryRes.json();
      if (retryData.errors && Object.keys(retryData.errors).length > 0) {
        console.error(`  FAILED after retry:`, retryData.errors);
        return retryData;
      }
      return retryData;
    }
    console.warn(`  WARNING: API errors for ${endpoint}:`, data.errors);
  }

  // Rate limit info from headers
  const remaining = res.headers.get('x-ratelimit-remaining');
  if (remaining !== null) {
    console.log(`  Daily requests remaining: ${remaining}`);
  }

  return data;
}

function saveJson(filename, data) {
  const filepath = resolve(RAW_DIR, filename);
  mkdirSync(dirname(filepath), { recursive: true });
  writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`  Saved: data/raw/${filename}`);
}

/**
 * Check if a raw JSON file already has valid data (non-empty response).
 * Used for resumability — skip files we already fetched successfully.
 */
function hasValidData(filename) {
  const filepath = resolve(RAW_DIR, filename);
  if (!existsSync(filepath)) return false;
  try {
    const data = JSON.parse(readFileSync(filepath, 'utf-8'));
    return data.response && data.response.length > 0;
  } catch {
    return false;
  }
}

async function main() {
  console.log('=== API-Football Data Fetcher ===');
  console.log(`League: ${LEAGUE_ID} (Liga Profesional Argentina)`);
  console.log(`Season: ${SEASON}`);
  console.log(`Rate limit: ${RATE_LIMIT} req/min (auto-throttled)`);
  console.log(`Output: data/raw/`);
  console.log(`Resumable: skips files with valid data\n`);

  // Step 1: Fetch all teams
  let teamsData;
  if (hasValidData('teams.json')) {
    console.log('Step 1/6: Teams already fetched, loading from cache...');
    teamsData = JSON.parse(readFileSync(resolve(RAW_DIR, 'teams.json'), 'utf-8'));
  } else {
    console.log('Step 1/6: Fetching teams...');
    teamsData = await apiFetch(`/teams?league=${LEAGUE_ID}&season=${SEASON}`);
    saveJson('teams.json', teamsData);
  }
  const teams = teamsData.response || [];
  console.log(`  Found ${teams.length} teams\n`);

  // Step 2: Fetch squads for each team
  console.log(`Step 2/6: Fetching squads for ${teams.length} teams...`);
  let skippedSquads = 0;
  for (const teamEntry of teams) {
    const teamId = teamEntry.team.id;
    const teamName = teamEntry.team.name;
    const filename = `squads/${teamId}.json`;

    if (hasValidData(filename)) {
      const cached = JSON.parse(readFileSync(resolve(RAW_DIR, filename), 'utf-8'));
      const count = cached.response?.[0]?.players?.length || 0;
      console.log(`  SKIP ${teamName} (${teamId}) — already cached (${count} players)`);
      skippedSquads++;
      continue;
    }

    console.log(`  Fetching squad for ${teamName} (${teamId})...`);
    const squadData = await apiFetch(`/players/squads?team=${teamId}`);
    saveJson(filename, squadData);
    const playerCount = squadData.response?.[0]?.players?.length || 0;
    console.log(`    ${playerCount} players`);
  }
  console.log(`  Skipped: ${skippedSquads}, Fetched: ${teams.length - skippedSquads}\n`);

  // Step 3–6: Top rankings
  const rankings = [
    { step: 3, name: 'top scorers', endpoint: `/players/topscorers?league=${LEAGUE_ID}&season=${SEASON}`, file: 'topscorers.json' },
    { step: 4, name: 'top assists', endpoint: `/players/topassists?league=${LEAGUE_ID}&season=${SEASON}`, file: 'topassists.json' },
    { step: 5, name: 'top yellow cards', endpoint: `/players/topyellowcards?league=${LEAGUE_ID}&season=${SEASON}`, file: 'topyellowcards.json' },
    { step: 6, name: 'top red cards', endpoint: `/players/topredcards?league=${LEAGUE_ID}&season=${SEASON}`, file: 'topredcards.json' },
  ];

  for (const { step, name, endpoint, file } of rankings) {
    if (hasValidData(file)) {
      const cached = JSON.parse(readFileSync(resolve(RAW_DIR, file), 'utf-8'));
      console.log(`Step ${step}/6: ${name} already cached (${cached.response?.length || 0} entries)`);
      continue;
    }
    console.log(`Step ${step}/6: Fetching ${name}...`);
    const data = await apiFetch(endpoint);
    saveJson(file, data);
    console.log(`  ${data.response?.length || 0} entries\n`);
  }

  // Summary
  console.log('\n=== DONE ===');
  console.log(`Total API requests made this run: ${requestCount}`);
  console.log(`Files saved in: data/raw/`);
  console.log(`\nNext step: run data/scripts/process-data.mjs to generate processed data`);
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
