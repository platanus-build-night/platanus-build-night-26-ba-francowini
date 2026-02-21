"use client";

import { useState } from "react";
import { Sparkles, Check } from "lucide-react";

interface AiUnlockCardProps {
  aiUnlocked: boolean;
  onPurchaseSuccess?: () => void;
}

export default function AiUnlockCard({
  aiUnlocked,
  onPurchaseSuccess,
}: AiUnlockCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (aiUnlocked) {
    return (
      <div className="card-retro">
        <div className="header-bar-accent">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI Premium
          </span>
        </div>
        <div className="card-retro-body text-center py-4">
          <div className="inline-flex items-center gap-2 border-2 border-espn-green bg-espn-green/10 px-4 py-2">
            <Check className="w-5 h-5 text-espn-green" />
            <span className="font-heading font-bold text-espn-green uppercase">
              Activado
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Ya tenes acceso al asistente AI premium.
          </p>
        </div>
      </div>
    );
  }

  const handlePurchase = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/wallet/ai-unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al procesar");
        return;
      }

      if (data.initPoint) {
        window.location.href = data.initPoint;
      }

      onPurchaseSuccess?.();
    } catch {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-retro">
      <div className="header-bar-accent">
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          AI Premium
        </span>
      </div>
      <div className="card-retro-body">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-heading font-bold text-lg">
              Desbloquea el Asistente AI
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Recibí consejos personalizados para armar tu equipo, analizar
              rivales y optimizar tus transferencias.
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 text-espn-green" />
                Recomendaciones de fichajes
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 text-espn-green" />
                Analisis de formacion
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 text-espn-green" />
                Predicciones de rendimiento
              </li>
            </ul>
          </div>

          <div className="border-2 border-border p-4 text-center min-w-[160px]">
            <p className="font-heading text-3xl font-bold text-espn-green">
              $500
            </p>
            <p className="text-xs text-muted-foreground uppercase font-heading">
              Pago unico ARS
            </p>

            <button
              onClick={handlePurchase}
              disabled={loading}
              className="btn-retro-accent w-full mt-3 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? "Procesando..." : "Desbloquear"}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 font-bold mt-3">{error}</p>
        )}
      </div>
    </div>
  );
}
