import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export interface Chunk {
  content: string;
  metadata: {
    position: number;
    source_url: string;
    page_title: string;
  };
}

export async function chunkContent(
  markdown: string,
  url: string,
  title: string
): Promise<Chunk[]> {
  const mdImageRegex = /!\[.*?\]\(.*?\)/g;
  const cleanedMarkdown = markdown.replace(mdImageRegex, "");

  const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
    chunkSize: 500,
    chunkOverlap: 100,
  });

  const documents = await splitter.createDocuments([cleanedMarkdown]);
  return documents.map((doc, index) => ({
    content: doc.pageContent,
    metadata: {
      position: index,
      source_url: url,
      page_title: title,
    },
  }));
}
