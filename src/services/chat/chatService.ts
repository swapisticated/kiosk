import { db } from "../../db";
import { conversations, messages } from "../../db/schema";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";
import embedText from "../rag/embedding";
import groq from "./groq";
import { queryChunks } from "./../rag/pinecone";

export async function answerQuestion(
  tenantId: string,
  question: string,
  sessionId: string
): Promise<{ answer: string; sources: { title: string; url: string }[] }> {
  // 0. Ensure Conversation Exists
  const logicalConv = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.sessionId, sessionId),
        eq(conversations.tenantId, tenantId)
      )
    )
    .get();

  let conversationId = logicalConv?.id;

  if (!conversationId) {
    conversationId = nanoid();
    await db.insert(conversations).values({
      id: conversationId,
      tenantId,
      sessionId: sessionId,
      visitorInfo: { ip: "127.0.0.1" },
    });
  }

  // 1. Save User Message
  await db.insert(messages).values({
    id: nanoid(),
    tenantId,
    conversationId: conversationId!,
    role: "user",
    content: question,
  });

  // 2. Embed & Search
  const embeddedQuestion = await embedText(question);
  const similarChunks = await queryChunks(tenantId, embeddedQuestion);

  // 3. Context
  const context = similarChunks
    .map((chunk) => chunk.metadata?.content)
    .join("\n\n");

  const systemPrompt = `You are a helpful assistant for a website.
Use the following context to answer the user's question.
If the answer is not in the context, say "I don't have that information."

CONTEXT:
${context}`;

  // 4. Groq
  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: question },
    ],
    model: "llama-3.1-8b-instant",
    temperature: 0.5,
    max_tokens: 1024,
  });

  const answer =
    completion.choices[0]?.message?.content ||
    "I could not generate an answer.";

  // 5. Save Assistant Message
  await db.insert(messages).values({
    id: nanoid(),
    tenantId,
    conversationId: conversationId!,
    role: "assistant",
    content: answer,
    sources: similarChunks.map((c) => c.id), // Save source IDs
  });

  // 6. Sources for Frontend
  const uniqueSources = new Map<string, { title: string; url: string }>();
  similarChunks.forEach((chunk) => {
    const url = chunk.metadata?.source_url as string;
    if (url && !uniqueSources.has(url)) {
      uniqueSources.set(url, {
        title: chunk.metadata?.page_title as string,
        url,
      });
    }
  });

  return { answer, sources: Array.from(uniqueSources.values()) };
}
