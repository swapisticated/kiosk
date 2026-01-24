import { Pinecone, type RecordMetadata } from "@pinecone-database/pinecone";
import env from "../../config/env";

const pc = new Pinecone({
  apiKey: env.PINECONE_API_KEY,
});

const INDEX_NAME = "ai-chatbot-widget";

//upsert chunks function

//take in embedding of chunks? right?, if id exists - update, if !exist - insert

export async function upsertChunks(
  namespace: string,
  chunks: { id: string; values: number[]; metadata: RecordMetadata }[]
): Promise<void> {
  const index = pc.index(INDEX_NAME);
  await index.namespace(namespace).upsert(chunks);
  console.log(
    `[Pinecone] Upserted ${chunks.length} chunks to namespace: ${namespace}`
  );
}

// Query chunks - find similar vectors
export async function queryChunks(
  namespace: string,
  queryVector: number[],
  topK: number = 5
) {
  const index = pc.index(INDEX_NAME);
  const results = await index.namespace(namespace).query({
    vector: queryVector,
    topK,
    includeMetadata: true,
  });
  return results.matches || [];
}

// Delete all vectors for a tenant (useful for re-indexing)
export async function deleteNamespace(namespace: string): Promise<void> {
  const index = pc.index(INDEX_NAME);
  await index.namespace(namespace).deleteAll();
  console.log(`[Pinecone] Deleted all vectors in namespace: ${namespace}`);
}
