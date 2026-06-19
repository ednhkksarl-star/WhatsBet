"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erreur de connexion");
      return;
    }

    router.push(data.role === "BETIKA" ? "/betika" : "/dashboard");
  }

  return (
    <div className="mesh-bg flex min-h-screen">
      {/* Left panel */}
      <div className="relative hidden w-full max-w-[540px] shrink-0 flex-col justify-between border-r border-white/[0.06] px-12 py-16 xl:max-w-[580px] xl:px-16 xl:py-20 lg:flex">
        <Link href="/" className="inline-block w-fit">
          <Image
            src="/logo.png"
            alt="WhatsBet"
            width={1536}
            height={1024}
            className="h-16 w-auto xl:h-[4.5rem]"
            priority
          />
        </Link>

        <div className="my-auto py-16">
          <h1 className="max-w-md text-[2rem] font-black leading-[1.15] tracking-tight text-white xl:text-4xl">
            Le cockpit de votre{" "}
            <span className="text-brand-yellow-500">bookmaker</span> conversationnel
          </h1>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-slate-400">
            Gérez utilisateurs, tickets, finances et le bot WhatsApp depuis une interface moderne.
          </p>
        </div>

        <p className="text-xs text-slate-600">© 2026 WhatsBet · Powered by Betika</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between px-6 pt-6 lg:hidden">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10 lg:px-12 lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-[420px]"
          >
            <div className="glass-elevated rounded-3xl p-8 sm:p-10">
              <div className="mb-8 lg:hidden">
                <Image
                  src="/logo.png"
                  alt="WhatsBet"
                  width={1536}
                  height={1024}
                  className="mx-auto h-12 w-auto"
                  priority
                />
              </div>

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
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pl-10"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

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

            <p className="mt-6 text-center text-xs text-slate-600 lg:hidden">
              © 2026 WhatsBet · Powered by Betika
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
