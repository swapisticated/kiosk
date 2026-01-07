import { defineConfig } from "drizzle-kit";
import env  from "./src/config/env";

export default defineConfig({
  dialect: "turso",           // ← Changed
  schema: "./src/db/schema.ts", // ← Changed path
  out: "./drizzle",           // ← Add: where migrations go
  dbCredentials: {            // ← Add: connection details
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  },
});