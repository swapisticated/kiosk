import embedText from "../rag/embedding";
import groq from "./groq";
import { queryChunks } from "./../rag/pinecone";

export async function answerQuestion(
  tenantId: string,
  question: string
): Promise<{ answer: string; sources: { title: string; url: string }[] }> {
  // 1 embedd question
  const embeddedQuestion = await embedText(question);

  // 2 similarity search in pinecone
  const similarChunks = await queryChunks(tenantId, embeddedQuestion);

  // 3 build context
  const context = similarChunks
    .map((chunk) => chunk.metadata?.content)
    .join("\n\n");

  const systemPrompt = `You are a helpful assistant for a website.
Use the following context to answer the user's question.
If the answer is not in the context, say "I don't have that information."

CONTEXT:
${context}`;

  // Step 4: Call Groq
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

  // Step 5: Extract unique sources (deduplicate by URL)
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
