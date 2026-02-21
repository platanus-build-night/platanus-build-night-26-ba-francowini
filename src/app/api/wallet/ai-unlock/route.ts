import {
  getAuthOrError,
  errorResponse,
  successResponse,
} from "@/lib/api-helpers";
import { purchaseAiUnlock } from "@/services/bot/ai-unlock.service";

/**
 * POST /api/wallet/ai-unlock — creates AI unlock purchase, returns MP link
 */
export async function POST() {
  const auth = await getAuthOrError();
  if (auth instanceof Response) return auth;

  try {
    const result = await purchaseAiUnlock(auth.userId);

    return successResponse(result, 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al procesar";
    return errorResponse(message, 400);
  }
}
