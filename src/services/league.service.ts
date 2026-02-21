import { prisma } from "@/lib/db";
import { LeagueStatus, TransactionType, TransactionStatus } from "@/generated/prisma/client";
import { getPaymentService } from "@/services/payment.service";

const MIN_BUYIN = 10000;
const MAX_BUYIN = 100000;
const BUYIN_STEP = 5000;
const DEFAULT_RAKE = 5; // 5% platform rake

export interface CreateLeagueInput {
  name: string;
  buyIn: number;
  maxPlayers?: number;
  startMatchdayId: number;
  endMatchdayId: number;
}

export interface LeagueSummary {
  id: number;
  name: string;
  code: string;
  status: LeagueStatus;
  buyIn: number;
  maxPlayers: number;
  memberCount: number;
  paidCount: number;
  startMatchday: { id: number; name: string };
  endMatchday: { id: number; name: string };
  isCreator: boolean;
  isMember: boolean;
  isPaid: boolean;
}

/**
 * Create a new private league.
 */
export async function createLeague(
  userId: string,
  input: CreateLeagueInput,
) {
  // Validate buy-in
  if (input.buyIn < MIN_BUYIN || input.buyIn > MAX_BUYIN) {
    throw new Error(`Buy-in debe ser entre $${MIN_BUYIN.toLocaleString()} y $${MAX_BUYIN.toLocaleString()} ARS`);
  }
  if (input.buyIn % BUYIN_STEP !== 0) {
    throw new Error(`Buy-in debe ser múltiplo de $${BUYIN_STEP.toLocaleString()}`);
  }

  // Validate matchday range
  if (input.startMatchdayId >= input.endMatchdayId) {
    throw new Error("La fecha de inicio debe ser anterior a la de fin");
  }

  const maxPlayers = input.maxPlayers ?? 20;
  if (maxPlayers < 3 || maxPlayers > 100) {
    throw new Error("El máximo de jugadores debe ser entre 3 y 100");
  }

  const league = await prisma.league.create({
    data: {
      name: input.name.trim(),
      buyIn: input.buyIn,
      maxPlayers,
      rakePercent: DEFAULT_RAKE,
      creatorId: userId,
      startMatchdayId: input.startMatchdayId,
      endMatchdayId: input.endMatchdayId,
    },
    include: {
      startMatchday: { select: { id: true, name: true } },
      endMatchday: { select: { id: true, name: true } },
    },
  });

  // Auto-join the creator (not yet paid)
  await prisma.leagueMember.create({
    data: { userId, leagueId: league.id },
  });

  return league;
}

/**
 * Join a league by invite code.
 * Returns an MP payment link for the buy-in.
 */
export async function joinLeague(userId: string, code: string) {
  const league = await prisma.league.findUnique({
    where: { code },
    include: {
      members: { select: { userId: true, paid: true } },
    },
  });

  if (!league) throw new Error("Liga no encontrada");
  if (league.status !== LeagueStatus.OPEN) {
    throw new Error("Esta liga ya no acepta nuevos miembros");
  }

  // Check if already a member
  const existing = league.members.find((m) => m.userId === userId);
  if (existing) {
    if (existing.paid) throw new Error("Ya sos miembro de esta liga");
    // Already joined but not paid — return payment link
    return createBuyInPayment(userId, league.id, league.buyIn);
  }

  // Check capacity
  const paidCount = league.members.filter((m) => m.paid).length;
  if (paidCount >= league.maxPlayers) {
    throw new Error("La liga está llena");
  }

  // Create membership
  await prisma.leagueMember.create({
    data: { userId, leagueId: league.id },
  });

  // Create MP payment link
  return createBuyInPayment(userId, league.id, league.buyIn);
}

/**
 * Create a Mercado Pago payment link for league buy-in.
 */
