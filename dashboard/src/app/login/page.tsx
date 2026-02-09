"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { BackgroundLayer } from "../../components/spatial/BackgroundLayer";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
      <BackgroundLayer />

      <div className="w-full max-w-md relative z-10 px-4">
        {/* Glass Card */}
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-br from-white/10 to-transparent rounded-[40px] blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-1000" />

          <div className="relative rounded-[32px] bg-black/40 backdrop-blur-3xl border border-white/10 p-8 md:p-10 shadow-2xl overflow-hidden">
            {/* Inner highlight */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            {/* Logo / Brand */}
            <div className="text-center mb-10 relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-6 backdrop-blur-sm border border-white/10 shadow-inner">
                <span className="text-3xl filter drop-shadow-lg">💬</span>
              </div>
              <h1 className="text-3xl font-light tracking-tight text-white mb-2">
                Kiosk
              </h1>
              <p className="text-white/40 font-light">
                AI-powered chatbots for your website
              </p>
            </div>

            <div className="space-y-6 relative z-10">
              <div className="text-center">
                <h2 className="text-lg font-medium text-white/80">
                  Welcome back
                </h2>
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="group/btn relative w-full flex items-center justify-center gap-3 px-4 py-4 bg-white text-black rounded-xl hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden shadow-lg shadow-white/5"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover/btn:animate-shimmer" />

                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                <span className="font-medium">
                  {isLoading ? "Signing in..." : "Continue with Google"}
                </span>
                <span className="absolute right-4 opacity-0 group-hover/btn:opacity-100 transition-opacity transform group-hover/btn:translate-x-1 duration-300">
                  →
                </span>
              </button>

              <p className="text-center text-xs text-white/30 leading-relaxed px-4">
                By continuing, you agree to our Terms of Service and Privacy
                Policy.
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-white/40 mt-8">
          Don't have an account?{" "}
          <button
            onClick={handleGoogleSignIn}
            className="text-white hover:text-white/80 hover:underline font-medium transition-colors"
          >
            Sign up for free
          </button>
        </p>
      </div>
    </div>
  );
}
