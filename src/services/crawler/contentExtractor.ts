export async function extractContent(url: string): Promise<string> {
  try {
    const response = await fetch(`https://r.jina.ai/${url}`);
    const markdown = await response.text();
    console.log(`[Jina] Extracted ${markdown.length} chars from ${url}`);
    return markdown;
  } catch (error) {
    console.error(`[Jina] Failed to extract: ${url}`);
    return "";
  }
}
