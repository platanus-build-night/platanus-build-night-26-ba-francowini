"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  DollarSign,
  Calendar,
  Copy,
  Check,
  Crown,
  Trophy,
} from "lucide-react";
import { LeagueLeaderboard } from "@/components/leagues/league-leaderboard";
import type { LeaderboardEntry } from "@/types";

interface Member {
  userId: string;
  userName: string;
  userImage: string | null;
  paid: boolean;
  joinedAt: string;
}

interface PrizeDistribution {
  position: number;
  percentage: number;
  amount: number;
}

interface LeagueDetail {
  id: number;
  name: string;
  code: string;
  status: string;
  buyIn: number;
  maxPlayers: number;
  rakePercent: number;
  startMatchday: { id: number; name: string };
  endMatchday: { id: number; name: string };
  isCreator: boolean;
  isMember: boolean;
  isPaid: boolean;
  members: Member[];
  prizePool: {
    totalPool: number;
    rake: number;
    netPool: number;
    distribution: PrizeDistribution[];
  };
}

interface PageData {
  league: LeagueDetail;
  leaderboard: LeaderboardEntry[];
  matchdays: { id: number; name: string }[];
  currentUserId: string;
}

export default function LeagueDetailPage() {
  const params = useParams();
  const code = params.code as string;

  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/leagues/${code}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = async () => {
    setJoinLoading(true);
    try {
      const res = await fetch(`/api/leagues/${code}/join`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      if (json.initPoint) {
        window.open(json.initPoint, "_blank");
      }
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al unirse");
    } finally {
      setJoinLoading(false);
    }
  };

  if (loading) return <DetailSkeleton />;

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link href="/leagues" className="flex items-center gap-1 text-sm text-accent hover:underline">
          <ArrowLeft className="w-4 h-4" /> Volver a Ligas
        </Link>
        <div className="card-retro">
          <div className="card-retro-body text-center py-8">
            <p className="text-destructive font-bold">{error || "Liga no encontrada"}</p>
          </div>
        </div>
      </div>
    );
  }

  const { league, leaderboard, matchdays, currentUserId } = data;
  const statusLabels: Record<string, string> = {
    OPEN: "Abierta",
    ACTIVE: "Activa",
    FINISHED: "Finalizada",
    CANCELLED: "Cancelada",
  };

  return (
    <div className="space-y-4">
      {/* Back link */}
      <Link href="/leagues" className="flex items-center gap-1 text-sm text-accent hover:underline">
        <ArrowLeft className="w-4 h-4" /> Volver a Ligas
      </Link>

      {/* Header */}
      <div className="card-retro">
        <div className="header-bar-accent flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            {league.name}
          </span>
          <span className="text-xs font-normal">
            {statusLabels[league.status] ?? league.status}
          </span>
        </div>
        <div className="card-retro-body">
          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div className="text-center">
              <div className="text-[10px] text-muted-foreground uppercase">Buy-in</div>
              <div className="font-heading font-bold flex items-center justify-center gap-1">
                <DollarSign className="w-4 h-4 text-accent" />
                {league.buyIn.toLocaleString()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-muted-foreground uppercase">Jugadores</div>
              <div className="font-heading font-bold flex items-center justify-center gap-1">
                <Users className="w-4 h-4" />
                {league.members.filter((m) => m.paid).length}/{league.maxPlayers}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-muted-foreground uppercase">Fechas</div>
              <div className="font-heading font-bold flex items-center justify-center gap-1 text-sm">
                <Calendar className="w-4 h-4" />
                {league.startMatchday.name} – {league.endMatchday.name}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-muted-foreground uppercase">Pozo neto</div>
              <div className="font-heading font-bold text-accent">
                ${league.prizePool.netPool.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Invite code */}
          <div className="flex items-center gap-2 border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">Código:</span>
            <code className="bg-muted px-2 py-1 text-xs font-mono border border-border">
              {league.code}
            </code>
            <button
              onClick={handleCopyCode}
              className="btn-retro-outline px-2 py-1 text-xs flex items-center gap-1"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copiar
                </>
              )}
            </button>

            {/* Join button if not member */}
            {!league.isMember && league.status === "OPEN" && (
              <button
                onClick={handleJoin}
                disabled={joinLoading}
                className="btn-retro text-xs ml-auto"
              >
                {joinLoading ? "..." : "Unirme"}
              </button>
            )}
            {league.isMember && !league.isPaid && league.status === "OPEN" && (
              <button
                onClick={handleJoin}
                disabled={joinLoading}
                className="btn-retro text-xs ml-auto"
              >
                {joinLoading ? "..." : "Pagar Buy-in"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Prize distribution */}
      {league.prizePool.distribution.length > 0 && (
        <div className="card-retro">
          <div className="card-retro-header">Premios</div>
          <div className="card-retro-body p-0">
            <table className="table-retro w-full">
              <thead>
                <tr>
                  <th>Puesto</th>
                  <th className="text-right">%</th>
                  <th className="text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {league.prizePool.distribution.map((d) => (
                  <tr key={d.position}>
                    <td className="font-heading font-bold">
                      {d.position === 1 && <Crown className="w-4 h-4 inline mr-1 text-amber-500" />}
                      {d.position}°
                    </td>
                    <td className="text-right">{d.percentage}%</td>
                    <td className="text-right font-heading font-bold text-accent">
                      ${d.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-3 py-2 border-t border-border text-[10px] text-muted-foreground">
              Comisión plataforma: {league.rakePercent}% (${league.prizePool.rake.toLocaleString()})
            </div>
          </div>
        </div>
      )}

      {/* League leaderboard */}
      <LeagueLeaderboard
        entries={leaderboard}
        currentUserId={currentUserId}
        matchdayNames={matchdays}
        leagueName={league.name}
      />

      {/* Members */}
      <div className="card-retro">
        <div className="card-retro-header">
          Miembros ({league.members.filter((m) => m.paid).length})
        </div>
        <div className="card-retro-body p-0">
          {league.members.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground text-sm">
              Sin miembros todavía
            </div>
          ) : (
            <table className="table-retro w-full">
              <thead>
                <tr>
                  <th>Jugador</th>
                  <th className="text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {league.members.map((m) => (
                  <tr key={m.userId}>
                    <td>
                      <div className="flex items-center gap-2">
                        {m.userImage ? (
                          <img src={m.userImage} alt="" className="w-5 h-5 border border-border" />
                        ) : (
                          <div className="w-5 h-5 bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                            {(m.userName || "?")[0].toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm">{m.userName}</span>
                        {m.userId === currentUserId && (
                          <span className="text-[10px] text-accent">(vos)</span>
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      {m.paid ? (
                        <span className="text-[10px] font-heading font-bold text-green-600 border border-green-600 px-1.5 py-0.5">
                          PAGADO
                        </span>
                      ) : (
                        <span className="text-[10px] font-heading font-bold text-amber-600 border border-amber-600 px-1.5 py-0.5">
                          PENDIENTE
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-24 bg-muted animate-pulse" />
      <div className="card-retro">
        <div className="header-bar-accent">Cargando...</div>
        <div className="card-retro-body">
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </div>
      <div className="card-retro">
        <div className="card-retro-header">Ranking</div>
        <div className="card-retro-body">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-muted animate-pulse mb-2" />
          ))}
        </div>
      </div>
    </div>
  );
}
