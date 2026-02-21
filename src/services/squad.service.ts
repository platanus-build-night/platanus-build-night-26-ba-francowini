import { prisma } from "@/lib/db";
import type { FormationCode, SquadValidation, SquadSummary } from "@/types";
import {
  FORMATIONS,
  MAX_SQUAD_SIZE,
  MAX_STARTERS,
  MAX_BENCH,
  STARTING_BUDGET,
  isValidFormation,
} from "@/lib/formations";
import type { Position } from "@/generated/prisma/client";

// ── Get user squad with full player data ──

export async function getSquadByUser(userId: string) {
  const squad = await prisma.squad.findFirst({
    where: { userId },
    include: {
      squadPlayers: {
        include: {
          player: {
            include: { team: true },
          },
        },
        orderBy: [{ isStarter: "desc" }, { player: { position: "asc" } }],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return squad;
}

// ── Get squad summary ──

export async function getSquadSummary(userId: string): Promise<SquadSummary | null> {
  const squad = await getSquadByUser(userId);
  if (!squad) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const starters = squad.squadPlayers.filter((sp) => sp.isStarter);
  const bench = squad.squadPlayers.filter((sp) => !sp.isStarter);
  const totalValue = squad.squadPlayers.reduce(
    (sum, sp) => sum + sp.player.fantasyPrice,
    0,
  );

  const captain = squad.squadPlayers.find((sp) => sp.isCaptain);
  const captainSub = squad.squadPlayers.find((sp) => sp.isCaptainSub);

  return {
    id: squad.id,
    formation: squad.formation as FormationCode,
    playerCount: squad.squadPlayers.length,
    starterCount: starters.length,
    benchCount: bench.length,
    totalValue,
    remainingBudget: user.virtualBudget,
    captainId: captain?.playerId ?? null,
    captainSubId: captainSub?.playerId ?? null,
  };
}

// ── Create or get squad ──

export async function getOrCreateSquad(userId: string, formation: FormationCode = "4-3-3") {
  let squad = await prisma.squad.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (!squad) {
    squad = await prisma.squad.create({
      data: {
        formation,
        user: { connect: { id: userId } },
      },
    });
  }

  return squad;
}

// ── Update formation (auto-swaps excess starters ↔ bench) ──

export async function updateFormation(userId: string, formation: FormationCode) {
  if (!isValidFormation(formation)) {
    return { error: "Formación inválida" };
  }

  const squad = await getSquadByUser(userId);
  if (!squad) {
    return { error: "No tenés equipo creado" };
  }

  const starters = squad.squadPlayers.filter((sp) => sp.isStarter);
  const benchPlayers = squad.squadPlayers.filter((sp) => !sp.isStarter);
  const slots = FORMATIONS[formation].slots;
  const countByPos: Record<string, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };

  for (const sp of starters) {
    countByPos[sp.player.position]++;
  }

  // Find excess starters per position (demote to bench), pick lowest-rated first
  const toBench: { id: number; name: string }[] = [];
  for (const pos of ["GK", "DEF", "MID", "FWD"] as const) {
    const excess = countByPos[pos] - slots[pos];
    if (excess > 0) {
      const posStarters = starters
        .filter((sp) => sp.player.position === pos)
        .sort((a, b) => (a.player.rating ?? 0) - (b.player.rating ?? 0));
      for (let i = 0; i < excess; i++) {
        toBench.push({ id: posStarters[i].id, name: posStarters[i].player.name });
      }
    }
  }

  // Find deficit positions (promote from bench)
  const toStarter: { id: number; name: string }[] = [];
  for (const pos of ["GK", "DEF", "MID", "FWD"] as const) {
    const deficit = slots[pos] - countByPos[pos];
    if (deficit > 0) {
      const posBench = benchPlayers
        .filter((sp) => sp.player.position === pos)
        .sort((a, b) => (b.player.rating ?? 0) - (a.player.rating ?? 0));
      for (let i = 0; i < Math.min(deficit, posBench.length); i++) {
        toStarter.push({ id: posBench[i].id, name: posBench[i].player.name });
      }
    }
  }

  // Check net bench change fits
  const netBenchChange = toBench.length - toStarter.length;
  const newBenchCount = benchPlayers.length + netBenchChange;
  if (newBenchCount > MAX_BENCH) {
    return {
      error: `No hay lugar en el banco para mover ${toBench.length} jugador(es). Vendé suplentes primero.`,
    };
  }

  // Transaction: demote excess + promote from bench + update formation
  await prisma.$transaction([
    ...toBench.map((sp) =>
      prisma.squadPlayer.update({
        where: { id: sp.id },
        data: { isStarter: false, isCaptain: false, isCaptainSub: false },
      }),
    ),
    ...toStarter.map((sp) =>
      prisma.squadPlayer.update({
        where: { id: sp.id },
        data: { isStarter: true },
      }),
    ),
    prisma.squad.update({
      where: { id: squad.id },
      data: { formation },
    }),
  ]);

  return {
    success: true,
    movedToBench: toBench.map((sp) => sp.name),
    promotedToStarter: toStarter.map((sp) => sp.name),
  };
}

// ── Add player to squad ──

export async function addPlayerToSquad(
  userId: string,
  playerId: number,
  isStarter: boolean,
) {
  const squad = await getOrCreateSquad(userId);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Usuario no encontrado" };

  // Check player exists
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) return { error: "Jugador no encontrado" };

  // Check not already in squad
  const existing = await prisma.squadPlayer.findUnique({
    where: { squadId_playerId: { squadId: squad.id, playerId } },
  });
  if (existing) return { error: "El jugador ya está en tu equipo" };

  // Check squad size
  const currentCount = await prisma.squadPlayer.count({
    where: { squadId: squad.id },
  });
  if (currentCount >= MAX_SQUAD_SIZE) {
    return { error: `Máximo ${MAX_SQUAD_SIZE} jugadores en el equipo` };
  }

  // Check starter/bench limits
  if (isStarter) {
    const starterCount = await prisma.squadPlayer.count({
      where: { squadId: squad.id, isStarter: true },
    });
    if (starterCount >= MAX_STARTERS) {
      return { error: `Máximo ${MAX_STARTERS} titulares` };
    }

    // Check formation slot
    const formation = squad.formation as FormationCode;
    const slots = FORMATIONS[formation]?.slots;
    if (slots) {
      const posCount = await prisma.squadPlayer.count({
        where: {
          squadId: squad.id,
          isStarter: true,
          player: { position: player.position },
        },
      });
      if (posCount >= slots[player.position as keyof typeof slots]) {
        return {
          error: `No hay lugar para más ${player.position} titulares en ${formation}`,
        };
      }
    }
  } else {
    const benchCount = await prisma.squadPlayer.count({
      where: { squadId: squad.id, isStarter: false },
    });
    if (benchCount >= MAX_BENCH) {
      return { error: `Máximo ${MAX_BENCH} suplentes` };
    }
  }

  // Check budget
  if (user.virtualBudget < player.fantasyPrice) {
    return {
      error: `Presupuesto insuficiente. Necesitás $${player.fantasyPrice.toFixed(1)}M pero tenés $${user.virtualBudget.toFixed(1)}M`,
    };
  }

  // Add player and deduct budget
  await prisma.$transaction([
    prisma.squadPlayer.create({
      data: {
        squad: { connect: { id: squad.id } },
        player: { connect: { id: playerId } },
        isStarter,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { virtualBudget: { decrement: player.fantasyPrice } },
    }),
  ]);

  return { success: true };
}

// ── Remove player from squad ──

export async function removePlayerFromSquad(userId: string, playerId: number) {
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

  // Remove and refund budget
  await prisma.$transaction([
    prisma.squadPlayer.delete({ where: { id: sp.id } }),
    prisma.user.update({
      where: { id: userId },
      data: { virtualBudget: { increment: sp.player.fantasyPrice } },
    }),
  ]);

  return { success: true };
}

// ── Set captain / captain sub ──

export async function setCaptain(
  userId: string,
  playerId: number,
  role: "captain" | "captainSub",
) {
  const squad = await prisma.squad.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  if (!squad) return { error: "No tenés equipo" };

  const sp = await prisma.squadPlayer.findUnique({
    where: { squadId_playerId: { squadId: squad.id, playerId } },
  });
  if (!sp) return { error: "Jugador no está en tu equipo" };
  if (!sp.isStarter) return { error: "Solo un titular puede ser capitán" };

  // Clear previous captain/captainSub
  const field = role === "captain" ? "isCaptain" : "isCaptainSub";
  await prisma.squadPlayer.updateMany({
    where: { squadId: squad.id, [field]: true },
    data: { [field]: false },
  });

  // Set new
  await prisma.squadPlayer.update({
    where: { id: sp.id },
    data: { [field]: true },
  });

  return { success: true };
}

// ── Toggle starter/bench ──

export async function toggleStarter(userId: string, playerId: number) {
  const squad = await getSquadByUser(userId);
  if (!squad) return { error: "No tenés equipo" };

  const sp = squad.squadPlayers.find((s) => s.playerId === playerId);
  if (!sp) return { error: "Jugador no está en tu equipo" };

  if (sp.isStarter) {
    // Move to bench
    const benchCount = squad.squadPlayers.filter((s) => !s.isStarter).length;
    if (benchCount >= MAX_BENCH) {
      return { error: "Banco lleno (máximo 7 suplentes)" };
    }
    await prisma.squadPlayer.update({
      where: { id: sp.id },
      data: { isStarter: false, isCaptain: false, isCaptainSub: false },
    });
  } else {
    // Move to starters
    const starterCount = squad.squadPlayers.filter((s) => s.isStarter).length;
    if (starterCount >= MAX_STARTERS) {
      return { error: "Titulares completos (máximo 11)" };
    }
    // Check formation slot
    const formation = squad.formation as FormationCode;
    const slots = FORMATIONS[formation]?.slots;
    if (slots) {
      const posCount = squad.squadPlayers.filter(
        (s) => s.isStarter && s.player.position === sp.player.position,
      ).length;
      if (posCount >= slots[sp.player.position as keyof typeof slots]) {
        return {
          error: `No hay lugar para más ${sp.player.position} titulares en ${formation}`,
        };
      }
    }
    await prisma.squadPlayer.update({
      where: { id: sp.id },
      data: { isStarter: true },
    });
  }

  return { success: true };
}

// ── Validate squad ──

export async function validateSquad(userId: string): Promise<SquadValidation> {
  const squad = await getSquadByUser(userId);
  const errors: string[] = [];

  if (!squad) {
    return { valid: false, errors: ["No tenés equipo creado"] };
  }

  const formation = squad.formation as FormationCode;
  if (!isValidFormation(formation)) {
    errors.push(`Formación "${squad.formation}" no es válida`);
  }

  const starters = squad.squadPlayers.filter((sp) => sp.isStarter);
  const bench = squad.squadPlayers.filter((sp) => !sp.isStarter);
  const total = squad.squadPlayers.length;

  // Total player count
  if (total > MAX_SQUAD_SIZE) {
    errors.push(`Tenés ${total} jugadores, máximo ${MAX_SQUAD_SIZE}`);
  }

  // Starter count
  if (starters.length !== MAX_STARTERS) {
    errors.push(`Necesitás exactamente ${MAX_STARTERS} titulares, tenés ${starters.length}`);
  }

  // Bench count
  if (bench.length !== MAX_BENCH) {
    errors.push(`Necesitás exactamente ${MAX_BENCH} suplentes, tenés ${bench.length}`);
  }

  // Formation slot validation
  if (isValidFormation(formation)) {
    const slots = FORMATIONS[formation].slots;
    const countByPos: Record<string, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    for (const sp of starters) {
      countByPos[sp.player.position]++;
    }
    for (const pos of ["GK", "DEF", "MID", "FWD"] as Position[]) {
      if (countByPos[pos] !== slots[pos]) {
        errors.push(
          `${formation} requiere ${slots[pos]} ${pos} titulares, tenés ${countByPos[pos]}`,
        );
      }
    }
  }

  // Captain
  const captains = squad.squadPlayers.filter((sp) => sp.isCaptain);
  if (captains.length !== 1) {
    errors.push("Necesitás exactamente 1 capitán");
  } else if (!captains[0].isStarter) {
    errors.push("El capitán debe ser titular");
  }

  // Captain sub
  const captainSubs = squad.squadPlayers.filter((sp) => sp.isCaptainSub);
  if (captainSubs.length !== 1) {
    errors.push("Necesitás exactamente 1 capitán suplente");
  } else if (!captainSubs[0].isStarter) {
    errors.push("El capitán suplente debe ser titular");
  }

  // No duplicate players
  const playerIds = new Set(squad.squadPlayers.map((sp) => sp.playerId));
  if (playerIds.size !== squad.squadPlayers.length) {
    errors.push("Hay jugadores duplicados en tu equipo");
  }

  // Budget check
  const user = await prisma.user.findUnique({ where: { id: squad.userId } });
  if (user && user.virtualBudget < 0) {
    errors.push(`Presupuesto excedido por $${Math.abs(user.virtualBudget).toFixed(1)}M`);
  }

  return { valid: errors.length === 0, errors };
}

// ── Swap two players (starter↔starter or starter↔bench) ──

export async function swapPlayers(
  userId: string,
  playerIdA: number,
  playerIdB: number,
) {
  const squad = await getSquadByUser(userId);
  if (!squad) return { error: "No tenés equipo" };

  const spA = squad.squadPlayers.find((s) => s.playerId === playerIdA);
  const spB = squad.squadPlayers.find((s) => s.playerId === playerIdB);
  if (!spA || !spB) return { error: "Jugador no está en tu equipo" };

  // If both are starters, validate positions fit formation
  if (spA.isStarter && spB.isStarter) {
    // Same position → always valid swap
    if (spA.player.position !== spB.player.position) {
      return { error: "No se pueden intercambiar titulares de distinta posición" };
    }
  }

  // If swapping starter↔bench, check formation allows the bench player's position
  if (spA.isStarter !== spB.isStarter) {
    const starter = spA.isStarter ? spA : spB;
    const benched = spA.isStarter ? spB : spA;
    const formation = squad.formation as FormationCode;
    const slots = FORMATIONS[formation]?.slots;

    if (slots && starter.player.position !== benched.player.position) {
      // Count current starters by position, subtract the one leaving, add the one entering
      const countByPos: Record<string, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
      for (const sp of squad.squadPlayers.filter((s) => s.isStarter)) {
        countByPos[sp.player.position]++;
      }
      countByPos[starter.player.position]--;
      countByPos[benched.player.position]++;

      for (const pos of ["GK", "DEF", "MID", "FWD"] as const) {
        if (countByPos[pos] > slots[pos]) {
          return { error: `El swap violaría la formación ${formation}: exceso de ${pos}` };
        }
      }
    }
  }

  // Perform swap
  await prisma.$transaction([
    prisma.squadPlayer.update({
      where: { id: spA.id },
      data: {
        isStarter: spB.isStarter,
        // Clear captain flags if moving to bench
        isCaptain: spB.isStarter ? spA.isCaptain : false,
        isCaptainSub: spB.isStarter ? spA.isCaptainSub : false,
      },
    }),
    prisma.squadPlayer.update({
      where: { id: spB.id },
      data: {
        isStarter: spA.isStarter,
        isCaptain: spA.isStarter ? spB.isCaptain : false,
        isCaptainSub: spA.isStarter ? spB.isCaptainSub : false,
      },
    }),
  ]);

  return { success: true };
}
