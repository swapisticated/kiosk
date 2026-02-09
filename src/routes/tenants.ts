//imports and setup
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { nanoid } from "nanoid";
import { db } from "../db";
import { tenants, apiKeys, users } from "../db/schema";
import * as crypto from "node:crypto";
import { eq } from "drizzle-orm";

const tenantsRoute = new Hono();

//confirming shape of data (validation)

//define what data we expect from the user

const createTenantSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email(),
  domain: z.string().optional(),
});

//the endpoint

//listen for post req
//z.validator, run validator if data is bad stop here
//async(c)=> ... actual funtion if data is good

tenantsRoute.post("/", zValidator("json", createTenantSchema), async (c) => {
  try {
    const data = c.req.valid("json");

    // Verify user exists
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, data.userId))
      .get();

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Check if user already has a tenant
    const existingTenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.userId, data.userId))
      .get();

    if (existingTenant) {
      return c.json(
        { error: "User already has a tenant", tenant: existingTenant },
        409
      );
    }

    const results = await db
      .insert(tenants)
      .values({
        id: nanoid(),
        userId: data.userId,
        name: data.name,
        email: data.email,
        // Map legacy domain input to allowedOrigins
        allowedOrigins: data.domain ? [data.domain] : [],
      })
      .returning();

    return c.json({ tenant: results[0] }, 201);
  } catch (error) {
    console.error("Tenant creation error :", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

tenantsRoute.get("/lookup", async (c) => {
  const email = c.req.query("email");
  if (!email) return c.json({ error: "Email required" }, 400);

  const tenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.email, email))
    .get();

  if (!tenant) return c.json({ error: "Tenant not found" }, 404);
  return c.json({ tenant });
});

// ... (previous imports)

// Widget Config Schema
const widgetConfigSchema = z.object({
  botName: z.string().optional(),
  welcomeMessage: z.string().optional(),
  placeholderText: z.string().optional(),
  primaryColor: z.string().optional(),
  fontFamily: z.string().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  position: z.enum(["bottom-right", "bottom-left"]).optional(),
  logoUrl: z.string().optional(),

  // Advanced Theming
  chatBackground: z.string().optional(), // hex, gradient, or url
  chatBackgroundStyle: z
    .enum(["solid", "gradient", "pattern", "image"])
    .optional(),
  incomingBubbleColor: z.string().optional(),
  outgoingBubbleColor: z.string().optional(),
  incomingTextColor: z.string().optional(),
  outgoingTextColor: z.string().optional(),
  borderRadius: z.number().optional(),

  // Allowed Origins (Test Mode)
  allowedOrigins: z.array(z.string()).optional(),
});

// Update Config Route
tenantsRoute.patch(
  "/:id/config",
  zValidator("json", widgetConfigSchema),
  async (c) => {
    const tenantId = c.req.param("id");
    const updates = c.req.valid("json");

    // Auth Check: Dashboard Secret or API Key (if we allowed API usage later)
    // For now, assume Dashboard Secret via Gateway or simple check
    // The current authMiddleware is for BEARER tokens.
    // We should probably rely on valid Tenant ID check + Secret if accessible?
    // Actually, "authMiddleware" sets "tenantId" in context.
    // If this route is protected by `authMiddleware` (with secret bypass), `c.get('tenantId')` works.
    // BUT tenantsRoute isn't wrapped in authMiddleware globally.
    // We need to apply it or check headers manually.

    // Check Dashboard Secret manually for now to align with dashboard/page.tsx logic
    const dashboardSecret = c.req.header("x-dashboard-secret");
    if (
      !process.env.DASHBOARD_SECRET ||
      dashboardSecret !== process.env.DASHBOARD_SECRET
    ) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    try {
      // Fetch existing to merge? Or just set? Drizzle json update replaces?
      // Better to merge if we want partial updates, but for now replace is fine if frontend sends full object.
      // Let's do a merge pattern: fetch, merge, update.

      const existing = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .get();
      if (!existing) return c.json({ error: "Tenant not found" }, 404);

      const currentConfig = (existing.widgetConfig as any) || {};

      // Separate allowedOrigins from widgetConfig
      const { allowedOrigins, ...configUpdates } = updates;
      const newConfig = { ...currentConfig, ...configUpdates };

      const updateData: any = {
        widgetConfig: newConfig,
        updatedAt: new Date(),
      };

      // Update allowedOrigins if provided
      if (allowedOrigins) {
        updateData.allowedOrigins = allowedOrigins;
      }

      await db.update(tenants).set(updateData).where(eq(tenants.id, tenantId));

      return c.json({
        success: true,
        config: newConfig,
        allowedOrigins: allowedOrigins || existing.allowedOrigins,
      });
    } catch (e) {
      console.error("Config update failed:", e);
      return c.json({ error: "Update failed" }, 500);
    }
  }
);

