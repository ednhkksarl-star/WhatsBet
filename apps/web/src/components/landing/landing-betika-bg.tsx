export function LandingBetikaBg() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 scale-[1.03] bg-cover bg-center opacity-100 blur-[3px]"
        style={{ backgroundImage: "url(/landing/betika-hero-bg.png)" }}
      />
      <div className="absolute inset-0 bg-[#001540]/78" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#001540]/95 via-[#000d2e]/75 to-brand-blue-950/85" />
    </div>
  );
}
