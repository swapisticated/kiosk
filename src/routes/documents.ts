//imports and setup
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { nanoid } from "nanoid";
import { db } from "../db";
import { documents } from "../db/schema";
import { authMiddleware } from "../middleware/auth";

import { scrapeUrl } from "../services/scraper";
import { chunks } from "../db/schema";
import { eq, and } from "drizzle-orm";

const documentsRoute = new Hono();

//document shape ?
const createdocumentSchema = z.object({
  url: z.url("Must be a valid url"),
  title: z.string().optional(),
});

// 1. User sends URL
// 2. Create a document record (so we can track it)
// 3. Scrape the URL
// 4. Get chunks from scraper
// 5. Store chunks in database
// 6. Update document status to "done"
// 7. Return success

//================================================

//listen for post req

documentsRoute.post(
  "/",
  authMiddleware,
  zValidator("json", createdocumentSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");
      const tenantId = c.get("tenantId");

      const result = await db
        .insert(documents)
        .values({
          id: nanoid(),
          tenantId,
          sourceType: "scraped",
          url: data.url,
          title: data.title || "Untitled", // Default if not provided
          status: "processing",
        })
        .returning();

      //scrape the url
      const scraped = await scrapeUrl(data.url);

      //get scraped chunks and insert in db
      const doc = result[0];
      if (!doc) {
        throw new Error("Failed to create document");
      }

      for (const [index, chunk] of scraped.chunks.entries()) {
        await db.insert(chunks).values({
          id: nanoid(),
          tenantId,
          documentId: doc.id,
          content: chunk.content,
          chunkIndex: index,
          tokenCount: Math.ceil(chunk.metadata.charCount / 4), // ← Add
        });
      }

      await db
        .update(documents)
        .set({
          title: scraped.title,
          content: scraped.rawText,
          status: "processed",
          updatedAt: new Date(),
        })
        .where(eq(documents.id, doc.id))
        .returning();

      // return c.json({ document: result[0] }, 201);
      return c.json(
        {
          document: {
            id: doc.id,
            title: scraped.title,
            url: data.url,
            status: "processed",
          },
          stats: {
            sections: scraped.sections.length,
            chunks: scraped.chunks.length,
            totalChars: scraped.rawText.length,
          },
        },
        201
      );
    } catch (error) {
      console.error("Document creation error:", error);
      return c.json({ error: "Faied to create document" }, 500);
    }
  }
);

documentsRoute.get("/:id", authMiddleware, async (c) => {
  const docId = c.req.param("id");
  const tenantId = c.get("tenantId");

  const doc = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, docId), eq(documents.tenantId, tenantId)))
    .get();

  if (!doc) {
    return c.json({ error: "Document not found" }, 404);
  }

  const docChunks = await db
    .select()
    .from(chunks)
    .where(eq(chunks.documentId, docId))
    .orderBy(chunks.chunkIndex);

  return c.json({ document: doc, chunks: docChunks });
});

export default documentsRoute;
