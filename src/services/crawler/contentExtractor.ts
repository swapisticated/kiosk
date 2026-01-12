import env from "../../config/env";

export async function extractContent(url: string): Promise<string> {
  try {
    const response = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        Authorization: `Bearer ${env.JINA_API_KEY}`,
        "X-No-Cache": "true",
        // "X-With-Shadow-Dom": "true",
        // "X-Timeout": "60",
        // "X-Engine": "browser",
        // "X-Wait-For-Selector": "body, .class, #",
      },
    });
    const markdown = await response.text();
    console.log(`[Jina] Extracted ${markdown.length} chars from ${url}`);
    return markdown;
  } catch (error) {
    console.error(`[Jina] Failed to extract: ${url}`);
    return "";
  }
}
