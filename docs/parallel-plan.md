# Plan de Paralelización — Bilardeando MVP (2 Players)

**Fecha**: 2026-02-20
**Input**: `docs/tasks.md` (T001-T094, 88 tasks across 8 user stories)

---

## 1. Dependencias Verificadas a Nivel de Código

Se analizó cada task para determinar qué archivos **crea** y qué archivos **importa** de otras fases/stories.

### Dependencias REALES (code-level)

| De → A | Razón |
|---|---|
| T001 → T002, T003, T004, T005 | Phase 1 crea el proyecto Next.js, todo lo demás necesita que exista |
| T006 → T007 | `prisma generate` necesita `schema.prisma` |
| T007 → T008, T009, T015 | `@prisma/client` generado por T007, requerido por db.ts, types, auth adapter |
| T008 + T015 → T017 | `withAuth` importa auth config y db |
| T011 → T012 | Mock provider implementa la interfaz de T011 |
| T007 + T008 + T013 → T014 | Seed script necesita Prisma client + mock JSON |
| T015 → T016 | Auth route importa auth config |
| T009 → T010, T011 | Formations e interface importan types |
| T049 (US4) → T069 (US7) | League leaderboard importa `leaderboard-table.tsx` directamente |
| T018 (Phase 2) → T053, T060, T066 | Payment service usado por US5, US6, US7 |

### Dependencias FALSAS (dichas en tasks.md pero no reales)

#### "US2 depende de US1" — FALSO (parcial)

**Lo que dice tasks.md (línea 261)**: "US2 Squad Builder: Depends on Foundational + US1 (needs auth + player data)"

**Realidad**: 10 de 12 tasks de US2 NO importan nada de US1.

| Task US2 | ¿Depende de US1? | Depende realmente de |
|---|---|---|
| T027-T032 (6 componentes UI) | NO | `src/types/index.ts` (Phase 2), `src/lib/formations.ts` (Phase 2) |
| T033 (squad service) | NO | `src/lib/db.ts` (Phase 2) |
| T034 (players API) | NO | `src/lib/api-helpers.ts` (Phase 2, T017) |
| T035-T036 (squad APIs) | NO | `src/lib/api-helpers.ts` (Phase 2, T017) |
| **T037 (squad page)** | **SÍ** | Necesita `src/app/(dashboard)/layout.tsx` de T024 (US1) |
| T038 (validation) | NO | Extiende T033 |

**Conclusión**: US2 puede correr en paralelo con US1. Solo T037 (la página) necesita el dashboard layout de US1.

#### "US6 depende de US1" — FALSO (parcial)

**Realidad**: Wallet service, componentes y API routes dependen de Phase 2 (db.ts, api-helpers, payment service), NO de US1. Solo T065 (wallet page) necesita el dashboard layout.

#### "US3 depende de US2" — FALSO

**Realidad**: US3 no importa NADA de US2. La dependencia es a nivel datos (necesita SquadPlayer records), que el seed script (T014) provee.

#### "US4 depende de US3" — PARCIALMENTE FALSO

**Realidad a nivel código**: US4 solo importa `db.ts` y hace `SELECT SUM(points) FROM MatchdayPoints`. No importa nada de US3.

**Realidad a nivel datos**: Necesita que existan registros en `MatchdayPoints`. El seed script (T014) NO menciona seedear MatchdayPoints explícitamente.

**Solución**: Extender T014 para seedear MatchdayPoints de los 2 matchdays demo.

#### "US7 depende de US6" — FALSO

**Realidad**: US7 usa `payment.service.ts` de Phase 2 (T018), NO de US6. La única dependencia real es T049 (componente leaderboard de US4) → T069 (league leaderboard de US7).

#### "US8 depende de US1-US5" — EXAGERADO

**Realidad**: 5 de 7 tasks de US8 son standalone:

| Task US8 | Dependencias reales |
|---|---|
| T077 (WhatsApp service interface) | Ninguna cross-story |
| T079 (message formatter) | Solo types de Phase 2 |
| T082 (bot config) | Ninguna |
| T081 (AI handler) | Claude API, types |
| T089 (paywall check) | User model (Phase 2) |
| **T078 (intent handlers)** | **Importa servicios de US2-US5** |
| **T080 (webhook route)** | **Importa T077, T078** |

