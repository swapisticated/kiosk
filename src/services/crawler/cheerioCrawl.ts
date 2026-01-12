import { CheerioCrawler } from "crawlee";

export async function crawlWithCheerio(
  startUrl: string,
  maxUrls: number = 50
): Promise<string[]> {
  const discoveredUrls: string[] = [];

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: maxUrls,
    useSessionPool: false,

    // Force HTTP/1.1 to fix Bun + got-scraping HTTP/2 issues
    preNavigationHooks: [
      async (crawlingContext, gotOptions) => {
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
  });

  await crawler.run([startUrl]);

  return discoveredUrls;
}

