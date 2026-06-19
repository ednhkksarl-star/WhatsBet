"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [needs2FA, setNeeds2FA] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, totpCode: totpCode || undefined }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (data.requires2FA) setNeeds2FA(true);
      setError(data.error ?? "Erreur de connexion");
      return;
    }

    router.push(data.role === "BETIKA" ? "/betika" : "/dashboard");
  }

  return (
    <div className="mesh-bg flex min-h-screen">
      {/* Panneau gauche — bleu */}
      <div className="relative hidden w-full max-w-[540px] shrink-0 flex-col items-center justify-between border-r border-white/[0.06] px-12 py-16 text-center xl:max-w-[580px] xl:px-16 xl:py-20 lg:flex">
        <Link href="/" className="inline-block">
          <Image
            src="/logo.png"
            alt="WhatsBet"
            width={1536}
            height={1024}
            className="mx-auto h-24 w-auto xl:h-28"
            priority
          />
        </Link>

        <div className="my-auto flex flex-col items-center py-16">
          <h1 className="max-w-md text-[2rem] font-black leading-[1.15] tracking-tight text-white xl:text-4xl">
            Le cockpit de votre{" "}
            <span className="text-brand-yellow-500">bookmaker</span> conversationnel
          </h1>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-slate-400">
            Gérez utilisateurs, tickets, finances et le bot WhatsApp depuis une interface moderne.
          </p>
        </div>

        <p className="text-sm text-slate-500">© 2026 WhatsBet · Powered by Betika</p>
      </div>

      {/* Panneau droit — fond Betika + formulaire */}
      <div className="relative flex min-h-screen min-w-0 flex-1 flex-col">
        <Image
          src="/login/betika-promo.png"
          alt=""
          fill
          className="object-cover object-center"
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#001540]/50 via-[#001540]/30 to-[#001540]/55" />

        <div className="relative z-10 flex items-center justify-between px-6 pt-6 lg:px-10">
          <Link href="/" className="inline-block rounded-xl bg-[#001540]/40 p-2 backdrop-blur-sm lg:hidden">
            <Image
              src="/logo.png"
              alt="WhatsBet"
              width={1536}
              height={1024}
              className="h-10 w-auto"
              priority
            />
          </Link>
          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[#001540]/40 px-3 py-1.5 text-sm text-white/90 backdrop-blur-sm transition hover:bg-[#001540]/55"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
        </div>

        <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-10 lg:px-12 lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-[420px]"
          >
            <div className="glass-elevated rounded-3xl p-8 sm:p-10">
              <h2 className="text-2xl font-bold text-white">Connexion</h2>
              <p className="mt-1.5 text-sm text-slate-400">Accédez à votre espace administrateur</p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-300">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 pl-10"
                      placeholder="admin@betika.cd"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-300">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pl-10 pr-11"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-500 transition hover:text-slate-300"
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {needs2FA && (
                  <div>
                    <label htmlFor="totp" className="mb-2 block text-sm font-medium text-slate-300">
                      Code 2FA (6 chiffres)
                    </label>
                    <Input
                      id="totp"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      className="h-11 font-mono tracking-widest"
                      placeholder="000000"
                      maxLength={6}
                      required
                    />
                  </div>
                )}

                {error && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <Button type="submit" className="mt-2 w-full" size="lg" disabled={loading}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Se connecter"}
                </Button>
              </form>
            </div>

            <p className="mt-6 text-center text-xs text-white/60 lg:hidden">
              © 2026 WhatsBet · Powered by Betika
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