---

## 2. Dependencias FALTANTES (no documentadas)

| Dependencia faltante | Impacto |
|---|---|
| T009 debería depender de T007 | T009 marca `[P]` pero si referencia Prisma enums, necesita el client generado |
| T014 debería seedear MatchdayPoints | Sin esto, US4 muestra datos vacíos |
| T064 (MP webhook) es infra compartida, no de US6 | US5, US7, T094 todos necesitan el webhook handler |
| T094 está tagged `[US8]` pero vive en Phase 8 (US6) | Cross-phase dependency oculta |
| T024 (dashboard layout) es bottleneck para TODAS las pages | T037, T047, T051, T058, T065, T073, T074 todas lo necesitan |
| T017 depende de T015 | Marcado `[P]` pero `withAuth` importa auth config |

---

## 3. Riesgos de Merge

### RIESGO ALTO

| Archivo | Tocado por | Riesgo |
|---|---|---|
| `src/app/(dashboard)/layout.tsx` | T024 (US1) lo crea; otros stories podrían querer agregar nav items | Conflicto en nav bar links |
| `src/types/index.ts` | T009 (Phase 2) lo crea; US2-US8 pueden agregar types | Múltiples stories agregando interfaces al mismo archivo |
| `prisma/schema.prisma` | T006 lo crea | Si algún story necesita cambiar un campo, bottleneck de archivo único |
| `src/app/api/webhooks/mercadopago/route.ts` | T064 (US6) lo crea; US5 y US7 necesitan que maneje sus pagos | US5/US7 payment flows se rompen si no maneja sus tipos |

### RIESGO BAJO

| Patrón de archivos | Razón |
|---|---|
| `src/components/**/*.tsx` | Cada componente es su propio archivo, stories distintos tocan archivos distintos |
| `src/services/*.service.ts` | Cada service es archivo propio por story |
| `src/app/api/**/*` | API routes en directorios separados por feature |
| `src/app/(dashboard)/*/page.tsx` | Cada page es archivo separado |

---

## 4. Grafo de Dependencias CORREGIDO

```
Phase 1 (T001-T005) — Setup proyecto
  │
Phase 2 (T006-T018) — Fundación
  │  Camino crítico: T006→T007→T008, T015→T016→T017
  │  Paralelo real: T013 (mock JSON), T018 (payment service)
  │  Bloqueante: T014 (seed, necesita T007+T013)
  │
  ├── US1 (T019-T026) — Auth + Dashboard Layout
  │     │
  │     │  ← T024 (dashboard layout) es el bottleneck real
  │     │     Todas las pages lo necesitan, NO todo el US1
  │     │
  │     ├── US2 (T027-T038) — Squad Builder
  │     │     Services+Components+APIs: paralelo con US1 ✅
  │     │     Page (T037): después de T024 ❌
  │     │
  │     ├── US3 (T039-T047) — Matchday & Scoring
  │     │     Services+Components+APIs: paralelo con US1 ✅
  │     │     Page (T047): después de T024 ❌
  │     │
  │     ├── US6 (T060-T065, T090-T094) — Wallet & Payments
  │     │     Services+Components+APIs: paralelo con US1 ✅
  │     │     Page (T065): después de T024 ❌
  │     │
  │     ├── US4 (T048-T051) — Leaderboard
  │     │     Código: paralelo con US3 ✅ (si seed tiene MatchdayPoints)
  │     │     Datos: necesita MatchdayPoints seedeados
  │     │
  │     ├── US5 (T052-T059) — Transfers
  │     │     Necesita: squad service (US2) + matchday service (US3)
  │     │     Puede arrancar en paralelo si importa solo interfaces
  │     │
  │     ├── US7 (T066-T076) — Private Leagues
  │     │     Necesita: T049 (leaderboard component de US4)
  │     │     Payment: usa T018 (Phase 2), NO US6
  │     │
  │     └── US8 (T077-T082, T089, T094) — WhatsApp Bot
  │           5/7 tasks son standalone
  │           T078 (intent handlers) necesita servicios de US2-US5
  │
  └── Phase 11 (T083-T088) — Polish
```

