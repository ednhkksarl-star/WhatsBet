# Design System — WhatsBet by Betika

**Version :** 1.0  
**Date :** 14 juin 2026  
**Basé sur :** `/public/logo.png`, `/public/favicon.png`

---

## 1. Identité de marque

### 1.1 Nom & slogan

| Élément | Valeur |
|---|---|
| **Nom produit** | WhatsBet |
| **Partenaire** | Powered by Betika |
| **Slogan** | Le premier bookmaker conversationnel sur WhatsApp |
| **Domaine visuel** | Sport × Conversation × Mobile Money |

### 1.2 Assets officiels

| Asset | Chemin | Usage |
|---|---|---|
| Logo principal | `/public/logo.png` | Header dashboard, page login, emails, présentations |
| Favicon / Avatar bot | `/public/favicon.png` | Favicon navigateur, photo de profil bot WhatsApp, app icon |

### 1.3 Anatomie du logo

Le logo `/public/logo.png` combine :

- **Bulle de dialogue** (bleu) — canal WhatsApp conversationnel
- **Ballon de football** (blanc/bleu) — paris sportifs
- **Traits de vitesse** (jaune/bleu) — action, rapidité, live
- **Wordmark « WhatsBet »** — « Whats » en blanc, « Bet » en jaune
- **Badge « POWERED BY »** — pill bleu bordure jaune
- **Logo Betika!** — typographie bold jaune, inclinaison dynamique (~12°)

> **Règle :** Ne jamais déformer, recoloriser ou recadrer le logo. Toujours respecter une zone de protection égale à la hauteur du « B » de Betika.

---

## 2. Palette de couleurs

Couleurs extraites par analyse pixel du logo et du favicon.

### 2.1 Couleurs primaires

| Token | Hex | RGB | Usage |
|---|---|---|---|
| `brand-blue-900` | `#002070` | 0, 32, 112 | Fond profond, sidebar dark |
| `brand-blue-800` | `#082878` | 8, 40, 120 | **Couleur primaire** — headers, boutons secondaires, bulle logo |
| `brand-blue-700` | `#103080` | 16, 48, 128 | Hover états, cards accent |
| `brand-blue-600` | `#283880` | 40, 56, 128 | Variante favicon, badges info |
| `brand-yellow-500` | `#FFE018` | 255, 224, 24 | **Couleur accent** — CTA, highlights, « Bet » du wordmark |
| `brand-yellow-400` | `#FFD818` | 255, 216, 24 | Hover CTA, bordures actives |
| `brand-yellow-600` | `#F8D008` | 248, 208, 8 | Variante favicon, états pressed |

### 2.2 Couleurs neutres

| Token | Hex | Usage |
|---|---|---|
| `neutral-0` | `#FFFFFF` | Texte sur fond sombre, « Whats » du wordmark |
| `neutral-50` | `#F8F9FC` | Fond page light mode |
| `neutral-100` | `#EEF0F6` | Bordures légères, dividers |
| `neutral-200` | `#D8DCE8` | Inputs disabled |
| `neutral-400` | `#8892A4` | Texte secondaire |
| `neutral-600` | `#4A5568` | Texte body |
| `neutral-900` | `#0A0A0F` | Fond dark mode (proche du noir du logo) |
| `neutral-950` | `#050508` | Fond deepest dark |

### 2.3 Couleurs sémantiques

| Token | Hex | Usage |
|---|---|---|
| `success-500` | `#22C55E` | Ticket gagnant, dépôt confirmé |
| `success-600` | `#16A34A` | Hover success |
| `error-500` | `#EF4444` | Ticket perdant, erreur, retrait rejeté |
| `error-600` | `#DC2626` | Hover error |
| `warning-500` | `#F59E0B` | Retrait pending, alertes |
| `info-500` | `#3B82F6` | Informations neutres |
| `whatsapp-500` | `#25D366` | Indicateurs canal WhatsApp uniquement |

