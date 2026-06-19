"use client";

import Image from "next/image";

export function HeroVisual() {
  return (
    <div className="relative flex items-center justify-center lg:justify-end">
      {/* Ambient glow */}
      <div className="absolute right-0 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-brand-blue-700/20 blur-3xl" />
      <div className="absolute right-12 top-1/3 h-[200px] w-[200px] rounded-full bg-brand-yellow-500/8 blur-3xl" />

      <div className="relative mx-auto w-[min(100%,320px)] sm:w-[340px] lg:w-[380px]">
        {/* Yellow swoosh behind phone */}
        <div className="hero-swoosh" />

        {/* Floating badge */}
        <div className="absolute -left-4 top-[38%] z-20 rounded-xl border border-brand-blue-600/50 bg-brand-blue-900/90 px-3 py-2 shadow-lg glow-blue backdrop-blur-sm sm:-left-8">
          <p className="text-lg font-black leading-none text-brand-yellow-500">100%</p>
          <p className="text-[9px] font-bold uppercase tracking-wider text-white/80">Conversationnel</p>
        </div>

        {/* Smartphone asset */}
        <div className="relative z-10 -rotate-2 drop-shadow-2xl drop-shadow-black/50">
          <Image
            src="/landing/hero-phone.png"
            alt="WhatsBet sur WhatsApp — interface de paris conversationnelle"
            width={682}
            height={1024}
            className="h-auto w-full object-contain"
            priority
            sizes="(max-width: 640px) 320px, (max-width: 1024px) 340px, 380px"
          />
        </div>

        {/* Ground reflection fade */}
        <div className="pointer-events-none absolute -bottom-6 left-1/2 h-16 w-[70%] -translate-x-1/2 bg-gradient-to-b from-brand-blue-900/20 to-transparent blur-xl" />
      </div>
    </div>
  );
}
