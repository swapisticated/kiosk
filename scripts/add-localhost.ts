import { db } from "../src/db";
import { tenants } from "../src/db/schema";
import { eq } from "drizzle-orm";

const TENANT_ID = "-N8aVBSsp7tCKXWQ6rxUt"; // Your tenant ID

async function addLocalhost() {
  const tenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, TENANT_ID))
    .get();

  if (!tenant) {
    console.error("Tenant not found");
    return;
  }

  const currentOrigins = tenant.allowedOrigins || [];
  if (!currentOrigins.includes("http://localhost:3001")) {
    currentOrigins.push("http://localhost:3001");

    await db
      .update(tenants)
      .set({ allowedOrigins: currentOrigins })
      .where(eq(tenants.id, TENANT_ID));

    console.log("✅ Added http://localhost:3000 to allowed origins");
  } else {
    console.log("ℹ️ localhost already allowed");
  }

  console.log("Current origins:", currentOrigins);
}

addLocalhost();