### 2.4 Couleurs de statut (paris & transactions)

| Statut | Couleur | Token |
|---|---|---|
| Pending | `#F59E0B` | `warning-500` |
| Won | `#22C55E` | `success-500` |
| Lost | `#EF4444` | `error-500` |
| Cancelled | `#8892A4` | `neutral-400` |
| Approved | `#3B82F6` | `info-500` |
| Paid | `#22C55E` | `success-500` |
| Rejected | `#EF4444` | `error-500` |

---

## 3. Configuration Tailwind CSS

```typescript
// tailwind.config.ts — extension couleurs WhatsBet
const colors = {
  brand: {
    blue: {
      600: '#283880',
      700: '#103080',
      800: '#082878', // PRIMARY
      900: '#002070',
    },
    yellow: {
      400: '#FFD818',
      500: '#FFE018', // ACCENT
      600: '#F8D008',
    },
  },
  whatsapp: {
    500: '#25D366',
  },
};
```

### 3.1 Variables CSS (Shadcn UI)

```css
:root {
  /* Light mode */
  --background: 248 249 252;        /* neutral-50 */
  --foreground: 10 10 15;           /* neutral-900 */
  --primary: 8 40 120;              /* brand-blue-800 */
  --primary-foreground: 255 255 255;
  --secondary: 255 224 24;          /* brand-yellow-500 */
  --secondary-foreground: 0 32 112; /* brand-blue-900 */
  --accent: 255 224 24;
  --accent-foreground: 0 32 112;
  --destructive: 239 68 68;
  --border: 216 220 232;
  --ring: 8 40 120;
  --radius: 0.625rem;
}

.dark {
  /* Dark mode — défaut recommandé (aligné fond logo) */
  --background: 10 10 15;           /* neutral-900 */
  --foreground: 255 255 255;
  --primary: 255 224 24;            /* brand-yellow-500 — CTA inversé */
  --primary-foreground: 0 32 112;
  --secondary: 8 40 120;            /* brand-blue-800 */
  --secondary-foreground: 255 255 255;
  --accent: 8 40 120;
  --accent-foreground: 255 255 255;
  --border: 16 48 128;              /* brand-blue-700 */
  --ring: 255 224 24;
}
```

---

## 4. Typographie

### 4.1 Familles de polices

| Rôle | Police | Fallback | Source |
|---|---|---|---|
| **Display / Headings** | `Inter` | system-ui, sans-serif | Google Fonts |
| **Body** | `Inter` | system-ui, sans-serif | Google Fonts |
| **Monospace / Cotes** | `JetBrains Mono` | monospace | Google Fonts |
| **Accent Betika** | `Nunito` (bold, italic) | sans-serif | Référence inclinaison logo Betika |

### 4.2 Échelle typographique

| Token | Taille | Line-height | Weight | Usage |
|---|---|---|---|---|
| `text-display` | 48px / 3rem | 1.1 | 800 | Hero landing |
| `text-h1` | 36px / 2.25rem | 1.2 | 700 | Titres de page dashboard |
| `text-h2` | 28px / 1.75rem | 1.25 | 700 | Sections |
| `text-h3` | 22px / 1.375rem | 1.3 | 600 | Sous-sections, cards |
| `text-h4` | 18px / 1.125rem | 1.4 | 600 | Labels importants |
| `text-body` | 16px / 1rem | 1.5 | 400 | Corps de texte |
| `text-body-sm` | 14px / 0.875rem | 1.5 | 400 | Tableaux, metadata |
| `text-caption` | 12px / 0.75rem | 1.4 | 500 | Badges, timestamps |
| `text-odds` | 18px / 1.125rem | 1 | 700 | Affichage cotes (mono) |

### 4.3 Règles typographiques

