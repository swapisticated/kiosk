import { nanoid } from "nanoid";
import { db } from "../db";
import { documents, chunks } from "../db/schema";
import { eq } from "drizzle-orm";
import { crawl } from "./crawler";
import embedText from "./rag/embedding";
import { upsertChunks } from "./rag/pinecone";
import { progressEmitter } from "./progressEmitter";

/**
 * Background ingestion processor.
 * This function runs asynchronously and updates the database with its progress.
 * Emits real-time progress events via SSE.
 */
export async function processIngestion(
  rootDocumentId: string,
  url: string,
  tenantId: string
): Promise<void> {
  console.log(`[Ingestion] Starting background job for doc: ${rootDocumentId}`);

  // Helper to emit progress
  const emit = (
    step:
      | "started"
      | "crawling"
      | "crawl_complete"
      | "processing"
      | "embedding"
      | "storing"
      | "complete"
      | "error",
    progress: number,
    message: string,
    extra?: {
      pagesFound?: number;
      currentPage?: number;
      totalPages?: number;
      chunksProcessed?: number;
    }
  ) => {
    progressEmitter.emit(rootDocumentId, { step, progress, message, ...extra });
  };

  // 1. Mark as processing
  emit("started", 5, "Starting ingestion...");
  await db
    .update(documents)
    .set({ status: "processing", updatedAt: new Date() })
    .where(eq(documents.id, rootDocumentId));

  try {
    // 2. Crawl the website
    emit("crawling", 10, "Discovering pages...");
    const pages = await crawl(url, 10);
    console.log(`[Ingestion] Crawl finished. Found ${pages.length} pages.`);
    emit("crawl_complete", 30, `Found ${pages.length} pages`, {
      pagesFound: pages.length,
    });

    let totalChunks = 0;
    const totalPages = pages.length;

    // 3. Process each page
    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex];
      if (!page) continue; // TypeScript guard

      const currentPage = pageIndex + 1;

      // Calculate progress: pages go from 30% to 80%
      const pageProgress = 30 + Math.floor((currentPage / totalPages) * 50);
      emit(
        "processing",
        pageProgress,
        `Processing page ${currentPage} of ${totalPages}`,
        {
          currentPage,
          totalPages,
        }
      );

      // Create document record for each page (or update root for first)
      const isRootPage = page.url === url;

      let docId: string;
      if (isRootPage) {
        // Update the root document with content
        await db
          .update(documents)
          .set({
            title:
              (page.chunks[0]?.metadata?.page_title as string) || "Untitled",
            content: page.content,
            updatedAt: new Date(),
          })
          .where(eq(documents.id, rootDocumentId));
        docId = rootDocumentId;
      } else {
        // Create new doc for child pages
        const [newDoc] = await db
          .insert(documents)
          .values({
            id: nanoid(),
            tenantId,
            sourceType: "scraped",
            url: page.url,
            title:
              (page.chunks[0]?.metadata?.page_title as string) || "Untitled",
            content: page.content,
            status: "processed",
            updatedAt: new Date(),
          })
          .returning();
        if (!newDoc) continue;
        docId = newDoc.id;
      }

      // 4. Process chunks for this page
      emit(
        "embedding",
        pageProgress + 5,
        `Creating embeddings for page ${currentPage}...`,
        {
          currentPage,
          totalPages,
        }
      );

      const pineconeRecords: {
        id: string;
        values: number[];
        metadata: { content: string; source_url: string; page_title: string };
      }[] = [];

      for (const [index, chunk] of page.chunks.entries()) {
        const chunkId = nanoid();

        await db.insert(chunks).values({
          id: chunkId,
          tenantId,
          documentId: docId,
          content: chunk.content,
          chunkIndex: index,
          tokenCount: Math.ceil(chunk.content.length / 4),
        });

        const vector = await embedText(chunk.content);
        pineconeRecords.push({
          id: chunkId,
          values: vector,
          metadata: {
            content: chunk.content,
            source_url: page.url,
            page_title: chunk.metadata.page_title,
          },
        });
      }

      // 5. Upsert to Pinecone
      if (pineconeRecords.length > 0) {
        emit(
          "storing",
          pageProgress + 10,
          `Storing vectors for page ${currentPage}...`,
          {
            currentPage,
            totalPages,
            chunksProcessed: totalChunks + page.chunks.length,
          }
        );
        await upsertChunks(tenantId, pineconeRecords);
      }

      totalChunks += page.chunks.length;
    }

    // 6. Mark root document as processed
    await db
      .update(documents)
      .set({ status: "processed", updatedAt: new Date() })
      .where(eq(documents.id, rootDocumentId));

    emit(
      "complete",
      100,
      `Done! ${totalPages} pages, ${totalChunks} chunks processed`,
      {
        pagesFound: totalPages,
        chunksProcessed: totalChunks,
      }
    );

    console.log(
      `[Ingestion] Completed! ${pages.length} pages, ${totalChunks} chunks`
    );
  } catch (error) {
    console.error("[Ingestion] Failed:", error);

    // Mark as failed
    await db
      .update(documents)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(documents.id, rootDocumentId));

    emit(
      "error",
      -1,
      error instanceof Error ? error.message : "Ingestion failed"
    );
  } finally {
    // Clean up listeners after a delay
    setTimeout(() => {
      progressEmitter.cleanup(rootDocumentId);
    }, 5000);
  }
}
