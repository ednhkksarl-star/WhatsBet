# PRD — WhatsBet by Betika

**Version :** 1.0  
**Date :** 14 juin 2026  
**Client :** BiG SARLU  
**Produit :** WhatsBet Powered by Betika  
**Statut :** MVP + Démo Betika

---

## 1. Résumé exécutif

WhatsBet est le **premier bookmaker conversationnel sur WhatsApp**. L'utilisateur ne navigue pas sur un site web de paris : il discute directement avec un assistant intelligent capable de consulter les matchs, construire des combinés, déposer et retirer de l'argent, et recevoir des suggestions IA.

**Slogan :** *Le premier bookmaker conversationnel sur WhatsApp.*

**Objectif MVP :** Livrer une démonstration fonctionnelle pour Betika, prête pour une montée en charge vers une plateforme de paris conversationnelle à grande échelle.

---

## 2. Problème & opportunité

### Problème

Les bookmakers traditionnels imposent une navigation web complexe, peu adaptée aux marchés africains où WhatsApp est le canal de communication dominant.

### Opportunité

Transformer WhatsApp en canal de paris sportifs natif, réduisant la friction d'acquisition et maximisant l'engagement via une expérience 100 % conversationnelle.

### Proposition de valeur

| Pour l'utilisateur | Pour Betika | Pour BiG SARLU |
|---|---|---|
| Paris sans app ni site | Nouveau canal de distribution | Plateforme SaaS scalable |
| QuickBet & suggestions IA | Visibilité marque partenaire | Revenus commission |
| Dépôts Mobile Money instantanés | Dashboard analytics lecture seule | Architecture extensible |

---

## 3. Personas

### 3.1 Joueur WhatsApp (Utilisateur final)

- **Profil :** Homme 18–35 ans, RDC, utilisateur WhatsApp quotidien
- **Comportement :** Parie occasionnellement, préfère Mobile Money (M-Pesa, Orange Money, Airtel Money)
- **Besoins :** Voir les matchs, parier vite, suivre ses tickets, déposer/retirer facilement
- **Pain points :** Sites lents, interfaces complexes, pas de notifications

### 3.2 Super Admin (Glody MUTOMBO)

- **Profil :** Opérateur plateforme BiG SARLU
- **Besoins :** KPIs temps réel, validation retraits, gestion utilisateurs, exports
- **Accès :** Full control — SUPER_ADMIN

### 3.3 Admin Betika (Partenaire)

- **Profil :** Équipe commerciale Betika
- **Besoins :** Consulter volume, CA, commissions, top matchs/ligues
- **Contrainte :** Lecture seule — aucune modification possible

### 3.4 Support

- **Profil :** Agent support client
- **Besoins :** Recherche utilisateurs, historique tickets, blocage/déblocage

---

## 4. Objectifs produit

### 4.1 Objectifs business (MVP)

| Objectif | Métrique cible | Horizon |
|---|---|---|
| Démo Betika fonctionnelle | 100 % des flows critiques opérationnels | Phase 1 |
| Acquisition utilisateurs WhatsApp | Création auto au 1er message | MVP |
| Volume de paris | ≥ 50 tickets/jour en démo | Phase 1 |
| Dépôts SimplyPaye | Flux end-to-end validé | MVP |

### 4.2 Objectifs techniques

- Architecture monorepo scalable (Next.js 15 + Gateway Railway)
- Migration future vers WhatsApp Cloud API sans refonte majeure
- Type safety stricte, tests Vitest + Playwright
- Synchronisation matchs toutes les 15 minutes

### 4.3 Non-objectifs (MVP)

- Paris live (Phase 3)
- Multi-sports au-delà du football (post-V1)
- Intégration API Betika officielle (Phase 2)
- Application mobile native

---

## 5. Architecture produit (vue haut niveau)

```
Utilisateur WhatsApp
        ↓
Baileys Gateway (Railway)
        ↓  webhooks JWT + HMAC
Next.js API (Vercel)
        ↓
┌───────┼───────────┐
▼       ▼           ▼
Neon   The Odds   SimplyPaye
PostgreSQL  API
```

> **Contrainte critique :** Baileys ne peut pas tourner sur Vercel (serverless). Le gateway WhatsApp est hébergé sur Railway avec communication sécurisée vers l'API Vercel.

---

## 6. Stack technique

