import { NextRequest, NextResponse } from "next/server";
import {
  getAuthOrError,
  successResponse,
  errorResponse,
} from "@/lib/api-helpers";
import {
  getSquadByUser,
  getSquadSummary,
  getOrCreateSquad,
  updateFormation,
  validateSquad,
} from "@/services/squad.service";
import type { FormationCode } from "@/types";
import { isValidFormation } from "@/lib/formations";

// GET /api/squad — get current user's squad
export async function GET() {
  const auth = await getAuthOrError();
  if (auth instanceof NextResponse) return auth;

  const squad = await getSquadByUser(auth.userId);
  if (!squad) {
    return successResponse({ squad: null, summary: null, validation: null });
  }

  const summary = await getSquadSummary(auth.userId);
  const validation = await validateSquad(auth.userId);

  const squadData = {
    id: squad.id,
    formation: squad.formation,
    players: squad.squadPlayers.map((sp) => ({
      id: sp.player.id,
      name: sp.player.name,
      photo: sp.player.photo,
      position: sp.player.position,
      teamName: sp.player.team.name,
      teamLogo: sp.player.team.logo,
      rating: sp.player.rating,
      fantasyPrice: sp.player.fantasyPrice,
      isStarter: sp.isStarter,
      isCaptain: sp.isCaptain,
      isCaptainSub: sp.isCaptainSub,
    })),
  };

  return successResponse({ squad: squadData, summary, validation });
}

// POST /api/squad — create squad
export async function POST(request: NextRequest) {
  const auth = await getAuthOrError();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => ({}));
  const formation = (body.formation || "4-3-3") as string;

  if (!isValidFormation(formation)) {
    return errorResponse("Formación inválida");
  }

  const squad = await getOrCreateSquad(auth.userId, formation as FormationCode);
  return successResponse({ id: squad.id, formation: squad.formation }, 201);
}

// PUT /api/squad — update formation
export async function PUT(request: NextRequest) {
  const auth = await getAuthOrError();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => ({}));
  const formation = body.formation as string;

  if (!formation || !isValidFormation(formation)) {
    return errorResponse("Formación inválida");
  }

  const result = await updateFormation(auth.userId, formation as FormationCode);
  if ("error" in result && result.error) {
    return errorResponse(result.error);
  }

  return successResponse({
    success: true,
    movedToBench: "movedToBench" in result ? result.movedToBench : [],
    promotedToStarter: "promotedToStarter" in result ? result.promotedToStarter : [],
  });
}
