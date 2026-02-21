import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { TransactionType, TransactionStatus } from "@/generated/prisma/client";
import { creditBalance } from "@/services/wallet.service";
import { creditBudget } from "@/services/budget-purchase.service";
import { unlockAi } from "@/services/bot/ai-unlock.service";

/**
 * GET /api/webhooks/mercadopago/mock — Mock payment completion handler.
 * Used in development when MERCADOPAGO_ACCESS_TOKEN is not set.
 * Simulates a successful payment and redirects back to the wallet.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const prefId = searchParams.get("pref");
  const redirect = searchParams.get("redirect") ?? "/wallet";

  if (!prefId) {
    return NextResponse.json(
      { error: "Missing preference ID" },
      { status: 400 },
    );
  }

  // Extract transaction ID from external reference in the preference ID
  // MockPaymentService creates: mock_pref_{timestamp}_{externalReference}
  const parts = prefId.split("_");
  const externalRef = parts.slice(3).join("_"); // everything after mock_pref_{timestamp}_
  const transactionId = parseInt(externalRef, 10);

  if (isNaN(transactionId)) {
    return NextResponse.redirect(new URL(redirect, request.url));
  }

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.redirect(new URL(redirect, request.url));
    }

    // Skip if already processed (idempotent)
    if (transaction.status !== TransactionStatus.PENDING) {
      return NextResponse.redirect(new URL(redirect, request.url));
    }

    // Store mock payment ID
    const mockPaymentId = `mock_pay_${Date.now()}`;
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { mpPaymentId: mockPaymentId },
    });

    // Process based on transaction type
    switch (transaction.type) {
      case TransactionType.WALLET_LOAD:
        await creditBalance(transaction.userId, transaction.id);
        break;

      case TransactionType.BUDGET_PURCHASE:
        await creditBudget(transaction.userId, transaction.id);
        break;

      case TransactionType.AI_UNLOCK:
        await unlockAi(transaction.userId, transaction.id);
        break;

      default:
        await prisma.transaction.update({
          where: { id: transactionId },
          data: { status: TransactionStatus.APPROVED },
        });
        break;
    }
  } catch (error) {
    console.error("Mock webhook error:", error);
  }

  return NextResponse.redirect(new URL(redirect, request.url));
}