| Couche | Technologie |
|---|---|
| Frontend | Next.js 15, App Router, TypeScript, TailwindCSS, Shadcn UI, Framer Motion |
| Backend | Route Handlers, Server Actions, Middleware |
| Base de données | PostgreSQL (Neon) + Drizzle ORM |
| Auth | Better Auth (admins + 2FA) |
| Validation | Zod |
| Cache | Redis (Upstash) |
| Storage | Vercel Blob |
| Logs | Pino |
| Paiement | SimplyPaye (webhooks) |
| Données sport | The Odds API |
| WhatsApp | Baileys (Railway) → migration Cloud API |

---

## 7. Modules fonctionnels

### Module 1 — Authentification

**Utilisateur WhatsApp**
- Création automatique à la réception du premier message
- Identifiant : numéro de téléphone (`+243...`)
- Champs : `id`, `phone`, `name`, `balance`, `status`, `createdAt`

**Admin**
- Connexion email + mot de passe + 2FA
- Rôles : `SUPER_ADMIN`, `BETIKA`, `SUPPORT`

**Critères d'acceptation**
- [ ] Un nouveau numéro WhatsApp crée un compte utilisateur automatiquement
- [ ] Un admin peut se connecter avec 2FA
- [ ] Les rôles restreignent correctement l'accès aux dashboards

---

### Module 2 — Gestion utilisateurs

**Fonctionnalités**
- Recherche par téléphone/nom
- Blocage / déblocage de compte
- Consultation solde et historique
- Vue tickets associés
- Dashboard temps réel

**Critères d'acceptation**
- [ ] Recherche instantanée (< 500 ms)
- [ ] Un utilisateur bloqué ne peut plus parier via WhatsApp
- [ ] Historique complet des actions sur le compte

---

### Module 3 — Synchronisation matchs

**Source :** The Odds API  
**Sport V1 :** Football uniquement  
**Fréquence :** Cron toutes les 15 minutes

**Données stockées**
- Ligues, équipes, matchs, marchés, cotes
- Extensibilité multi-sports prévue en architecture

**Critères d'acceptation**
- [ ] Matchs du jour disponibles dans les 15 min suivant publication API
- [ ] Cotes mises à jour sans interruption de service
- [ ] Matchs terminés passent en statut `finished`

---

### Module 4 — Marchés de paris (MVP)

| Marché | Sélections |
|---|---|
| 1X2 | Home Win, Draw, Away Win |
| Double Chance | 1X, X2, 12 |
| BTTS | Yes, No |
| Over/Under | Over 1.5, Over 2.5, Over 3.5 |

Architecture extensible pour ajout de marchés futurs.

---

### Module 5 — Moteur de tickets (cœur métier)

**Capacités**
- 1 à 15 sélections par ticket
- Calcul automatique : cote totale, gain potentiel, mise
- Validation : cote valide, match actif, marché actif

**Services (DDD)**
- `TicketService`
- `BetEngine`
- `OddsCalculator`
- `SettlementEngine`

**Formules**
```
coteTotale = selection1 × selection2 × ... × selectionN
gainPotentiel = mise × coteTotale
```

**Critères d'acceptation**
- [ ] Ticket de 15 sélections calculé en < 100 ms
- [ ] Rejet si cote expirée ou match commencé
- [ ] Débit du solde à la validation du ticket

---

### Module 6 — QuickBet (signature produit)

**Commande WhatsApp :** `quick`

**Options proposées au joueur**
1. Ticket sûr — cotes basses, probabilité élevée
2. Ticket équilibré — ratio risque/rendement modéré
3. Jackpot — cotes élevées, gain maximal
4. IA personnalisée — paramètres utilisateur

**Critères d'acceptation**
- [ ] Génération en < 3 secondes
- [ ] Ticket proposé respecte le solde disponible
- [ ] L'utilisateur peut accepter ou regénérer

---

### Module 7 — IA de suggestion

**Interface abstraite** (compatible OpenAI)

| Méthode | Description |
|---|---|
| `generateSafeTicket()` | Sélections à faible risque |
| `generateBalancedTicket()` | Équilibre risque/rendement |
| `generateJackpotTicket()` | Maximise le gain potentiel |
| `generateCustomTicket()` | Paramètres utilisateur |

**Entrées :** budget, objectif gain, nombre de matchs  
**Sortie :** ticket optimisé prêt à valider

