# CURSOR MASTER PROMPT — WHATSBET BY BETIKA

Tu es un Senior Software Architect, Product Manager, Tech Lead Next.js, spécialiste FinTech, Betting Platforms, WhatsApp Automation et SaaS Architecture.

Avant d'écrire une seule ligne de code, tu dois générer un document complet PRD.md (Product Requirements Document), puis un ARCHITECTURE.md détaillé.

Le projet s'appelle :

WHATSBET BY BETIKA

Slogan :

Le premier bookmaker conversationnel sur WhatsApp.

---

# CONTEXTE BUSINESS

WhatsBet transforme WhatsApp en plateforme de paris sportifs conversationnelle.

L'utilisateur ne navigue pas sur un site web de paris.

Il discute directement avec un assistant WhatsApp capable de :

* Consulter les matchs
* Voir les cotes
* Construire un ticket
* Générer un combiné
* Déposer de l'argent
* Retirer de l'argent
* Consulter son solde
* Suivre ses tickets
* Recevoir des suggestions IA

L'objectif est de proposer une expérience de paris entièrement conversationnelle.

---

# CONTRAINTE TECHNIQUE MAJEURE

IMPORTANT :

Ne jamais tenter de faire fonctionner Baileys dans Vercel.

Baileys nécessite :

* WebSocket permanent
* Session persistante
* Processus Node vivant

Vercel est serverless.

Architecture imposée :

Frontend + API :

* Next.js 15
* Vercel

WhatsApp Gateway :

* Baileys
* Railway

Communication :

* Webhooks sécurisés
* JWT
* Signature HMAC

Architecture cible :

WhatsApp User
↓
Baileys Gateway (Railway)
↓
Next.js API (Vercel)
↓
Neon PostgreSQL
↓
The Odds API
↓
SimplyPaye

Le système doit être conçu pour permettre ultérieurement une migration vers WhatsApp Cloud API sans refonte majeure.

---

# STACK OBLIGATOIRE

Frontend :

* Next.js 15
* App Router
* TypeScript
* TailwindCSS
* Shadcn UI
* Framer Motion

Backend :

* Route Handlers
* Server Actions
* Middleware

Database :

* PostgreSQL Neon

ORM :

* Drizzle ORM

Validation :

* Zod

Auth :

* Better Auth

Logs :

* Pino

Cache :

* Redis Upstash

File Storage :

* Vercel Blob

Paiement :

* SimplyPaye

Sports Data :

* The Odds API

---

# ARCHITECTURE MONOREPO

Créer :

apps/
web/
gateway/

packages/
database/
shared/
types/
ui/

docs/

Le gateway Railway héberge :

* Baileys
* Session WhatsApp
* Gestion QR
* Réception messages
* Envoi messages
* Webhooks

Le frontend Next.js héberge :

* Dashboard
* API métier
* Auth
* Reporting

---

# MODULE 1 — AUTHENTIFICATION

Utilisateur WhatsApp :

Création automatique à la réception du premier message.

Structure :

User

* id
* phone
* name
* balance
* status
* createdAt

Admin :

* email
* password
* role
* 2FA

Rôles :

SUPER_ADMIN
BETIKA
SUPPORT

---

# MODULE 2 — GESTION UTILISATEURS

Fonctionnalités :

* Recherche
* Blocage
* Déblocage
* Historique
* Solde
* Tickets

Dashboard temps réel.

---

# MODULE 3 — SYNCHRONISATION MATCHS

Source :

The Odds API

Sport V1 :

Football uniquement.

Synchronisation automatique toutes les 15 minutes.

Créer :

* cron jobs
* services
* repositories

Stocker :

* ligues
* équipes
* matchs
* marchés
* cotes

Prévoir extensibilité multi-sports.

---

# MODULE 4 — MARCHÉS DE PARIS

Version MVP :

1X2

* Home Win
* Draw
* Away Win

Double Chance

* 1X
* X2
* 12

BTTS

* Yes
* No

Over / Under

* Over 1.5
* Over 2.5
* Over 3.5

