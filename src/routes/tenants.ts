//imports and setup
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { nanoid } from "nanoid";
import { db } from "../db";
import { tenants, apiKeys } from "../db/schema";
import * as crypto from "node:crypto"
import { eq } from "drizzle-orm";

const tenantsRoute = new Hono();

//confirming shape of data (validation)

//define what data we expect from the user

const createTenantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email(),
  domain: z.string().optional(),
});

//the endpoint

//listen for post req
//z.validator, run validator if data is bad stop here
//async(c)=> ... actual funtion if data is good



tenantsRoute.post("/", zValidator("json", createTenantSchema), async (c) => {
try {
    const data = c.req.valid("json");

  const results = await db
    .insert(tenants)
    .values({
      id: nanoid(),
      name: data.name,
      email: data.email,
      domain: data.domain,
    })
    .returning();

  return c.json({ tenant: results[0] }, 201);
} catch (error) {
      console.error('Tenant creation error :', error);

        // Check if it's a duplicate email error
  if ((error as any)?.cause?.code==='SQLITE_CONSTRAINT') {
    return c.json({ error: 'Email already exists' }, 409);
  }
  // Any other error = server error
  return c.json({ error: 'Internal server error' }, 500);
}
});



tenantsRoute.post("/:id/keys", async (c) => {

  
  const rawKey = `sk_${crypto.randomUUID().replace(/-/g,'')}`
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  //check if tenant exists
  const tenantId = c.req.param("id");

  const tenant = await db.select().from(tenants).where(eq(tenants.id, tenantId)).get();
  if(!tenant){
    return c.json({error:"Tenant not found"}, 404)
  }

  const result = await db.insert(apiKeys).values({
    id: nanoid(),
    tenantId,
    keyHash,
    keyPrefix: rawKey.slice(0,10)+ "..."
  }).returning();

  return c.json({
    apiKey:rawKey,
    keyId: result[0]?.id,
    message: "Save this key! You wont see it again."
  },201);

});

export default tenantsRoute;