async function createBuyInPayment(
  userId: string,
  leagueId: number,
  buyIn: number,
) {
  const transaction = await prisma.transaction.create({
    data: {
      type: TransactionType.LEAGUE_BUYIN,
      status: TransactionStatus.PENDING,
      amountArs: buyIn,
      description: `Buy-in liga #${leagueId}`,
      userId,
    },
  });

  const paymentService = getPaymentService();
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const paymentLink = await paymentService.createPaymentLink({
    title: "Buy-in de Liga — Bilardeando",
    description: `Buy-in $${buyIn.toLocaleString()} ARS`,
    amountArs: buyIn,
    externalReference: `league:${leagueId}:tx:${transaction.id}`,
    backUrls: {
      success: `${baseUrl}/leagues?status=success`,
      failure: `${baseUrl}/leagues?status=failure`,
      pending: `${baseUrl}/leagues?status=pending`,
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
  };
}

/**
 * Confirm buy-in payment (called by webhook or mock).
 * Marks member as paid.
 */
export async function confirmBuyIn(
  transactionId: number,
) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) throw new Error("Transaction not found");
  if (transaction.status === TransactionStatus.APPROVED) return; // idempotent

  // Parse league ID from external reference
  const ref = transaction.description ?? "";
  const leagueMatch = ref.match(/liga #(\d+)/);
  if (!leagueMatch) throw new Error("Invalid league transaction");
  const leagueId = parseInt(leagueMatch[1], 10);

  await prisma.$transaction([
    prisma.transaction.update({
      where: { id: transactionId },
      data: { status: TransactionStatus.APPROVED },
    }),
    prisma.leagueMember.updateMany({
      where: { userId: transaction.userId, leagueId },
      data: { paid: true },
    }),
  ]);
}

/**
 * Get leagues for a user (both created and joined).
 */
export async function getUserLeagues(userId: string): Promise<LeagueSummary[]> {
  const leagues = await prisma.league.findMany({
    where: {
      OR: [
        { creatorId: userId },
        { members: { some: { userId } } },
      ],
    },
    include: {
      startMatchday: { select: { id: true, name: true } },
      endMatchday: { select: { id: true, name: true } },
      members: { select: { userId: true, paid: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return leagues.map((league) => {
    const userMember = league.members.find((m) => m.userId === userId);
    return {
      id: league.id,
      name: league.name,
      code: league.code,
      status: league.status,
      buyIn: league.buyIn,
      maxPlayers: league.maxPlayers,
      memberCount: league.members.length,
      paidCount: league.members.filter((m) => m.paid).length,
      startMatchday: league.startMatchday,
      endMatchday: league.endMatchday,
      isCreator: league.creatorId === userId,
      isMember: !!userMember,
      isPaid: userMember?.paid ?? false,
    };
  });
}

/**
 * Get league detail by invite code.
 */
export async function getLeagueByCode(code: string, userId: string) {
  const league = await prisma.league.findUnique({
    where: { code },
    include: {
      startMatchday: { select: { id: true, name: true } },
      endMatchday: { select: { id: true, name: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });

  if (!league) return null;

  const userMember = league.members.find((m) => m.userId === userId);

  return {
    id: league.id,
    name: league.name,
    code: league.code,
    status: league.status,
    buyIn: league.buyIn,
    maxPlayers: league.maxPlayers,
    rakePercent: league.rakePercent,
    startMatchday: league.startMatchday,
    endMatchday: league.endMatchday,
    isCreator: league.creatorId === userId,
    isMember: !!userMember,
    isPaid: userMember?.paid ?? false,
    members: league.members.map((m) => ({
      userId: m.userId,
      userName: m.user.name ?? "Sin nombre",
      userImage: m.user.image,
      paid: m.paid,
      joinedAt: m.joinedAt,
    })),
    prizePool: calculatePrizePool(
      league.buyIn,
      league.members.filter((m) => m.paid).length,
      league.rakePercent,
    ),
  };
}

/**
 * Calculate prize pool and distribution.
 * Poker-style: 5% platform rake, then distribute to top finishers.
 */
function calculatePrizePool(
  buyIn: number,
  paidMembers: number,
  rakePercent: number,
) {
  const totalPool = buyIn * paidMembers;
  const rake = totalPool * (rakePercent / 100);
  const netPool = totalPool - rake;

  const distribution = getPrizeDistribution(paidMembers, netPool);

  return {
    totalPool,
    rake,
    netPool,
    distribution,
  };
}

/**
 * Poker-style prize distribution:
 * - 3-6 players: top 1-2
 * - 7-15 players: top 3
 * - 16-20+ players: top 4
 */
export function getPrizeDistribution(
  playerCount: number,
  netPool: number,
): { position: number; percentage: number; amount: number }[] {
  if (playerCount < 3) return [];

  let percentages: number[];

  if (playerCount <= 6) {
    // Top 2: 70/30
    percentages = [70, 30];
  } else if (playerCount <= 15) {
    // Top 3: 50/30/20
    percentages = [50, 30, 20];
  } else {
    // Top 4: 40/25/20/15
    percentages = [40, 25, 20, 15];
  }

  return percentages.map((pct, i) => ({
    position: i + 1,
    percentage: pct,
    amount: Math.round((netPool * pct) / 100),
  }));
}

/**
 * Check auto-cancel: if < 3 paid members by start matchday LOCK,
 * refund all buy-ins and set status CANCELLED.
 */
export async function checkAutoCancel(leagueId: number): Promise<boolean> {
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      startMatchday: true,
      members: {
        where: { paid: true },
        include: { user: true },
      },
    },
  });

  if (!league) return false;
  if (league.status !== LeagueStatus.OPEN) return false;

  // Only auto-cancel if start matchday is LOCK or later
  if (league.startMatchday.status === "OPEN") return false;

  const paidCount = league.members.length;
  if (paidCount >= 3) {
    // Enough members — activate the league
    await prisma.league.update({
      where: { id: leagueId },
      data: { status: LeagueStatus.ACTIVE },
    });
    return false;
  }

  // Less than 3 paid members — cancel and refund
  await prisma.$transaction(async (tx) => {
    // Set league as cancelled
    await tx.league.update({
      where: { id: leagueId },
      data: { status: LeagueStatus.CANCELLED },
    });

    // Create refund transactions for each paid member
    for (const member of league.members) {
      await tx.transaction.create({
        data: {
          type: TransactionType.LEAGUE_REFUND,
          status: TransactionStatus.APPROVED,
          amountArs: league.buyIn,
          description: `Reembolso liga "${league.name}" (cancelada por falta de jugadores)`,
          userId: member.userId,
        },
      });

      // Credit real balance
      await tx.user.update({
        where: { id: member.userId },
        data: { realBalance: { increment: league.buyIn } },
      });
    }
  });

  return true;
}

/**
 * Get available matchdays for league creation.
 */
export async function getAvailableMatchdays() {
  return prisma.matchday.findMany({
    select: { id: true, name: true, status: true, startDate: true },
    orderBy: { id: "asc" },
  });
}
