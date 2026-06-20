"use client";

import { AgeGate } from "@/components/age-gate";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  MessageCircle,
  Zap,
  Trophy,
  BarChart3,
  Shield,
  Sparkles,
  CheckCircle2,
  Clock,
  TrendingUp,
  Instagram,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { HeroVisual } from "@/components/landing/hero-visual";
import { LandingBetikaBg } from "@/components/landing/landing-betika-bg";
import { CtaBannerGraphic } from "@/components/landing/cta-graphic";
import { MotionBlock, MotionItem, MotionStagger } from "@/components/landing/landing-motion";
import { cn } from "@/lib/utils";

/* ─── Data ─── */
const NAV_LINKS = [
  { label: "Fonctionnalités", href: "#fonctionnalites" },
  { label: "Avantages", href: "#avantages" },
  { label: "Dashboard", href: "/login" },
  { label: "Tarifs", href: "#tarifs" },
];

const STATS = [
  { value: "15", label: "Sélections max" },
  { value: "<3s", label: "Réponse bot" },
  { value: "24/7", label: "Disponibilité" },
  { value: "5%", label: "Commission" },
];

const FEATURES = [
  {
    icon: MessageCircle,
    title: "100% Conversationnel",
    desc: "Pariez via WhatsApp sans application ni site web. Une expérience native pour l'Afrique.",
  },
  {
    icon: Zap,
    title: "QuickBet IA",
    desc: "Ticket sûr, équilibré, jackpot ou personnalisé — généré en quelques secondes.",
  },
  {
    icon: Trophy,
    title: "Combinés ×15",
    desc: "Jusqu'à 15 sélections par ticket avec calcul automatique des cotes et gains.",
  },
  {
    icon: BarChart3,
    title: "Dashboard temps réel",
    desc: "KPIs, analytics, finance et gestion des opérations pour les admins.",
  },
  {
    icon: Shield,
    title: "SimplyPaye",
    desc: "Dépôts et retraits Mobile Money sécurisés avec webhooks idempotents.",
  },
  {
    icon: Sparkles,
    title: "Powered by Betika",
    desc: "Infrastructure scalable prête pour l'intégration API Betika officielle.",
  },
];

const TRUST = [
  { icon: CheckCircle2, title: "Sécurisé", desc: "Transactions chiffrées" },
  { icon: Clock, title: "Fiable", desc: "99.9% de disponibilité" },
  { icon: Zap, title: "Rapide", desc: "Réponses en moins de 3 secondes" },
  { icon: TrendingUp, title: "Évolutif", desc: "Conçu pour des milliers d'utilisateurs" },
];

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const SOCIAL_LINKS: { label: string; Icon: LucideIcon | typeof WhatsAppIcon }[] = [
  { label: "WhatsApp", Icon: WhatsAppIcon },
  { label: "Instagram", Icon: Instagram },
  { label: "X", Icon: X },
];

