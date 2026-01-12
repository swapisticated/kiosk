# Web Crawler/Scraper Implementation Guide

## Overview

This document explains how our production-ready web crawler works for the AI chatbot widget project. The crawler is designed to discover and scrape entire websites, not just individual pages.

## Architecture

### Core Components

1. **URL Discovery Service** (`src/services/urlDiscovery.ts`)

   - Discovers all URLs on a website
   - Uses hybrid approach: sitemap-first, then recursive crawling
   - Respects robots.txt rules
   - Implements intelligent filtering

2. **Scraper Service** (`src/services/scraper.ts`)
   - Scrapes content from individual URLs
   - 5-stage pipeline: Fetch → Prune → Extract → Segment → Chunk
   - Optimized for RAG (Retrieval-Augmented Generation)

## How It Works

### Discovery Strategy: Hybrid Approach

```
┌─────────────────────────────────────────┐
│  1. Check robots.txt                    │
│     - Respect crawl rules               │
│     - Find sitemap locations            │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  2. Try Sitemap Discovery (FAST)        │
│     - Check /sitemap.xml                │
│     - Check robots.txt for sitemaps     │
│     - Parse sitemap index recursively   │
└────────────┬────────────────────────────┘
             │
             ▼
      ┌──────────────┐
      │ Found URLs?  │
      └──────┬───────┘
             │
    ┌────────┴────────┐
    │                 │
   YES               NO
    │                 │
    ▼                 ▼
 ┌──────┐      ┌─────────────────────┐
 │ DONE │      │ 3. Recursive Crawl  │
 └──────┘      │    - BFS algorithm  │
               │    - Extract links  │
               │    - Max depth: 3   │
               └─────────────────────┘
```

### Why This Approach?

**Sitemap-First Benefits:**

- ⚡ **Fast**: Get all URLs in seconds vs. hours
- ✅ **Complete**: Site owners list all important pages
- 🤝 **Polite**: Respects what the site wants indexed
- 📊 **Structured**: Often includes metadata like update frequency

**Recursive Crawling Fallback:**

- 🔍 **Discovery**: Finds pages not in sitemap
- 🕸️ **Comprehensive**: Follows all internal links
- 🎯 **Depth Control**: Prevents infinite crawling
- 🚦 **Rate Limited**: Polite delays between requests

## Key Features

### 1. Robots.txt Compliance

```typescript
// Automatically checks and respects robots.txt
const robots = await fetchRobotsTxt(origin);
if (!robots.isAllowed(url, "Googlebot")) {
  // Skip this URL
}
```

**Why it matters:**

- Legal compliance
- Respects site owner wishes
- Avoids getting IP banned
- Professional crawling etiquette

### 2. Intelligent URL Filtering

**Automatically skips:**

- Authentication pages (login, signup, etc.)
- User-specific content (cart, checkout, profile)
- File downloads (PDFs, images, videos)
- Tracking URLs (utm parameters)
- Duplicate URLs (normalized)

**Example:**

```typescript
// These URLs are automatically filtered out:
❌ https://example.com/login
❌ https://example.com/cart
❌ https://example.com/document.pdf
❌ https://example.com/page?utm_source=email
✅ https://example.com/about
✅ https://example.com/products
```

### 3. URL Normalization

Prevents duplicate crawling:

```typescript
// These are treated as the same URL:
https://example.com/about/
https://example.com/about
https://example.com/about#section

// Normalized to:
https://example.com/about
```

### 4. Polite Crawling

- **1 second delay** between requests (configurable)
- **Respects robots.txt** crawl-delay directive
- **User-Agent identification** (can be customized)
- **Max pages limit** to prevent runaway crawling

## Usage Examples

### Basic Usage

```typescript
import { discoverUrls } from "./services/urlDiscovery";
import { scrapeUrl } from "./services/scraper";

// Discover all URLs on a website
const result = await discoverUrls("https://example.com");

console.log(`Method: ${result.method}`); // "sitemap" or "recursive"
console.log(`Found: ${result.totalFound} URLs`);
console.log(`Using: ${result.urls.length} URLs`);

// Scrape each discovered URL
for (const url of result.urls) {
  const content = await scrapeUrl(url);

  // Store chunks in your database for RAG
  for (const chunk of content.chunks) {
    await storeChunk({
      content: chunk.content,
      heading: chunk.metadata.heading,
      url: content.url,
      title: content.title,
    });
  }
}
```

### Integration with Your API

