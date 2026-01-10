import { createMiddleware } from "hono/factory";
import * as crypto from "node:crypto";
import { db } from "../db";
import { apiKeys } from "../db/schema";
import { eq } from "drizzle-orm";

type Variables = {
  tenantId: string;
};

export const authMiddleware = createMiddleware<{ Variables: Variables }>(
  async (c, next) => {
    // 1. Get the Authorization header
    const authHeader = c.req.header("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Missing or invalid Authorization header" }, 401);
    }

    // 2. Extract the key (remove "Bearer ")
    const rawKey = authHeader.replace("Bearer ", "");

    // 3. Hash it (same way we stored it)
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

    // 4. Look up in database
    const apiKey = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.keyHash, keyHash))
      .get();

    if (!apiKey || !apiKey.isActive) {
      return c.json({ error: "Invalid or inactive API key" }, 401);
    }

    // 5. Set tenantId in context for handler to use
    c.set("tenantId", apiKey.tenantId);

    // 6. Continue to handler
    await next();
  }
);