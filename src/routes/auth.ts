import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { nanoid } from "nanoid";
import { db } from "../db";
import { users, tenants } from "../db/schema";
import { eq } from "drizzle-orm";

const authRoute = new Hono();

// Schema for creating/getting a user from OAuth
const userSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  image: z.string().optional(),
  provider: z.string(),
  providerAccountId: z.string(),
});

// Called by NextAuth on sign-in to create or fetch user
authRoute.post("/user", zValidator("json", userSchema), async (c) => {
  const data = c.req.valid("json");

  try {
    // Check if user already exists
    let user = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .get();

    if (!user) {
      // Create new user
      const results = await db
        .insert(users)
        .values({
          id: nanoid(),
          email: data.email,
          name: data.name || null,
          image: data.image || null,
          provider: data.provider,
          providerAccountId: data.providerAccountId,
        })
        .returning();
      user = results[0];
    }

    // Check if user has a tenant
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.userId, user!.id))
      .get();

    return c.json({
      user: user,
      hasTenant: !!tenant,
      tenant: tenant || null,
    });
  } catch (error) {
    console.error("Auth user error:", error);
    return c.json({ error: "Failed to process user" }, 500);
  }
});

// Get current user's tenant
authRoute.get("/me", async (c) => {
  const userId = c.req.query("userId");
  if (!userId) return c.json({ error: "userId required" }, 400);

  const user = await db.select().from(users).where(eq(users.id, userId)).get();

  // If user doesn't exist in DB (was deleted), return no tenant
  // This will trigger onboarding redirect, and on next sign-in, user will be recreated
  if (!user) {
    return c.json({
      user: null,
      hasTenant: false,
      tenant: null,
      requiresReauth: true, // Signal to frontend that session is stale
    });
  }

  const tenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.userId, userId))
    .get();

  return c.json({
    user,
    hasTenant: !!tenant,
    tenant: tenant || null,
  });
});

export default authRoute;
