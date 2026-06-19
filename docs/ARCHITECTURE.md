# Architecture WhatsBet

## Vue d'ensemble

Monorepo pnpm :

```
WhatsBet/
├── apps/web/          # Next.js 15 — dashboard admin + API + bot handler
├── apps/gateway/      # Baileys WhatsApp gateway (Express)
└── packages/
    ├── database/      # Drizzle schema + client Neon
    ├── shared/        # BetEngine, QuickBet, utils
    └── types/         # Types partagés
```

## Flux principaux

### Message WhatsApp entrant

```
Joueur → Gateway Baileys → POST /api/webhooks/whatsapp (HMAC)
       → handleWhatsAppMessage → DB (users, sessions, tickets)
       → Gateway /send → réponse joueur
```

### Dépôt Mobile Money

```
Bot → SimplyPaye initiate → transaction pending
SimplyPaye webhook / polling → completeDepositTransaction
→ crédit solde + notification WA + log notifications
```

### Retrait

```
Bot → withdrawal pending + débit solde
Admin dashboard → approve → paid (+ notification WA)
```

## Base de données (Neon PostgreSQL)

Tables clés : `users`, `tickets`, `transactions`, `withdrawals`, `matches`, `markets`, `odds`, `messages`, `sessions`, `admins`, `notifications`, `logs`.

Sessions bot : table `sessions` (PostgreSQL). Acceptable pour MVP ; Redis recommandé > 10k utilisateurs actifs.

## Auth admin

JWT httpOnly cookie (`whatsbet_session`), 8h. Rôles : `SUPER_ADMIN`, `SUPPORT`, `BETIKA` (lecture seule).

2FA TOTP optionnel par admin (`two_factor_enabled`, `two_factor_secret`).

## Sécurité

- Middleware Next.js : protection `/dashboard/*` et `/api/*` (sauf webhooks, login, cron avec secret)
- Rate limiting mémoire sur login et webhooks
- En-têtes CSP / HSTS / X-Frame-Options via `next.config.ts`

## Intégrations externes

| Service | Usage |
|---------|-------|
| The Odds API | Sync matchs + cotes |
| SimplyPaye | Dépôts Mobile Money RDC |
| Baileys | WhatsApp non-officiel via gateway |

## Analytics géographique

Champ `users.province` (code ISO CD-XX), inféré du préfixe téléphonique. Agrégation tickets/dépôts par province pour la carte RDC.
