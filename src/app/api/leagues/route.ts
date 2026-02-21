import { NextRequest } from "next/server";
import {
  getAuthOrError,
  successResponse,
  errorResponse,
} from "@/lib/api-helpers";
import {
  getUserLeagues,
  createLeague,
  getAvailableMatchdays,
} from "@/services/league.service";

/**
 * GET /api/leagues — list user's leagues + available matchdays for creation
 */
export async function GET() {
  const auth = await getAuthOrError();
  if (auth instanceof Response) return auth;

  try {
    const [leagues, matchdays] = await Promise.all([
      getUserLeagues(auth.userId),
      getAvailableMatchdays(),
    ]);

    return successResponse({ leagues, matchdays });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al cargar ligas";
    return errorResponse(message, 500);
  }
}

/**
 * POST /api/leagues — create a new league
 * Body: { name, buyIn, maxPlayers?, startMatchdayId, endMatchdayId }
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthOrError();
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const { name, buyIn, maxPlayers, startMatchdayId, endMatchdayId } = body;

    if (!name || typeof name !== "string") {
      return errorResponse("Nombre es requerido");
    }
    if (!buyIn || typeof buyIn !== "number") {
      return errorResponse("Buy-in es requerido");
    }
    if (!startMatchdayId || !endMatchdayId) {
      return errorResponse("Fechas de inicio y fin son requeridas");
    }

    const league = await createLeague(auth.userId, {
      name,
      buyIn,
      maxPlayers,
      startMatchdayId,
      endMatchdayId,
    });

    return successResponse(league, 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al crear liga";
    return errorResponse(message, 400);
  }
}
