"use client";

import { PlayerCard } from "@/components/player/player-card";
import { SELL_TAX_RATE } from "@/lib/formations";

interface RosterPlayer {
  id: number;
  name: string;
  photo: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  teamName: string;
  rating: number | null;
  fantasyPrice: number;
  isStarter: boolean;
}

interface SquadRosterProps {
  players: RosterPlayer[];
  onSell: (playerId: number) => void;
  disabled?: boolean;
  showSellTax?: boolean;
}

const POSITION_ORDER = ["GK", "DEF", "MID", "FWD"] as const;
const POSITION_LABELS: Record<string, string> = {
  GK: "Arqueros",
  DEF: "Defensores",
  MID: "Mediocampistas",
  FWD: "Delanteros",
};

export function SquadRoster({ players, onSell, disabled, showSellTax }: SquadRosterProps) {
  const grouped = POSITION_ORDER.map((pos) => ({
    position: pos,
    label: POSITION_LABELS[pos],
    players: players.filter((p) => p.position === pos),
  }));

  return (
    <div className="card-retro">
      <div className="card-retro-header flex items-center justify-between">
        <span>Mi Plantel</span>
        <span className="text-xs font-normal opacity-80">
          {players.length}/18 jugadores
        </span>
      </div>
      <div className="card-retro-body space-y-3">
        {players.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-6">
            Tu plantel está vacío — Comprá jugadores del catálogo
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.position}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-heading font-bold text-xs uppercase text-muted-foreground">
                  {group.label}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {group.players.length}
                </span>
              </div>
              {group.players.length === 0 ? (
                <div className="text-[10px] text-muted-foreground py-1 pl-2">
                  —
                </div>
              ) : (
                <div className="space-y-1">
                  {group.players.map((player) => {
                    const sellValue = player.fantasyPrice * (1 - SELL_TAX_RATE);
                    return (
                      <div key={player.id} className="flex items-center gap-1">
                        <div className="flex-1 min-w-0">
                          <PlayerCard
                            id={player.id}
                            name={player.name}
                            photo={player.photo}
                            position={player.position}
                            teamName={player.teamName}
                            rating={player.rating}
                            fantasyPrice={player.fantasyPrice}
                            compact
                          />
                        </div>
                        {!disabled && (
                          <button
                            onClick={() => onSell(player.id)}
                            className="btn-retro text-[9px] px-1.5 py-1 bg-destructive text-destructive-foreground border-destructive flex-shrink-0"
                          >
                            {showSellTax ? (
                              <span title={`Valor: $${player.fantasyPrice.toFixed(1)}M — Impuesto 10%`}>
                                Vender ${sellValue.toFixed(1)}M
                              </span>
                            ) : (
                              "✕"
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
