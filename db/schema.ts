import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const appState = sqliteTable("app_state", {
  userId: text("user_id").primaryKey(),
  catalogJson: text("catalog_json").notNull().default(""),
  cartJson: text("cart_json").notNull().default("{}"),
  revision: integer("revision").notNull().default(1),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const listingCache = sqliteTable(
  "listing_cache",
  {
    cacheKey: text("cache_key").primaryKey(),
    retailer: text("retailer").notNull(),
    requestUrl: text("request_url").notNull(),
    responseJson: text("response_json").notNull().default(""),
    outcome: text("outcome").notNull().default("unchecked"),
    fetchedAt: integer("fetched_at").notNull().default(0),
    expiresAt: integer("expires_at").notNull().default(0),
    staleUntil: integer("stale_until").notNull().default(0),
    nextRetryAt: integer("next_retry_at").notNull().default(0),
    failureCount: integer("failure_count").notNull().default(0),
    etag: text("etag").notNull().default(""),
    lastModified: text("last_modified").notNull().default(""),
    lastError: text("last_error").notNull().default(""),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_listing_cache_expires_at").on(table.expiresAt),
    index("idx_listing_cache_retry").on(table.nextRetryAt).where(sql`${table.nextRetryAt} > 0`),
  ],
);
