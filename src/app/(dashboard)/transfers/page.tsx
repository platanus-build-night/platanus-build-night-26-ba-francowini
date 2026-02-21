"use client";

import { useState, useEffect, useCallback } from "react";
import { PlayerCatalog } from "@/components/player/player-catalog";
import { SquadRoster } from "@/components/squad/squad-roster";
import { AlertTriangle, DollarSign, Check, ArrowLeft, Wallet } from "lucide-react";
import { STARTING_BUDGET, SELL_TAX_RATE } from "@/lib/formations";
import Link from "next/link";

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

export default function TransfersPage() {
  const [players, setPlayers] = useState<SquadPlayer[]>([]);
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
        setPlayers(data.squad?.players ?? []);
        if (data.summary) {
          setRemainingBudget(data.summary.remainingBudget);
        } else {
          setRemainingBudget(STARTING_BUDGET);
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

  const handleBuyPlayer = async (player: { id: number; position: string }) => {
    setActionLoading(true);
    setError(null);
    try {
      // Ensure squad exists
      const squadRes = await fetch("/api/squad");
      const squadData = await squadRes.json();
      if (!squadData.squad) {
        await fetch("/api/squad", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formation: "4-3-3" }),
        });
      }

      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "buy", playerId: player.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al comprar jugador");
        return;
      }

      setToast("Jugador comprado");
      await fetchSquad();
    } finally {
      setActionLoading(false);
    }
  };

  const handleSellPlayer = async (playerId: number) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sell", playerId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al vender jugador");
        return;
      }
      const data = await res.json();
      if (data.refundAmount) {
        setToast(
          `Vendido por $${data.refundAmount.toFixed(1)}M (impuesto 10%)`,
        );
      }
      await fetchSquad();
    } finally {
      setActionLoading(false);
    }
  };

  const selectedPlayerIds = new Set(players.map((p) => p.id));
  const totalSpent = players.reduce((s, p) => s + p.fantasyPrice, 0);
  const percentUsed = Math.min((totalSpent / STARTING_BUDGET) * 100, 100);
  const isLow = remainingBudget < 20;
  const isDanger = remainingBudget < 5;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-muted animate-pulse border-2 border-border" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-96 bg-muted animate-pulse border-2 border-border" />
          <div className="h-96 bg-muted animate-pulse border-2 border-border" />
        </div>
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

      {/* Budget hero section */}
      <div className="card-retro">
        <div className="header-bar-accent flex items-center justify-between">
          <span className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            Mercado de Pases
          </span>
          <Link
            href="/squad"
            className="flex items-center gap-1 text-xs font-normal hover:underline"
          >
            <ArrowLeft className="w-3 h-3" />
            Volver al equipo
          </Link>
        </div>
        <div className="card-retro-body">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-heading font-bold text-3xl">
                ${remainingBudget.toFixed(1)}M
              </div>
              <div className="text-xs text-muted-foreground">
                Presupuesto disponible
              </div>
            </div>
            <div className="flex-1 max-w-xs">
              <div className="w-full h-5 bg-muted border-2 border-border">
                <div
                  className={`h-full transition-all duration-300 ${
                    isDanger
                      ? "bg-destructive"
                      : isLow
                        ? "bg-amber-600"
                        : "bg-primary"
                  }`}
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 text-right">
                ${totalSpent.toFixed(1)}M / ${STARTING_BUDGET}M gastado
              </div>
            </div>
            <div className="text-right">
              <div className="font-heading font-bold text-lg">
                {players.length}/18
              </div>
              <div className="text-xs text-muted-foreground">jugadores</div>
            </div>
          </div>
          <div className="mt-2 border-t border-border pt-2 text-[10px] text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>
                Impuesto de venta: <strong className="text-destructive">{SELL_TAX_RATE * 100}%</strong>
              </span>
              <span>|</span>
              <span>Al vender recibís el 90% del valor del jugador</span>
            </div>
            <Link
              href="/wallet"
              className="flex items-center gap-1 text-accent font-heading font-bold hover:underline"
            >
              <Wallet className="w-3 h-3" />
              Comprar presupuesto
            </Link>
          </div>
          {isLow && (
            <Link
              href="/wallet"
              className="block mt-2 border-2 border-accent bg-accent/10 p-2 text-center text-xs font-heading font-bold hover:bg-accent/20 transition-colors"
            >
              <Wallet className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
              {isDanger
                ? "Presupuesto casi agotado — Comprá más en la Billetera"
                : "Presupuesto bajo — Recargá en la Billetera"}
            </Link>
          )}
        </div>
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Player catalog (2/3) */}
        <div className="lg:col-span-2">
          <PlayerCatalog
            selectedPlayerIds={selectedPlayerIds}
            onSelectPlayer={handleBuyPlayer}
            remainingBudget={remainingBudget}
          />
        </div>

        {/* Right: Squad roster (1/3) */}
        <div className="lg:col-span-1">
          <SquadRoster
            players={players.map((p) => ({
              id: p.id,
              name: p.name,
              photo: p.photo,
              position: p.position,
              teamName: p.teamName,
              rating: p.rating,
              fantasyPrice: p.fantasyPrice,
              isStarter: p.isStarter,
            }))}
            onSell={handleSellPlayer}
            disabled={actionLoading}
            showSellTax
          />
        </div>
      </div>
    </div>
  );
}