---

## 5. Plan de Ejecución para 2 Players

### Wave 0: Foundation (1 player, el otro espera)

**Player 1** hace Phase 1 + Phase 2 completo (T001-T018). Son 18 tasks con dependencias internas que hacen difícil paralelizar entre 2 players en esta fase.

**Player 2** puede preparar mock data (T013) en un archivo separado y pasárselo a Player 1, pero no justifica un worktree.

```bash
# Player 1 (en main o primer worktree)
# T001-T018 secuencial/semi-paralelo
# Merge a main cuando termine
```

**Entregable**: Proyecto Next.js funcional con schema Prisma, auth configurado, mock data seedeado, payment service interface.

---

### Wave 1: Auth + Squad Services (PARALELO)

| | Player 1 | Player 2 |
|---|---|---|
| **Worktree** | `hack auth "US1 auth and login"` | `hack squad "US2 squad builder"` |
| **Tasks** | T019-T026 (8 tasks) | T027-T036, T038 (11 tasks) |
| **Qué hace** | SessionProvider, root layout, login page, middleware, dashboard layout, profile page, user API | Player card, catalog, formation selector, pitch view, bench list, budget bar, squad service, players API, squad APIs, validation |
| **Qué NO hace** | — | T037 (squad page) — necesita dashboard layout |
| **Tiempo estimado** | ~1.5 horas | ~2.5 horas |

**Orden de merge**: Player 1 (US1) merge PRIMERO → Player 2 hace `sync`, agrega T037, merge.

```bash
# Player 1
hack auth "US1 auth and login"
cd ~/worktrees/auth
# /speckit.implement "Ejecutar US1 Auth: tasks T019-T026"
# Cuando termine:
git push origin feat/auth
# Merge a main

# Player 2
hack squad "US2 squad builder"
cd ~/worktrees/squad
# /speckit.implement "Ejecutar US2 Squad Builder: tasks T027-T036 y T038. NO hacer T037 (squad page) todavía"
# Esperar merge de US1, luego:
sync
# /speckit.implement "Ejecutar T037: squad page en src/app/(dashboard)/squad/page.tsx"
git push origin feat/squad
# Merge a main
```

---

### Wave 2: Matchday + Wallet (PARALELO)

| | Player 1 | Player 2 |
|---|---|---|
| **Worktree** | `hack matchday "US3 matchday and scoring"` | `hack wallet "US6 wallet and payments"` |
| **Tasks** | T039-T047 (9 tasks) | T060-T065, T090-T094 (10 tasks) |
| **Qué hace** | Matchday service, scoring service, match card, squad points, status badge, matchday APIs, simulate endpoint, matchday page | Wallet service, balance card, transaction history, wallet APIs, MP webhook, budget purchase, fee logic, AI unlock |
| **Dependencias** | Necesita US1 mergeado (dashboard layout) ✅ | Necesita US1 mergeado (dashboard layout) ✅ |
| **Conflictos posibles** | Ninguno entre ellos | T064 (MP webhook) es archivo compartido — Player 2 lo crea, Player 1 no lo toca |

```bash
# Player 1
hack matchday "US3 matchday and scoring"
cd ~/worktrees/matchday
# /speckit.implement "Ejecutar US3 Matchday: tasks T039-T047"

# Player 2
hack wallet "US6 wallet and payments"
cd ~/worktrees/wallet
# /speckit.implement "Ejecutar US6 Wallet: tasks T060-T065, T090-T094"
```

**Merge**: Cualquier orden, no hay conflictos.

---

### Wave 3: Leaderboard+Transfers + Leagues (PARALELO)

| | Player 1 | Player 2 |
|---|---|---|
| **Worktree** | `hack leaderboard-transfers "US4+US5"` | `hack leagues "US7 private leagues"` |
| **Tasks** | T048-T051 (US4, 4 tasks) + T052-T059 (US5, 8 tasks) = 12 tasks | T066-T076 (11 tasks) |
| **Qué hace** | Leaderboard service+table+API+page, luego transfer service, substitution service, transfer list, sub dialog, transfer APIs, transfers page, MP integration | League service, league card, create form, league leaderboard, league APIs, join API, leagues pages, prize distribution, auto-cancel |
| **Dependencias** | US3 mergeado ✅ (matchday lifecycle para US5) | US4 mergeado... ❌ |

