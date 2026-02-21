import { NextRequest } from "next/server";
import {
  getAuthOrError,
  errorResponse,
  successResponse,
} from "@/lib/api-helpers";
import { getTiers, purchaseBudget } from "@/services/budget-purchase.service";
import { checkFeeWaiver } from "@/services/wallet.service";

/**
 * GET /api/wallet/budget — returns available tiers with prices
 */
export async function GET() {
  const auth = await getAuthOrError();
  if (auth instanceof Response) return auth;

  try {
    const tiers = getTiers();
    const feeWaived = await checkFeeWaiver(auth.userId);

    return successResponse({
      tiers,
      feeWaived,
      feeRate: feeWaived ? 0 : 0.03,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al obtener tiers";
    return errorResponse(message, 500);
  }
}

/**
 * POST /api/wallet/budget — body: { tierId: string } — creates budget purchase, returns MP link
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthOrError();
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const { tierId } = body as { tierId?: string };

    if (!tierId || typeof tierId !== "string") {
      return errorResponse("Se requiere un tierId válido");
    }

    const result = await purchaseBudget(auth.userId, tierId);

    return successResponse(result, 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al comprar presupuesto";
    return errorResponse(message, 400);
  }
}
