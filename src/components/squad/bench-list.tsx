"use client";

import { useState } from "react";
import { PlayerCard } from "@/components/player/player-card";

interface BenchPlayer {
  id: number;
  name: string;
  photo: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  teamName: string;
  rating: number | null;
  fantasyPrice: number;
}

interface DragData {
  playerId: number;
  position: string;
  isStarter: boolean;
}

interface BenchListProps {
  players: BenchPlayer[];
  onRemove?: (playerId: number) => void;
  onMoveToStarter?: (playerId: number) => void;
  onSwap?: (playerIdA: number, playerIdB: number) => void;
}

export function BenchList({
  players,
  onRemove,
  onMoveToStarter,
  onSwap,
}: BenchListProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverPlayerId, setDragOverPlayerId] = useState<number | null>(null);
  const [hoveredPlayerId, setHoveredPlayerId] = useState<number | null>(null);

  function handleDragStart(e: React.DragEvent, player: BenchPlayer) {
    const data: DragData = {
      playerId: player.id,
      position: player.position,
      isStarter: false,
    };
    e.dataTransfer.setData("application/json", JSON.stringify(data));
    e.dataTransfer.effectAllowed = "move";
  }

  function handleContainerDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  }

  function handleContainerDragLeave(e: React.DragEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const { clientX, clientY } = e;
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      setIsDragOver(false);
    }
  }

  function handleContainerDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const data: DragData = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.isStarter) {
        onMoveToStarter?.(data.playerId);
      }
    } catch {
      // ignore
    }
  }

  function handlePlayerDragOver(e: React.DragEvent, playerId: number) {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPlayerId(playerId);
  }

  function handlePlayerDragLeave() {
    setDragOverPlayerId(null);
  }

  function handlePlayerDrop(e: React.DragEvent, targetPlayerId: number) {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPlayerId(null);
    setIsDragOver(false);
    try {
      const data: DragData = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.playerId === targetPlayerId) return;
      onSwap?.(data.playerId, targetPlayerId);
    } catch {
      // ignore
    }
  }

  return (
    <div className="card-retro">
      <div className="card-retro-header flex items-center justify-between">
        <span>Suplentes — 0.5× puntos</span>
        <span className="text-xs font-normal opacity-80">
          {players.length}/7
          {onSwap && (
            <span className="ml-2 text-accent">Arrastrá aquí</span>
          )}
        </span>
      </div>
      <div
        className={`card-retro-body transition-colors ${
          isDragOver ? "bg-green-900/20 ring-2 ring-inset ring-green-400/50" : ""
        }`}
        onDragOver={handleContainerDragOver}
        onDragLeave={handleContainerDragLeave}
        onDrop={handleContainerDrop}
      >
        {players.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-4">
            Sin suplentes
            {isDragOver && (
              <div className="mt-2 text-green-600 font-heading font-bold text-xs">
                Soltá para mover al banco
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {players.map((player) => {
              const isTarget = dragOverPlayerId === player.id;
              const isHovered = hoveredPlayerId === player.id;
              return (
                <div
                  key={player.id}
                  className={`relative transition-all ${
                    isTarget
                      ? "ring-2 ring-green-400 scale-[1.02]"
                      : ""
                  }`}
                  draggable={!!onSwap}
                  onDragStart={(e) => handleDragStart(e, player)}
                  onDragOver={(e) => handlePlayerDragOver(e, player.id)}
                  onDragLeave={handlePlayerDragLeave}
                  onDrop={(e) => handlePlayerDrop(e, player.id)}
                  onMouseEnter={() => setHoveredPlayerId(player.id)}
                  onMouseLeave={() => setHoveredPlayerId(null)}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold text-muted-foreground w-6 text-center flex-shrink-0">
                      0.5×
                    </span>
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
                        onRemove={onRemove ? () => onRemove(player.id) : undefined}
                      />
                    </div>
                    {/* Hover action: move to starters */}
                    {isHovered && onMoveToStarter && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveToStarter(player.id);
                        }}
                        className="btn-retro text-[9px] px-1.5 py-0.5 bg-primary text-primary-foreground border-primary flex-shrink-0"
                        title="Mover a titulares"
                      >
                        ↑ Titular
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
