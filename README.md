# WhatsBet by Betika

Monorepo — bookmaker conversationnel sur WhatsApp.

## Structure

```
apps/
  web/       → Next.js 15 (Vercel) — Dashboard + API
  gateway/   → Baileys (Railway) — WhatsApp
packages/
  database/  → Drizzle ORM + schémas PostgreSQL
  shared/    → Services métier (BetEngine, QuickBet)
  types/     → Types TypeScript partagés
docs/        → PRD, Design System, Cahier des charges
```

## Démarrage rapide

```bash
# Installer les dépendances
pnpm install --config.block-exotic-subdeps=false

# Copier et configurer l'environnement
cp .env.example .env

# Pousser le schéma DB
pnpm db:push

# Seed admins (dev only)
curl -X POST http://localhost:3000/api/seed

# Lancer le web
pnpm dev:web

# Lancer le gateway WhatsApp (terminal séparé)
pnpm dev:gateway
```

## Comptes admin (seed dev)

| Email | Rôle | Mot de passe |
|---|---|---|
| glody@whatsbet.cd | SUPER_ADMIN | WhatsBet2026! |
| admin@betika.cd | BETIKA | WhatsBet2026! |

## Commandes bot WhatsApp

`matchs` · `quick` · `ticket` · `solde` · `depot` · `retrait` · `aide`

## Architecture

```
WhatsApp → Gateway (Railway/Baileys) → API (Vercel) → Neon PostgreSQL
                                              ↓
                                    The Odds API + SimplyPaye
```
