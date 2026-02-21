"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FormationSelector } from "@/components/squad/formation-selector";
import { PitchView } from "@/components/squad/pitch-view";
import { BenchList } from "@/components/squad/bench-list";
import { BudgetBar } from "@/components/squad/budget-bar";
import { AlertTriangle, Check, ArrowLeftRight } from "lucide-react";
import type { FormationCode, SquadValidation } from "@/types";
import { STARTING_BUDGET } from "@/lib/formations";

interface SquadPlayer {
  id: number;
  name: string;
  photo: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  teamName: string;
  teamLogo: string;
  rating: number | null;
  fantasyPrice: number;
  isStarter: boolean;
  isCaptain: boolean;
  isCaptainSub: boolean;
}

interface SquadData {
  id: number;
  formation: string;
  players: SquadPlayer[];
}

export default function SquadPage() {
  const [squad, setSquad] = useState<SquadData | null>(null);
  const [validation, setValidation] = useState<SquadValidation | null>(null);
  const [remainingBudget, setRemainingBudget] = useState(STARTING_BUDGET);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchSquad = useCallback(async () => {
    try {
      const res = await fetch("/api/squad");
      if (res.ok) {
        const data = await res.json();
        setSquad(data.squad);
        setValidation(data.validation);
        if (data.summary) {
          setRemainingBudget(data.summary.remainingBudget);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSquad();
  }, [fetchSquad]);

  // Auto-dismiss toasts
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleFormationChange = async (formation: FormationCode) => {
    setActionLoading(true);
    setError(null);
    try {
      if (!squad) {
        await fetch("/api/squad", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formation }),
        });
      } else {
        const res = await fetch("/api/squad", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formation }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Error al cambiar formación");
          return;
        }
        const data = await res.json();
        if (data.movedToBench?.length > 0) {
          setToast(
            `Movidos al banco: ${data.movedToBench.join(", ")}`,
          );
        }
      }
      await fetchSquad();
    } finally {
      setActionLoading(false);
    }
  };

  const handlePlayerAction = async (
    playerId: number,
    action: "captain" | "captainSub" | "toggleStarter",
  ) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/squad/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, action }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error");
        return;
      }
      await fetchSquad();
    } finally {
      setActionLoading(false);
    }
  };

  const handleSwap = async (playerIdA: number, playerIdB: number) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/squad/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: playerIdA, playerIdB, action: "swap" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al intercambiar jugadores");
        return;
      }
      await fetchSquad();
    } finally {
      setActionLoading(false);
    }
  };

  const formation = (squad?.formation || "4-3-3") as FormationCode;
  const starters = squad?.players.filter((p) => p.isStarter) ?? [];
  const bench = squad?.players.filter((p) => !p.isStarter) ?? [];
  const totalSpent =
    squad?.players.reduce((s, p) => s + p.fantasyPrice, 0) ?? 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-muted animate-pulse border-2 border-border" />
        <div className="h-96 bg-muted animate-pulse border-2 border-border" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error banner */}
      {error && (
        <div className="border-2 border-destructive bg-destructive/10 p-3 flex items-center gap-2 text-sm">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-xs font-heading font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="border-2 border-accent bg-accent/10 p-3 flex items-center gap-2 text-sm">
          <Check className="w-4 h-4 text-accent flex-shrink-0" />
          <span>{toast}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-auto text-xs font-heading font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Validation status */}
      {validation && (
        <div
          className={`border-2 p-2 flex items-center gap-2 text-xs ${
            validation.valid
              ? "border-green-700 bg-green-700/10 text-green-800"
              : "border-accent bg-accent/10 text-accent-foreground"
          }`}
        >
          {validation.valid ? (
            <>
              <Check className="w-4 h-4" />
              <span className="font-heading font-bold">
                Equipo válido — Listo para jugar
              </span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4" />
              <span>
                {validation.errors[0]}
                {validation.errors.length > 1 &&
                  ` (+${validation.errors.length - 1} más)`}
              </span>
            </>
          )}
        </div>
      )}

      {/* Budget bar + market link */}
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <BudgetBar
            totalBudget={STARTING_BUDGET}
            spent={totalSpent}
            playerCount={squad?.players.length ?? 0}
          />
        </div>
        <Link
          href="/transfers"
          className="btn-retro-accent flex items-center gap-1 text-xs whitespace-nowrap mt-1"
        >
          <ArrowLeftRight className="w-3 h-3" />
          Mercado de Pases
        </Link>
      </div>

      {/* Formation selector */}
      <FormationSelector
        selected={formation}
        onChange={handleFormationChange}
        disabled={actionLoading}
      />

      {/* 2-column layout: Bench (1/3) | Pitch (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Bench */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <BenchList
            players={bench.map((p) => ({
              id: p.id,
              name: p.name,
              photo: p.photo,
              position: p.position,
              teamName: p.teamName,
              rating: p.rating,
              fantasyPrice: p.fantasyPrice,
            }))}
            onMoveToStarter={(playerId) =>
              handlePlayerAction(playerId, "toggleStarter")
            }
            onSwap={handleSwap}
          />
        </div>

        {/* Right: Pitch */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          <PitchView
            formation={formation}
            starters={starters.map((p) => ({
              id: p.id,
              name: p.name,
              position: p.position,
              photo: p.photo,
              rating: p.rating,
              isCaptain: p.isCaptain,
              isCaptainSub: p.isCaptainSub,
            }))}
            onSetCaptain={(playerId) =>
              handlePlayerAction(playerId, "captain")
            }
            onSetCaptainSub={(playerId) =>
              handlePlayerAction(playerId, "captainSub")
            }
            onSwap={handleSwap}
            onMoveToBench={(playerId) =>
              handlePlayerAction(playerId, "toggleStarter")
            }
          />
        </div>
      </div>
    </div>
  );
}
