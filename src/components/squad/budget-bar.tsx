"use client";

import Link from "next/link";
import { DollarSign, Wallet } from "lucide-react";

interface BudgetBarProps {
  totalBudget: number;
  spent: number;
  playerCount: number;
}

export function BudgetBar({ totalBudget, spent, playerCount }: BudgetBarProps) {
  const remaining = totalBudget - spent;
  const percentUsed = Math.min((spent / totalBudget) * 100, 100);
  const isLow = remaining < 20;
  const isDanger = remaining < 5;

  return (
    <div className="card-retro">
      <div className="header-bar-accent flex items-center justify-between">
        <span className="flex items-center gap-1">
          <DollarSign className="w-4 h-4" />
          Presupuesto
        </span>
        <span className="text-xs font-normal">
          {playerCount}/18 jugadores
        </span>
      </div>
      <div className="card-retro-body space-y-2">
        {/* Budget numbers */}
        <div className="flex justify-between items-baseline">
          <div>
            <span className="font-heading font-bold text-2xl">
              ${remaining.toFixed(1)}M
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              disponible
            </span>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            Gastado: ${spent.toFixed(1)}M / ${totalBudget}M
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-4 bg-muted border-2 border-border">
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

        {/* Budget breakdown + wallet link */}
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-muted-foreground">
            Promedio por jugador restante:{" "}
            {playerCount < 18
              ? `$${(remaining / (18 - playerCount)).toFixed(1)}M`
              : "—"}
          </div>
          <Link
            href="/wallet"
            className="flex items-center gap-1 text-[10px] text-accent font-heading font-bold hover:underline"
          >
            <Wallet className="w-3 h-3" />
            Comprar presupuesto
          </Link>
        </div>

        {/* Low budget warning banner */}
        {isLow && (
          <Link
            href="/wallet"
            className="block border-2 border-accent bg-accent/10 p-2 text-center text-xs font-heading font-bold hover:bg-accent/20 transition-colors"
          >
            <Wallet className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
            {isDanger
              ? "Presupuesto casi agotado — Comprá más en la Billetera"
              : "Presupuesto bajo — Recargá en la Billetera"}
          </Link>
        )}
      </div>
    </div>
  );
}
