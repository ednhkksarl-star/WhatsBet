import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCdf(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${Math.round(num).toLocaleString("fr-FR")} CDF`;
}
