CAHIER DES CHARGES COMPLET
WHATSBET BY BETIKA
Le premier bookmaker conversationnel sur WhatsApp

Version : 1.0
Projet : MVP + Démo Betika
Client : BiG SARLU
Produit : WhatsBet Powered by Betika

1. VISION DU PRODUIT

WhatsBet est une plateforme de paris sportifs conversationnelle fonctionnant directement dans WhatsApp.

L'utilisateur ne navigue plus sur un site de paris traditionnel.

Il discute avec un assistant intelligent qui lui permet :

Consulter les matchs
Générer des combinés
Créer des tickets
Déposer de l'argent
Retirer de l'argent
Suivre ses paris
Recevoir des suggestions IA

Objectif :

Transformer WhatsApp en bookmaker conversationnel.

2. CONTRAINTE TECHNIQUE PRINCIPALE
Hébergement

100% sur Vercel

Aucun VPS

Aucun backend externe

Aucun serveur Node dédié

ATTENTION IMPORTANT
Baileys + Vercel

Techniquement ce n'est PAS viable en production.

Baileys maintient :

WebSocket permanent
Session persistante
Processus vivant

Vercel fonctionne avec :

Fonctions serverless
Exécution temporaire
Pas de processus permanent

Donc :

❌ Baileys ne peut pas tourner durablement dans Vercel Serverless.

Solutions réelles :

Option A

NextJS sur Vercel

Micro-service Baileys sur :

Railway
Fly.io
Render

(recommandé)

Option B

WhatsApp Cloud API Meta

100% compatible Vercel

(recommandation entreprise)

Pour la démo :

Baileys sur Railway + NextJS sur Vercel.

3. STACK TECHNIQUE
Frontend

NextJS 15

App Router

TypeScript

TailwindCSS

Shadcn/UI

Framer Motion

Backend

NextJS Route Handlers

Server Actions

Middleware

Database

Neon PostgreSQL

Drizzle ORM

Paiement

SimplyPaye

Webhook SimplyPaye

Dépôts

Retraits

API Sport

The Odds API

API KEY :

[à stocker dans .env]

Utilisation :

Matchs
Cotes
Résultats
Sports disponibles
4. ARCHITECTURE
Client WhatsApp
      │
      ▼
Baileys Gateway
      │
      ▼
NextJS API
      │
 ┌────┼─────────┐
 ▼    ▼         ▼
Neon OddsAPI SimplyPaye
5. MODULES PRINCIPAUX
MODULE 1

AUTHENTIFICATION

Utilisateur

Création automatique

via numéro WhatsApp

{
 phone: "+243..."
}
Admin

Connexion Email

Mot de passe

2FA

Betika

Compte partenaire

Permissions spécifiques

MODULE 2

GESTION UTILISATEURS

Table :

users

id
phone
name
balance
status
created_at

Fonctionnalités :

recherche
blocage
historique
MODULE 3

MATCHS

Synchronisation automatique

Toutes les 15 minutes

Depuis :

The Odds API

Sports :

football uniquement

V1

Table :

matches

id
external_id
home_team
away_team
league
country
start_time
status
MODULE 4

MARCHÉS DE PARIS

V1

Uniquement :

1X2
Victoire domicile
Match nul
Victoire extérieur
Double Chance
1X
X2
12
BTTS
Oui
Non
Over / Under
Over 1.5
Over 2.5
Over 3.5
MODULE 5

MOTEUR COMBINÉ

Point central du projet.

Objectif :

Jusqu'à 15 matchs.

Structure :

ticket = {
 selections: []
}

Ajout :

ticket.selections.push({
 matchId,
 oddId,
 odd
})

Calcul :

coteTotale =
selection1 *
selection2 *
selection3

Gain :

mise * coteTotale
MODULE 6

QUICKBET

Signature produit.

Commande :

quick

Bot :

1. Ticket sûr

2. Ticket équilibré

3. Jackpot

4. IA

Génération automatique.

MODULE 7

IA DE SUGGESTION

Fonctions :

generateSafeTicket()

generateBalancedTicket()

generateJackpotTicket()

generateCustomTicket()

Entrées :

montant
objectifGain
nombreMatchs

Sortie :

Ticket complet.

MODULE 8

DEPOT

SimplyPaye

Flux :

WhatsApp

→ Montant

→ Lien SimplyPaye

→ Paiement

→ Webhook

→ Crédit balance

Table :

transactions

id
user_id
amount
status
reference
MODULE 9

RETRAIT

WhatsApp

retrait

Demander :

montant
numéro mobile money

Validation admin.

MODULE 10

TICKETS

Table :

bets

id
user_id
stake
total_odds
potential_win
status

Statuts :

pending
won
lost
cancelled
MODULE 11

BOT WHATSAPP

Menu intelligent.

Pas de menus longs.

Conversation guidée.

Exemples :

pari
solde
depot
retrait
ticket
quick
MODULE 12

DASHBOARD SUPER ADMIN

Accès :

Glody MUTOMBO

Vue :

KPIs

Utilisateurs

Dépôts

Retraits

Volume

Tickets

Gains

Commission

Graphiques :

Jour

Semaine

Mois

Actions :

Valider retraits

Bloquer compte

Voir tickets

Exporter

MODULE 13

DASHBOARD BETIKA

Accès séparé.

Lecture seule.

Peut voir :

Utilisateurs actifs

Volume généré

Nombre de tickets

CA

Commission

Top matchs

Top ligues

Ne peut pas :

Modifier

Supprimer

Payer

MODULE 14

NOTIFICATIONS

WhatsApp

Automatiques.

Exemple :

Votre ticket est gagnant

+125 000 CDF
MODULE 15

AUDIT LOG

Tout enregistrer.

logs

Qui

Quand

Action

IP

BASE DE DONNÉES DRIZZLE

Tables :

users

matches

markets

odds

tickets

ticket_selections

transactions

withdrawals

notifications

logs

admins

betika_users
ROADMAP MVP
Phase 1

Démo Betika

WhatsApp
Matchs Odds API
Combinés
QuickBet
Dashboard
Phase 2

API Betika

Vrais matchs
Vraies cotes
Vrais tickets
Phase 3

Paris Live

Phase 4

IA avancée

INSTRUCTION FINALE POUR CURSOR

Construire une application monorepo NextJS 15 TypeScript utilisant App Router, Tailwind, Shadcn, Neon PostgreSQL, Drizzle ORM, SimplyPaye, The Odds API et une architecture modulaire. Générer un PRD.md détaillé avant toute ligne de code. Créer les dashboards Super Admin et Betika, le moteur de tickets combinés jusqu'à 15 sélections, le moteur QuickBet, l'intégration Odds API et tous les schémas Drizzle. Respecter une architecture scalable prête pour l'intégration future de l'API officielle Betika.

Point critique à noter

Ne demande pas à Cursor de faire tourner Baileys dans Vercel. Ce n'est pas une limitation de code mais du modèle d'exécution serverless de Vercel. Pour la démo, prévois un microservice Baileys séparé (Railway/Fly.io) ou migre directement vers WhatsApp Cloud API si l'objectif est une architecture 100% compatible Vercel.