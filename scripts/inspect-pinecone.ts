import { Pinecone } from "@pinecone-database/pinecone";
import env from "../src/config/env";

const pc = new Pinecone({
  apiKey: env.PINECONE_API_KEY,
});

async function inspect() {
  const list = await pc.listIndexes();
  console.log(JSON.stringify(list, null, 2));
}

inspect();
