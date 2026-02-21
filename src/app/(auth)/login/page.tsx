"use client";

import { signIn } from "next-auth/react";
import { Trophy, User } from "lucide-react";
import { useState } from "react";

const demoUsers = [
  { email: "demo1@bilardeando.com", name: "Juan Demo" },
  { email: "demo2@bilardeando.com", name: "María Demo" },
  { email: "demo3@bilardeando.com", name: "Carlos Demo" },
];

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null);

  function handleLogin(email: string) {
    setLoading(email);
    signIn("credentials", { email, callbackUrl: "/squad" });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header bar */}
      <div className="header-bar text-lg px-4 py-3">
        BILARDEANDO — Fantasy Football Argentina
      </div>

      {/* Centered login card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="card-retro w-full max-w-md">
          <div className="header-bar-accent text-center text-lg px-4 py-3">
            Iniciar Sesión
          </div>
          <div className="card-retro-body space-y-6 py-8 text-center">
            <Trophy className="w-16 h-16 text-espn-gold mx-auto" />
            <h1 className="font-heading text-3xl font-bold text-espn-green uppercase">
              Bilardeando
            </h1>
            <p className="text-sm text-muted-foreground">
              Elegí tu usuario para ingresar a la demo.
            </p>
            <div className="space-y-3">
              {demoUsers.map((user) => (
                <button
                  key={user.email}
                  onClick={() => handleLogin(user.email)}
                  disabled={loading !== null}
                  className="btn-retro-primary w-full text-base px-6 py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <User className="w-5 h-5" />
                  {loading === user.email
                    ? "Ingresando..."
                    : `Ingresar como ${user.name}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
