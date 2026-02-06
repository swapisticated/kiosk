import { Hono } from "hono";
import { db } from "../db";
import { conversations, messages } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";

type Variables = {
  tenantId: string;
};

const statsRoute = new Hono<{ Variables: Variables }>();

// Auth: Require API Key (Bearer)
statsRoute.use("/*", authMiddleware);

statsRoute.get("/", async (c) => {
  const tenantId = c.get("tenantId");

  try {
    // 1. Total Chats
    const chatResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(conversations)
      .where(eq(conversations.tenantId, tenantId))
      .get();

    // 2. Total Messages
    const msgResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(eq(messages.tenantId, tenantId))
      .get();

    return c.json({
      totalChats: chatResult?.count || 0,
      totalMessages: msgResult?.count || 0,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return c.json({ error: "Failed to fetch stats" }, 500);
  }
});

export default statsRoute;
