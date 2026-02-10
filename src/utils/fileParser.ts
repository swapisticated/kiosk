import { extractText } from "unpdf";

export async function extractTextFromFile(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "pdf":
      const uint8Array = new Uint8Array(buffer);
      const { text } = await extractText(uint8Array);
      return text.join("\n");

    case "txt":
    case "md":
      return buffer.toString("utf-8");

    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}
