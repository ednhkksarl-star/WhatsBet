# Critique — à traiter avant tout lancement

> Dernière revue : juin 2026. Ce document recense les écarts entre l’état actuel du code et les exigences production / PRD.

## Bloquant — sécurité & argent réel

| # | Domaine | Problème | Risque | Action requise |
|---|---------|----------|--------|----------------|
| 1 | Webhooks SimplyPaye | Pas de vérification de signature HMAC | Crédit frauduleux de dépôts | Valider signature + idempotence stricte |
| 2 | Gateway Baileys | API `/send` sans authentification | Envoi de messages arbitraires | Token Bearer `GATEWAY_API_SECRET` |
| 3 | Secrets | `dev-secret-change-me` en fallback JWT | Session forgée | Refuser le démarrage si secrets absents en prod |
| 4 | Cron | Endpoints cron ouverts si `CRON_SECRET` non défini | Sync / réconciliation abusives | Exiger `CRON_SECRET` en production |
| 5 | Settlement | Aucun moteur de règlement des tickets | Paris jamais soldés, gains non payés | Worker settlement + statuts won/lost |
| 6 | Pari manuel | Commande `pari` = stub | Fonction cœur absente | Flow construction ticket complet |
| 7 | Migrations | `db:push` seulement, pas de migrations versionnées | Drift prod / rollback impossible | Drizzle migrations + CI |
| 8 | CI/CD | Pas de pipeline GitHub Actions | Régressions non détectées | Lint, build, tests sur PR |
| 9 | Docker | Pas d’images reproductibles | Déploiement fragile | Dockerfile web + gateway |

## Élevé — fonctionnel & conformité PRD

| # | Domaine | Problème | Statut |
|---|---------|----------|--------|
| 10 | Mise minimum | QuickBet à 5 000 CDF (réalité : **300 CDF**) | ✅ Corrigé |
| 11 | Retraits | Pas d’étape `paid`, pas de notification WhatsApp | ✅ Corrigé |
| 12 | Admin | Bloquer/débloquer joueur depuis dashboard | ✅ Corrigé |
| 13 | Ledger | Paris sans écritures `transactions` (bet/win) | ✅ `recordBet` sur QuickBet |
| 14 | Cotes | Bug `.limit(1)` ; pas de double_chance / btts | ✅ Corrigé |
| 15 | QuickBet | Pas de confirmation accepter / régénérer | ✅ Session `quickbet_confirm` |
| 16 | 2FA admin | Colonnes DB, jamais implémentée | ✅ TOTP login + setup |
| 17 | Rate limiting | Aucun sur login, webhooks | ✅ Middleware |
| 18 | Tests | Zéro test | ✅ Vitest (4 tests shared) |
| 19 | Monitoring | Pas de Sentry | ✅ Logger + hook Sentry optionnel |
| 20 | Middleware | Auth uniquement dans layouts | ✅ `middleware.ts` |

## Moyen — qualité & conformité

| # | Domaine | Problème | Statut |
|---|---------|----------|--------|
| 21 | Pages légales | CGU / confidentialité en `href="#"` | ✅ Pages `/terms`, `/privacy` |
| 22 | Exports | CSV/Excel absents (PRD) | ✅ `/api/export/tickets`, `/users` |
| 23 | Notifications | Table + UI sans insertions | ✅ Helper `logUserNotification` |
| 24 | En-têtes HTTP | Pas de CSP, HSTS, X-Frame-Options | ✅ `next.config.ts` |
| 25 | Sessions bot | PostgreSQL vs Redis (acceptable) | Documenté — OK pour MVP |
| 26 | Documentation ops | Pas de guide déploiement / runbook | ✅ DEPLOYMENT, ARCHITECTURE, RUNBOOK |

## Carte géographique (analytics)

| # | Domaine | Problème | Statut |
|---|---------|----------|--------|
| 27 | Carte RDC | Pas de vue par province (jeu / recettes) | ✅ Module `RdcMap` + API provinces |

## Checklist pré-lancement

- [ ] Variables d’environnement production validées (aucun secret par défaut)
- [ ] `pnpm db:migrate` exécuté sur Neon prod
- [ ] Gateway sur Railway avec `GATEWAY_API_SECRET` + webhook signé
- [ ] SimplyPaye webhook URL publique + signature activée
- [ ] `CRON_SECRET` configuré (Vercel Cron)
- [ ] Settlement des tickets testé sur matchs terminés
- [ ] Retrait bout-en-bout : demande → approbation → paid → WA joueur
- [ ] 2FA activée pour tous les comptes SUPER_ADMIN
- [ ] Sentry DSN configuré
- [ ] Pages légales + vérification d’âge sur landing
- [ ] Backup DB Neon + plan incident (RUNBOOK.md)

## Références

- [PRD](./prd.md)
- [Architecture](./ARCHITECTURE.md)
- [Déploiement](./DEPLOYMENT.md)
- [Runbook incident](./RUNBOOK.md)
