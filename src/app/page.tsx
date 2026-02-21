import Link from "next/link";
import { Trophy, Users, Zap, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <div className="header-bar text-lg px-4 py-3 flex items-center justify-between">
        <span>BILARDEANDO — Fantasy Football Argentina</span>
        <Link href="/login" className="btn-retro-accent text-xs py-1 px-3">
          Ingresar
        </Link>
      </div>

      {/* Hero section */}
      <main className="max-w-5xl mx-auto p-6">
        <div className="card-retro">
          <div className="header-bar-accent text-xl px-4 py-4 text-center">
            Armá tu equipo. Competí con amigos. Demostrá que sabés de fútbol.
          </div>
          <div className="card-retro-body space-y-6 py-8 text-center">
            <h1 className="font-heading text-5xl font-bold text-espn-green uppercase tracking-tight">
              Bilardeando
            </h1>
            <p className="text-lg font-body max-w-2xl mx-auto">
              La plataforma de fantasy football para la Liga Profesional
              Argentina. Elegí tu formación, armá tu plantel de 18 jugadores con
              $150M de presupuesto, y competí fecha a fecha.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/login" className="btn-retro-primary text-base px-6 py-3">
                Ingresar
              </Link>
            </div>
          </div>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <FeatureCard
            icon={<Trophy className="w-8 h-8 text-espn-gold" />}
            title="Torneo General"
            description="Leaderboard global gratuito. Acumulá puntos fecha a fecha y demostrá quién sabe más."
          />
          <FeatureCard
            icon={<Users className="w-8 h-8 text-espn-gold" />}
            title="Ligas Privadas"
            description="Creá ligas con amigos. Buy-in desde $10k ARS. Premios estilo poker para los mejores."
          />
          <FeatureCard
            icon={<Zap className="w-8 h-8 text-espn-gold" />}
            title="Puntajes en Vivo"
            description="Seguí los resultados de cada fecha. Titulares 1x, suplentes 0.5x, capitán 2x."
          />
          <FeatureCard
            icon={<Shield className="w-8 h-8 text-espn-gold" />}
            title="Mercado de Pases"
            description="Comprá y vendé jugadores entre fechas. Sustituciones durante la fecha con Mercado Pago."
          />
        </div>

        {/* How it works */}
        <div className="card-retro mt-6">
          <div className="card-retro-header">Cómo funciona</div>
          <div className="card-retro-body p-0">
            <table className="table-retro">
              <thead>
                <tr>
                  <th>Paso</th>
                  <th>Acción</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-heading font-bold text-lg text-espn-gold">1</td>
                  <td className="font-bold">Registrate</td>
                  <td>Elegí tu usuario demo y entrá en un click.</td>
                </tr>
                <tr>
                  <td className="font-heading font-bold text-lg text-espn-gold">2</td>
                  <td className="font-bold">Armá tu equipo</td>
                  <td>Elegí formación y 18 jugadores dentro de tu presupuesto de $150M.</td>
                </tr>
                <tr>
                  <td className="font-heading font-bold text-lg text-espn-gold">3</td>
                  <td className="font-bold">Competí</td>
                  <td>Ganá puntos basados en el rendimiento real de tus jugadores.</td>
                </tr>
                <tr>
                  <td className="font-heading font-bold text-lg text-espn-gold">4</td>
                  <td className="font-bold">Subí en el ranking</td>
                  <td>Mirá el leaderboard y demostrá que sos el mejor DT.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground mt-8 mb-4">
          Bilardeando &copy; 2026 — Fantasy Football Argentina
        </div>
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="card-retro">
      <div className="card-retro-body space-y-2 text-center">
        <div className="flex justify-center">{icon}</div>
        <h3 className="font-heading font-bold text-lg uppercase">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
