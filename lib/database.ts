import { env } from "cloudflare:workers";

let schemaPromise: Promise<void> | null = null;

export function getDatabase(): D1Database {
  if (!env.DB) {
    throw new Error("The Good Groceries database is unavailable.");
  }
  return env.DB;
}

export function ensureDatabaseSchema(db: D1Database): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = db
      .batch([
        db.prepare(`
          CREATE TABLE IF NOT EXISTS app_state (
            user_id TEXT PRIMARY KEY NOT NULL,
            catalog_json TEXT NOT NULL DEFAULT '',
            cart_json TEXT NOT NULL DEFAULT '{}',
            revision INTEGER NOT NULL DEFAULT 1,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `),
        db.prepare(`
          CREATE TABLE IF NOT EXISTS listing_cache (
            cache_key TEXT PRIMARY KEY NOT NULL,
            retailer TEXT NOT NULL,
            request_url TEXT NOT NULL,
            response_json TEXT NOT NULL DEFAULT '',
            outcome TEXT NOT NULL DEFAULT 'unchecked',
            fetched_at INTEGER NOT NULL DEFAULT 0,
            expires_at INTEGER NOT NULL DEFAULT 0,
            stale_until INTEGER NOT NULL DEFAULT 0,
            next_retry_at INTEGER NOT NULL DEFAULT 0,
            failure_count INTEGER NOT NULL DEFAULT 0,
            etag TEXT NOT NULL DEFAULT '',
            last_modified TEXT NOT NULL DEFAULT '',
            last_error TEXT NOT NULL DEFAULT '',
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `),
        db.prepare(`
          CREATE INDEX IF NOT EXISTS idx_listing_cache_expires_at
          ON listing_cache(expires_at)
        `),
        db.prepare(`
          CREATE INDEX IF NOT EXISTS idx_listing_cache_retry
          ON listing_cache(next_retry_at)
          WHERE next_retry_at > 0
        `),
      ])
      .then(() => undefined)
      .catch((error) => {
        schemaPromise = null;
        throw error;
      });
  }
  return schemaPromise!;
}

export function getAuthenticatedUserId(request: Request): string | null {
  const userId = request.headers.get("oai-authenticated-user-id")?.trim();
  if (userId) {
    return userId;
  }

  const host = new URL(request.url).hostname;
  return host === "localhost" || host === "127.0.0.1" ? "local-preview-user" : null;
}
