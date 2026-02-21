"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, Plus, Link2, Search } from "lucide-react";
import { LeagueCard } from "@/components/leagues/league-card";
import { CreateLeagueForm } from "@/components/leagues/create-league-form";

interface LeagueSummary {
  id: number;
  name: string;
  code: string;
  status: string;
  buyIn: number;
  maxPlayers: number;
  memberCount: number;
  paidCount: number;
  startMatchday: { id: number; name: string };
  endMatchday: { id: number; name: string };
  isCreator: boolean;
  isMember: boolean;
  isPaid: boolean;
}

interface Matchday {
  id: number;
  name: string;
}

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState<LeagueSummary[]>([]);
  const [matchdays, setMatchdays] = useState<Matchday[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchLeagues = useCallback(async () => {
    try {
      const res = await fetch("/api/leagues");
      const data = await res.json();
      if (res.ok) {
        setLeagues(data.leagues);
        setMatchdays(data.matchdays);
      }
    } catch {
      setError("Error al cargar ligas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeagues();
  }, [fetchLeagues]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleCreate = async (data: {
    name: string;
    buyIn: number;
    maxPlayers: number;
    startMatchdayId: number;
    endMatchdayId: number;
  }) => {
    setCreateLoading(true);
    try {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setToast(`Liga "${data.name}" creada — código: ${result.code}`);
      setShowCreate(false);
      await fetchLeagues();
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoinLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leagues/${joinCode.trim()}/join`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // If there's a payment link, redirect (mock opens in new tab)
      if (data.initPoint) {
        window.open(data.initPoint, "_blank");
        setToast("Redirigiendo a Mercado Pago para el buy-in...");
      }

      setShowJoin(false);
      setJoinCode("");
      await fetchLeagues();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al unirse");
    } finally {
      setJoinLoading(false);
    }
  };

  if (loading) {
    return <LeaguesSkeleton />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold uppercase">
          Mis Ligas
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowJoin(!showJoin); setShowCreate(false); }}
            className="btn-retro-outline text-xs flex items-center gap-1"
          >
            <Link2 className="w-3.5 h-3.5" />
            Unirme
          </button>
          <button
            onClick={() => { setShowCreate(!showCreate); setShowJoin(false); }}
            className="btn-retro text-xs flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Crear
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="border-2 border-destructive bg-destructive/10 p-3 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="border-2 border-accent bg-accent/10 p-3 text-sm">
          {toast}
        </div>
      )}

      {/* Join form */}
      {showJoin && (
        <div className="card-retro">
          <div className="header-bar-accent flex items-center gap-1">
            <Search className="w-4 h-4" />
            Unirme a una Liga
          </div>
          <div className="card-retro-body flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Código de invitación"
              className="flex-1 border-2 border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
            <button
              onClick={handleJoin}
              disabled={joinLoading || !joinCode.trim()}
              className="btn-retro disabled:opacity-50"
            >
              {joinLoading ? "..." : "Unirme"}
            </button>
          </div>
        </div>
      )}

      {/* Create form */}
      {showCreate && matchdays.length > 0 && (
        <CreateLeagueForm
          matchdays={matchdays}
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          loading={createLoading}
        />
      )}

      {/* League list */}
      {leagues.length === 0 ? (
        <div className="card-retro">
          <div className="card-retro-body text-center py-12">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No tenés ligas todavía. Creá una o uníte con un código de
              invitación.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {leagues.map((league) => (
            <LeagueCard
              key={league.id}
              code={league.code}
              name={league.name}
              status={league.status}
              buyIn={league.buyIn}
              memberCount={league.memberCount}
              paidCount={league.paidCount}
              maxPlayers={league.maxPlayers}
              startMatchday={league.startMatchday.name}
              endMatchday={league.endMatchday.name}
              isCreator={league.isCreator}
              isPaid={league.isPaid}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LeaguesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-40 bg-muted animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-retro">
            <div className="card-retro-body p-3 space-y-2">
              <div className="h-5 w-32 bg-muted animate-pulse" />
              <div className="h-4 w-full bg-muted animate-pulse" />
              <div className="h-4 w-24 bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
