import { Pinecone } from "@pinecone-database/pinecone";
import env from "../src/config/env";
import * as readline from "readline";

const INDEX_NAME = "ai-chatbot-widget";

const pc = new Pinecone({
  apiKey: env.PINECONE_API_KEY,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function resetPinecone() {
  console.log(
    `\n🚨 DANGER: This will delete ALL data in Pinecone index '${INDEX_NAME}'`
  );

  rl.question("Are you sure? (Type 'yes' to confirm): ", async (answer) => {
    if (answer !== "yes") {
      console.log("Aborted.");
      process.exit(0);
    }

    try {
      console.log("Checking index...");
      const indexList = await pc.listIndexes();
      const exists = indexList.indexes?.some((i) => i.name === INDEX_NAME);

      if (exists) {
        console.log(`Deleting index '${INDEX_NAME}'...`);
        await pc.deleteIndex(INDEX_NAME);
        console.log("Index deleted.");

        // Wait a bit for propagation
        console.log("Waiting 10s before recreation...");
        await new Promise((resolve) => setTimeout(resolve, 10000));
      } else {
        console.log("Index didn't exist, skipping delete.");
      }

      console.log(`Creating index '${INDEX_NAME}'...`);
      await pc.createIndex({
        name: INDEX_NAME,
        dimension: 768, // Match Gemini embedding dimension
        metric: "cosine",
        spec: {
          serverless: {
            cloud: "aws",
            region: "us-east-1",
          },
        },
      });

      console.log("✅ Success! Pinecone index has been reset.");
    } catch (error) {
      console.error("Failed:", error);
    } finally {
      rl.close();
      process.exit(0);
    }
  });
}

resetPinecone();
