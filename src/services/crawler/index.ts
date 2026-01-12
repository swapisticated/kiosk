import { extractContent } from "./contentExtractor";
import { crawlWithCheerio } from "./cheerioCrawl";

interface CrawlResult {
  url: string;
  content: string;
}

const MIN_CONTENT_LENGTH = 10;

export async function crawl(
  websiteUrl: string,
  maxPages: number = 50
): Promise<CrawlResult[]> {
  console.log(`[Crawler] Starting crawl of ${websiteUrl}`);

  // 1. Discover URLs using CheerioCrawler
  const urls = await crawlWithCheerio(websiteUrl, maxPages);
  console.log(`[Crawler] Found ${urls.length} URLs`);

  // 2. Extract content from each URL, filter junk
  const results: CrawlResult[] = [];

  for (const url of urls) {
    const content = await extractContent(url);

    // Skip junk pages (too short = error page or empty)
    if (content.length < MIN_CONTENT_LENGTH) {
      console.log(
        `[Crawler] Skipping ${url} - too short (${content.length} chars)`
      );
      continue;
    }

    results.push({ url, content });
    console.log(`[Crawler] ${url} (${content.length} chars)`);
  }

  console.log(`[Crawler] Done! ${results.length} pages with content`);
  return results;
}
