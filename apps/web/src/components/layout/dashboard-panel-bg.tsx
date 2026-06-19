import Image from "next/image";

export function DashboardPanelBg() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <Image
        src="/betika-dashboard-bg.png"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center opacity-35"
        quality={80}
      />
      <div className="absolute inset-0 bg-[#020617]/72" />
      <div className="absolute inset-0 bg-gradient-to-br from-brand-blue-950/75 via-[#020617]/55 to-brand-blue-900/65" />
    </div>
  );
}
