/**
 * Database seed script for Bilardeando.
 *
 * Loads teams, players, matchdays, matches, and player stats from JSON fixtures.
 * Creates demo users with pre-built squads for testing.
 *
 * Run: npx tsx prisma/seed.ts
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { Position, MatchdayStatus, MatchStatus } from "../src/generated/prisma/client";

import teamsJson from "../data/processed/teams.json";
import playersJson from "../data/processed/players.json";
import matchesJson from "../src/mock-data/matches.json";
import statsJson from "../src/mock-data/stats.json";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

// ── Type helpers for JSON data ──

interface TeamJson {
  apiId: number;
  name: string;
  code: string | null;
  logo: string;
  founded: number;
  national: boolean;
  venue: {
    name: string;
    city: string;
    capacity: number;
    image: string;
  } | null;
  tier: 1 | 2 | 3;
}

interface PlayerJson {
  apiId: number;
  name: string;
  photo: string;
  age: number | null;
  number: number | null;
  position: "GK" | "DEF" | "MID" | "FWD";
  teamApiId: number;
  teamName: string;
  stats: {
    rating: number | null;
    appearances: number;
    minutes: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
  } | null;
  hasRealStats: boolean;
  fantasyPrice: number;
}

interface MatchdayJson {
  id: number;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
}

interface MatchJson {
  id: number;
  matchdayId: number;
  homeTeamApiId: number;
  awayTeamApiId: number;
  homeScore: number;
  awayScore: number;
  status: string;
  kickoff: string;
}

interface StatJson {
  playerApiId: number;
  matchId: number;
  rating: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  saves: number;
}

async function main() {
  console.log("Seeding database...");

  // Clear ALL data (in reverse dependency order) — full flush
  await prisma.squadPlayerPoints.deleteMany();
  await prisma.matchdayPoints.deleteMany();
  await prisma.squadPlayer.deleteMany();
  await prisma.squad.deleteMany();
  await prisma.leagueMember.deleteMany();
  await prisma.league.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.playerMatchStat.deleteMany();
  await prisma.match.deleteMany();
  await prisma.matchday.deleteMany();
  await prisma.player.deleteMany();
  await prisma.team.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("Flushed ALL data (including users).");

  // ── 1. Seed Teams ──
  const teams = teamsJson as TeamJson[];
  const teamApiIdToDbId = new Map<number, number>();

  for (const team of teams) {
    const created = await prisma.team.create({
      data: {
        apiId: team.apiId,
        name: team.name,
        code: team.code,
        logo: team.logo,
        founded: team.founded,
        tier: team.tier,
        venueName: team.venue?.name ?? null,
        venueCity: team.venue?.city ?? null,
        venueCapacity: team.venue?.capacity ?? null,
        venueImage: team.venue?.image ?? null,
      },
    });
    teamApiIdToDbId.set(team.apiId, created.id);
  }
  console.log(`Seeded ${teams.length} teams.`);

  // ── 2. Seed Players ──
  const players = playersJson as PlayerJson[];
  const playerApiIdToDbId = new Map<number, number>();
  let skippedPlayers = 0;

  // Batch in chunks for performance
  const BATCH_SIZE = 50;
  for (let i = 0; i < players.length; i += BATCH_SIZE) {
    const batch = players.slice(i, i + BATCH_SIZE);
    for (const player of batch) {
      const teamDbId = teamApiIdToDbId.get(player.teamApiId);
      if (!teamDbId) {
        skippedPlayers++;
        continue;
      }

      const created = await prisma.player.create({
        data: {
          apiId: player.apiId,
          name: player.name,
          photo: player.photo ?? "",
          age: player.age,
          number: player.number,
          position: player.position as Position,
          fantasyPrice: player.fantasyPrice,
          rating: player.stats?.rating ?? null,
          appearances: player.stats?.appearances ?? 0,
          minutes: player.stats?.minutes ?? 0,
          goals: player.stats?.goals ?? 0,
          assists: player.stats?.assists ?? 0,
          yellowCards: player.stats?.yellowCards ?? 0,
          redCards: player.stats?.redCards ?? 0,
          hasRealStats: player.hasRealStats,
          team: { connect: { id: teamDbId } },
        },
      });
      playerApiIdToDbId.set(player.apiId, created.id);
    }
  }
  console.log(
    `Seeded ${playerApiIdToDbId.size} players (${skippedPlayers} skipped — missing team).`,
  );

  // ── 3. Seed Matchdays ──
  const matchdays = matchesJson.matchdays as MatchdayJson[];
  const matchdayJsonIdToDbId = new Map<number, number>();

  for (const md of matchdays) {
    const created = await prisma.matchday.create({
      data: {
        name: md.name,
        status: md.status as MatchdayStatus,
        startDate: new Date(md.startDate),
        endDate: new Date(md.endDate),
      },
    });
    matchdayJsonIdToDbId.set(md.id, created.id);
  }
  console.log(`Seeded ${matchdays.length} matchdays.`);

  // ── 4. Seed Matches ──
  const matches = matchesJson.matches as MatchJson[];
  const matchJsonIdToDbId = new Map<number, number>();

  for (const match of matches) {
    const matchdayDbId = matchdayJsonIdToDbId.get(match.matchdayId);
    const homeTeamDbId = teamApiIdToDbId.get(match.homeTeamApiId);
    const awayTeamDbId = teamApiIdToDbId.get(match.awayTeamApiId);

    if (!matchdayDbId || !homeTeamDbId || !awayTeamDbId) {
      console.warn(`Skipping match ${match.id}: missing references`);
      continue;
    }

    const created = await prisma.match.create({
      data: {
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        status: match.status as MatchStatus,
        kickoff: new Date(match.kickoff),
        matchday: { connect: { id: matchdayDbId } },
        homeTeam: { connect: { id: homeTeamDbId } },
        awayTeam: { connect: { id: awayTeamDbId } },
      },
    });
    matchJsonIdToDbId.set(match.id, created.id);
  }
  console.log(`Seeded ${matchJsonIdToDbId.size} matches.`);

  // ── 5. Seed Player Match Stats ──
  const stats = statsJson as StatJson[];
  let seededStats = 0;
  let skippedStats = 0;

  for (let i = 0; i < stats.length; i += BATCH_SIZE) {
    const batch = stats.slice(i, i + BATCH_SIZE);
    for (const stat of batch) {
      const playerDbId = playerApiIdToDbId.get(stat.playerApiId);
      const matchDbId = matchJsonIdToDbId.get(stat.matchId);

      if (!playerDbId || !matchDbId) {
        skippedStats++;
        continue;
      }

      await prisma.playerMatchStat.create({
        data: {
          rating: stat.rating,
          minutesPlayed: stat.minutesPlayed,
          goals: stat.goals,
          assists: stat.assists,
          yellowCards: stat.yellowCards,
          redCards: stat.redCards,
          saves: stat.saves,
          player: { connect: { id: playerDbId } },
          match: { connect: { id: matchDbId } },
        },
      });
      seededStats++;
    }
  }
  console.log(
    `Seeded ${seededStats} player match stats (${skippedStats} skipped).`,
  );

  // ── 6. Create Demo Users with Squads ──
  // Juan: squad built by rating (top-rated, ~$101M) — for testing squad/transfers
  // María: squad built by rating (top-rated, ~$101M)
  // Carlos: squad built by rating with offset (~$80M)
  const demoUsers = [
    { email: "demo1@bilardeando.com", name: "Juan Demo", buildSquad: true, ratingOffset: 0 },
    { email: "demo2@bilardeando.com", name: "María Demo", buildSquad: true, ratingOffset: 0 },
    { email: "demo3@bilardeando.com", name: "Carlos Demo", buildSquad: true, ratingOffset: 5 },
  ];

  for (const demoUser of demoUsers) {
    const user = await prisma.user.create({
      data: {
        email: demoUser.email,
        name: demoUser.name,
        virtualBudget: 150,
        realBalance: 10000,
      },
    });

    if (!demoUser.buildSquad) {
      console.log(
        `Created demo user ${demoUser.name} without squad ($150M budget).`,
      );
      continue;
    }

    // Build a 4-3-3 squad (18 players) sorted by price ascending to stay within budget
    // GK: 3 (1 starter + 2 bench), DEF: 6 (4 starter + 2 bench),
    // MID: 5 (3 starter + 2 bench), FWD: 4 (3 starter + 1 bench) = 18 total
    const offset = demoUser.ratingOffset * 18; // offset by full squad to avoid overlap
    const gks = await prisma.player.findMany({
      where: { position: "GK" },
      orderBy: { fantasyPrice: "asc" },
      skip: offset,
      take: 3,
    });
    const defs = await prisma.player.findMany({
      where: { position: "DEF" },
      orderBy: { fantasyPrice: "asc" },
      skip: offset,
      take: 6,
    });
    const mids = await prisma.player.findMany({
      where: { position: "MID" },
      orderBy: { fantasyPrice: "asc" },
      skip: offset,
      take: 5,
    });
    const fwds = await prisma.player.findMany({
      where: { position: "FWD" },
      orderBy: { fantasyPrice: "asc" },
      skip: offset,
      take: 4,
    });

    // 4-3-3: 1 GK + 4 DEF + 3 MID + 3 FWD starters, rest on bench
    const starters = [
      ...gks.slice(0, 1),
      ...defs.slice(0, 4),
      ...mids.slice(0, 3),
      ...fwds.slice(0, 3),
    ];
    const bench = [
      ...gks.slice(1, 3),
      ...defs.slice(4, 6),
      ...mids.slice(3, 5),
      ...fwds.slice(3, 4),
    ];

    const totalValue = [...starters, ...bench].reduce(
      (sum, p) => sum + p.fantasyPrice,
      0,
    );

    const squad = await prisma.squad.create({
      data: {
        formation: "4-3-3",
        user: { connect: { id: user.id } },
      },
    });

    // Add starters
    for (let i = 0; i < starters.length; i++) {
      await prisma.squadPlayer.create({
        data: {
          squad: { connect: { id: squad.id } },
          player: { connect: { id: starters[i].id } },
          isStarter: true,
          isCaptain: i === 0,
          isCaptainSub: i === 1,
        },
      });
    }

    // Add bench players
    for (const benchPlayer of bench) {
      await prisma.squadPlayer.create({
        data: {
          squad: { connect: { id: squad.id } },
          player: { connect: { id: benchPlayer.id } },
          isStarter: false,
          isCaptain: false,
          isCaptainSub: false,
        },
      });
    }

    // Update user budget
    await prisma.user.update({
      where: { id: user.id },
      data: { virtualBudget: 150 - totalValue },
    });

    console.log(
      `Created demo user ${demoUser.name} with squad (${starters.length} starters + ${bench.length} bench, $${totalValue.toFixed(1)}M spent, $${(150 - totalValue).toFixed(1)}M remaining).`,
    );
  }

  console.log("\nSeed complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
