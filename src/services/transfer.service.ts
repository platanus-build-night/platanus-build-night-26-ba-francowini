import { prisma } from "@/lib/db";
import { addPlayerToSquad } from "@/services/squad.service";
import { SELL_TAX_RATE } from "@/lib/formations";

// ── Buy player (delegates to squad service, adds to bench) ──

export async function buyPlayer(userId: string, playerId: number) {
  return addPlayerToSquad(userId, playerId, false);
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
