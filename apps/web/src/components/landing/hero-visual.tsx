"use client";

import { PhoneStageVisual } from "@/components/landing/phone-stage-visual";

export function HeroVisual() {
  return (
    <div className="relative flex items-center justify-center lg:justify-end">
      <div className="absolute right-0 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-brand-blue-700/20 blur-3xl" />
      <div className="absolute right-12 top-1/3 h-[200px] w-[200px] rounded-full bg-brand-yellow-500/8 blur-3xl" />
      <PhoneStageVisual size="landing" />
    </div>
  );
}
