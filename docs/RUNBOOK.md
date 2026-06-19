# Runbook incident — WhatsBet

## Contacts & accès

| Ressource | Où |
|-----------|-----|
| Dashboard admin | `/login` |
| Vercel logs | vercel.com → projet → Logs |
| Railway gateway | railway.app → service gateway → Logs |
| Neon DB | console.neon.tech |
| Sentry | sentry.io (si `SENTRY_DSN` configuré) |

## Incidents fréquents

### 1. WhatsApp déconnecté

**Symptômes :** Messages non reçus, gateway « Arrêté », QR demandé.

**Actions :**
1. Vérifier logs Railway gateway
2. Dashboard → Configuration → Reconnecter / scanner QR
3. Si session corrompue : supprimer volume `auth_info_baileys` et re-pairer

### 2. Dépôts bloqués en Pending

**Symptômes :** Joueur a payé, solde non crédité.

**Actions :**
1. Vérifier transaction en DB (`transactions` status pending)
2. Appeler manuellement `GET /api/cron/reconcile-deposits` avec `Authorization: Bearer CRON_SECRET`
3. Vérifier credentials SimplyPaye et webhook URL
4. Crédit manuel si nécessaire (SUPER_ADMIN) + audit log

### 3. Bot ne répond pas

**Actions :**
1. `GET /api/gateway/status` — gateway up ?
2. Logs Vercel sur `/api/webhooks/whatsapp`
3. Vérifier `GATEWAY_WEBHOOK_SECRET` identique web ↔ gateway
4. Tester envoi depuis Conversations dashboard

### 4. Cotes absentes / QuickBet échoue

**Actions :**
1. Vérifier `THE_ODDS_API_KEY` et quota API
2. Lancer sync : `POST /api/cron/sync-odds` (avec cron secret)
3. Vérifier table `odds` pour marchés 1x2, double_chance, btts

### 5. Retrait approuvé mais joueur non payé

**Actions :**
1. Dashboard Retraits → statut doit passer à **paid**
2. Vérifier notification WA envoyée (table `notifications`)
3. Paiement Mobile Money manuel si gateway down

### 6. Compte joueur abusif

**Actions :**
1. Dashboard Utilisateurs → Bloquer
2. Vérifier `users.status = blocked`
3. Consulter audit log

## Escalade sécurité

- Webhook non signé / secret exposé → rotation immédiate des secrets
- Solde incohérent → comparer `users.balance` vs somme `transactions`
- Suspect fraude dépôt → désactiver webhook SimplyPaye, investiguer logs

## Maintenance planifiée

1. Annoncer via broadcast Conversations (si applicable)
2. Mettre gateway en maintenance (stop Railway)
3. Déployer web (Vercel zero-downtime)
4. Redémarrer gateway, vérifier QR si besoin
5. Smoke test : login, sync, message test

## Sauvegardes

Neon : activer point-in-time recovery. Export hebdomadaire recommandé avant gros changements schema.