const FOOTER_LINKS = {
  Produit: [
    { label: "Fonctionnalités", href: "#fonctionnalites" },
    { label: "Dashboard", href: "/login" },
    { label: "Tarifs", href: "#tarifs" },
  ],
  Entreprise: [
    { label: "À propos", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Légal: [
    { label: "Conditions d'utilisation", href: "/terms" },
    { label: "Politique de confidentialité", href: "/privacy" },
  ],
};

/* ─── Page ─── */
export default function HomePage() {
  return (
    <AgeGate>
    <div className="landing-page relative min-h-screen">
      <LandingBetikaBg />

      <div className="relative z-10">
      {/* ══════════ NAVBAR ══════════ */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#001540]/85 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="block h-14 w-[148px] shrink-0 overflow-hidden">
            <Image src="/logo.png" alt="WhatsBet" width={1536} height={1024} className="h-[4.75rem] w-auto max-w-none origin-left scale-[1.2]" priority />
          </Link>

          {/* Center nav — hidden on mobile */}
          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-sm font-medium text-white/70 transition hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden text-sm font-medium text-white/70 transition hover:text-white sm:block">
              Connexion
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-yellow-500 px-4 py-2 text-sm font-bold text-brand-blue-950 transition hover:bg-brand-yellow-400"
            >
              Démarrer <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </motion.header>

      {/* ══════════ HERO ══════════ */}
      <section className="relative overflow-hidden pt-28 pb-16 lg:pt-32 lg:pb-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 lg:grid-cols-2 lg:gap-6 lg:px-8">
          {/* Left — copy */}
          <MotionStagger className="max-w-xl" immediate>
            <MotionItem>
              <div className="mb-6 inline-flex items-center rounded-full border border-brand-yellow-500/35 bg-brand-yellow-500/10 px-4 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-yellow-500">
                  Le premier bookmaker conversationnel sur WhatsApp
                </span>
              </div>
            </MotionItem>

            <MotionItem>
              <h1 className="text-[2.4rem] font-black uppercase leading-[1.02] tracking-tight sm:text-5xl lg:text-[3.25rem]">
                <span className="text-white">Pariez.</span>{" "}
                <span className="text-brand-yellow-500">Discutez.</span>{" "}
                <span className="text-white">Gagnez.</span>
              </h1>
            </MotionItem>

            <MotionItem>
              <p className="mt-5 text-lg font-medium text-white/85">
                Powered by <span className="font-bold text-brand-yellow-500">Betika</span>
              </p>
            </MotionItem>

            <MotionItem>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-slate-400">
                Transformez WhatsApp en plateforme de paris sportifs. Consultez les matchs, pariez, déposez et gagnez — tout en conversation.
              </p>
            </MotionItem>

            <MotionItem>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="https://wa.me/"
                  className="inline-flex items-center gap-2.5 rounded-lg bg-brand-yellow-500 px-5 py-3 text-sm font-bold text-brand-blue-950 transition hover:bg-brand-yellow-400 glow-yellow"
                >
                  <MessageCircle className="h-4 w-4" />
                  Commencer sur WhatsApp
                </a>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-lg border-2 border-brand-yellow-500/60 px-5 py-3 text-sm font-bold text-brand-yellow-500 transition hover:bg-brand-yellow-500/10"
                >
                  Accéder au dashboard
                </Link>
              </div>
            </MotionItem>

            <MotionItem>
              <div className="mt-12 flex flex-wrap items-center gap-0">
                {STATS.map((s, i) => (
                  <div key={s.label} className="flex items-center">
                    {i > 0 && <div className="stat-divider mx-5 hidden sm:block" />}
                    <div className="py-1 pr-6 sm:pr-0">
                      <p className="text-2xl font-black text-white">{s.value}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </MotionItem>
          </MotionStagger>

          {/* Right — phone visual */}
          <HeroVisual />
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section id="fonctionnalites" className="relative py-24">
        {/* Dot decorations */}
        <div className="pointer-events-none absolute left-4 top-1/2 hidden h-40 w-16 -translate-y-1/2 opacity-30 dot-grid lg:block" />
        <div className="pointer-events-none absolute right-4 top-1/2 hidden h-40 w-16 -translate-y-1/2 opacity-30 dot-grid lg:block" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Section header */}
          <MotionBlock className="mb-14 text-center">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-brand-yellow-500">
              Pourquoi WhatsBet ?
            </p>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Une plateforme{" "}
              <span className="text-brand-yellow-500">next-gen</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-slate-400">
              Conçue pour la démo Betika et la montée en charge vers une infrastructure de paris conversationnelle à grande échelle.
            </p>
          </MotionBlock>

          {/* 3×2 grid */}
          <MotionStagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.07}>
            {FEATURES.map((f, i) => {
              const isYellow = i % 2 === 1;
              return (
                <MotionItem key={f.title}>
                  <div className={cn("h-full rounded-2xl p-6", isYellow ? "feature-card-yellow" : "feature-card-blue")}>
                    <div
                      className={cn(
                        "mb-4 flex h-10 w-10 items-center justify-center rounded-xl ring-1",
                        isYellow
                          ? "bg-brand-blue-950/15 ring-brand-blue-950/20"
                          : "bg-brand-blue-900/60 ring-white/[0.08]"
                      )}
                    >
                      <f.icon
                        className={cn("h-5 w-5", isYellow ? "text-brand-blue-950" : "text-brand-yellow-500")}
                        strokeWidth={1.75}
                      />
                    </div>
                    <h3 className={cn("text-[15px] font-bold", isYellow ? "text-brand-blue-950" : "text-white")}>
                      {f.title}
                    </h3>
                    <p className={cn("mt-2 text-[13px] leading-relaxed", isYellow ? "text-brand-blue-950/75" : "text-slate-400")}>
                      {f.desc}
                    </p>
                  </div>
                </MotionItem>
              );
            })}
          </MotionStagger>
        </div>
      </section>

      {/* ══════════ CTA BANNER ══════════ */}
      <section id="avantages" className="py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <MotionBlock variant="scaleIn">
            <div className="cta-banner overflow-hidden rounded-3xl">
              <div className="cta-banner-glow-yellow" aria-hidden />
              <div className="cta-banner-glow-blue" aria-hidden />

              <div className="relative grid min-h-[300px] items-center lg:min-h-[320px] lg:grid-cols-2">
                <MotionStagger className="relative z-10 px-10 py-12 lg:px-14 lg:py-14" immediate stagger={0.1}>
                  <MotionItem>
                    <h2 className="text-[1.75rem] font-black leading-[1.15] text-white sm:text-3xl lg:text-[2.125rem]">
                      Prêt pour la{" "}
                      <span className="text-brand-yellow-500">démo Betika</span> ?
                    </h2>
                  </MotionItem>
                  <MotionItem>
                    <p className="mt-4 max-w-md text-[15px] leading-relaxed text-slate-400">
                      Connectez le bot WhatsApp et lancez votre première session de paris conversationnels.
                    </p>
                  </MotionItem>
                  <MotionItem>
                    <Link
                      href="/login"
                      className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand-yellow-500 px-5 py-3 text-sm font-bold text-brand-blue-950 transition hover:bg-brand-yellow-400"
                    >
                      Ouvrir le dashboard <ArrowRight className="h-4 w-4" />
                    </Link>
                  </MotionItem>
                </MotionStagger>

                <MotionBlock className="relative z-10 hidden min-h-[300px] overflow-hidden lg:block" delay={0.15} variant="fadeIn">
                  <div className="absolute inset-y-0 right-0 flex w-full items-center justify-end pr-6 xl:pr-10">
                    <CtaBannerGraphic className="h-full w-full" />
                  </div>
                </MotionBlock>

                <MotionBlock className="relative z-10 pb-10 lg:hidden" delay={0.1} variant="fadeIn">
                  <CtaBannerGraphic />
                </MotionBlock>
              </div>
            </div>
          </MotionBlock>
        </div>
      </section>

      {/* ══════════ TRUST BAR ══════════ */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
          <MotionBlock>
            <h2 className="text-xl font-bold text-white sm:text-2xl">
              Une technologie fiable. Une expérience{" "}
              <span className="text-brand-yellow-500">révolutionnaire.</span>
            </h2>
          </MotionBlock>
          <MotionStagger className="mt-12 grid grid-cols-2 gap-8 lg:grid-cols-4" stagger={0.1}>
            {TRUST.map((t) => (
              <MotionItem key={t.title}>
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-yellow-500/10 ring-1 ring-brand-yellow-500/25">
                    <t.icon className="h-5 w-5 text-brand-yellow-500" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{t.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{t.desc}</p>
                  </div>
                </div>
              </MotionItem>
            ))}
          </MotionStagger>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer id="tarifs" className="relative overflow-hidden border-t border-white/[0.06] bg-[#000d28] py-14">
        <div className="landing-brush-corner landing-brush-corner--bl" aria-hidden />
        <div className="landing-brush-corner landing-brush-corner--br" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <MotionStagger className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5" stagger={0.06}>
            <MotionItem className="lg:col-span-2">
              <Image src="/logo.png" alt="WhatsBet" width={1536} height={1024} className="h-20 w-auto sm:h-24" />
              <p className="mt-4 max-w-xs text-xs leading-relaxed text-slate-500">
                Le premier bookmaker conversationnel sur WhatsApp. Powered by Betika.
              </p>
            </MotionItem>

            {Object.entries(FOOTER_LINKS).map(([title, links]) => (
              <MotionItem key={title}>
                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-white">{title}</p>
                <ul className="space-y-2.5">
                  {links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="text-xs text-slate-500 transition hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </MotionItem>
            ))}

            <MotionItem>
              <p className="mb-4 text-xs font-bold uppercase tracking-wider text-white">Réseaux</p>
              <div className="flex gap-2.5">
                {SOCIAL_LINKS.map(({ label, Icon }) => (
                  <a
                    key={label}
                    href="#"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-yellow-500/10 ring-1 ring-brand-yellow-500/25 transition hover:bg-brand-yellow-500/20"
                  >
                    {label === "WhatsApp" ? (
                      <WhatsAppIcon className="h-4 w-4 text-brand-yellow-500" />
                    ) : (
                      <Icon className="h-4 w-4 text-brand-yellow-500" strokeWidth={1.75} />
                    )}
                  </a>
                ))}
              </div>
            </MotionItem>
          </MotionStagger>

          <MotionBlock className="mt-12 border-t border-white/[0.06] pt-8 text-center text-[11px] text-slate-600" delay={0.2}>
            <p>© 2026 WhatsBet by Betika — BiG SARLU. Tous droits réservés.</p>
          </MotionBlock>
        </div>
      </footer>
      </div>
    </div>
    </AgeGate>
  );
}
