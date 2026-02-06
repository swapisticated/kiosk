//imports and setup
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { nanoid } from "nanoid";
import { db } from "../db";
import { documents, chunks } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { eq, and } from "drizzle-orm";
import { processIngestion } from "../services/ingestion";
import { progressEmitter } from "../services/progressEmitter";
import { deleteVectors } from "../services/rag/pinecone";

const documentsRoute = new Hono();

//document shape ?
const createdocumentSchema = z.object({
  url: z.string().url("Must be a valid url"),
  title: z.string().optional(),
});

// Flow:
// 1. User sends URL
// 2. Create a "pending" document record
// 3. Fire off background ingestion (don't wait)
// 4. Return 202 Accepted immediately
// 5. Background: Scrape, chunk, embed, store, update status

//================================================

documentsRoute.post(
  "/",
  authMiddleware,
  zValidator("json", createdocumentSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");
      const tenantId = c.get("tenantId");

      console.log(`[Documents] Received ingestion request for: ${data.url}`);

      // 1. Create a "pending" root document immediately
      const [rootDoc] = await db
        .insert(documents)
        .values({
          id: nanoid(),
          tenantId,
          sourceType: "scraped",
          url: data.url,
          title: data.title || "Processing...",
          status: "pending",
          updatedAt: new Date(),
        })
        .returning();

      if (!rootDoc) {
        return c.json({ error: "Failed to create document" }, 500);
      }

      // 2. FIRE AND FORGET - Do NOT await this!
      // The function runs in the background, updating DB status as it progresses
      processIngestion(rootDoc.id, data.url, tenantId).catch((err) => {
        console.error("[Documents] Background ingestion failed:", err);
      });

      // 3. Return immediately with 202 Accepted
      return c.json(
        {
          message: "Ingestion started",
          documentId: rootDoc.id,
          status: "pending",
        },
        202
      );
    } catch (error) {
      console.error("Document creation error:", error);
      return c.json({ error: "Failed to create document" }, 500);
    }
  }
);

documentsRoute.get("/", authMiddleware, async (c) => {
  const tenantId = c.get("tenantId");

  const docs = await db
    .select()
    .from(documents)
    .where(eq(documents.tenantId, tenantId))
    .orderBy(documents.createdAt);

  return c.json({ documents: docs });
});

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

// SSE endpoint for real-time ingestion progress
documentsRoute.get("/:id/progress", authMiddleware, async (c) => {
  const docId = c.req.param("id");
  const tenantId = c.get("tenantId");

  // Verify document exists and belongs to tenant
  const doc = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, docId), eq(documents.tenantId, tenantId)))
    .get();

  if (!doc) {
    return c.json({ error: "Document not found" }, 404);
  }

  // If already processed or failed, return current status immediately
  if (doc.status === "processed" || doc.status === "failed") {
    return c.json({
      status: doc.status,
      message:
        doc.status === "processed" ? "Ingestion complete" : "Ingestion failed",
    });
  }

  // Set up SSE response
  return new Response(
    new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        // Send initial connection event
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              step: "connected",
              progress: 0,
              message: "Connected to progress stream",
            })}\n\n`
          )
        );

        // Subscribe to progress events
        const unsubscribe = progressEmitter.subscribe(docId, (event) => {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
            );

            // Close stream on complete or error
            if (event.step === "complete" || event.step === "error") {
              setTimeout(() => {
                try {
                  controller.close();
                } catch {
                  // Already closed
                }
              }, 100);
            }
          } catch {
            // Stream already closed by client
          }
        });

        // Handle client disconnect
        c.req.raw.signal.addEventListener("abort", () => {
          unsubscribe();
          try {
            controller.close();
          } catch {
            // Already closed
          }
        });
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
});

documentsRoute.delete("/:id", authMiddleware, async (c) => {
  const docId = c.req.param("id");
  const tenantId = c.get("tenantId");

  try {
    // 1. Fetch chunks to get IDs for Pinecone deletion
    const docChunks = await db
      .select({ id: chunks.id })
      .from(chunks)
      .where(eq(chunks.documentId, docId));

    const chunkIds = docChunks.map((c) => c.id);

    // 2. Delete from Pinecone
    if (chunkIds.length > 0) {
      try {
        await deleteVectors(tenantId, chunkIds);
      } catch (err) {
        console.error("Failed to delete vectors from Pinecone:", err);
        // Continue to delete from DB even if Pinecone fails?
        // Yes, otherwise we get zombie DB state.
      }
    }

    // 3. Delete from DB
    const result = await db
      .delete(documents)
      .where(and(eq(documents.id, docId), eq(documents.tenantId, tenantId)))
      .returning();

    if (result.length === 0) {
      return c.json({ error: "Document not found" }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Delete document error:", error);
    return c.json({ error: "Failed to delete document" }, 500);
  }
});

export default documentsRoute;
