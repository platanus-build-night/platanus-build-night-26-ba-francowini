"use client";

import { Users, Calendar, DollarSign, Crown } from "lucide-react";
import Link from "next/link";

interface LeagueCardProps {
  code: string;
  name: string;
  status: string;
  buyIn: number;
  memberCount: number;
  paidCount: number;
  maxPlayers: number;
  startMatchday: string;
  endMatchday: string;
  isCreator: boolean;
  isPaid: boolean;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Abierta", className: "bg-green-700 text-white" },
  ACTIVE: { label: "Activa", className: "bg-accent text-accent-foreground" },
  FINISHED: { label: "Finalizada", className: "bg-muted text-muted-foreground" },
  CANCELLED: { label: "Cancelada", className: "bg-destructive text-white" },
};

export function LeagueCard({
  code,
  name,
  status,
  buyIn,
  paidCount,
  maxPlayers,
  startMatchday,
  endMatchday,
  isCreator,
  isPaid,
}: LeagueCardProps) {
  const statusInfo = statusLabels[status] ?? statusLabels.OPEN;

  return (
    <Link href={`/leagues/${code}`} className="block">
      <div className="card-retro hover:shadow-md transition-shadow">
        <div className="card-retro-body p-3">
          {/* Top row: name + status */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="font-heading font-bold text-sm uppercase truncate">
              {isCreator && <Crown className="w-3.5 h-3.5 inline mr-1 text-accent -mt-0.5" />}
              {name}
            </h3>
            <span
              className={`text-[10px] font-heading font-bold px-2 py-0.5 border ${statusInfo.className}`}
            >
              {statusInfo.label}
            </span>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-accent" />
              <span>${buyIn.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-muted-foreground" />
              <span>
                {paidCount}/{maxPlayers}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              <span className="truncate">
                {startMatchday} – {endMatchday}
              </span>
            </div>
          </div>

          {/* Membership badge */}
          {!isPaid && status === "OPEN" && (
            <div className="mt-2 text-[10px] text-center border-t border-border pt-1.5 text-accent font-heading font-bold">
              Pendiente de pago — tocá para pagar
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
