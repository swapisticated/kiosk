import { scraperClient } from "../lib/httpClient";
import * as cheerio from "cheerio";

import { parseHTML } from "linkedom";
import { Readability } from "@mozilla/readability";

// scraper pipeline stages

// stage 1 - fetch html (using scraper client)

// stage 2 - prune data with cheerio

// stage 3 - clean with mozilla readability

// stage 4 - segment by headings

// stage 5 - chunk intengillently

//==================================================

//stage 1 - fetch

async function fetchHtml(url: string): Promise<string> {
  const response = await scraperClient.get(url);
  return response.data;
}

//stage 2 - prune

function pruneHtml(html: string): string {
  const $ = cheerio.load(html);

  // Remove scripts, styles, and metadata
  $("script, style, noscript, link, meta").remove();
  // Remove navigation and structural elements
  $("nav, footer, header, aside").remove();
  // Remove interactive elements
  $("form, button, input, select, textarea").remove();
  // Remove by ARIA role
  $('[role="navigation"]').remove();
  $('[role="banner"]').remove();
  $('[role="contentinfo"]').remove();

  // Remove by common garbage class names
  const garbageClasses = [
    ".nav",
    ".menu",
    ".footer",
    ".header",
    ".cookie",
    ".banner",
    ".popup",
    ".modal",
    ".sidebar",
    ".ad",
    ".ads",
    ".advertisement",
    ".social",
    ".share",
    ".comments",
  ];
  $(garbageClasses.join(", ")).remove();
  // Remove hidden elements
  $("[hidden]").remove();
  $('[style*="display: none"]').remove();
  $('[style*="display:none"]').remove();
  return $.html();
}

//stage 3 - extraction

function extractContent(
  html: string
): { title: string; content: string } | null {
  // html here is the PRUNED html from cheerio
  const { document } = parseHTML(html);
  const reader = new Readability(document);
  const article = reader.parse();

  if (!article || !article.content) {
    return null;
  }

  return {
    title: article.title || "Untitled",
    content: article.content, // ← HTML with headings preserved
  };
}

// ============================================
// STAGE 4: SEGMENT BY HEADINGS
// ============================================

interface Section {
  heading: string;
  content: string;
  level: number; // h1=1, h2=2, etc.
}

function segmentByHeadings(html: string): Section[] {
  const $ = cheerio.load(html);
  const sections: Section[] = [];

  // Find main content area (or use body)
  const mainContent = $("main, article, .content, .post, #content").first();
  const container = mainContent.length ? mainContent : $("body");

  let currentSection: Section = {
    heading: "Introduction",
    content: "",
    level: 0,
  };

  // Walk through headings and paragraphs
  container.find("h1, h2, h3, h4, h5, h6, p, li").each((_, el) => {
    const $el = $(el);
    const tagName = (el.tagName || el.name || "").toLowerCase();
    const text = $el.text().trim();
w
    if (!text) return; // Skip empty elements

    // If it's a heading, start a new section
    if (tagName.match(/^h[1-6]$/)) {
      // Save previous section if it has content
      if (currentSection.content.trim()) {
        sections.push({ ...currentSection });
      }

      // Start new section
      currentSection = {
        heading: text,
        content: "",
        level: tagName[1] ? parseInt(tagName[1]) : 0,
      };
    } else {
      // It's content (p, li), add to current section
      currentSection.content += text + "\n\n";
    }
  });

  // Don't forget the last section
  if (currentSection.content.trim()) {
    sections.push(currentSection);
  }

  return sections;
}

// ============================================
// STAGE 5: INTELLIGENT CHUNKING
// ============================================

interface Chunk {
  content: string;
  metadata: {
    heading: string;
    position: number;
    charCount: number;
  };
}

const MAX_CHUNK_CHARS = 1500; // ~375 tokens
const MIN_CHUNK_CHARS = 200; // Don't create tiny chunks

function chunkSections(sections: Section[]): Chunk[] {
  const chunks: Chunk[] = [];
  let position = 0;

  for (const section of sections) {
    // Split section into paragraphs
    const paragraphs = section.content
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    let currentChunk = "";

    for (const paragraph of paragraphs) {
      // If adding this paragraph exceeds max, save current chunk first
      if (
        currentChunk.length + paragraph.length > MAX_CHUNK_CHARS &&
        currentChunk.length >= MIN_CHUNK_CHARS
      ) {
        chunks.push({
          content: currentChunk.trim(),
          metadata: {
            heading: section.heading,
            position: position++,
            charCount: currentChunk.length,
          },
        });
        currentChunk = "";
      }

      // Add paragraph to current chunk
      currentChunk += paragraph + "\n\n";
    }

    // Save remaining content
    if (currentChunk.trim().length >= MIN_CHUNK_CHARS) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: {
          heading: section.heading,
          position: position++,
          charCount: currentChunk.length,
        },
      });
    } else if (currentChunk.trim().length > 0 && chunks.length > 0) {
      // Merge small leftover with previous chunk
      const lastChunk = chunks[chunks.length - 1];
      if (lastChunk) {
        lastChunk.content += "\n\n" + currentChunk.trim();
        lastChunk.metadata.charCount = lastChunk.content.length;
      }
    } else if (currentChunk.trim().length > 0) {
      // First chunk, even if small
      chunks.push({
        content: currentChunk.trim(),
        metadata: {
          heading: section.heading,
          position: position++,
          charCount: currentChunk.length,
        },
      });
    }
  }

  return chunks;
}

// ============================================
// MAIN EXPORT: SCRAPE URL
// ============================================

export interface ScrapedContent {
  title: string;
  url: string;
  sections: Section[];
  chunks: Chunk[];
  rawText: string;
}

export async function scrapeUrl(url: string): Promise<ScrapedContent> {
  console.log(`[Scraper] Starting scrape: ${url}`);

  // Stage 1: Fetch
  const rawHtml = await fetchHtml(url);
  console.log(`[Scraper] Fetched ${rawHtml.length} chars`);

  // Stage 2: Prune
  const prunedHtml = pruneHtml(rawHtml);
  console.log(`[Scraper] Pruned to ${prunedHtml.length} chars`);

  // Stage 3: Extract main content
  const extracted = extractContent(prunedHtml);
  if (!extracted) {
    throw new Error("Could not extract readable content from page");
  }
  console.log(`[Scraper] Extracted: "${extracted.title}"`);

  // Stage 4: Segment by headings
  const sections = segmentByHeadings(extracted.content);
  console.log(`[Scraper] Found ${sections.length} sections`);

  // If no sections found, create one from extracted content
  if (sections.length === 0) {
    const $ = cheerio.load(extracted.content);
    sections.push({
      heading: extracted.title,
      content: $.text(),
      level: 1,
    });
  }

  // Stage 5: Chunk
  const chunks = chunkSections(sections);
  console.log(`[Scraper] Created ${chunks.length} chunks`);

  // Get plain text for storage
  const $ = cheerio.load(extracted.content);
  const rawText = $.text().trim();

  return {
    title: extracted.title,
    url,
    sections,
    chunks,
    rawText,
  };
}
