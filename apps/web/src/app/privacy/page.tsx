import Link from "next/link";
import Image from "next/image";

export default function PrivacyPage() {
  return (
    <div className="landing-page min-h-screen px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <Link href="/">
          <Image src="/logo.png" alt="WhatsBet" width={200} height={80} className="mb-8 h-10 w-auto" />
        </Link>
        <h1 className="text-3xl font-bold text-white">Politique de confidentialité</h1>
        <p className="mt-2 text-sm text-muted">Dernière mise à jour : juin 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-300">
          <section>
            <h2 className="text-lg font-semibold text-white">Données collectées</h2>
            <p>
              Nous collectons votre numéro WhatsApp, nom affiché, historique de messages avec le bot, transactions et tickets. Ces données servent à fournir le service de paris et à respecter nos obligations légales.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white">Conservation</h2>
            <p>
              Les données sont hébergées sur des serveurs sécurisés (Neon PostgreSQL, Vercel, Railway). Elles ne sont pas vendues à des tiers.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white">Vos droits</h2>
            <p>
              Vous pouvez demander l&apos;accès, la rectification ou la suppression de vos données en contactant Betika via les canaux officiels de support.
            </p>
          </section>
        </div>

        <Link href="/" className="mt-10 inline-block text-sm text-brand-yellow-500 hover:underline">
          ← Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
