"use client";

export default function CustomizePage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Customize</h1>
        <p className="text-muted-foreground text-lg">
          Personalize your chatbot appearance
        </p>
      </header>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center">
        <div className="text-4xl mb-4">🎨</div>
        <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
        <p className="text-muted-foreground">
          Customize colors, welcome messages, and bot personality
        </p>
      </div>
    </div>
  );
}
