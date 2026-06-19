"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { FeatureBubble } from "@/components/landing/feature-bubble";
import { cn } from "@/lib/utils";

const PARTICLES = [
  { top: "18%", left: "22%", size: 5, delay: 0, color: "#ffe018" },
  { top: "28%", left: "78%", size: 4, delay: 0.8, color: "#ffd000" },
  { top: "62%", left: "14%", size: 3, delay: 1.4, color: "#fff176" },
  { top: "72%", left: "82%", size: 5, delay: 0.3, color: "#ffe018" },
  { top: "48%", left: "8%", size: 3, delay: 2.1, color: "#ffc400" },
  { top: "38%", left: "88%", size: 4, delay: 1.7, color: "#ffe018" },
] as const;

const BUBBLES = [
  {
    value: "100%",
    label: "Conversationnel",
    position: "left-[2%] top-[24%] z-30 -translate-x-1/4",
    bgClass: "bg-brand-blue-900/92",
    borderClass: "border-brand-blue-600/50",
    valueClass: "text-brand-yellow-500",
    glowClass: "glow-blue",
    delay: 0.1,
    floatDelay: 0,
  },
  {
    value: "<3s",
    label: "Réponse bot",
    position: "right-[0%] top-[8%] z-30 translate-x-1/4",
    bgClass: "bg-emerald-950/92",
    borderClass: "border-emerald-500/45",
    valueClass: "text-emerald-400",
    glowClass: "shadow-lg shadow-emerald-500/25",
    delay: 0.2,
    floatDelay: 0.4,
  },
  {
    value: "24/7",
    label: "Disponible",
    position: "right-[1%] top-[40%] z-30 translate-x-1/5",
    bgClass: "bg-violet-950/92",
    borderClass: "border-violet-500/45",
    valueClass: "text-cyan-400",
    glowClass: "shadow-lg shadow-violet-500/25",
    delay: 0.25,
    floatDelay: 0.8,
  },
  {
    value: "15",
    label: "Sélections max",
    position: "left-[3%] bottom-[24%] z-30 -translate-x-1/5",
    bgClass: "bg-brand-blue-950/95",
    borderClass: "border-brand-yellow-500/35",
    valueClass: "text-brand-yellow-500",
    glowClass: "glow-yellow",
    delay: 0.15,
    floatDelay: 1.2,
  },
  {
    value: "300",
    label: "CDF mise min",
    position: "right-[2%] bottom-[10%] z-30 translate-x-1/6",
    bgClass: "bg-orange-950/92",
    borderClass: "border-orange-500/45",
    valueClass: "text-orange-400",
    glowClass: "shadow-lg shadow-orange-500/25",
    delay: 0.3,
    floatDelay: 0.6,
  },
] as const;

const SIZE_CLASSES = {
  landing: "w-[min(100%,320px)] sm:w-[340px] lg:w-[380px]",
  default: "w-[min(100%,240px)] sm:w-[260px] xl:w-[280px]",
  compact: "w-[min(100%,220px)]",
} as const;

const IMAGE_SIZES = {
  landing: "(max-width: 640px) 320px, (max-width: 1024px) 340px, 380px",
  default: "(max-width: 640px) 240px, 280px",
  compact: "220px",
} as const;

export type PhoneStageVisualProps = {
  compact?: boolean;
  className?: string;
  size?: keyof typeof SIZE_CLASSES;
};

export function PhoneStageVisual({ compact = false, className, size }: PhoneStageVisualProps) {
  const resolvedSize = compact ? "compact" : (size ?? "default");
  const bubbles = compact ? BUBBLES.slice(0, 4) : BUBBLES;
  const particleCount = compact ? 4 : 6;

  return (
    <div className={cn("phone-stage", className)}>
      <div className="phone-stage-aurora" aria-hidden />
      <div className="phone-stage-aurora phone-stage-aurora--inner" aria-hidden />
      <div className="phone-stage-orbit" aria-hidden />
      <div className="phone-stage-brush phone-stage-brush--1" aria-hidden />
      <div className="phone-stage-brush phone-stage-brush--2" aria-hidden />
      <div className="phone-stage-spotlight" aria-hidden />
      <div className="phone-stage-floor" aria-hidden />

      {PARTICLES.slice(0, particleCount).map((p, i) => (
        <span
          key={i}
          className="phone-stage-particle"
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDelay: `${p.delay}s`,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
          }}
          aria-hidden
        />
      ))}

      <div className={cn("relative mx-auto", SIZE_CLASSES[resolvedSize])}>
        {bubbles.map((bubble) => (
          <motion.div
            key={bubble.label}
            className={cn("absolute", bubble.position)}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: bubble.delay }}
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{
                duration: 3.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: bubble.floatDelay,
              }}
            >
              <FeatureBubble
                value={bubble.value}
                label={bubble.label}
                bgClass={bubble.bgClass}
                borderClass={bubble.borderClass}
                valueClass={bubble.valueClass}
                glowClass={bubble.glowClass}
                className={cn(compact && "origin-center scale-[0.88]")}
              />
            </motion.div>
          </motion.div>
        ))}

        <motion.div
          className="relative z-20 -rotate-2 drop-shadow-[0_24px_48px_rgba(0,0,0,0.55)]"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/landing/hero-phone.png"
              alt="WhatsBet sur WhatsApp — paris conversationnels"
              width={682}
              height={1024}
              className="h-auto w-full object-contain"
              priority
              sizes={IMAGE_SIZES[resolvedSize]}
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
