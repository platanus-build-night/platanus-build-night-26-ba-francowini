import { prisma } from "@/lib/db";
import { TransactionType, TransactionStatus } from "@/generated/prisma/client";
import { getPaymentService } from "@/services/payment.service";
import { checkFeeWaiver } from "@/services/wallet.service";

const FEE_RATE = 0.03; // 3%

export interface BudgetTier {
  id: string;
  virtualAmount: number; // in millions
  priceArs: number;
}

const TIERS: BudgetTier[] = [
  { id: "tier-5m", virtualAmount: 5, priceArs: 1000 },
  { id: "tier-10m", virtualAmount: 10, priceArs: 1800 },
  { id: "tier-20m", virtualAmount: 20, priceArs: 3000 },
];

export interface BudgetPurchaseResult {
  transactionId: number;
  preferenceId: string;
  initPoint: string;
  tier: BudgetTier;
  fee: number;
  totalArs: number;
}

/**
 * Get available budget purchase tiers.
 */
export function getTiers(): BudgetTier[] {
  return TIERS;
}

/**
 * Create a budget purchase transaction and return an MP payment link.
 * Applies 3% fee unless user balance >= $20k ARS.
 */
export async function purchaseBudget(
  userId: string,
  tierId: string,
): Promise<BudgetPurchaseResult> {
  const tier = TIERS.find((t) => t.id === tierId);
  if (!tier) {
    throw new Error("Tier no válido");
  }

  const feeWaived = await checkFeeWaiver(userId);
  const fee = feeWaived
    ? 0
    : Math.round(tier.priceArs * FEE_RATE * 100) / 100;
  const totalArs = tier.priceArs + fee;

  const transaction = await prisma.transaction.create({
    data: {
      type: TransactionType.BUDGET_PURCHASE,
      status: TransactionStatus.PENDING,
      amountArs: tier.priceArs,
      description: fee > 0
        ? `Compra $${tier.virtualAmount}M presupuesto ($${tier.priceArs} + $${fee} comisión)`
        : `Compra $${tier.virtualAmount}M presupuesto (sin comisión)`,
      userId,
    },
  });

  const paymentService = getPaymentService();
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const paymentLink = await paymentService.createPaymentLink({
    title: `Presupuesto +$${tier.virtualAmount}M — Bilardeando`,
    description: `Compra $${tier.virtualAmount}M de presupuesto virtual`,
    amountArs: totalArs,
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
    tier,
    fee,
    totalArs,
  };
}

/**
 * Credit virtual budget after webhook confirmation (BUDGET_PURCHASE).
 * Idempotent: only credits if transaction is still PENDING.
 */
export async function creditBudget(
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
    return; // already credited — idempotent
  }

  if (transaction.type !== TransactionType.BUDGET_PURCHASE) {
    throw new Error("Transaction is not a budget purchase");
  }

  // Find the tier by matching the amount
  const tier = TIERS.find((t) => t.priceArs === transaction.amountArs);
  if (!tier) {
    throw new Error("Could not determine tier for transaction amount");
  }

  await prisma.$transaction([
    prisma.transaction.update({
      where: { id: transactionId },
      data: { status: TransactionStatus.APPROVED },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { virtualBudget: { increment: tier.virtualAmount } },
    }),
  ]);
}
