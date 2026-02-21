import { prisma } from "@/lib/db";
import { addPlayerToSquad, getOrCreateSquad } from "@/services/squad.service";
import { SELL_TAX_RATE, MAX_BENCH } from "@/lib/formations";

// ── Buy player (tries bench first, then starter if bench is full) ──

export async function buyPlayer(userId: string, playerId: number) {
  const squad = await getOrCreateSquad(userId);
  const benchCount = await prisma.squadPlayer.count({
    where: { squadId: squad.id, isStarter: false },
  });

  // Try bench first, fall back to starter if bench is full
  const isStarter = benchCount >= MAX_BENCH;
  return addPlayerToSquad(userId, playerId, isStarter);
}

// ── Sell player with 10% tax ──

export async function sellPlayer(userId: string, playerId: number) {
  const squad = await prisma.squad.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  if (!squad) return { error: "No tenés equipo" };

  const sp = await prisma.squadPlayer.findUnique({
    where: { squadId_playerId: { squadId: squad.id, playerId } },
    include: { player: true },
  });
  if (!sp) return { error: "Jugador no está en tu equipo" };

  const refundAmount = sp.player.fantasyPrice * (1 - SELL_TAX_RATE);

  await prisma.$transaction([
    prisma.squadPlayer.delete({ where: { id: sp.id } }),
    prisma.user.update({
      where: { id: userId },
      data: { virtualBudget: { increment: refundAmount } },
    }),
  ]);

  return {
    success: true,
    playerName: sp.player.name,
    originalPrice: sp.player.fantasyPrice,
    refundAmount,
    taxAmount: sp.player.fantasyPrice * SELL_TAX_RATE,
  };
}

// ── Get transfer summary (price breakdown) ──

export function getTransferSummary(
  fantasyPrice: number,
  action: "buy" | "sell",
) {
  if (action === "buy") {
    return {
      action: "buy" as const,
      cost: fantasyPrice,
      tax: 0,
      net: fantasyPrice,
    };
  }
  const tax = fantasyPrice * SELL_TAX_RATE;
  return {
    action: "sell" as const,
    cost: fantasyPrice,
    tax,
    net: fantasyPrice - tax,
  };
}
