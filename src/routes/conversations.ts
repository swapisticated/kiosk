import { Hono } from "hono";
import { db } from "../db";
import { conversations, messages } from "../db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";

const conversationsRoute = new Hono<{ Variables: { tenantId: string } }>();

// Auth: Require API Key (Bearer) or Dashboard Secret
conversationsRoute.use("/*", authMiddleware);

// GET /conversations - List conversations (paginated)
conversationsRoute.get("/", async (c) => {
  const tenantId = c.get("tenantId");
  const limit = Number(c.req.query("limit")) || 50;
  const offset = Number(c.req.query("offset")) || 0;

  try {
    const convos = await db
      .select()
      .from(conversations)
      .where(eq(conversations.tenantId, tenantId))
      .orderBy(desc(conversations.createdAt))
      .limit(limit)
      .offset(offset)
      .all();

    // Enrich with last message/metadata if needed for list view
    // For now, returning basic info + stats computation
    const enriched = await Promise.all(
      convos.map(async (convo) => {
        // Optimization: In a real app, use a join or dedicated stats table
        const msgs = await db
          .select({
            content: messages.content,
            role: messages.role,
            createdAt: messages.createdAt,
          })
          .from(messages)
          .where(eq(messages.conversationId, convo.id))
          .orderBy(messages.createdAt)
          .all();

        const lastMsg = msgs[msgs.length - 1];
        const userMsg = msgs.find((m) => m.role === "user");

        return {
          id: convo.id,
          sessionId: convo.sessionId,
          visitorInfo: convo.visitorInfo,
          createdAt: convo.createdAt,
          messageCount: msgs.length,
          lastMessage: lastMsg
            ? {
                content: lastMsg.content,
                role: lastMsg.role,
                createdAt: lastMsg.createdAt,
              }
            : null,
          // Use first user message as title/query
          query: userMsg ? userMsg.content : "New Conversation",
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${convo.sessionId}`,
        };
      })
    );

    return c.json({ conversations: enriched });
  } catch (e) {
    console.error("Failed to fetch conversations:", e);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// GET /conversations/:id - Full details
conversationsRoute.get("/:id", async (c) => {
  const tenantId = c.get("tenantId");
  const id = c.req.param("id");

  try {
    const convo = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id))
      .get();

    if (!convo) return c.json({ error: "Conversation not found" }, 404);
    if (convo.tenantId !== tenantId)
      return c.json({ error: "Unauthorized" }, 403);

    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt)
      .all();

    return c.json({
      ...convo,
      messages: msgs,
    });
  } catch (e) {
    console.error(`Failed to fetch conversation ${id}:`, e);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

export default conversationsRoute;
