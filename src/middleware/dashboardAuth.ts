import { createMiddleware } from "hono/factory";
import env from "../config/env";

/**
 * Dashboard Authentication Middleware
 *
 * Purpose: Protect sensitive dashboard-only routes from unauthorized access
 *
 * How it works:
 * 1. Extracts the 'x-dashboard-secret' header from the incoming request
 * 2. Compares it against the DASHBOARD_SECRET from environment variables
 * 3. If they match, allows the request to proceed
 * 4. If they don't match (or header is missing), returns 401 Unauthorized
 *
 * This ensures that only the legitimate dashboard (which knows the secret)
 * can access protected endpoints like /auth and /tenants
 */
export const dashboardAuth = createMiddleware(async (c, next) => {
  // Allow the widget to fetch its configuration publicly
  // Path pattern: /tenants/:id/config
  const { path, method } = c.req;
  if (method === "GET" && path.match(/^\/tenants\/[^\/]+\/config$/)) {
    return await next();
  }

  // Step 1: Get the secret from the request header
  const providedSecret = c.req.header("x-dashboard-secret");

  // Step 2: Check if the header exists
  if (!providedSecret) {
    return c.json({ error: "Unauthorized: Missing dashboard secret" }, 401);
  }

  // Step 3: Compare with our environment secret
  if (providedSecret !== env.DASHBOARD_SECRET) {
    return c.json({ error: "Unauthorized: Invalid dashboard secret" }, 401);
  }

  // Step 4: Secret is valid! Let the request continue to the handler
  await next();
});
