import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { answerQuestion } from "../services/chat/chatService";
import { db } from "../db";
import { tenants } from "../db/schema";
import { eq } from "drizzle-orm";

const chatRoute = new Hono();

//define expected req body

import { nanoid } from "nanoid";

// ...

const chatSchema = z.object({
  message: z.string().min(1),
  tenantId: z.string().min(1),
  sessionId: z.string().optional(),
});

chatRoute.post("/", zValidator("json", chatSchema), async (c) => {
  try {
    const body = c.req.valid("json");
    const sessionId = body.sessionId || nanoid();

    // 1. Fetch tenant to check allowed origins
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, body.tenantId))
      .get();

    if (!tenant) {
      return c.json({ error: "Tenant not found" }, 404);
    }

    // 2. Validate Origin
    const origin = c.req.header("Origin");
    const allowedOrigins = tenant.allowedOrigins || [];

    // Allow requests from localhost for dev, or matching origins
    const isAllowed =
      allowedOrigins.includes(origin || "") || allowedOrigins.includes("*");

    if (!isAllowed) {
      console.warn(
        `Blocked request from origin: ${origin} for tenant: ${body.tenantId}`
      );
      return c.json({ error: "Unauthorized domain" }, 403);
    }

    // 3. Call service with Persistence
    const result = await answerQuestion(body.tenantId, body.message, sessionId);

    //return json
    return c.json(result);
  } catch (e) {
    console.error(e);
    return c.json({ error: "failed to process message" }, 500);
  }
});

export default chatRoute;
