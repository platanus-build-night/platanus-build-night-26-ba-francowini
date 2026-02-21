"use client";

import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import type { LeaderboardEntry } from "@/types";

interface LeagueLeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  matchdayNames?: { id: number; name: string }[];
  leagueName: string;
}

export function LeagueLeaderboard({
  entries,
  currentUserId,
  matchdayNames,
  leagueName,
}: LeagueLeaderboardProps) {
  return (
    <LeaderboardTable
      entries={entries}
      currentUserId={currentUserId}
      matchdayNames={matchdayNames}
      page={1}
      totalPages={1}
      onPageChange={() => {}}
      title={`Ranking — ${leagueName}`}
    />
  );
}
