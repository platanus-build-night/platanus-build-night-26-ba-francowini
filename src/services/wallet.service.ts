import { prisma } from "@/lib/db";
import { TransactionType, TransactionStatus } from "@/generated/prisma/client";
import { getPaymentService } from "@/services/payment.service";

const FEE_RATE = 0.03; // 3%
const FEE_WAIVER_THRESHOLD = 20000; // ARS

export interface WalletBalance {
  virtualBudget: number;
  realBalance: number;
  feeWaived: boolean;
}

export interface LoadBalanceResult {
  transactionId: number;
  preferenceId: string;
  initPoint: string;
  amountArs: number;
  fee: number;
  totalArs: number;
}

export interface TransactionPage {
  data: {
    id: number;
    type: TransactionType;
    status: TransactionStatus;
    amountArs: number;
    description: string | null;
    createdAt: Date;
  }[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Check whether the user qualifies for fee waiver (balance >= $20,000 ARS).
 */
export async function checkFeeWaiver(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { realBalance: true },
  });
  return (user?.realBalance ?? 0) >= FEE_WAIVER_THRESHOLD;
}

/**
 * Get user wallet balance and fee waiver status.
 */
export async function getBalance(userId: string): Promise<WalletBalance> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { virtualBudget: true, realBalance: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    virtualBudget: user.virtualBudget,
    realBalance: user.realBalance,
    feeWaived: user.realBalance >= FEE_WAIVER_THRESHOLD,
  };
}

/**
 * Create a wallet load transaction and return a Mercado Pago payment link.
 * Applies 3% service fee unless user has balance >= $20,000 ARS.
 */
export async function loadBalance(
  userId: string,
  amountArs: number,
): Promise<LoadBalanceResult> {
  if (amountArs <= 0) {
    throw new Error("El monto debe ser mayor a 0");
  }

  const feeWaived = await checkFeeWaiver(userId);
  const fee = feeWaived ? 0 : Math.round(amountArs * FEE_RATE * 100) / 100;
  const totalArs = amountArs + fee;

  // Create pending transaction
  const transaction = await prisma.transaction.create({
    data: {
      type: TransactionType.WALLET_LOAD,
      status: TransactionStatus.PENDING,
      amountArs,
      description: fee > 0
        ? `Carga de saldo $${amountArs} + comisión $${fee}`
        : `Carga de saldo $${amountArs} (sin comisión)`,
      userId,
    },
  });

  // Create MP payment link
  const paymentService = getPaymentService();
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const paymentLink = await paymentService.createPaymentLink({
    title: "Carga de saldo — Bilardeando",
    description: `Carga $${amountArs} ARS a tu billetera`,
    amountArs: totalArs,
    externalReference: String(transaction.id),
    backUrls: {
      success: `${baseUrl}/wallet?status=success`,
      failure: `${baseUrl}/wallet?status=failure`,
      pending: `${baseUrl}/wallet?status=pending`,
    },
  });

  // Save preference ID to transaction
  await prisma.transaction.update({
    where: { id: transaction.id },
    data: { mpPreferenceId: paymentLink.preferenceId },
  });

  return {
    transactionId: transaction.id,
    preferenceId: paymentLink.preferenceId,
    initPoint: paymentLink.initPoint,
    amountArs,
    fee,
    totalArs,
  };
}

/**
 * Get paginated transaction history for a user.
 */
export async function getTransactions(
  userId: string,
  page: number = 1,
  pageSize: number = 20,
): Promise<TransactionPage> {
  const skip = (page - 1) * pageSize;

  const [data, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      select: {
        id: true,
        type: true,
        status: true,
        amountArs: true,
        description: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.transaction.count({ where: { userId } }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Credit user real balance after successful webhook confirmation (WALLET_LOAD).
 * Idempotent: only credits if transaction is still PENDING.
 */
export async function creditBalance(
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
    // Already credited — idempotent
    return;
  }

  if (transaction.type !== TransactionType.WALLET_LOAD) {
    throw new Error("Transaction is not a wallet load");
  }

  await prisma.$transaction([
    prisma.transaction.update({
      where: { id: transactionId },
      data: { status: TransactionStatus.APPROVED },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { realBalance: { increment: transaction.amountArs } },
    }),
  ]);
}