**PROBLEMA**: US7 necesita T049 (leaderboard-table component de US4), y Player 1 está haciendo US4 en esta misma wave.

**SOLUCIÓN**: Player 1 hace US4 primero (4 tasks, rápido), merge, Player 2 hace `sync`, luego ambos continúan en paralelo.

```bash
# Player 1 — US4 primero (rápido)
hack leaderboard "US4 leaderboard"
cd ~/worktrees/leaderboard
# /speckit.implement "Ejecutar US4 Leaderboard: tasks T048-T051"
# Merge a main rápido (4 tasks)

# Player 2 espera merge de US4, luego:
hack leagues "US7 private leagues"
cd ~/worktrees/leagues
# /speckit.implement "Ejecutar US7 Private Leagues: tasks T066-T076"

# Player 1 continúa con US5:
hack transfers "US5 transfers and subs"
cd ~/worktrees/transfers
# /speckit.implement "Ejecutar US5 Transfers: tasks T052-T059"
```

---

### Wave 4: WhatsApp Bot + Polish (PARALELO)

| | Player 1 | Player 2 |
|---|---|---|
| **Worktree** | `hack whatsapp "US8 whatsapp bot"` | `hack polish "Phase 11 polish"` |
| **Tasks** | T077-T082, T089 (7 tasks) | T083-T088 (6 tasks) |
| **Qué hace** | WhatsApp service, intent handlers, message formatter, webhook route, AI handler, bot config, paywall | Skeletons, empty states, error boundary, responsive pass, demo seed script, smoke test |

```bash
# Player 1
hack whatsapp "US8 whatsapp bot"
cd ~/worktrees/whatsapp
# /speckit.implement "Ejecutar US8 WhatsApp Bot: tasks T077-T082, T089"

# Player 2
hack polish "Phase 11 polish"
cd ~/worktrees/polish
# /speckit.implement "Ejecutar Phase 11 Polish: tasks T083-T088"
```

---

## 6. Resumen Visual

```
Tiempo →  ████████████████████████████████████████████████████████████████████

Wave 0:   [Player 1: Phase 1+2 (T001-T018)]
          [Player 2: ---- espera ----]

Wave 1:   [Player 1: US1 Auth (T019-T026)------]
          [Player 2: US2 services+comps (T027-T036,T038)------][+T037]

Wave 2:   [Player 1: US3 Matchday (T039-T047)----------]
          [Player 2: US6 Wallet (T060-T065,T090-T094)----------]

Wave 3:   [P1: US4 (T048-T051)][P1: US5 Transfers (T052-T059)------]
          [P2: --- sync ---][P2: US7 Leagues (T066-T076)-----------]

Wave 4:   [Player 1: US8 WhatsApp (T077-T082,T089)------]
          [Player 2: Phase 11 Polish (T083-T088)------]
```

---

## 7. Comandos Exactos por Wave

### Wave 0 — Player 1

```bash
# En main (o primer worktree)
# /speckit.implement "Ejecutar Phase 1 Setup (T001-T005) y Phase 2 Foundational (T006-T018). Son 18 tasks de infraestructura base."
```

### Wave 1 — Ambos Players

**Player 1:**
```bash
hack auth "US1 auth and login"
cd ~/worktrees/auth
# /speckit.implement "Ejecutar Phase 3: US1 Auth tasks T019-T026. Crear SessionProvider, root layout con fonts, landing page, login page con demo user selector, auth middleware, dashboard layout con top nav, profile page, user API route."
```

**Player 2:**
```bash
hack squad "US2 squad builder services and components"
cd ~/worktrees/squad
# /speckit.implement "Ejecutar US2 Squad Builder tasks T027-T036 y T038. NO hacer T037 (squad page) todavía — necesita dashboard layout de US1. Crear: player card, player catalog, formation selector, pitch view, bench list, budget bar, squad service, players API, squad APIs, validation logic."
```

