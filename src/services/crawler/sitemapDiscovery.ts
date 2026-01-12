import { scraperClient } from "../../lib/httpClient";
import * as cheerio from "cheerio";

export async function discoverFromSitemap(baseUrl: string): Promise<string[]> {
  const sitemapUrl = `${baseUrl}/sitemap.xml`;

  try {
    const response = await scraperClient.get(sitemapUrl);
    const xml = response.data;
    const $ = cheerio.load(xml, { xmlMode: true });
    const urls = $("loc")
      .map((_, el) => $(el).text())
      .get();

    console.log(`[Sitemap] Found ${urls.length} URLs`);
    return urls;
  } catch (error) {
    console.log(`[Sitemap] No sitemap found at ${sitemapUrl}`);
    return [];
  }
}