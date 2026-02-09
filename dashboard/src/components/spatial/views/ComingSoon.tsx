"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description?: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  const [email, setEmail] = useState("");
  const [notified, setNotified] = useState(false);

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setNotified(true);
    setTimeout(() => {
      setNotified(false);
      setEmail("");
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 relative">
      {/* Subtle background text or pattern can go here if needed, but keeping it empty for minimal af */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-start max-w-lg w-full"
      >
        <span className="text-xs font-mono text-cyan-500/80 mb-4 tracking-widest uppercase">
          // Production_Line
        </span>

        <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tighter mb-6 opacity-90">
          {title}
        </h1>

        <p className="text-stone-400 text-lg leading-relaxed mb-12 max-w-md font-light">
          {description ||
            "This module is currently in the forge. We are crafting a pristine experience."}
        </p>

        {/* Minimal Input */}
        {/* <form onSubmit={handleNotify} className="w-full relative group">
          <input
            type="email"
            placeholder="Enter your email for access..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={notified}
            className="w-full bg-transparent border-b border-white/20 py-4 text-xl text-white placeholder:text-white/20 focus:outline-none focus:border-white/60 transition-colors disabled:opacity-50 font-light"
          />
          <button
            type="submit"
            disabled={notified}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors disabled:opacity-0"
          >
            {notified ? (
              <span className="text-sm text-green-400 font-mono">
                Registered
              </span>
            ) : (
              <ArrowRight size={24} strokeWidth={1} />
            )}
          </button>
        </form> */}

        <div className="mt-16 flex items-center gap-4 text-xs font-mono text-white/50">
          <span>EST_ARRIVAL: Q3_2026</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span>PRIORITY: HIGH</span>
        </div>
      </motion.div>
    </div>
  );
}
