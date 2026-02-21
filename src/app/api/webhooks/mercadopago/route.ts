import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { TransactionType, TransactionStatus } from "@/generated/prisma/client";
import { getPaymentService } from "@/services/payment.service";
import { creditBalance } from "@/services/wallet.service";
import { creditBudget } from "@/services/budget-purchase.service";
import { unlockAi } from "@/services/bot/ai-unlock.service";

/**
 * POST /api/webhooks/mercadopago — receives MP payment notifications.
 * Does NOT require auth (called by MP servers).
 * Must be idempotent.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // MP sends different notification types — we only care about "payment"
    const topic = body.type ?? body.topic;
    if (topic !== "payment") {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Extract payment ID from notification
    const paymentId =
      body.data?.id?.toString() ?? body.id?.toString() ?? null;

    if (!paymentId) {
      return NextResponse.json(
        { error: "Missing payment ID" },
        { status: 400 },
      );
    }

    // Get payment status from MP
    const paymentService = getPaymentService();
    const paymentResult = await paymentService.handleWebhook(paymentId);

    // Find the transaction by mpPaymentId first, then by externalReference
    let transaction = await prisma.transaction.findFirst({
      where: { mpPaymentId: paymentId },
    });

    if (!transaction) {
      // Try finding by external reference (which we set to transaction ID)
      const externalRef = body.data?.external_reference ?? body.external_reference;
      if (externalRef) {
        const txId = parseInt(externalRef, 10);
        if (!isNaN(txId)) {
          transaction = await prisma.transaction.findUnique({
            where: { id: txId },
          });
        }
      }
    }

    if (!transaction) {
      // Try to find any pending transaction that matches — last resort
      // This handles mock flow where externalReference is in the preference ID
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    // Store mpPaymentId if not already set
    if (!transaction.mpPaymentId) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { mpPaymentId: paymentId },
      });
    }

    // Map payment result status to our TransactionStatus
    const statusMap: Record<string, TransactionStatus> = {
      approved: TransactionStatus.APPROVED,
      rejected: TransactionStatus.REJECTED,
      pending: TransactionStatus.PENDING,
    };

    const newStatus = statusMap[paymentResult.status] ?? TransactionStatus.PENDING;

    // If already in a terminal state (APPROVED, REJECTED, REFUNDED), skip — idempotent
    if (
      transaction.status === TransactionStatus.APPROVED ||
      transaction.status === TransactionStatus.REJECTED ||
      transaction.status === TransactionStatus.REFUNDED
    ) {
      return NextResponse.json({ received: true, status: transaction.status });
    }

    // Handle based on payment result
    if (newStatus === TransactionStatus.APPROVED) {
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
          // For LEAGUE_BUYIN, SUBSTITUTION_FEE, etc. — just update status
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: TransactionStatus.APPROVED },
          });
          break;
      }
    } else if (newStatus === TransactionStatus.REJECTED) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.REJECTED },
      });
    }
    // If still PENDING, do nothing — wait for next notification

    return NextResponse.json({ received: true, status: newStatus });
  } catch (error) {
    console.error("Webhook error:", error);
    // Return 200 to prevent MP from retrying on our errors
    return NextResponse.json({ received: true, error: "Internal error" }, { status: 200 });
  }
}

/**
 * GET /api/webhooks/mercadopago — health check for MP webhook verification.
 */
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
