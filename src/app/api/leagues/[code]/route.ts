import { NextRequest } from "next/server";
import {
  getAuthOrError,
  successResponse,
  errorResponse,
} from "@/lib/api-helpers";
import { getLeagueByCode } from "@/services/league.service";
import { getLeagueLeaderboard } from "@/services/leaderboard.service";
import { prisma } from "@/lib/db";

/**
 * GET /api/leagues/[code] — league detail with members and leaderboard
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const auth = await getAuthOrError();
  if (auth instanceof Response) return auth;

  const { code } = await params;

  try {
    const league = await getLeagueByCode(code, auth.userId);
    if (!league) {
      return errorResponse("Liga no encontrada", 404);
    }

    // Get leaderboard for the league
    const leaderboard = await getLeagueLeaderboard(league.id);

    // Get matchday names
    const matchdays = await prisma.matchday.findMany({
      where: {
        id: {
          gte: league.startMatchday.id,
          lte: league.endMatchday.id,
        },
      },
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    });

    return successResponse({
      league,
      leaderboard: leaderboard.data,
      matchdays,
      currentUserId: auth.userId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al cargar liga";
    return errorResponse(message, 500);
  }
}
