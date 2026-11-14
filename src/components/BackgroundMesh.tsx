export function BackgroundMesh() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Base midnight navy field */}
      <div className="absolute inset-0 bg-[#050814]" />

      {/* Subtle architectural coordinate grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(148, 163, 184, 0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.5) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* Electric blue upper-left radial aura */}
      <div
        className="animate-drift-slow absolute -top-40 -left-32 h-[540px] w-[540px] rounded-full opacity-25 blur-[120px]"
        style={{
          background:
            'radial-gradient(circle, rgba(37, 99, 235, 0.65) 0%, rgba(14, 165, 233, 0.25) 45%, transparent 75%)',
        }}
      />

      {/* Purple & cyan right-side ambient aura */}
      <div
        className="animate-drift-reverse absolute top-1/4 -right-40 h-[580px] w-[580px] rounded-full opacity-20 blur-[130px]"
        style={{
          background:
            'radial-gradient(circle, rgba(124, 58, 237, 0.6) 0%, rgba(6, 182, 212, 0.25) 50%, transparent 78%)',
        }}
      />

      {/* Lower subtle cyan-blue glow */}
      <div
        className="animate-drift-slow absolute -bottom-48 left-1/3 h-[480px] w-[480px] rounded-full opacity-15 blur-[130px]"
        style={{
          background:
            'radial-gradient(circle, rgba(6, 182, 212, 0.5) 0%, rgba(59, 130, 246, 0.25) 55%, transparent 78%)',
        }}
      />
    </div>
  );
}
