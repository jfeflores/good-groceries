import { ensureDatabaseSchema, getAuthenticatedUserId, getDatabase } from "../../../lib/database";
import { inspectRetailerBatch, inspectRetailerItem, retailerLimits, type RetailerInput } from "../../../lib/retailer";

function unauthorized() {
  return Response.json({ ok: false, error: "Sign in is required." }, { status: 401 });
}

function responseStatus(result: Record<string, unknown>): number {
  if (result.ok) return 200;
  if (result.broken) return 404;
  return 502;
}

export async function GET(request: Request) {
  if (!getAuthenticatedUserId(request)) return unauthorized();
  const url = new URL(request.url);
  const input: RetailerInput = {
    url: url.searchParams.get("url")?.trim() || "",
    expectedName: url.searchParams.get("expected")?.trim() || "",
    expectedBrand: url.searchParams.get("brand")?.trim() || "",
    expectedSize: url.searchParams.get("size")?.trim() || "",
    force: url.searchParams.get("force") === "1",
  };
  if (!input.url) return Response.json({ ok: false, error: "A retailer product URL is required." }, { status: 400 });
  const db = getDatabase();
  await ensureDatabaseSchema(db);
  const result = await inspectRetailerItem(db, input);
  return Response.json(result, { status: responseStatus(result) });
}

export async function POST(request: Request) {
  if (!getAuthenticatedUserId(request)) return unauthorized();
  let payload: { items?: RetailerInput[] };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return Response.json({ ok: false, error: "The batch request was not valid JSON." }, { status: 400 });
  }
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return Response.json({ ok: false, error: "At least one retailer item is required." }, { status: 400 });
  }
  if (payload.items.length > retailerLimits.maxBatchSize) {
    return Response.json(
      { ok: false, error: `A maximum of ${retailerLimits.maxBatchSize} items can be checked at once.` },
      { status: 400 },
    );
  }
  const db = getDatabase();
  await ensureDatabaseSchema(db);
  const results = await inspectRetailerBatch(db, payload.items);
  return Response.json({ ok: true, results, cacheTtlSeconds: retailerLimits.successTtlSeconds });
}