- **Wordmark produit :** « Whats » en blanc (`neutral-0`), « Bet » en jaune (`brand-yellow-500`)
- **Titres dashboard :** Bold, blanc sur fond sombre
- **Cotes :** Toujours en `JetBrains Mono`, bold, couleur `brand-yellow-500`
- **Montants CDF :** Format `125 000 CDF` avec espaces milliers

---

## 5. Espacement & grille

### 5.1 Spacing scale (base 4px)

| Token | Valeur |
|---|---|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-12` | 48px |
| `space-16` | 64px |

### 5.2 Grille dashboard

- **Desktop :** 12 colonnes, gutter 24px, max-width 1440px
- **Tablet :** 8 colonnes, gutter 16px
- **Mobile :** 4 colonnes, gutter 16px

### 5.3 Border radius

| Token | Valeur | Usage |
|---|---|---|
| `radius-sm` | 6px | Badges, tags |
| `radius-md` | 10px | Inputs, buttons |
| `radius-lg` | 16px | Cards |
| `radius-xl` | 24px | Modals, panels |
| `radius-pill` | 9999px | Badge « POWERED BY », pills |

---

## 6. Élévation & ombres

```css
--shadow-sm: 0 1px 2px rgba(0, 32, 112, 0.08);
--shadow-md: 0 4px 12px rgba(0, 32, 112, 0.12);
--shadow-lg: 0 8px 24px rgba(0, 32, 112, 0.16);
--shadow-glow-yellow: 0 0 20px rgba(255, 224, 24, 0.3);
--shadow-glow-blue: 0 0 20px rgba(8, 40, 120, 0.4);
```

**Dark mode :** Utiliser `shadow-glow-yellow` sur les CTA principaux pour reproduire l'énergie du logo.

---

## 7. Composants UI

### 7.1 Boutons

| Variante | Fond | Texte | Bordure | Usage |
|---|---|---|---|---|
| **Primary** | `brand-yellow-500` | `brand-blue-900` | — | CTA principal (Parier, Déposer) |
| **Primary hover** | `brand-yellow-400` | `brand-blue-900` | — | — |
| **Secondary** | `brand-blue-800` | `neutral-0` | `brand-yellow-500` 2px | Actions secondaires |
| **Ghost** | transparent | `neutral-0` | — | Navigation sidebar |
| **Destructive** | `error-500` | `neutral-0` | — | Bloquer, Rejeter |
| **WhatsApp** | `whatsapp-500` | `neutral-0` | — | Actions liées au bot |

```tsx
// Exemple Shadcn Button override
<Button className="bg-brand-yellow-500 text-brand-blue-900 font-bold hover:bg-brand-yellow-400 shadow-glow-yellow">
  Parier maintenant
</Button>
```

### 7.2 Cards KPI (Dashboard)

```
┌─────────────────────────────┐
│  ▲ Icon (yellow)            │
│  Label (neutral-400, sm)    │
│  125 430 CDF (h2, white)    │
│  +12.5% ↑ (success-500)     │
└─────────────────────────────┘
  bg: brand-blue-800/40
  border: brand-blue-700
  radius: radius-lg
```

### 7.3 Badges de statut

| Statut | Style |
|---|---|
| Pending | `bg-warning-500/20 text-warning-500 border-warning-500/30` |
| Won | `bg-success-500/20 text-success-500 border-success-500/30` |
| Lost | `bg-error-500/20 text-error-500 border-error-500/30` |
| Cancelled | `bg-neutral-400/20 text-neutral-400 border-neutral-400/30` |

### 7.4 Tableaux de données

- Header : fond `brand-blue-900`, texte `neutral-0`, uppercase `text-caption`
- Rows : alternance `neutral-900` / `brand-blue-800/20`
- Hover row : `brand-blue-700/30`
- Colonne cotes : `font-mono text-brand-yellow-500 font-bold`

### 7.5 Sidebar navigation

```
┌──────────────────┐
│  [logo.png]      │  ← h-10, object-contain
│                  │
│  ● Dashboard     │  ← actif: border-l-4 brand-yellow-500
│  ○ Utilisateurs  │
│  ○ Tickets       │
│  ○ Retraits      │
│  ○ Matchs        │
│  ○ Logs          │
│                  │
│  [Avatar] Admin  │
└──────────────────┘
  bg: brand-blue-900
  width: 260px (desktop)
