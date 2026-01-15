import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export async function chunkContent(markdown: string): Promise<string[]> {
  const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
    chunkSize: 500,
    chunkOverlap: 100,
  });

  const documents = await splitter.createDocuments([markdown]);
  return documents.map((doc) => doc.pageContent);
}
