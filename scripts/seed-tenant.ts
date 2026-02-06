import { db } from "../src/db";
import { tenants } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const tenantId = "test_tenant_001";

  console.log(`Checking if tenant ${tenantId} exists...`);

  const existing = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .get();

  if (existing) {
    console.log("Tenant exists. Updating allowed origins...");
    await db
      .update(tenants)
      .set({
        allowedOrigins: ["http://localhost:3000", "http://127.0.0.1:8080"],
      })
      .where(eq(tenants.id, tenantId));
  } else {
    console.log("Creating new test tenant...");
    await db.insert(tenants).values({
      id: tenantId,
      name: "Test Tenant",
      email: "test@example.com",
      allowedOrigins: ["http://localhost:3000"],
    });
  }

  console.log("✅ Tenant seeded successfully!");
}

main().catch(console.error);