---

### Module 8 — Dépôts (SimplyPaye)

**Flux**
```
WhatsApp → montant → lien SimplyPaye → paiement → webhook → crédit solde
```

**Services**
- `TransactionService`
- `LedgerService`
- `AuditService`

**Exigences**
- Idempotence obligatoire (éviter double crédit)
- Réconciliation automatique via webhook

**Critères d'acceptation**
- [ ] Lien de paiement généré en < 2 s
- [ ] Solde crédité dans les 30 s après confirmation webhook
- [ ] Notification WhatsApp de confirmation

---

### Module 9 — Retraits

**Commande WhatsApp :** `retrait`

**Collecte**
- Montant
- Numéro Mobile Money

**Workflow admin**
```
Pending → Approved → Paid
         ↘ Rejected
```

Validation manuelle par Super Admin.

**Critères d'acceptation**
- [ ] Retrait impossible si solde insuffisant
- [ ] Admin reçoit notification de nouvelle demande
- [ ] Utilisateur notifié à chaque changement de statut

---

### Module 10 — Tickets & statuts

| Statut | Description |
|---|---|
| `pending` | En attente du résultat |
| `won` | Gagnant — solde crédité |
| `lost` | Perdant |
| `cancelled` | Annulé (match reporté, etc.) |

Historique complet consultable via WhatsApp (`ticket`) et dashboard.

---

### Module 11 — Bot WhatsApp

**Philosophie :** Conversation guidée, pas de menus longs.

**Commandes**

| Commande | Action |
|---|---|
| `pari` | Construire un ticket manuellement |
| `matchs` | Voir les matchs du jour |
| `quick` | QuickBet (4 options) |
| `ticket` | Consulter ses tickets |
| `solde` | Afficher le solde |
| `depot` | Initier un dépôt |
| `retrait` | Initier un retrait |
| `aide` | Menu d'aide |

**Composant technique :** `ConversationStateManager` — gestion multi-étapes avec persistance Redis.

---

### Module 12 — Dashboard Super Admin

**KPIs**
- Utilisateurs actifs / total
- Dépôts (volume, count)
- Retraits (pending, paid)
- Tickets (pending, won, lost)
- Volume total parié
- Bénéfices & commissions

**Graphiques :** jour / semaine / mois

**Actions**
- Valider / rejeter retraits
- Bloquer / débloquer comptes
- Consulter tickets
- Exporter CSV / Excel

**Accès initial :** Glody MUTOMBO

---

### Module 13 — Dashboard Betika

**Mode :** Lecture seule

**Consultation**
- Utilisateurs actifs
- Volume généré, CA, commissions
- Nombre de tickets
- Top matchs & top ligues

**Restrictions :** Aucune modification, suppression ou paiement possible.

---

### Module 14 — Notifications WhatsApp

**Événements déclencheurs**

| Événement | Message exemple |
|---|---|
| Ticket créé | « Votre ticket #1234 est enregistré. Cote : 12.5 » |
| Ticket gagnant | « Félicitations ! +125 000 CDF » |
| Ticket perdant | « Ticket #1234 terminé. Bonne chance next time ! » |
| Dépôt confirmé | « +5 000 CDF crédités sur votre compte » |
| Retrait validé | « Votre retrait de 10 000 CDF a été envoyé » |

**Service :** `NotificationService`

---

### Module 15 — Audit Log

**Tracé obligatoire pour :**
- Actions admin (validation retrait, blocage)
- Transactions financières
- Création/modification tickets
- Connexions admin

**Champs :** utilisateur, action, date, IP, payload  
**Service :** `AuditLogService`

---

## 8. Modèle de données (aperçu)

| Table | Description |
|---|---|
| `users` | Joueurs WhatsApp |
| `admins` | Comptes admin avec rôles |
| `betika_users` | Comptes partenaire Betika |
| `matches` | Matchs synchronisés |
| `markets` | Marchés de paris |
| `odds` | Cotes par marché |
| `tickets` | Paris combinés |
| `ticket_selections` | Sélections d'un ticket |
| `transactions` | Dépôts SimplyPaye |
| `withdrawals` | Demandes de retrait |
| `notifications` | Historique notifications |
| `logs` | Audit trail |
| `sessions` | Sessions conversation WhatsApp |
| `settings` | Configuration plateforme |

---

