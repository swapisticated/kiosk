import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import tenantsRoute from "./routes/tenants";
import documentsRoute from "./routes/documents";
import chatRoute from "./routes/chat";
import authRoute from "./routes/auth";
import statsRoute from "./routes/stats";
import { dashboardAuth } from "./middleware/dashboardAuth";

const app = new Hono();

app.use("/*", cors());

app.get("/", (c) => {
  return c.json({ message: "AI chatbot is running" });
});

// Serve the widget.js file
app.use("/widget.js", serveStatic({ path: "./dist/widget.js" }));

// Protected routes - require dashboard secret
app.use("/auth/*", dashboardAuth);
app.use("/tenants/*", dashboardAuth);

// Mount routes
app.route("/auth", authRoute);
app.route("/tenants", tenantsRoute);

// Public routes - for widget usage (protected by API key)
app.route("/documents", documentsRoute);
app.route("/chat", chatRoute);
app.route("/stats", statsRoute);

// Explicitly export fetch handler and port 8000
export default {
  port: 8000,
  fetch: app.fetch,
};
