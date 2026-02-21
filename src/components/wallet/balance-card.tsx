"use client";

import { useState } from "react";
import { Wallet, DollarSign, ArrowUpCircle, Shield } from "lucide-react";

interface BalanceCardProps {
  virtualBudget: number;
  realBalance: number;
  feeWaived: boolean;
  onLoadSuccess?: () => void;
}

export default function BalanceCard({
  virtualBudget,
  realBalance,
  feeWaived,
  onLoadSuccess,
}: BalanceCardProps) {
  const [showInput, setShowInput] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Ingresá un monto válido");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numAmount }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al procesar");
        return;
      }

      // Redirect to MP payment page
      if (data.initPoint) {
        window.location.href = data.initPoint;
      }

      onLoadSuccess?.();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const fee = !feeWaived && amount
    ? Math.round(parseFloat(amount) * 0.03 * 100) / 100
    : 0;
  const parsedAmount = parseFloat(amount) || 0;

  return (
    <div className="card-retro">
      <div className="header-bar-accent">
        <span className="flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          Billetera
        </span>
      </div>
      <div className="card-retro-body">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Real balance */}
          <div className="border-2 border-border p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <DollarSign className="w-5 h-5 text-espn-green" />
              <span className="font-heading text-sm uppercase text-muted-foreground">
                Saldo Real (ARS)
              </span>
            </div>
            <p className="font-heading text-4xl font-bold text-espn-green">
              ${realBalance.toLocaleString("es-AR")}
            </p>
            {feeWaived && (
              <div className="mt-2 inline-flex items-center gap-1 border-2 border-espn-green bg-espn-green/10 px-2 py-0.5">
                <Shield className="w-3 h-3 text-espn-green" />
                <span className="font-heading text-xs font-bold text-espn-green uppercase">
                  Sin comision
                </span>
              </div>
            )}
          </div>

          {/* Virtual budget */}
          <div className="border-2 border-border p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <DollarSign className="w-5 h-5 text-espn-gold" />
              <span className="font-heading text-sm uppercase text-muted-foreground">
                Presupuesto Virtual
              </span>
            </div>
            <p className="font-heading text-4xl font-bold text-espn-green">
              ${virtualBudget}M
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Para armar tu plantel
            </p>
          </div>
        </div>

        {/* Load balance section */}
        {!showInput ? (
          <button
            onClick={() => setShowInput(true)}
            className="btn-retro-accent w-full flex items-center justify-center gap-2"
          >
            <ArrowUpCircle className="w-4 h-4" />
            Cargar Saldo
          </button>
        ) : (
          <div className="border-2 border-border p-3 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-sm">$</span>
              <input
                type="number"
                min="1"
                max="1000000"
                step="100"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                placeholder="Monto en ARS"
                className="flex-1 border-2 border-border px-3 py-2 font-body text-sm focus:outline-none focus:border-espn-green"
                autoFocus
              />
            </div>

            {/* Quick amount buttons */}
            <div className="flex gap-2 flex-wrap">
              {[1000, 5000, 10000, 25000].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(String(preset))}
                  className="btn-retro-outline text-xs px-3 py-1"
                >
                  ${preset.toLocaleString("es-AR")}
                </button>
              ))}
            </div>

            {/* Fee breakdown */}
            {parsedAmount > 0 && (
              <div className="border-t border-border pt-2 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monto:</span>
                  <span className="font-bold">${parsedAmount.toLocaleString("es-AR")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Comision (3%):
                  </span>
                  <span className={`font-bold ${feeWaived ? "line-through text-muted-foreground" : ""}`}>
                    ${fee.toLocaleString("es-AR")}
                  </span>
                  {feeWaived && (
                    <span className="font-bold text-espn-green text-xs">GRATIS</span>
                  )}
                </div>
                <div className="flex justify-between border-t border-border pt-1">
                  <span className="font-heading font-bold">Total a pagar:</span>
                  <span className="font-heading font-bold text-espn-green">
                    ${(parsedAmount + fee).toLocaleString("es-AR")}
                  </span>
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 font-bold">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleLoad}
                disabled={loading || !amount}
                className="btn-retro-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Procesando..." : "Confirmar Carga"}
              </button>
              <button
                onClick={() => {
                  setShowInput(false);
                  setAmount("");
                  setError(null);
                }}
                className="btn-retro-outline"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
