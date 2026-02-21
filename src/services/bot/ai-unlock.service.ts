import { prisma } from "@/lib/db";
import { TransactionType, TransactionStatus } from "@/generated/prisma/client";
import { getPaymentService } from "@/services/payment.service";

const AI_UNLOCK_PRICE_ARS = 500;

export interface AiUnlockResult {
  transactionId: number;
  preferenceId: string;
  initPoint: string;
  amountArs: number;
}

/**
 * Create an AI unlock purchase and return an MP payment link.
 * No fee applied — fixed price product.
 */
export async function purchaseAiUnlock(
  userId: string,
): Promise<AiUnlockResult> {
  // Check if already unlocked
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { aiUnlocked: true },
  });

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  if (user.aiUnlocked) {
    throw new Error("AI Premium ya está activado");
  }

  // Check for existing pending AI_UNLOCK transaction
  const existingPending = await prisma.transaction.findFirst({
    where: {
      userId,
      type: TransactionType.AI_UNLOCK,
      status: TransactionStatus.PENDING,
    },
  });

  if (existingPending) {
    // Return existing pending transaction info if it has a preference
    if (existingPending.mpPreferenceId) {
      const paymentService = getPaymentService();
      const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

      // Create a new link since we can't recover the old one
      const paymentLink = await paymentService.createPaymentLink({
        title: "AI Premium — Bilardeando",
        description: "Desbloquear asistente AI premium",
        amountArs: AI_UNLOCK_PRICE_ARS,
        externalReference: String(existingPending.id),
        backUrls: {
          success: `${baseUrl}/wallet?status=success`,
          failure: `${baseUrl}/wallet?status=failure`,
          pending: `${baseUrl}/wallet?status=pending`,
        },
      });

      await prisma.transaction.update({
        where: { id: existingPending.id },
        data: { mpPreferenceId: paymentLink.preferenceId },
      });

      return {
        transactionId: existingPending.id,
        preferenceId: paymentLink.preferenceId,
        initPoint: paymentLink.initPoint,
        amountArs: AI_UNLOCK_PRICE_ARS,
      };
    }
  }

  const transaction = await prisma.transaction.create({
    data: {
      type: TransactionType.AI_UNLOCK,
      status: TransactionStatus.PENDING,
      amountArs: AI_UNLOCK_PRICE_ARS,
      description: "Desbloqueo AI Premium",
      userId,
    },
  });

  const paymentService = getPaymentService();
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const paymentLink = await paymentService.createPaymentLink({
    title: "AI Premium — Bilardeando",
    description: "Desbloquear asistente AI premium",
    amountArs: AI_UNLOCK_PRICE_ARS,
    externalReference: String(transaction.id),
    backUrls: {
      success: `${baseUrl}/wallet?status=success`,
      failure: `${baseUrl}/wallet?status=failure`,
      pending: `${baseUrl}/wallet?status=pending`,
    },
  });

  await prisma.transaction.update({
    where: { id: transaction.id },
    data: { mpPreferenceId: paymentLink.preferenceId },
  });

  return {
    transactionId: transaction.id,
    preferenceId: paymentLink.preferenceId,
    initPoint: paymentLink.initPoint,
    amountArs: AI_UNLOCK_PRICE_ARS,
  };
}

/**
 * Unlock AI premium for the user after webhook confirmation.
 * Idempotent: only unlocks if transaction is still PENDING.
 */
export async function unlockAi(
  userId: string,
  transactionId: number,
): Promise<void> {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction || transaction.userId !== userId) {
    throw new Error("Transaction not found");
  }

  if (transaction.status === TransactionStatus.APPROVED) {
    return; // already unlocked — idempotent
  }

  if (transaction.type !== TransactionType.AI_UNLOCK) {
    throw new Error("Transaction is not an AI unlock");
  }

  await prisma.$transaction([
    prisma.transaction.update({
      where: { id: transactionId },
      data: { status: TransactionStatus.APPROVED },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { aiUnlocked: true },
    }),
  ]);
}
