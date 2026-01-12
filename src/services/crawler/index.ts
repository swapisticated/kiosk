import { extractContent } from "./contentExtractor";
import { discoverFromSitemap } from "./sitemapDiscovery";


interface CrawlResult {
  url: string;
  content: string;
}

export async function crawl(websiteUrl:string) {
    const urls = await discoverFromSitemap(websiteUrl)

    const results=[]
    for(const url of urls){
        const content = await extractContent(url)
        results.push({url,content})
    }
    return results;
    
}