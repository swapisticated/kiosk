"use client";

export function BackgroundLayer() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Background image - blurred and scaled */}
      <div
        className="absolute inset-0 scale-110"
        style={{
          backgroundImage: "url(/bg.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Dark overlay for contrast - Reduced opacity for brightness */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Atmospheric glow behind dashboard */}
      {/* <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 40%, rgba(79,140,255,0.1) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 50% 50%, rgba(61,214,198,0.06) 0%, transparent 40%)
          `,
        }}
      /> */}

      {/* Top ambient light */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 100% 30% at 50% 0%, rgba(255,255,255,0.08) 0%, transparent 60%)
          `,
        }}
      />

      {/* Subtle vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)`,
        }}
      />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: "url(/noise.png)",
          backgroundRepeat: "repeat",
        }}
      />
    </div>
  );
}