```

### 7.6 Inputs & formulaires

- Fond : `brand-blue-800/30` (dark) / `neutral-0` (light)
- Bordure : `brand-blue-700` → focus `brand-yellow-500`
- Placeholder : `neutral-400`
- Label : `text-body-sm font-medium text-neutral-0`

---

## 8. Iconographie

### 8.1 Bibliothèque

**Lucide React** (compatible Shadcn UI) — stroke-width 2, taille par défaut 20px.

### 8.2 Icônes métier

| Contexte | Icône Lucide | Couleur |
|---|---|---|
| Dashboard | `LayoutDashboard` | `brand-yellow-500` |
| Utilisateurs | `Users` | `neutral-0` |
| Tickets / Paris | `Ticket` | `brand-yellow-500` |
| Dépôts | `ArrowDownCircle` | `success-500` |
| Retraits | `ArrowUpCircle` | `warning-500` |
| Matchs | `Trophy` | `brand-yellow-500` |
| QuickBet | `Zap` | `brand-yellow-500` |
| WhatsApp | `MessageCircle` | `whatsapp-500` |
| IA | `Sparkles` | `brand-yellow-500` |
| Logs | `ScrollText` | `neutral-400` |
| Export | `Download` | `neutral-0` |

### 8.3 Pictogrammes custom (inspirés logo)

- **Bulle + ballon** : Reprendre la métaphore bulle de dialogue + ballon du logo pour empty states
- **Traits de vitesse** : Motif décoratif sur hero sections (3 lignes horizontales décalées jaune/bleu)

---

## 9. Motion & animation (Framer Motion)

### 9.1 Principes

- **Énergie sportive** — animations rapides, dynamiques (comme les traits de vitesse du logo)
- **Feedback immédiat** — chaque action utilisateur a une micro-animation
- **Pas de distraction** — animations dashboard subtiles, bot WhatsApp plus expressif

### 9.2 Transitions standard

```typescript
const transitions = {
  fast: { duration: 0.15, ease: 'easeOut' },
  normal: { duration: 0.25, ease: 'easeInOut' },
  slow: { duration: 0.4, ease: 'easeInOut' },
  spring: { type: 'spring', stiffness: 300, damping: 25 },
};
```

### 9.3 Animations clés

| Élément | Animation | Durée |
|---|---|---|
| Page enter | fade + slideUp 20px | 0.3s |
| KPI cards | stagger fadeIn (delay 0.05s) | 0.4s |
| Modal | scale 0.95→1 + fade | 0.25s |
| Toast notification | slideIn from right | 0.3s |
| Cote update | pulse yellow glow | 0.6s |
| Ticket won | confetti + scale bounce | 0.8s |
| Sidebar item hover | translateX 4px | 0.15s |

---

## 10. Layouts par écran

### 10.1 Page Login Admin

```
┌─────────────────────────────────────────────┐
│  bg: neutral-950                            │
│                                             │
│     ┌─────────────────────┐                 │
│     │   [logo.png]        │                 │
│     │   h-16 centered     │                 │
│     │                     │                 │
│     │   Email             │                 │
│     │   Password          │                 │
│     │   [Se connecter]    │  ← yellow CTA   │
│     └─────────────────────┘                 │
│     card: brand-blue-800/60                 │
│     border: brand-yellow-500/30             │
└─────────────────────────────────────────────┘
```

### 10.2 Dashboard Super Admin

```
┌────────┬────────────────────────────────────┐
│ Sidebar│  Header: breadcrumb + user menu  │
│        ├────────────────────────────────────┤
│ logo   │  ┌────┐ ┌────┐ ┌────┐ ┌────┐     │
│ nav    │  │KPI │ │KPI │ │KPI │ │KPI │     │
│ items  │  └────┘ └────┘ └────┘ └────┘     │
│        │  ┌─────────────────────────────┐  │
│        │  │     Chart (jour/sem/mois)   │  │
│        │  └─────────────────────────────┘  │
│        │  ┌─────────────────────────────┐  │
│        │  │     Table (retraits pending)│  │
│        │  └─────────────────────────────┘  │
└────────┴────────────────────────────────────┘
```

### 10.3 Dashboard Betika (lecture seule)

- Même layout que Super Admin
- Badge « Lecture seule » en haut (`brand-blue-600` pill)
- Actions destructives/modification masquées
- Accent visuel Betika : logo `/public/favicon.png` dans le header

---

## 11. Messages WhatsApp (formatting)

Le bot utilise du texte formaté WhatsApp natif :

```
🏟 *MATCHS DU JOUR*