```typescript
// In your tenant onboarding endpoint
app.post("/api/tenants/:id/scrape", async (c) => {
  const { id } = c.req.param();
  const { websiteUrl } = await c.req.json();

  // Step 1: Discover all URLs
  const discovery = await discoverUrls(websiteUrl);

  // Step 2: Scrape each URL
  const documents = [];
  for (const url of discovery.urls) {
    try {
      const scraped = await scrapeUrl(url);

      // Step 3: Store in database
      const doc = await db
        .insert(documents)
        .values({
          tenantId: id,
          url: scraped.url,
          title: scraped.title,
          content: scraped.rawText,
        })
        .returning();

      // Step 4: Store chunks for RAG
      for (const chunk of scraped.chunks) {
        await db.insert(chunks).values({
          documentId: doc.id,
          content: chunk.content,
          metadata: chunk.metadata,
        });
      }

      documents.push(doc);
    } catch (error) {
      console.error(`Failed to scrape ${url}:`, error);
    }
  }

  return c.json({
    success: true,
    discovered: discovery.totalFound,
    scraped: documents.length,
    method: discovery.method,
  });
});
```

## Configuration

### Adjustable Parameters

```typescript
// In urlDiscovery.ts
const MAX_PAGES = 100; // Maximum URLs to discover
const MAX_DEPTH = 3; // Maximum crawl depth
const CRAWL_DELAY_MS = 1000; // Delay between requests (ms)

// Add custom paths to skip
const DISALLOWED_PATHS = [
  "login",
  "admin",
  "api",
  // Add more...
];

// Add file extensions to skip
const SKIP_EXTENSIONS = [
  ".pdf",
  ".zip",
  // Add more...
];
```

## Best Practices

### 1. Start Small

```typescript
// Test with a small site first
const result = await discoverUrls("https://small-site.com");
```

### 2. Handle Errors Gracefully

```typescript
try {
  const content = await scrapeUrl(url);
} catch (error) {
  // Log and continue with next URL
  console.error(`Failed to scrape ${url}:`, error);
  continue;
}
```

### 3. Implement Progress Tracking

```typescript
let processed = 0;
for (const url of urls) {
  await scrapeUrl(url);
  processed++;
  console.log(`Progress: ${processed}/${urls.length}`);
}
```

### 4. Use Background Jobs

```typescript
// For large sites, use a job queue
await jobQueue.add("scrape-website", {
  tenantId: id,
  urls: discovery.urls,
});
```

## Performance Considerations

### Sitemap Crawling

- **Speed**: ~1-5 seconds for most sites
- **Scalability**: Can handle 10,000+ URLs
- **Memory**: Low (streaming XML parsing)

### Recursive Crawling

- **Speed**: ~1 second per page (with delay)
- **Scalability**: Limited by MAX_PAGES and MAX_DEPTH
- **Memory**: Moderate (visited set grows with pages)

### Optimization Tips

1. **Increase concurrency** (with caution):

   ```typescript
   // Process multiple URLs in parallel
   const chunks = chunkArray(urls, 5);
   for (const chunk of chunks) {
     await Promise.all(chunk.map((url) => scrapeUrl(url)));
   }
   ```

2. **Cache robots.txt**:

   ```typescript
   const robotsCache = new Map();
   // Reuse robots.txt for same domain
   ```

3. **Use a proxy service** for large-scale crawling:
   ```typescript
   // Configure axios with proxy
   scraperClient.defaults.proxy = {
     host: "proxy.example.com",
     port: 8080,
   };
   ```

## Comparison: Sitemap vs Recursive

| Feature       | Sitemap          | Recursive    |
| ------------- | ---------------- | ------------ |
| Speed         | ⚡⚡⚡ Very Fast | 🐌 Slow      |
| Completeness  | ✅ High          | ⚠️ Variable  |
| Server Load   | 💚 Low           | 🔴 Higher    |
| Depth Control | N/A              | ✅ Yes       |
| Dynamic Pages | ⚠️ May miss      | ✅ Finds all |

## Troubleshooting

### Issue: No URLs discovered

**Solution**: Check if site has sitemap and robots.txt allows crawling

### Issue: Too many URLs

**Solution**: Increase MAX_PAGES or implement better filtering

### Issue: Getting blocked

**Solution**: Increase CRAWL_DELAY_MS, use proxies, or contact site owner

### Issue: Missing important pages

**Solution**: Combine sitemap + recursive, or manually add seed URLs

## Next Steps

1. **Implement incremental updates**: Only re-scrape changed pages
2. **Add change detection**: Use Last-Modified headers
3. **Implement priority queue**: Scrape important pages first
4. **Add distributed crawling**: Scale across multiple workers
5. **Monitor crawl health**: Track success rates, errors, etc.

## Resources

- [Robots.txt Specification](https://www.robotstxt.org/)
- [Sitemap Protocol](https://www.sitemaps.org/)
- [Web Scraping Best Practices](https://www.scrapehero.com/web-scraping-best-practices/)
- [Polite Web Crawling](https://www.promptcloud.com/blog/web-crawling-best-practices/)