Después de merge de US1:
```bash
sync
# /speckit.implement "Ejecutar T037: crear squad builder page en src/app/(dashboard)/squad/page.tsx componiendo catalog, formation selector, pitch view, bench list y budget bar."
```

### Wave 2 — Ambos Players

**Player 1:**
```bash
hack matchday "US3 matchday and scoring"
cd ~/worktrees/matchday
# /speckit.implement "Ejecutar Phase 5: US3 Matchday tasks T039-T047. Crear matchday service, scoring service, match card, squad points breakdown, status badge, matchday APIs, simulation endpoint, matchday page."
```

**Player 2:**
```bash
hack wallet "US6 wallet and payments"
cd ~/worktrees/wallet
# /speckit.implement "Ejecutar Phase 8: US6 Wallet tasks T060-T065, T090-T094. Crear wallet service, balance card, transaction history, wallet APIs, MP webhook handler, budget purchase service+API+UI, service fee logic, AI unlock purchase flow."
```

### Wave 3 — Ambos Players

**Player 1 (primero US4, merge rápido, luego US5):**
```bash
hack leaderboard "US4 leaderboard"
cd ~/worktrees/leaderboard
# /speckit.implement "Ejecutar Phase 6: US4 Leaderboard tasks T048-T051. Crear leaderboard service, leaderboard table component, leaderboard API, leaderboard page."
# Merge a main

hack transfers "US5 transfers and subs"
cd ~/worktrees/transfers
# /speckit.implement "Ejecutar Phase 7: US5 Transfers tasks T052-T059. Crear transfer service, substitution service, transfer list, substitution dialog, transfer APIs, substitution APIs, transfers page, MP Checkout Pro integration."
```

**Player 2 (espera merge de US4, luego US7):**
```bash
# Esperar que Player 1 mergee US4
hack leagues "US7 private leagues"
cd ~/worktrees/leagues
# /speckit.implement "Ejecutar Phase 9: US7 Private Leagues tasks T066-T076. Crear league service, league card, create-league form, league leaderboard, leagues APIs, join API, leagues pages, league detail page, prize distribution, auto-cancel logic."
```

### Wave 4 — Ambos Players

**Player 1:**
```bash
hack whatsapp "US8 whatsapp bot"
cd ~/worktrees/whatsapp
# /speckit.implement "Ejecutar Phase 10: US8 WhatsApp Bot tasks T077-T082, T089. Crear WhatsApp service interface+mock, intent handlers, message formatter, webhook route, AI handler con Claude API, bot config, AI paywall check."
```

**Player 2:**
```bash
hack polish "Phase 11 polish and demo"
cd ~/worktrees/polish
# /speckit.implement "Ejecutar Phase 11: Polish tasks T083-T088. Crear loading skeletons, empty states, error boundary+toasts, responsive design pass, demo seed+simulation script, end-to-end smoke test."
```

---

## 8. Notas Importantes

1. **Wave 0 es el cuello de botella** — Player 2 no puede hacer nada útil mientras Player 1 arma la fundación. Considerar que Player 2 trabaje en diseño, mock data, o documentación mientras tanto.

2. **T024 (dashboard layout) es el verdadero blocker** — No todo US1, solo este task. Si Player 1 hace T024 primero dentro de US1 y lo pushea, Player 2 puede empezar sus pages antes.

3. **T064 (MP webhook) debería ser infra compartida** — Está en US6 pero US5, US7, y T094 todos lo necesitan. Player 2 (wallet) debería hacerlo con lógica extensible para que cuando Player 1 haga US5/US7, solo agregue handlers.

4. **T014 (seed) debería incluir MatchdayPoints** — Sin esto, el leaderboard (US4) muestra datos vacíos durante desarrollo.

5. **Merge order importa en Wave 1** — US1 SIEMPRE merge primero, luego US2. En Waves 2-4 el orden no importa.

6. **Archivos compartidos de riesgo**: `types/index.ts`, `dashboard/layout.tsx`, `webhooks/mercadopago/route.ts`. Comunicar entre players antes de tocar estos archivos.
