import { crawl } from "./src/services/crawler";
import { writeFileSync } from "fs";

async function main() {
  const results = await crawl("https://damndeepesh.dev/", 50);
  console.log("\nResults:", results.length);

  // Write JSON
  writeFileSync("crawl-output.json", JSON.stringify(results, null, 2));

  // Write TXT (readable format)
  const txtContent = results
    .map((r) => `=== ${r.url} ===\n\n${r.content}\n`)
    .join("\n---\n\n");
  writeFileSync("crawl-output.txt", txtContent);

  console.log("Written to crawl-output.json and crawl-output.txt");
}

main();
