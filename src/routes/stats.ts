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

    // 3. Recent Chats (Last 10)
    const recentConvos = await db
      .select()
      .from(conversations)
      .where(eq(conversations.tenantId, tenantId))
      .orderBy(sql`${conversations.createdAt} DESC`)
      .limit(10)
      .all();

    // Fetch details for recent chats (first user message as tile)
    const recentChatsWithDetails = await Promise.all(
      recentConvos.map(async (convo) => {
        const msgs = await db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, convo.id))
          .orderBy(messages.createdAt)
          .all();

        const userMsg = msgs.find((m) => m.role === "user");
        const lastMsg = msgs[msgs.length - 1];

        return {
          id: convo.id,
          user: convo.sessionId.slice(0, 8), // Anonymous ID
          query: userMsg ? userMsg.content : "No messages",
          time: convo.createdAt,
          status: "active", // You could deduce this from last message time?
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${convo.sessionId}`,
          messageCount: msgs.length,
        };
      })
    );

    // 4. Activity Graph (Last 7 days messages)
    // SQLite timestamp is stored as seconds (integer) based on verification.
    const activityData = await db
      .select({
        date: sql<string>`date(${messages.createdAt}, 'unixepoch')`,
        count: sql<number>`count(*)`,
      })
      .from(messages)
      .where(eq(messages.tenantId, tenantId))
      .groupBy(sql`date(${messages.createdAt}, 'unixepoch')`)
      .orderBy(sql`date(${messages.createdAt}, 'unixepoch') DESC`);
    // 5. Average Duration (in seconds)
    // - Group messages by conversation
    // - duration = max(created_at) - min(created_at) (timestamps are in seconds)
    // - avg(duration)
    const durationResult = await db
      .select({
        avgDuration: sql<number>`avg(duration)`,
      })
      .from(
        db
          .select({
            duration: sql<number>`(MAX(${messages.createdAt}) - MIN(${messages.createdAt})) AS duration`,
          })
          .from(messages)
          .where(eq(messages.tenantId, tenantId))
          .groupBy(messages.conversationId)
          .having(
            sql`(MAX(${messages.createdAt}) - MIN(${messages.createdAt})) < 7200`
          ) // Exclude > 2 hours
          .as("conversation_durations")
      )
      .get();

    return c.json({
      totalChats: chatResult?.count || 0,
      totalMessages: msgResult?.count || 0,
      activeUsers: 0,
      avgDuration: Math.round(durationResult?.avgDuration || 0),
      recentChats: recentChatsWithDetails,
      activity: activityData.reverse(), // Ascending order
      heatmap: await getHeatmapData(tenantId),
      topKeywords: await getTopKeywords(tenantId), // Uses stored topics if available
      sentiment: await getSentimentStats(tenantId),
    });
  } catch (error) {
    console.error("Stats error:", error);
    return c.json({ error: "Failed to fetch stats" }, 500);
  }
});

// Helper: Get Heatmap Data (Day x Hour)
async function getHeatmapData(tenantId: string) {
  // SQLite: strftime('%w', ...) returns 0-6 (Sun-Sat)
  // strftime('%H', ...) returns 00-23
  // console.log("Fetching Heatmap Data for tenant:", tenantId);
  try {
    const data = await db
      .select({
        day: sql<number>`CAST(strftime('%w', ${messages.createdAt}, 'unixepoch') AS INTEGER)`,
        hour: sql<number>`CAST(strftime('%H', ${messages.createdAt}, 'unixepoch') AS INTEGER)`,
        count: sql<number>`count(*)`,
      })
      .from(messages)
      .where(eq(messages.tenantId, tenantId))
      .groupBy(
        sql`CAST(strftime('%w', ${messages.createdAt}, 'unixepoch') AS INTEGER)`,
        sql`CAST(strftime('%H', ${messages.createdAt}, 'unixepoch') AS INTEGER)`
      )
      .all();

    // console.log(`Heatmap data length: ${data.length}`);
    // if (data.length > 0) {
    // console.log("Sample heatmap point:", data[0]);
    // } else {
    // console.log("Heatmap data is empty.");
    // }
    return data;
  } catch (error) {
    console.error("Error fetching heatmap data:", error);
    return [];
  }
}

// Helper: Get Sentiment Stats
async function getSentimentStats(tenantId: string) {
  const sentiments = await db
    .select({
      score: messages.sentimentScore,
    })
    .from(messages)
    .where(eq(messages.tenantId, tenantId))
    .all();

  let positive = 0;
  let neutral = 0;
  let negative = 0;

  sentiments.forEach((s) => {
    const score = s.score || 0;
    if (score > 0) positive++;
    else if (score < 0) negative++;
    else neutral++;
  });

  const total = sentiments.length || 1;

  return {
    positive: Math.round((positive / total) * 100),
    neutral: Math.round((neutral / total) * 100),
    negative: Math.round((negative / total) * 100),
  };
}

// Helper: Get Top Keywords
async function getTopKeywords(tenantId: string) {
  // 1. Try to get stored topics first (New system)
  const storedTopics = await db
    .select({ topics: messages.topics })
    .from(messages)
    .where(
      sql`${messages.tenantId} = ${tenantId} AND ${messages.topics} IS NOT NULL`
    )
    .limit(200)
    .all();

  const topicCounts: Record<string, number> = {};

  if (storedTopics.length > 0) {
    storedTopics.forEach((row) => {
      const topics = row.topics || [];
      topics.forEach((t) => {
        const topic = t.toLowerCase();
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });
  } else {
    // Fallback: Legacy Keyword Extraction (for old messages)
    const userMessages = await db
      .select({ content: messages.content })
      .from(messages)
      .where(
        sql`${messages.tenantId} = ${tenantId} AND ${messages.role} = 'user'`
      )
      .orderBy(sql`${messages.createdAt} DESC`)
      .limit(100)
      .all();

    const stopWords = new Set([
      "the",
      "is",
      "at",
      "which",
      "on",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "to",
      "of",
      "for",
      "with",
      "i",
      "my",
      "me",
      "how",
      "what",
      "why",
      "when",
      "where",
      "can",
      "do",
      "does",
      "did",
      "have",
      "has",
      "had",
      "hey",
      "hello",
      "hi",
      "please",
      "help",
    ]);

    userMessages.forEach((msg) => {
      const words = msg.content
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/);

      words.forEach((w) => {
        if (w.length > 3 && !stopWords.has(w)) {
          topicCounts[w] = (topicCounts[w] || 0) + 1;
        }
      });
    });
  }

  // 3. Sort and top 15
  return Object.entries(topicCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([text, value]) => ({ text, value }));
}

export default statsRoute;
