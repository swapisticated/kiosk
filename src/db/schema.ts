import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ===================
// TENANTS
// ===================
export const tenants = sqliteTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  domain: text("domain"),
  widgetConfig: text("widget_config", { mode: "json" }).$type<{
    botName?: string;
    welcomeMessage?: string;
    primaryColor?: string;
    position?: "bottom-right" | "bottom-left";
  }>(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// ===================
// API KEYS
// ===================
export const apiKeys = sqliteTable("api_keys", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  keyHash: text("key_hash").notNull(),
  keyPrefix: text("key_prefix").notNull(), // e.g., "pk_abc1..."
  allowedDomains: text("allowed_domains", { mode: "json" })
    .$type<string[]>()
    .default([]),
  label: text("label"), // e.g., "production", "staging"
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
});

// ===================
// DOCUMENTS
// ===================
export const sourceTypeEnum = ["scraped", "uploaded", "manual"] as const;
export const statusEnum = [
  "pending",
  "processing",
  "processed",
  "failed",
] as const;

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  sourceType: text("source_type", { enum: sourceTypeEnum }).notNull(),
  url: text("url"),
  fileName: text("file_name"),
  title: text("title").notNull(),
  content: text("content"),
  status: text("status", { enum: statusEnum }).default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// ===================
// CHUNKS
// ===================
export const chunks = sqliteTable("chunks", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  documentId: text("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  pineconeId: text("pinecone_id"),
  chunkIndex: integer("chunk_index").notNull(),
  tokenCount: integer("token_count"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// ===================
// CONVERSATIONS
// ===================
export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  sessionId: text("session_id").notNull(),
  visitorInfo: text("visitor_info", { mode: "json" }).$type<{
    ip?: string;
    userAgent?: string;
    pageUrl?: string;
  }>(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// ===================
// MESSAGES
// ===================
export const roleEnum = ["user", "assistant"] as const;

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role", { enum: roleEnum }).notNull(),
  content: text("content").notNull(),
  sources: text("sources", { mode: "json" }).$type<string[]>(), // chunk IDs used
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// ===================
// RELATIONS (for Drizzle query API)
// ===================
export const tenantsRelations = relations(tenants, ({ many }) => ({
  apiKeys: many(apiKeys),
  documents: many(documents),
  conversations: many(conversations),
  chunks: many(chunks),
  messages: many(messages),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  tenant: one(tenants, {
    fields: [apiKeys.tenantId],
    references: [tenants.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [documents.tenantId],
    references: [tenants.id],
  }),
  chunks: many(chunks),
}));

export const chunksRelations = relations(chunks, ({ one }) => ({
  tenant: one(tenants, {
    fields: [chunks.tenantId],
    references: [tenants.id],
  }),
  document: one(documents, {
    fields: [chunks.documentId],
    references: [documents.id],
  }),
}));

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [conversations.tenantId],
      references: [tenants.id],
    }),
    messages: many(messages),
  })
);

export const messagesRelations = relations(messages, ({ one }) => ({
  tenant: one(tenants, {
    fields: [messages.tenantId],
    references: [tenants.id],
  }),
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));
