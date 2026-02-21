import { NextRequest } from "next/server";
import {
  getAuthOrError,
  successResponse,
  errorResponse,
} from "@/lib/api-helpers";
import { joinLeague } from "@/services/league.service";

/**
 * POST /api/leagues/[code]/join — join a league, returns MP payment link
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const auth = await getAuthOrError();
  if (auth instanceof Response) return auth;

  const { code } = await params;

  try {
    const result = await joinLeague(auth.userId, code);
    return successResponse(result, 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al unirse a la liga";
    return errorResponse(message, 400);
  }
}
