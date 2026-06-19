import Link from "next/link";
import Image from "next/image";

export default function TermsPage() {
  return (
    <div className="landing-page min-h-screen px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <Link href="/">
          <Image src="/logo.png" alt="WhatsBet" width={200} height={80} className="mb-8 h-10 w-auto" />
        </Link>
        <h1 className="text-3xl font-bold text-white">Conditions d&apos;utilisation</h1>
        <p className="mt-2 text-sm text-muted">Dernière mise à jour : juin 2026</p>

        <div className="prose prose-invert mt-8 max-w-none space-y-6 text-sm leading-relaxed text-slate-300">
          <section>
            <h2 className="text-lg font-semibold text-white">1. Objet</h2>
            <p>
              WhatsBet by Betika est une plateforme de paris sportifs accessibles via WhatsApp, réservée aux personnes majeures (18 ans et plus) en République Démocratique du Congo.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white">2. Compte joueur</h2>
            <p>
              L&apos;utilisation du service implique l&apos;acceptation de ces conditions. Un numéro de téléphone valide est requis. Betika se réserve le droit de suspendre tout compte en cas de fraude ou d&apos;abus.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white">3. Paris et paiements</h2>
            <p>
              Les mises sont exprimées en franc congolais (CDF). La mise minimum QuickBet est de 300 CDF. Les dépôts et retraits passent par Mobile Money agréé. Les gains sont crédités après validation officielle des résultats sportifs.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white">4. Jeu responsable</h2>
            <p>
              Le jeu comporte des risques. Ne pariez que ce que vous pouvez vous permettre de perdre. En cas de difficulté, contactez le support Betika.
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