// Public Config Fetch (for Widget)
tenantsRoute.get("/:id/config", async (c) => {
  const tenantId = c.req.param("id");

  // Enable CORS for this specific endpoint (Widget runs on other domains)
  // Hono handles CORS if middleware is set, but we can explicitly set headers if needed.
  // Assuming global CORS middleware might not be enough for "*" if credentials included?
  // Widget doesn't send cookies, so "*" is fine.

  const tenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .get();

  if (!tenant) {
    // Return 404, widget should utilize defaults
    return c.json({ error: "Not found" }, 404);
  }

  // Return only safe public info
  return c.json({
    config: tenant.widgetConfig || {},
    allowedOrigins: tenant.allowedOrigins,
  });
});

// Secure Keys Route (Fixing security hole)
tenantsRoute.post("/:id/keys", async (c) => {
  // Auth Check
  const dashboardSecret = c.req.header("x-dashboard-secret");
  const tenantId = c.req.param("id");

  // Allow if passed secret OR if authenticated user owns the tenant (complex check).
  // For dashboard use-case, secret is standard now.
  if (
    !process.env.DASHBOARD_SECRET ||
    dashboardSecret !== process.env.DASHBOARD_SECRET
  ) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const rawKey = `sk_${crypto.randomUUID().replace(/-/g, "")}`;
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

  const tenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .get();
  if (!tenant) {
    return c.json({ error: "Tenant not found" }, 404);
  }

  const result = await db
    .insert(apiKeys)
    .values({
      id: nanoid(),
      tenantId,
      keyHash,
      keyPrefix: rawKey.slice(0, 10) + "...",
    })
    .returning();

  return c.json(
    {
      apiKey: rawKey,
      keyId: result[0]?.id,
      message: "Save this key! You wont see it again.",
    },
    201
  );
});

// ... keys route

// Magic Theme Analysis
tenantsRoute.post("/:id/analyze-theme", async (c) => {
  try {
    const { url } = await c.req.json();
    if (!url) return c.json({ error: "URL is required" }, 400);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Kiosk-Widget-Analyzer/1.0",
      },
    });

    if (!response.ok) {
      return c.json({ error: "Failed to fetch URL" }, 400);
    }

    const html = await response.text();
    const cheerio = await import("cheerio");
    const $ = cheerio.load(html);

    // 1. Title -> Bot Name
    const title = ($("title").text().split("|")[0] ?? "")
      .trim()
      .substring(0, 20); // Keep it short

    // 2. Theme Color -> Primary Color
    // Try meta theme-color, or og:image (not color), or look for specific styles?
    // theme-color is best bet.
    let primaryColor = $('meta[name="theme-color"]').attr("content");

    // Fallback: Try to find common colors? Too expensive.
    // If no theme-color, default to undefined/null (frontend handles default).

    // 3. Icon -> Logo
    let iconHref =
      $('link[rel="icon"]').attr("href") ||
      $('link[rel="shortcut icon"]').attr("href");
    let logoUrl = "";
    if (iconHref) {
      try {
        logoUrl = new URL(iconHref, url).toString();
      } catch (e) {}
    }

    // 4. Description -> Welcome Message
    const desc =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content");
    const welcomeMessage = desc
      ? `Hi/Welcome! ${desc.substring(0, 50)}...`
      : "Hello! How can I help you today?";

    const config = {
      botName: title || "Assistant",
      welcomeMessage,
      primaryColor: primaryColor || "#000000", // Default to black if not found? Or undefined?
      logoUrl,
    };

    return c.json({ config });
  } catch (err) {
    console.error("Theme analysis failed:", err);
    return c.json({ error: "Analysis failed" }, 500);
  }
});

export default tenantsRoute;