Architecture extensible.

---

# MODULE 5 — MOTEUR DE TICKETS

Fonction centrale du projet.

Support :

1 à 15 sélections.

Structure :

Ticket
Selections[]

Calcul automatique :

Total Odds

Potential Win

Stake

Validation :

* cote valide
* match actif
* marché actif

Utiliser Domain Driven Design.

Créer :

TicketService

BetEngine

OddsCalculator

SettlementEngine

---

# MODULE 6 — QUICKBET

Commande WhatsApp :

quick

Options :

1. Ticket sûr
2. Ticket équilibré
3. Jackpot
4. IA personnalisée

Le moteur génère automatiquement des sélections selon des règles métiers.

---

# MODULE 7 — IA DE SUGGESTION

Créer un service IA abstrait.

Fonctions :

generateSafeTicket()

generateBalancedTicket()

generateJackpotTicket()

generateCustomTicket()

Entrées :

* budget
* objectif gain
* nombre de matchs

Sortie :

ticket optimisé

Prévoir compatibilité OpenAI.

---

# MODULE 8 — DEPOTS

Flux :

WhatsApp
→ montant
→ lien SimplyPaye
→ paiement
→ webhook
→ crédit utilisateur

Créer :

TransactionService

LedgerService

AuditService

Gestion idempotente obligatoire.

---

# MODULE 9 — RETRAITS

Commande :

retrait

Collecter :

* montant
* numéro Mobile Money

Workflow :

Pending
Approved
Rejected
Paid

Validation manuelle par admin.

---

# MODULE 10 — TICKETS

Statuts :

Pending
Won
Lost
Cancelled

Historique complet.

---

# MODULE 11 — BOT WHATSAPP

Conversation guidée.

Commandes :

* pari
* matchs
* quick
* ticket
* solde
* depot
* retrait
* aide

Créer un Conversation State Manager.

Gestion multi-étapes.

---

# MODULE 12 — DASHBOARD SUPER ADMIN

KPIs :

* utilisateurs
* dépôts
* retraits
* tickets
* volume
* bénéfices
* commissions

Graphiques :

* jour
* semaine
* mois

Actions :

* valider retraits
* voir utilisateurs
* voir tickets
* exporter CSV
* exporter Excel

---

# MODULE 13 — DASHBOARD BETIKA

Lecture seule.

Peut consulter :

* utilisateurs actifs
* tickets
* volume
* CA
* commissions
* top matchs
* top ligues

Ne peut rien modifier.

---

# MODULE 14 — NOTIFICATIONS

Notifications WhatsApp automatiques.

Exemples :

Ticket créé

Ticket gagnant

Ticket perdu

Dépôt confirmé

Retrait validé

Créer NotificationService.

---

# MODULE 15 — AUDIT LOG

Tout tracer.

Informations :

* utilisateur
* action
* date
* IP
* payload

Créer AuditLogService.

---

# BASE DE DONNÉES DRIZZLE

Créer les schémas complets :

users

admins

betika_users

matches

markets

odds

tickets

ticket_selections

transactions

withdrawals

notifications

logs

sessions

settings

---

# QUALITÉ LOGICIELLE

Obligatoire :

* Clean Architecture
* DDD
* SOLID
* Repository Pattern
* Service Layer
* DTO Pattern
* Validation Zod
* Type Safety stricte
* Tests unitaires Vitest
* Tests E2E Playwright

---

# LIVRABLES ATTENDUS

Générer dans cet ordre :

1. PRD.md
2. Architecture.md
3. Database Schema
4. Folder Structure
5. API Specifications
6. WhatsApp Conversation Flows
7. Wireframes Dashboard
8. Drizzle Schema
9. Railway Gateway Architecture
10. Plan de développement Sprint par Sprint
11. Code du MVP

Ne jamais sauter une étape.

Toujours documenter avant de coder.

Le résultat final doit être prêt pour une démonstration Betika et une montée en charge future vers une plateforme de paris conversationnelle à grande échelle.
