import { NextRequest } from "next/server";
import {
  getAuthOrError,
  errorResponse,
  successResponse,
  parsePagination,
} from "@/lib/api-helpers";
import {
  getBalance,
  loadBalance,
  getTransactions,
} from "@/services/wallet.service";

/**
 * GET /api/wallet — returns balance + paginated transactions (authenticated)
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthOrError();
  if (auth instanceof Response) return auth;

  const { searchParams } = request.nextUrl;
  const { page, pageSize } = parsePagination(searchParams);

  try {
    const [balance, transactions] = await Promise.all([
      getBalance(auth.userId),
      getTransactions(auth.userId, page, pageSize),
    ]);

    return successResponse({
      balance,
      transactions,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al obtener billetera";
    return errorResponse(message, 500);
  }
}

/**
 * POST /api/wallet — body: { amount: number } — creates load balance request, returns MP link
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthOrError();
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const { amount } = body as { amount?: number };

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return errorResponse("El monto debe ser un número mayor a 0");
    }

    if (amount > 1000000) {
      return errorResponse("El monto máximo es $1.000.000 ARS");
    }

    const result = await loadBalance(auth.userId, amount);

    return successResponse(result, 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al cargar saldo";
    return errorResponse(message, 500);
  }
}
