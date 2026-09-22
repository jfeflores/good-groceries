import { ensureDatabaseSchema, getAuthenticatedUserId, getDatabase } from "../../../lib/database";

const MAX_CATALOG_BYTES = 1_750_000;
const MAX_CART_BYTES = 100_000;

type StateRow = {
  catalog_json: string;
  cart_json: string;
  revision: number;
  updated_at: string;
};

function unauthorized() {
  return Response.json({ ok: false, error: "Sign in is required." }, { status: 401 });
}

function parseJson(value: string, fallback: unknown) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function serializeBounded(value: unknown, maxBytes: number, label: string): string {
  const serialized = JSON.stringify(value);
  if (new TextEncoder().encode(serialized).byteLength > maxBytes) {
    throw new Error(`${label} is too large to save.`);
  }
  return serialized;
}

async function readState(userId: string): Promise<StateRow | null> {
  return getDatabase()
    .prepare("SELECT catalog_json, cart_json, revision, updated_at FROM app_state WHERE user_id = ?")
    .bind(userId)
    .first<StateRow>();
}

export async function GET(request: Request) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) return unauthorized();
  const db = getDatabase();
  await ensureDatabaseSchema(db);
  const row = await readState(userId);
  if (!row) return Response.json({ ok: true, hasState: false, revision: 0 });
  return Response.json({
    ok: true,
    hasState: true,
    catalog: parseJson(row.catalog_json, null),
    cart: parseJson(row.cart_json, {}),
    revision: row.revision,
    updatedAt: row.updated_at,
  });
}

export async function PATCH(request: Request) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) return unauthorized();
  const db = getDatabase();
  await ensureDatabaseSchema(db);

  let payload: { catalog?: unknown; cart?: unknown; baseRevision?: number };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return Response.json({ ok: false, error: "The saved-state request was not valid JSON." }, { status: 400 });
  }
  if (!("catalog" in payload) && !("cart" in payload)) {
    return Response.json({ ok: false, error: "No catalog or cart changes were supplied." }, { status: 400 });
  }
  if ("catalog" in payload && (!payload.catalog || typeof payload.catalog !== "object" || !Array.isArray((payload.catalog as { products?: unknown }).products))) {
    return Response.json({ ok: false, error: "The catalog data is invalid." }, { status: 400 });
  }
  if ("cart" in payload && (!payload.cart || typeof payload.cart !== "object" || Array.isArray(payload.cart))) {
    return Response.json({ ok: false, error: "The cart data is invalid." }, { status: 400 });
  }

  try {
    const current = await readState(userId);
    const currentRevision = current?.revision || 0;
    if (Number.isFinite(payload.baseRevision) && Number(payload.baseRevision) !== currentRevision) {
      return Response.json(
        { ok: false, conflict: true, revision: currentRevision, updatedAt: current?.updated_at || null },
        { status: 409 },
      );
    }
    const catalogJson = "catalog" in payload
      ? serializeBounded(payload.catalog, MAX_CATALOG_BYTES, "Catalog")
      : current?.catalog_json || "";
    const cartJson = "cart" in payload
      ? serializeBounded(payload.cart, MAX_CART_BYTES, "Cart")
      : current?.cart_json || "{}";
    const nextRevision = currentRevision + 1;
    await db.prepare(`
      INSERT INTO app_state (user_id, catalog_json, cart_json, revision, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        catalog_json = excluded.catalog_json,
        cart_json = excluded.cart_json,
        revision = excluded.revision,
        updated_at = CURRENT_TIMESTAMP
    `).bind(userId, catalogJson, cartJson, nextRevision).run();
    return Response.json({ ok: true, revision: nextRevision, updatedAt: new Date().toISOString() });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "State could not be saved." },
      { status: 500 },
    );
  }
}
