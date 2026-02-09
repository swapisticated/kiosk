import { CheerioCrawler, Configuration } from "crawlee";
import { join } from "path";
import { tmpdir } from "os";

export async function crawlWithCheerio(
  startUrl: string,
  maxUrls: number = 50
): Promise<string[]> {
  const discoveredUrls: string[] = [];

  // Use /tmp for crawler storage to avoid permission issues in production
  // Randomize folder to avoid conflicts if multiple crawls run
  const storageDir = join(
    tmpdir(),
    `crawler_${Date.now()}_${Math.random().toString(36).slice(2)}`
  );

  const config = new Configuration({
    persistStorage: false, // Don't keep data after run
    storageClientOptions: {
      storageDir,
    },
  });

  const crawler = new CheerioCrawler(
    {
      maxRequestsPerCrawl: maxUrls,
      useSessionPool: false,

      // 🔥 FORCE FIXED CONCURRENCY (NO AUTOSCALING)
      // This prevents AutoscaledPool -> Snapshotter -> `ps` command usage
      maxConcurrency: 3,
      minConcurrency: 3,

      // Force HTTP/1.1 to fix Bun + got-scraping HTTP/2 issues
      preNavigationHooks: [
        async (_crawlingContext, gotOptions) => {
          gotOptions.http2 = false;
        },
      ],

      async requestHandler({ request, enqueueLinks }) {
        discoveredUrls.push(request.url);

        await enqueueLinks({
          strategy: "same-domain",
        });
      },

      async failedRequestHandler({ request }, error) {
        console.log(`[Cheerio] Failed: ${request.url} - ${error.message}`);
      },
    },
    config
  );

  await crawler.run([startUrl]);

  return discoveredUrls;
}
