"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "whatsbet_age_verified";

export function AgeGate({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState(true);

  useEffect(() => {
    setVerified(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  if (verified) return <>{children}</>;

  return (
    <>
      {children}
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020617]/90 p-6 backdrop-blur-sm">
        <div className="glass-elevated max-w-md rounded-3xl p-8 text-center">
          <h2 className="text-xl font-bold text-white">Accès réservé aux majeurs</h2>
          <p className="mt-3 text-sm text-slate-400">
            WhatsBet by Betika est un service de paris réservé aux personnes de 18 ans et plus. En continuant, vous confirmez avoir l&apos;âge légal requis en RDC.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button
              className="w-full"
              onClick={() => {
                localStorage.setItem(STORAGE_KEY, "1");
                setVerified(true);
              }}
            >
              J&apos;ai 18 ans ou plus
            </Button>
            <a href="https://www.google.com" className="text-xs text-muted hover:text-white">
              Quitter le site
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