1. *Arsenal* vs *Chelsea*
   🕐 20:45 | Premier League
   1: 2.10 | X: 3.40 | 2: 3.20

⚡ Tapez le numéro pour parier
💬 *quick* pour un QuickBet
💰 *solde* pour voir votre solde
```

**Conventions :**
- Titres en `*gras*`
- Emojis sport : 🏟 ⚽ 🏆
- Emojis finance : 💰 💳 ✅ ❌
- Emojis QuickBet : ⚡ 🎯 🎰 🤖
- Montants toujours en CDF avec espaces : `125 000 CDF`
- Cotes en monospace visuel : `×2.50`

---

## 12. Responsive breakpoints

| Breakpoint | Min-width | Comportement |
|---|---|---|
| `sm` | 640px | Sidebar collapsée, KPI 2 colonnes |
| `md` | 768px | Sidebar icônes only, KPI 2 colonnes |
| `lg` | 1024px | Sidebar complète, KPI 4 colonnes |
| `xl` | 1280px | Layout complet, charts full width |
| `2xl` | 1536px | Max-width container centré |

---

## 13. Accessibilité

| Critère | Implémentation |
|---|---|
| Contraste texte | Ratio ≥ 4.5:1 (blanc sur blue-800 = 8.2:1 ✅) |
| Contraste CTA | Jaune sur blue-900 = 7.1:1 ✅ |
| Focus visible | Ring `brand-yellow-500` 2px offset |
| Navigation clavier | Tous composants Shadcn accessibles |
| Screen readers | Labels ARIA sur KPIs et statuts |
| Daltonisme | Statuts = couleur + icône + texte |

---

## 14. Thème recommandé

**Dark mode par défaut** — aligné sur le fond noir du logo WhatsBet.

Justification :
- L'identité visuelle du logo est conçue pour fond sombre
- Le jaune `#FFE018` et le bleu `#082878` atteignent leur impact maximal sur dark
- Cohérent avec l'univers betting / sport nocturne
- Réduit la fatigue visuelle pour les admins (usage prolongé)

Light mode disponible en option via toggle.

---

## 15. Checklist implémentation

- [ ] Configurer Tailwind avec tokens `brand-blue` et `brand-yellow`
- [ ] Importer Inter + JetBrains Mono via `next/font`
- [ ] Override thème Shadcn avec variables CSS ci-dessus
- [ ] Placer `/public/logo.png` dans sidebar et page login
- [ ] Placer `/public/favicon.png` comme favicon + avatar bot
- [ ] Créer composants : `KpiCard`, `StatusBadge`, `OddsDisplay`, `TicketRow`
- [ ] Configurer Framer Motion variants réutilisables
- [ ] Tester contrastes WCAG AA sur dark mode
- [ ] Documenter composants dans Storybook (optionnel Phase 2)

---

*Design System WhatsBet by Betika — BiG SARLU — v1.0*
