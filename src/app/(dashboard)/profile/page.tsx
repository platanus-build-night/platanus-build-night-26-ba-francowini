"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { User, DollarSign, Wallet, Calendar, Mail, Sparkles } from "lucide-react";

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  virtualBudget: number;
  realBalance: number;
  aiUnlocked: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user")
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div className="card-retro">
        <div className="card-retro-header">Mi Perfil</div>
        <div className="card-retro-body text-center py-8 text-muted-foreground">
          No se pudo cargar el perfil.
        </div>
      </div>
    );
  }

  const createdDate = new Date(profile.createdAt).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold uppercase">Mi Perfil</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* User info card */}
        <div className="card-retro lg:col-span-1">
          <div className="card-retro-header">
            <span className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Información
            </span>
          </div>
          <div className="card-retro-body space-y-4">
            <div className="flex items-center gap-4">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt=""
                  className="w-16 h-16 border-2 border-border"
                />
              ) : (
                <div className="w-16 h-16 bg-muted border-2 border-border flex items-center justify-center">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="font-heading font-bold text-lg">
                  {profile.name || "Sin nombre"}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {profile.email}
                </p>
              </div>
            </div>

            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Miembro desde:</span>
                <span className="font-bold">{createdDate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">AI Premium:</span>
                <span className={`font-bold ${profile.aiUnlocked ? "text-green-700" : "text-muted-foreground"}`}>
                  {profile.aiUnlocked ? "Activado" : "No activado"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Budget & Balance cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Virtual budget */}
            <div className="card-retro">
              <div className="header-bar-accent">
                <span className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Presupuesto Virtual
                </span>
              </div>
              <div className="card-retro-body text-center py-6">
                <p className="font-heading text-4xl font-bold text-espn-green">
                  ${profile.virtualBudget}M
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Para armar tu plantel
                </p>
              </div>
            </div>

            {/* Real balance */}
            <div className="card-retro">
              <div className="header-bar-accent">
                <span className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Saldo Real (ARS)
                </span>
              </div>
              <div className="card-retro-body text-center py-6">
                <p className="font-heading text-4xl font-bold text-espn-green">
                  ${profile.realBalance.toLocaleString("es-AR")}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Para ligas, subs y compras
                </p>
              </div>
            </div>
          </div>

          {/* Account summary table */}
          <div className="card-retro">
            <div className="card-retro-header">Resumen de Cuenta</div>
            <div className="card-retro-body p-0">
              <table className="table-retro">
                <thead>
                  <tr>
                    <th>Campo</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-bold">Nombre</td>
                    <td>{profile.name || "—"}</td>
                  </tr>
                  <tr>
                    <td className="font-bold">Email</td>
                    <td>{profile.email || "—"}</td>
                  </tr>
                  <tr>
                    <td className="font-bold">Presupuesto Virtual</td>
                    <td>${profile.virtualBudget}M</td>
                  </tr>
                  <tr>
                    <td className="font-bold">Saldo ARS</td>
                    <td>${profile.realBalance.toLocaleString("es-AR")}</td>
                  </tr>
                  <tr>
                    <td className="font-bold">AI Premium</td>
                    <td>{profile.aiUnlocked ? "Sí" : "No"}</td>
                  </tr>
                  <tr>
                    <td className="font-bold">Miembro desde</td>
                    <td>{createdDate}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-muted animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card-retro lg:col-span-1">
          <div className="card-retro-header">Información</div>
          <div className="card-retro-body space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-muted animate-pulse" />
              <div className="space-y-2">
                <div className="h-5 w-32 bg-muted animate-pulse" />
                <div className="h-4 w-48 bg-muted animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card-retro">
              <div className="header-bar-accent">Presupuesto Virtual</div>
              <div className="card-retro-body text-center py-6">
                <div className="h-10 w-32 bg-muted animate-pulse mx-auto" />
              </div>
            </div>
            <div className="card-retro">
              <div className="header-bar-accent">Saldo Real (ARS)</div>
              <div className="card-retro-body text-center py-6">
                <div className="h-10 w-32 bg-muted animate-pulse mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
