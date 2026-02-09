"use client";

import { motion } from "framer-motion";
import {
  Github,
  Linkedin,
  Twitter,
  Globe,
  Mail,
  ArrowUpRight,
  Copy,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SocialLink {
  label: string;
  url: string;
  icon: any;
  username: string;
  className?: string; // Custom bento classes
}

export function SupportView() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut" as const,
      },
    },
  };
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("swapnilsharma806@gmail.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const links: SocialLink[] = [
    {
      label: "Portfolio",
      url: "https://www.swapisticated.dev/",
      icon: Globe,
      username: "swapisticated.dev",
      className: "col-span-1 md:col-span-2 row-span-1",
    },
    {
      label: "GitHub",
      url: "https://github.com/swapisticated",
      icon: Github,
      username: "@swapisticated",
      className: "col-span-1 row-span-1",
    },
    {
      label: "Twitter / X",
      url: "https://x.com/swapisticated",
      icon: Twitter,
      username: "@swapisticated",
      className: "col-span-1 row-span-1",
    },
    {
      label: "LinkedIn",
      url: "https://www.linkedin.com/in/swapisticated",
      icon: Linkedin,
      username: "Swapnil Sharma",
      className: "col-span-1 md:col-span-2 row-span-1",
    },
  ];

  return (
    <div className="h-full flex flex-col p-4 md:p-8 overflow-y-auto custom-scrollbar">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-4xl mx-auto w-full"
      >
        {/* Header */}
        <motion.div variants={item} className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Connect
          </h2>
          <p className="text-stone-500 font-light">
            Reach out for collaborations or just to say hi.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[140px]">
          {/* Main Contact Card */}
          <motion.div
            variants={item}
            className="col-span-1 md:col-span-2 md:row-span-2 rounded-[28px] bg-white/[0.03] border border-white/10 p-8 flex flex-col justify-between group hover:border-white/20 transition-[border-color,background-color] duration-300 relative overflow-hidden"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center mb-6">
                <Mail className="text-white opacity-80" size={24} />
              </div>
              <h3 className="text-2xl font-medium text-white mb-2">Email Me</h3>
              <p className="text-white text-sm leading-relaxed max-w-xs font-light">
                Open for opportunities, freelance projects, or technical
                consulting.
              </p>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleCopyEmail}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors border border-white/5"
              >
                {copied ? "Copied!" : "Copy Email"}
                <Copy size={12} />
              </button>
              <a
                href="mailto:swapnilsharma806@gmail.com"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black hover:bg-stone-200 text-xs font-bold transition-colors"
              >
                Send Mail <ArrowUpRight size={12} />
              </a>
            </div>
          </motion.div>

          {/* Social Links */}
          {links.map((link) => (
            <motion.a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              variants={item}
              className={cn(
                "relative rounded-[28px] bg-white/[0.03] border border-white/10 p-6 flex flex-col justify-between group hover:border-white/20 transition-[border-color,background-color] duration-300 overflow-hidden",
                link.className
              )}
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0 duration-300">
                <ArrowUpRight size={16} className="text-white/40" />
              </div>

              <div className="mb-2">
                <link.icon
                  size={26}
                  className="text-white opacity-70 group-hover:opacity-100 transition-opacity"
                />
              </div>

              <div>
                <h4 className="text-stone-200 font-medium text-sm mb-1">
                  {link.label}
                </h4>
                <p className="text-stone-500 text-xs font-mono truncate opacity-60 group-hover:opacity-100 transition-opacity">
                  {link.username}
                </p>
              </div>
            </motion.a>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