## 9. Exigences non-fonctionnelles

| Catégorie | Exigence |
|---|---|
| Performance | API < 200 ms (p95), bot réponse < 3 s |
| Disponibilité | 99.5 % uptime (hors maintenance) |
| Sécurité | JWT + HMAC webhooks, 2FA admin, chiffrement transit |
| Scalabilité | Architecture monorepo, Redis cache, Neon serverless |
| Conformité | Audit log complet, idempotence transactions |
| Qualité code | Clean Architecture, DDD, SOLID, Vitest + Playwright |
| Devise | CDF (Franc congolais) — configurable |

---

## 10. Identité visuelle & assets

Les assets de marque sont disponibles dans `/public` :

| Fichier | Usage |
|---|---|
| `/public/logo.png` | Logo principal WhatsBet Powered by Betika — headers, landing, emails |
| `/public/favicon.png` | Favicon & avatar bot WhatsApp Betika |

Voir `design-system.md` pour la palette de couleurs extraite du logo et les guidelines UI.

---

## 11. Roadmap

### Phase 1 — Démo Betika (MVP)
- Bot WhatsApp fonctionnel
- Matchs & cotes (The Odds API)
- Moteur combinés (1–15 sélections)
- QuickBet
- Dépôts SimplyPaye
- Dashboards Super Admin & Betika

### Phase 2 — Intégration Betika
- API Betika officielle
- Vrais matchs & vraies cotes
- Tickets réels

### Phase 3 — Paris Live
- Cotes en temps réel
- Paris pendant le match

### Phase 4 — IA avancée
- Modèles prédictifs
- Personnalisation poussée
- Recommandations contextuelles

---

## 12. Risques & mitigations

| Risque | Impact | Mitigation |
|---|---|---|
| Baileys instable | Bot offline | Gateway Railway + reconnexion auto ; migration Cloud API planifiée |
| The Odds API quota | Pas de matchs | Cache Redis + fallback données |
| SimplyPaye webhook manqué | Solde non crédité | Idempotence + réconciliation cron |
| Fraude retraits | Perte financière | Validation manuelle admin + audit log |
| Conformité jeux | Légal | Validation juridique Betika avant prod |

---

## 13. Métriques de succès (KPIs produit)

| KPI | Formule | Cible MVP |
|---|---|---|
| DAU | Utilisateurs actifs/jour | ≥ 20 |
| Taux conversion dépôt | dépôts / nouveaux users | ≥ 30 % |
| Tickets/jour | count tickets 24h | ≥ 50 |
| QuickBet adoption | quick / total tickets | ≥ 40 % |
| Temps réponse bot | p95 latence | < 3 s |
| Uptime gateway | % disponibilité | ≥ 99 % |

---

## 14. Dépendances & intégrations

| Service | Rôle | Criticité |
|---|---|---|
| The Odds API | Matchs & cotes | Haute |
| SimplyPaye | Paiements Mobile Money | Haute |
| Neon PostgreSQL | Persistance | Haute |
| Railway | Gateway Baileys | Haute |
| Upstash Redis | Cache & sessions | Moyenne |
| Vercel | Hébergement web/API | Haute |
| OpenAI (future) | Suggestions IA | Basse (MVP) |

---

## 15. Glossaire

| Terme | Définition |
|---|---|
| **Combiné** | Ticket avec plusieurs sélections dont les cotes se multiplient |
| **QuickBet** | Génération automatique de ticket selon profil de risque |
| **Gateway** | Microservice Baileys sur Railway gérant WhatsApp |
| **Cote** | Multiplicateur de gain pour une sélection |
| **Mise (Stake)** | Montant parié par l'utilisateur |
| **Settlement** | Règlement d'un ticket après résultat du match |
| **Mobile Money** | Paiement via opérateur télécom (M-Pesa, Orange, Airtel) |

---

## 16. Prochaines étapes

1. ✅ PRD.md (ce document)
2. ⬜ ARCHITECTURE.md
3. ⬜ Database Schema & Drizzle Schema
4. ⬜ API Specifications
5. ⬜ WhatsApp Conversation Flows
6. ⬜ Wireframes Dashboard
7. ⬜ Railway Gateway Architecture
8. ⬜ Plan de développement Sprint par Sprint
9. ⬜ Code MVP

---

*Document généré pour WhatsBet by Betika — BiG SARLU — Confidentiel*
