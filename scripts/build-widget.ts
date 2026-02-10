await Bun.build({
  entrypoints: ["./src/widget/widget.ts"],
  outdir: "./dist",
  minify: true, // Compress for production
  naming: "widget.js", // Explicitly name it widget.js
  define: {
    __API_URL__: JSON.stringify(process.env.API_URL || "http://localhost:8000"),
  },
});

console.log("✅ Widget built to dist/widget.js");
