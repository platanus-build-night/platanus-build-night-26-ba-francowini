"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Shield,
  Calendar,
  Trophy,
  ArrowLeftRight,
  Users,
  Wallet,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

const navItems = [
  { href: "/squad", label: "Equipo", icon: Shield },
  { href: "/matchday", label: "Fecha", icon: Calendar },
  { href: "/leaderboard", label: "Ranking", icon: Trophy },
  { href: "/transfers", label: "Pases", icon: ArrowLeftRight },
  { href: "/leagues", label: "Ligas", icon: Users },
  { href: "/wallet", label: "Billetera", icon: Wallet },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top header bar */}
      <div className="header-bar text-lg px-4 py-2 flex items-center justify-between">
        <Link href="/squad" className="hover:opacity-90">
          BILARDEANDO
        </Link>
        <UserMenu session={session} />
      </div>

      {/* Tab navigation */}
      <nav className="tab-nav overflow-x-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={isActive ? "tab-nav-item-active" : "tab-nav-item"}
            >
              <span className="flex items-center gap-1.5">
                <Icon className="w-4 h-4" />
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Page content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4">{children}</main>

      {/* Footer */}
      <footer className="border-t-2 border-border px-4 py-2 text-center text-xs text-muted-foreground">
        Bilardeando &copy; 2026
      </footer>
    </div>
  );
}

function UserMenu({
  session,
}: {
  session: ReturnType<typeof useSession>["data"];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!session?.user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-primary-foreground text-sm hover:opacity-80"
      >
        {session.user.image ? (
          <img
            src={session.user.image}
            alt=""
            className="w-6 h-6 border border-primary-foreground/30"
          />
        ) : null}
        <span className="font-heading font-bold text-xs uppercase hidden sm:inline">
          {session.user.name || session.user.email}
        </span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-card border-2 border-border shadow-lg z-50">
          <Link
            href="/profile"
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            <User className="w-4 h-4" />
            Mi Perfil
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted w-full text-left text-destructive"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
}
