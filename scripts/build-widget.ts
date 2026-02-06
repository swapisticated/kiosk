await Bun.build({
  entrypoints: ["./src/widget/widget.ts"],
  outdir: "./dist",
  minify: true, // Compress for production
  naming: "widget.js", // Explicitly name it widget.js
});

console.log("✅ Widget built to dist/widget.js");
