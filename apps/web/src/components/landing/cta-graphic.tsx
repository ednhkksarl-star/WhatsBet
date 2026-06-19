"use client";

import Image from "next/image";

export function CtaBannerGraphic({ className = "" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-end overflow-hidden ${className}`}>
      <Image
        src="/landing/cta-graphic.png"
        alt="WhatsBet — ballon de foot dans une bulle de conversation"
        width={682}
        height={1024}
        className="h-[240px] w-auto shrink-0 origin-center object-contain mix-blend-screen sm:h-[260px] lg:h-[300px] lg:origin-right lg:scale-[1.45] lg:-translate-x-[30px] xl:h-[320px] xl:scale-[1.5]"
        sizes="(max-width: 1024px) 260px, 480px"
      />
    </div>
  );
}
