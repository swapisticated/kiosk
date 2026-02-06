"use client";

import { useRef, useState, MouseEvent } from "react";
import { cn } from "@/lib/utils";

interface TiltPanelProps {
  children: React.ReactNode;
  className?: string;
}

export function TiltPanel({ children, className }: TiltPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    // Max rotation in degrees
    const MAX_ROTATION = 3;

    setRotateX(yPct * -MAX_ROTATION); // Invert Y for X rotation
    setRotateY(xPct * MAX_ROTATION);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "glass transition-transform duration-200 ease-out will-change-transform",
        className
      )}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      }}
    >
      {children}
    </div>
  );
}
