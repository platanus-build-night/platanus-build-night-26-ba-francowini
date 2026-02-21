"use client";

import { useState } from "react";
import { DollarSign, TrendingUp, Star } from "lucide-react";

interface BudgetTier {
  id: string;
  virtualAmount: number;
  priceArs: number;
}

interface BudgetPurchaseProps {
  tiers: BudgetTier[];
  feeWaived: boolean;
  feeRate: number;
  onPurchaseSuccess?: () => void;
}

export default function BudgetPurchase({
  tiers,
  feeWaived,
  feeRate,
  onPurchaseSuccess,
}: BudgetPurchaseProps) {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Determine best value tier (highest virtualAmount / priceArs ratio)
  const bestValueId = tiers.reduce((best, tier) => {
    const bestTier = tiers.find((t) => t.id === best);
    if (!bestTier) return tier.id;
    const currentRatio = tier.virtualAmount / tier.priceArs;
    const bestRatio = bestTier.virtualAmount / bestTier.priceArs;
    return currentRatio > bestRatio ? tier.id : best;
  }, tiers[0]?.id ?? "");

  const handlePurchase = async (tierId: string) => {
    setLoadingTier(tierId);
    setError(null);

    try {
      const res = await fetch("/api/wallet/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al procesar compra");
        return;
      }

      if (data.initPoint) {
        window.location.href = data.initPoint;
      }

      onPurchaseSuccess?.();
    } catch {
      setError("Error de conexion");
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="card-retro">
      <div className="card-retro-header">
        <span className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Comprar Presupuesto Virtual
        </span>
      </div>
      <div className="card-retro-body">
        <p className="text-sm text-muted-foreground mb-4">
          Amplia tu presupuesto para fichar mejores jugadores.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {tiers.map((tier) => {
            const isBestValue = tier.id === bestValueId;
            const fee = feeWaived
              ? 0
              : Math.round(tier.priceArs * feeRate * 100) / 100;
            const total = tier.priceArs + fee;
            const isLoading = loadingTier === tier.id;

            return (
              <div
                key={tier.id}
                className={`border-2 p-4 text-center space-y-3 ${
                  isBestValue
                    ? "border-espn-gold bg-espn-gold/5"
                    : "border-border"
                }`}
              >
                {isBestValue && (
                  <div className="inline-flex items-center gap-1 bg-espn-gold text-accent-foreground px-2 py-0.5 border border-espn-gold font-heading text-xs font-bold uppercase">
                    <Star className="w-3 h-3" />
                    Mejor Valor
                  </div>
                )}

                <div className="space-y-1">
                  <p className="font-heading text-3xl font-bold text-espn-green">
                    +${tier.virtualAmount}M
                  </p>
                  <p className="text-xs text-muted-foreground uppercase font-heading">
                    Presupuesto Virtual
                  </p>
                </div>

                <div className="border-t border-border pt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Precio:</span>
                    <span className="font-bold">
                      ${tier.priceArs.toLocaleString("es-AR")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Comision:</span>
                    {feeWaived ? (
                      <span className="font-bold text-espn-green text-xs">
                        GRATIS
                      </span>
                    ) : (
                      <span className="font-bold">
                        ${fee.toLocaleString("es-AR")}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between border-t border-border pt-1">
                    <span className="font-heading font-bold">Total:</span>
                    <span className="font-heading font-bold flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {total.toLocaleString("es-AR")}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handlePurchase(tier.id)}
                  disabled={isLoading || loadingTier !== null}
                  className={`w-full flex items-center justify-center gap-2 disabled:opacity-50 ${
                    isBestValue ? "btn-retro-accent" : "btn-retro-primary"
                  }`}
                >
                  {isLoading ? "Procesando..." : "Comprar"}
                </button>
              </div>
            );
          })}
        </div>

        {error && (
          <p className="text-sm text-red-600 font-bold mt-3">{error}</p>
        )}

        {!feeWaived && (
          <p className="text-xs text-muted-foreground mt-3 border-t border-border pt-2">
            La comision del 3% se elimina cuando tu saldo ARS sea igual o
            superior a $20.000.
          </p>
        )}
      </div>
    </div>
  );
}
