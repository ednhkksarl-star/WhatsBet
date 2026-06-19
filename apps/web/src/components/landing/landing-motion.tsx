"use client";

import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1 },
};

const defaultTransition = { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const };

type MotionBlockProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: "fadeUp" | "fadeIn" | "scaleIn";
  once?: boolean;
  /** true = animate on mount (hero), false = on scroll */
  immediate?: boolean;
};

export function MotionBlock({
  children,
  className,
  delay = 0,
  variant = "fadeUp",
  once = true,
  immediate = false,
}: MotionBlockProps) {
  const variants = variant === "fadeIn" ? fadeIn : variant === "scaleIn" ? scaleIn : fadeUp;

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate={immediate ? "visible" : undefined}
      whileInView={immediate ? undefined : "visible"}
      viewport={immediate ? undefined : { once, margin: "-48px" }}
      variants={variants}
      transition={{ ...defaultTransition, delay }}
    >
      {children}
    </motion.div>
  );
}

type MotionStaggerProps = {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  immediate?: boolean;
};

export function MotionStagger({
  children,
  className,
  stagger = 0.08,
  immediate = false,
}: MotionStaggerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate={immediate ? "visible" : undefined}
      whileInView={immediate ? undefined : "visible"}
      viewport={immediate ? undefined : { once: true, margin: "-48px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function MotionItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={cn(className)} variants={fadeUp} transition={defaultTransition}>
      {children}
    </motion.div>
  );
}
