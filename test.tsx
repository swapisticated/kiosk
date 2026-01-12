import { writeFileSync } from "fs";

async function main() {
  const url = "https://www.crawlee.dev/";//https://crawlee.dev/

  console.log(`Fetching from Jina: ${url}`);
  const response = await fetch(`https://r.jina.ai/${url}`, {
    headers: {
      "X-Timeout": "60",
      "X-Wait-For-Selector": "body",
      "X-With-Shadow-Dom": "true",
      "X-Engine": "browser",
      "X-No-Cache": "true", // Bypass cache
    },
  });
  const markdown = await response.text();

  writeFileSync("jina-output.txt", markdown);
  console.log(`Done! Written ${markdown.length} chars to jina-output.txt`);
}

main();
