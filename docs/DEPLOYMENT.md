# Déploiement — Vercel + Railway

## Prérequis

- Compte [Vercel](https://vercel.com) (apps/web)
- Compte [Railway](https://railway.app) (gateway Baileys)
- Base [Neon](https://neon.tech) PostgreSQL
- Clés SimplyPaye + The Odds API

## 1. Base de données (Neon)

```bash
# Depuis la racine du monorepo
pnpm install
DATABASE_URL="postgresql://..." pnpm db:push
pnpm db:seed   # optionnel — admin initial
```

## 2. Application web (Vercel)

**Root directory :** `apps/web`  
**Build command :** `cd ../.. && pnpm install && pnpm --filter @whatsbet/web build`  
**Output :** `.next`

### Variables d'environnement (Vercel)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Connection string Neon |
| `AUTH_SECRET` | Secret JWT (32+ chars aléatoires) |
| `GATEWAY_URL` | URL publique Railway gateway |
| `GATEWAY_WEBHOOK_SECRET` | HMAC webhook WhatsApp |
| `SIMPLYPAYE_*` | Credentials SimplyPaye |
| `THE_ODDS_API_KEY` | The Odds API |
| `CRON_SECRET` | Bearer pour cron Vercel |
| `NEXT_PUBLIC_APP_URL` | https://votre-domaine.vercel.app |
| `SENTRY_DSN` | Optionnel — monitoring |

### Cron Vercel (vercel.json)

```json
{
  "crons": [
    { "path": "/api/cron/sync-odds", "schedule": "0 */6 * * *" },
    { "path": "/api/cron/reconcile-deposits", "schedule": "*/5 * * * *" }
  ]
}
```

Headers cron : `Authorization: Bearer ${CRON_SECRET}`

## 3. Gateway WhatsApp (Railway)

**Service :** `apps/gateway`  
**Start :** `node dist/index.js` ou `pnpm start`

### Variables Railway

| Variable | Description |
|----------|-------------|
| `PORT` | 3001 (Railway injecte PORT) |
| `WEBHOOK_URL` | https://votre-app.vercel.app/api/webhooks/whatsapp |
| `GATEWAY_WEBHOOK_SECRET` | Même valeur que Vercel |
| `GATEWAY_API_SECRET` | Token pour `/send` |

Volume persistant recommandé pour `auth_info_baileys/` (session WhatsApp).

### Lier WhatsApp

1. Déployer gateway
2. Dashboard → Configuration → Scanner QR
3. Vérifier statut « En cours d'exécution »

## 4. SimplyPaye

Webhook URL : `https://votre-app.vercel.app/api/webhooks/simplypaye`

## 5. Post-déploiement

- [ ] Login admin + activer 2FA
- [ ] Sync matchs (Matchs → Sync)
- [ ] Test dépôt 500 CDF
- [ ] Test QuickBet 300 CDF
- [ ] Vérifier Sentry / logs

## Développement local

```bash
pnpm install
cp .env.example .env   # remplir les valeurs
pnpm db:push
pnpm dev:web           # :3000
pnpm dev:gateway       # :3001
```
