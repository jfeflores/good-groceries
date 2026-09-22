const ALLOWED_HOSTS = new Set(["www.aldi.us", "shop.aldi.us", "www.walmart.com"]);
const MAX_RESPONSE_BYTES = 6 * 1024 * 1024;
const SUCCESS_TTL_MS = 6 * 60 * 60 * 1000;
const OUT_OF_STOCK_TTL_MS = 2 * 60 * 60 * 1000;
const BROKEN_TTL_MS = 24 * 60 * 60 * 1000;
const STALE_IF_ERROR_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_BATCH_SIZE = 20;

const COMMON_NAME_WORDS = new Set([
  "a",
  "all",
  "and",
  "count",
  "each",
  "fresh",
  "food",
  "foods",
  "for",
  "from",
  "great",
  "marketside",
  "natural",
  "nature",
  "of",
  "organic",
  "oz",
  "pack",
  "product",
  "simply",
  "the",
  "value",
  "with",
]);

const PROCESSED_FORM_WORDS = new Set([
  "butter",
  "canned",
  "dried",
  "drink",
  "juice",
  "milk",
  "powder",
  "spread",
  "supplement",
  "tablet",
]);

type JsonRecord = Record<string, unknown>;

export type RetailerInput = {
  id?: string;
  url: string;
  expectedName?: string;
  expectedBrand?: string;
  expectedSize?: string;
  force?: boolean;
};

type CacheRow = {
  cache_key: string;
  retailer: string;
  request_url: string;
  response_json: string;
  outcome: string;
  fetched_at: number;
  expires_at: number;
  stale_until: number;
  next_retry_at: number;
  failure_count: number;
  etag: string;
  last_modified: string;
  last_error: string;
};

export class RetailerError extends Error {
  status: number;
  broken: boolean;
  retryAfterSeconds: number;

  constructor(message: string, options: { status?: number; broken?: boolean; retryAfterSeconds?: number } = {}) {
    super(message);
    this.name = "RetailerError";
    this.status = options.status ?? 502;
    this.broken = options.broken ?? false;
    this.retryAfterSeconds = options.retryAfterSeconds ?? 0;
  }
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function cleanText(value: unknown): string {
  if (value == null) return "";
  return String(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHost(hostname: string): string {
  return hostname.toLowerCase().replace(/\.$/, "");
}

function isExactProductPath(url: URL): boolean {
  const host = normalizeHost(url.hostname);
  const path = url.pathname.toLowerCase();
  if (host === "www.walmart.com") return path.includes("/ip/");
  return ["www.aldi.us", "shop.aldi.us"].includes(host) &&
    (path.includes("/product/") || path.includes("/products/") || path.includes("/detail/"));
}

function validateProductUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new RetailerError("The retailer link is not a valid URL.", { status: 400, broken: true });
  }
  const host = normalizeHost(url.hostname);
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(host) || url.username || url.password) {
    throw new RetailerError("Only exact HTTPS product links from Aldi or Walmart can be checked.", {
      status: 400,
      broken: true,
    });
  }
  if (!isExactProductPath(url)) {
    throw new RetailerError("This is a retailer page, but it is not an exact product listing.", {
      status: 400,
      broken: true,
    });
  }
  return url;
}

function normalizedRequest(url: URL): { cacheKey: string; url: string; retailer: string; itemId: string } {
  url.hash = "";
  url.search = "";
  const host = normalizeHost(url.hostname);
  const retailer = host === "www.walmart.com" ? "Walmart" : "Aldi";
  const walmartId = host === "www.walmart.com" ? url.pathname.match(/\/ip\/(?:[^/]+\/)?(\d+)/i)?.[1] || "" : "";
  const itemId = walmartId || url.pathname.toLowerCase().replace(/\/+$/, "");
  return {
    cacheKey: `${retailer.toLowerCase()}:${itemId}`,
    url: url.toString(),
    retailer,
    itemId,
  };
}

function nestedGet(value: unknown, ...keys: string[]): unknown {
  let current = value;
  for (const key of keys) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return undefined;
    current = (current as JsonRecord)[key];
  }
  return current;
}

function walkJson(root: unknown): JsonRecord[] {
  const records: JsonRecord[] = [];
  const stack: unknown[] = [root];
  let inspected = 0;
  while (stack.length && inspected < 60_000) {
    const value = stack.pop();
    inspected += 1;
    if (Array.isArray(value)) {
      for (let index = value.length - 1; index >= 0; index -= 1) stack.push(value[index]);
    } else if (value && typeof value === "object") {
      const record = value as JsonRecord;
      records.push(record);
      for (const child of Object.values(record)) stack.push(child);
    }
  }
  return records;
}

function extractJsonScripts(page: string, options: { id?: string; type?: string } = {}): unknown[] {
  const values: unknown[] = [];
  const pattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  for (const match of page.matchAll(pattern)) {
    const attributes = match[1] || "";
    if (options.id && !new RegExp(`\\bid=["']${escapeRegExp(options.id)}["']`, "i").test(attributes)) continue;
    if (options.type && !new RegExp(`\\btype=["']${escapeRegExp(options.type)}["']`, "i").test(attributes)) continue;
    try {
      values.push(JSON.parse(match[2].trim()));
    } catch {
      // Retailers sometimes emit unrelated non-JSON script tags.
    }
  }
  return values;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function firstOffer(value: unknown): JsonRecord {
  if (Array.isArray(value)) return asRecord(value.find((item) => item && typeof item === "object"));
  return asRecord(value);
}

function firstImageUrl(value: unknown): string {
  if (typeof value === "string") {
    const candidate = cleanText(value);
    try {
      const parsed = new URL(candidate);
      return parsed.protocol === "https:" && !candidate.toLowerCase().includes("missing-item") ? candidate : "";
    } catch {
      return "";
    }
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const result = firstImageUrl(item);
      if (result) return result;
    }
  }
  if (value && typeof value === "object") {
    const record = value as JsonRecord;
    for (const key of ["url", "contentUrl", "imageUrl", "thumbnailUrl", "src"]) {
      const result = firstImageUrl(record[key]);
      if (result) return result;
    }
    for (const item of Object.values(record)) {
      const result = firstImageUrl(item);
      if (result) return result;
    }
  }
  return "";
}

function metaContent(page: string, key: string): string {
  for (const match of page.matchAll(/<meta\b([^>]*)>/gi)) {
    const attributes: Record<string, string> = {};
    for (const attribute of match[1].matchAll(/([:\w-]+)\s*=\s*["']([^"']*)["']/g)) {
      attributes[attribute[1].toLowerCase()] = cleanText(attribute[2]);
    }
    if ((attributes.property || attributes.name || "").toLowerCase() === key.toLowerCase()) {
      return attributes.content || "";
    }
  }
  return "";
}

function toNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(String(value).replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseAldiPricing(page: string): JsonRecord {
  let decoded = page;
  try {
    decoded = decodeURIComponent(page);
  } catch {
    // The page can contain standalone percent characters; raw text still has JSON-LD pricing.
  }
  const value = (key: string) => cleanText(decoded.match(new RegExp(`"${key}"\\s*:\\s*"([^"\\\\]*)"`))?.[1]);
  const unitDisplay = value("pricingUnitString");
  const unitMatch = unitDisplay.match(/\$([\d,]+(?:\.\d+)?)\s*\/\s*([a-zA-Z]+)/);
  return {
    unitPrice: unitMatch ? toNumber(unitMatch[1]) : null,
    priceUnit: unitMatch?.[2]?.toLowerCase() || "",
    priceDisplay: value("priceString"),
    packageDescription: value("pricingUnitSecondaryString"),
  };
}

function parseAldi(page: string, finalUrl: string): JsonRecord {
  const candidates = extractJsonScripts(page, { type: "application/ld+json" });
  let product: JsonRecord | undefined;
  for (const candidate of candidates) {
    product = walkJson(candidate).find((item) => {
      const type = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
      return type.some((entry) => String(entry).toLowerCase() === "product") && Boolean(item.name);
    });
    if (product) break;
  }
  if (!product) throw new RetailerError("Aldi returned a page, but its product data could not be read right now.");
  const offer = firstOffer(product.offers);
  const brandRecord = asRecord(product.brand);
  return {
    retailer: "Aldi",
    name: cleanText(product.name),
    brand: cleanText(brandRecord.name || product.brand),
    price: toNumber(offer.price ?? offer.lowPrice),
    currency: cleanText(offer.priceCurrency) || "USD",
    availability: cleanText(offer.availability).split("/").pop()?.toUpperCase() || "",
    canonicalUrl: cleanText(product.url) || finalUrl,
    size: cleanText(product.size),
    ingredients: cleanText(product.ingredients),
    ingredientLabelUrl: "",
    nutritionLabelUrl: "",
    imageUrl: firstImageUrl(product.image) || firstImageUrl(metaContent(page, "og:image")),
    seller: "Aldi",
    ...parseAldiPricing(page),
  };
}

function normalizedAvailability(value: unknown): string {
  const record = asRecord(value);
  const source = Object.keys(record).length ? record.value ?? record.display : value;
  return cleanText(source).toUpperCase().replace(/\s+/g, "_");
}

function walmartAvailability(product: JsonRecord): string {
  const storeStatuses: string[] = [];
  for (const item of walkJson(product)) {
    const status = normalizedAvailability(item.availabilityStatus);
    const method = cleanText(item.fulfillmentMethod).toUpperCase();
    const type = cleanText(item.fulfillmentType).toUpperCase();
    if (status && (["PICKUP", "DELIVERY"].includes(method) || type === "STORE")) storeStatuses.push(status);
  }
  if (storeStatuses.some((status) => ["IN_STOCK", "AVAILABLE"].includes(status))) return "IN_STOCK";
  return normalizedAvailability(product.availabilityStatus) || storeStatuses[0] || "";
}

function specificationValue(root: JsonRecord, displayName: string): string {
  const target = displayName.toLowerCase();
  for (const item of walkJson(root)) {
    const name = cleanText(item.displayName ?? item.name).toLowerCase();
    if (name !== target) continue;
    const value = item.attributeValue ?? item.value;
    return cleanText(Array.isArray(value) ? value.find(Boolean) : value);
  }
  return "";
}

function findWalmartProduct(root: unknown): JsonRecord | null {
  const direct = asRecord(nestedGet(root, "props", "pageProps", "initialData", "data", "product"));
  if (direct.name) return direct;
  const candidates = walkJson(root)
    .filter((item) => item.name && (item.priceInfo || item.imageInfo || item.availabilityStatus))
    .map((item) => ({
      item,
      score: Number(Boolean(item.priceInfo)) * 3 + Number(Boolean(item.imageInfo)) * 2 + Number(Boolean(item.availabilityStatus)),
    }))
    .sort((left, right) => right.score - left.score);
  return candidates[0]?.item || null;
}

function parseWalmart(page: string, finalUrl: string): JsonRecord {
  const roots = extractJsonScripts(page, { id: "__NEXT_DATA__" });
  const root = roots[0];
  const product = root ? findWalmartProduct(root) : null;
  if (!product) {
    const jsonLd = extractJsonScripts(page, { type: "application/ld+json" });
    const fallback = jsonLd.flatMap(walkJson).find((item) => String(item["@type"]).toLowerCase() === "product" && item.name);
    if (!fallback) throw new RetailerError("Walmart did not expose a readable product listing.");
    const offer = firstOffer(fallback.offers);
    return {
      retailer: "Walmart",
      name: cleanText(fallback.name),
      brand: cleanText(asRecord(fallback.brand).name || fallback.brand),
      price: toNumber(offer.price ?? offer.lowPrice),
      currency: cleanText(offer.priceCurrency) || "USD",
      availability: normalizedAvailability(offer.availability).split("/").pop() || "",
      canonicalUrl: cleanText(fallback.url) || finalUrl,
      size: cleanText(fallback.size),
      ingredients: cleanText(fallback.ingredients),
      ingredientLabelUrl: "",
      nutritionLabelUrl: "",
      imageUrl: firstImageUrl(fallback.image) || firstImageUrl(metaContent(page, "og:image")),
      seller: cleanText(asRecord(offer.seller).name) || "Walmart listing",
    };
  }
  const imageInfo = asRecord(product.imageInfo);
  let canonical = cleanText(product.canonicalUrl);
  if (canonical.startsWith("/")) canonical = new URL(canonical, "https://www.walmart.com").toString();
  return {
    retailer: "Walmart",
    name: cleanText(product.name),
    brand: cleanText(product.brand),
    price: toNumber(nestedGet(product, "priceInfo", "currentPrice", "price")),
    currency: cleanText(nestedGet(product, "priceInfo", "currentPrice", "currencyUnit")) || "USD",
    availability: walmartAvailability(product),
    canonicalUrl: canonical || finalUrl,
    size: cleanText(product.salesUnit),
    ingredients: cleanText(nestedGet(product, "idml", "ingredients", "ingredients", "value")),
    ingredientLabelUrl: specificationValue(product, "Ingredient list image") || specificationValue(asRecord(root), "Ingredient list image"),
    nutritionLabelUrl: specificationValue(product, "Nutrition facts label image") || specificationValue(asRecord(root), "Nutrition facts label image"),
    imageUrl: firstImageUrl(imageInfo.thumbnailUrl) || firstImageUrl(imageInfo.allImages) || firstImageUrl(metaContent(page, "og:image")),
    seller: cleanText(product.sellerDisplayName) || cleanText(nestedGet(product, "sellerInfo", "sellerDisplayName")) || "Walmart listing",
  };
}

function nameTokens(value: string): Set<string> {
  const tokens = new Set<string>();
  for (let token of value.toLowerCase().match(/[a-z0-9]+/g) || []) {
    if (token.endsWith("ies") && token.length > 4) token = `${token.slice(0, -3)}y`;
    else if (token.endsWith("s") && token.length > 3) token = token.slice(0, -1);
    if (token.length > 1 && !COMMON_NAME_WORDS.has(token) && !/^\d+$/.test(token)) tokens.add(token);
  }
  return tokens;
}

function rawTokens(value: string): Set<string> {
  return new Set(value.toLowerCase().match(/[a-z0-9]+/g) || []);
}

function extractComparableSize(value: string): { amount: number; unit: string } | null {
  const match = value.toLowerCase().match(/(\d+(?:\.\d+)?)\s*(fl\.?\s*oz|fluid\s*ounces?|ounces?|oz|pounds?|lbs?|lb|count|ct)\b/);
  if (!match) return null;
  let amount = Number(match[1]);
  let unit = match[2].replace(/[.\s]/g, "");
  if (["fluidounce", "fluidounces", "floz"].includes(unit)) unit = "floz";
  else if (["ounce", "ounces", "oz"].includes(unit)) unit = "oz";
  else if (["pound", "pounds", "lbs", "lb"].includes(unit)) {
    amount *= 16;
    unit = "oz";
  } else if (["count", "ct"].includes(unit)) unit = "count";
  return { amount, unit };
}

function compareIdentity(input: RetailerInput, actual: JsonRecord): JsonRecord {
  const expected = cleanText(input.expectedName);
  const actualName = cleanText(actual.name);
  if (!expected) return { matched: true, matchScore: 1, matchConfidence: "high", matchReasons: ["Exact retailer URL validated"] };
  const left = nameTokens(expected);
  const right = nameTokens(actualName);
  if (!left.size || !right.size) return { matched: false, matchScore: 0, matchConfidence: "low", matchReasons: ["Product name could not be compared"] };
  const overlap = new Set([...left].filter((token) => right.has(token)));
  const union = new Set([...left, ...right]);
  const jaccard = overlap.size / union.size;
  const coverage = overlap.size / left.size;
  const score = Math.round((jaccard * 0.55 + coverage * 0.45) * 1000) / 1000;
  const expectedRaw = rawTokens(expected);
  const actualRaw = rawTokens(actualName);
  const expectedForms = [...expectedRaw].filter((token) => PROCESSED_FORM_WORDS.has(token));
  const actualForms = new Set([...actualRaw].filter((token) => PROCESSED_FORM_WORDS.has(token)));
  const formMismatch = expectedForms.length > 0 && !expectedForms.some((token) => actualForms.has(token));
  const freshMismatch = expectedRaw.has("fresh") && [...actualForms].some((token) => token !== "fresh");
  const expectedBrand = cleanText(input.expectedBrand).toLowerCase();
  const actualBrand = cleanText(actual.brand).toLowerCase();
  const brandComparable = expectedBrand.length > 2 && actualBrand.length > 2;
  const brandMatched = !brandComparable || actualBrand.includes(expectedBrand) || expectedBrand.includes(actualBrand);
  const expectedSize = extractComparableSize(cleanText(input.expectedSize));
  const actualSize = extractComparableSize(`${cleanText(actual.size)} ${actualName}`);
  const sizeComparable = Boolean(expectedSize && actualSize && expectedSize.unit === actualSize.unit);
  const sizeMatched =
    !sizeComparable ||
    Math.abs(expectedSize!.amount - actualSize!.amount) / Math.max(expectedSize!.amount, actualSize!.amount) <= 0.04;
  const matched =
    !formMismatch &&
    !freshMismatch &&
    brandMatched &&
    sizeMatched &&
    (overlap.size >= 2 || score >= 0.42 || (left.size === 1 && overlap.size === 1));
  const confidence = matched && score >= 0.62 && brandMatched && sizeMatched ? "high" : matched ? "medium" : "low";
  const reasons = [
    `${overlap.size}/${left.size} expected name terms matched`,
    brandComparable ? (brandMatched ? "Brand matched" : "Brand did not match") : "Brand comparison unavailable",
    sizeComparable ? (sizeMatched ? "Package size matched" : "Package size did not match") : "Package-size comparison unavailable",
  ];
  if (formMismatch || freshMismatch) reasons.push("Product form did not match");
  return { matched, matchScore: score, matchConfidence: confidence, matchReasons: reasons };
}

function scopeText(retailer: string): string {
  return retailer === "Walmart"
    ? "Current Walmart web listing. Price and availability may vary after your local store and fulfillment method are selected."
    : "Current Aldi web listing. Variable-weight totals and local shelf availability can differ by store.";
}

async function fetchPage(rawUrl: string, cache: CacheRow | null): Promise<{ page: string; finalUrl: string; etag: string; lastModified: string; notModified: boolean }> {
  let current = validateProductUrl(rawUrl);
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    const headers = new Headers({
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    });
    if (cache?.etag) headers.set("If-None-Match", cache.etag);
    if (cache?.last_modified) headers.set("If-Modified-Since", cache.last_modified);
    let response: Response;
    try {
      response = await fetch(current, { headers, redirect: "manual", signal: controller.signal });
    } catch (error) {
      clearTimeout(timer);
      if (error instanceof Error && error.name === "AbortError") throw new RetailerError("The retailer took too long to respond.");
      throw new RetailerError("The retailer could not be reached right now.");
    }
    clearTimeout(timer);
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new RetailerError("The retailer returned an invalid redirect.");
      const next = new URL(location, current);
      if (next.protocol !== "https:" || !ALLOWED_HOSTS.has(normalizeHost(next.hostname))) {
        throw new RetailerError("The retailer redirected outside the approved sites.");
      }
      if (!isExactProductPath(next)) {
        throw new RetailerError("The retailer temporarily redirected away from the product page. The exact link was preserved.");
      }
      current = next;
      continue;
    }
    if (response.status === 304 && cache?.response_json) {
      return { page: "", finalUrl: current.toString(), etag: cache.etag, lastModified: cache.last_modified, notModified: true };
    }
    if ([404, 410].includes(response.status)) {
      throw new RetailerError("The retailer product page no longer exists.", { status: response.status, broken: true });
    }
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("retry-after")) || 300;
      throw new RetailerError("The retailer is rate-limiting checks right now.", { retryAfterSeconds: Math.min(retryAfter, 3600) });
    }
    if (!response.ok) throw new RetailerError(`Retailer returned HTTP ${response.status}.`);
    const contentType = response.headers.get("content-type")?.toLowerCase() || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      throw new RetailerError("The retailer link did not return a product page.", { broken: true });
    }
    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) throw new RetailerError("The retailer response was too large to inspect safely.");
    const body = await response.arrayBuffer();
    if (body.byteLength > MAX_RESPONSE_BYTES) throw new RetailerError("The retailer response was too large to inspect safely.");
    return {
      page: new TextDecoder().decode(body),
      finalUrl: current.toString(),
      etag: response.headers.get("etag") || "",
      lastModified: response.headers.get("last-modified") || "",
      notModified: false,
    };
  }
  throw new RetailerError("The retailer redirected too many times.");
}

async function readCache(db: D1Database, key: string): Promise<CacheRow | null> {
  return db.prepare("SELECT * FROM listing_cache WHERE cache_key = ?").bind(key).first<CacheRow>();
}

async function writeSuccess(db: D1Database, key: string, normalized: ReturnType<typeof normalizedRequest>, result: JsonRecord, response: { etag: string; lastModified: string }, now: number): Promise<void> {
  const outOfStock = /OUT|UNAVAILABLE|NOT_AVAILABLE/i.test(cleanText(result.availability));
  const ttl = outOfStock ? OUT_OF_STOCK_TTL_MS : SUCCESS_TTL_MS;
  await db.prepare(`
    INSERT INTO listing_cache (
      cache_key, retailer, request_url, response_json, outcome, fetched_at, expires_at,
      stale_until, next_retry_at, failure_count, etag, last_modified, last_error, updated_at
    ) VALUES (?, ?, ?, ?, 'current', ?, ?, ?, 0, 0, ?, ?, '', CURRENT_TIMESTAMP)
    ON CONFLICT(cache_key) DO UPDATE SET
      retailer = excluded.retailer,
      request_url = excluded.request_url,
      response_json = excluded.response_json,
      outcome = excluded.outcome,
      fetched_at = excluded.fetched_at,
      expires_at = excluded.expires_at,
      stale_until = excluded.stale_until,
      next_retry_at = 0,
      failure_count = 0,
      etag = excluded.etag,
      last_modified = excluded.last_modified,
      last_error = '',
      updated_at = CURRENT_TIMESTAMP
  `).bind(key, normalized.retailer, normalized.url, JSON.stringify(result), now, now + ttl, now + STALE_IF_ERROR_MS, response.etag, response.lastModified).run();
}

async function writeFailure(db: D1Database, key: string, normalized: ReturnType<typeof normalizedRequest>, cache: CacheRow | null, error: RetailerError, now: number): Promise<void> {
  const failures = Math.min((cache?.failure_count || 0) + 1, 10);
  const exponentialSeconds = Math.min(300 * 2 ** (failures - 1), 6 * 60 * 60);
  const retrySeconds = error.broken ? 24 * 60 * 60 : Math.max(exponentialSeconds, error.retryAfterSeconds);
  await db.prepare(`
    INSERT INTO listing_cache (
      cache_key, retailer, request_url, response_json, outcome, fetched_at, expires_at,
      stale_until, next_retry_at, failure_count, etag, last_modified, last_error, updated_at
    ) VALUES (?, ?, ?, '', ?, ?, ?, ?, ?, ?, '', '', ?, CURRENT_TIMESTAMP)
    ON CONFLICT(cache_key) DO UPDATE SET
      outcome = excluded.outcome,
      expires_at = excluded.expires_at,
      next_retry_at = excluded.next_retry_at,
      failure_count = excluded.failure_count,
      last_error = excluded.last_error,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    key,
    normalized.retailer,
    normalized.url,
    error.broken ? "broken" : "error",
    now,
    now + (error.broken ? BROKEN_TTL_MS : retrySeconds * 1000),
    cache?.stale_until || 0,
    now + retrySeconds * 1000,
    failures,
    error.message,
  ).run();
}

function cachedResult(cache: CacheRow, input: RetailerInput, now: number, stale = false): JsonRecord {
  const result = JSON.parse(cache.response_json) as JsonRecord;
  return {
    ok: true,
    ...result,
    ...compareIdentity(input, result),
    cached: true,
    stale,
    cacheAgeSeconds: Math.max(0, Math.round((now - cache.fetched_at) / 1000)),
    warning: stale ? "The retailer could not be reached, so the last verified listing data was kept." : "",
  };
}

export async function inspectRetailerItem(db: D1Database, input: RetailerInput): Promise<JsonRecord> {
  const normalized = normalizedRequest(validateProductUrl(cleanText(input.url)));
  const now = Date.now();
  let cache = await readCache(db, normalized.cacheKey);
  if (!input.force && cache?.response_json && cache.expires_at > now) return cachedResult(cache, input, now);
  if (!input.force && cache?.next_retry_at && cache.next_retry_at > now) {
    if (cache.response_json && cache.stale_until > now) return cachedResult(cache, input, now, true);
    return {
      ok: false,
      error: cache.last_error || "The retailer check is waiting before retrying.",
      broken: cache.outcome === "broken",
      retryAt: new Date(cache.next_retry_at).toISOString(),
      cached: true,
    };
  }

  try {
    const response = await fetchPage(normalized.url, cache);
    if (response.notModified && cache?.response_json) {
      const existing = JSON.parse(cache.response_json) as JsonRecord;
      await writeSuccess(db, normalized.cacheKey, normalized, existing, response, now);
      cache = await readCache(db, normalized.cacheKey);
      return cachedResult(cache!, input, now);
    }
    const finalHost = normalizeHost(new URL(response.finalUrl).hostname);
    const result = finalHost === "www.walmart.com" ? parseWalmart(response.page, response.finalUrl) : parseAldi(response.page, response.finalUrl);
    result.checkedAt = new Date(now).toISOString();
    result.scope = scopeText(cleanText(result.retailer));
    result.sourceMethod = finalHost === "www.walmart.com" ? "Walmart structured product data" : "Aldi JSON-LD product data";
    await writeSuccess(db, normalized.cacheKey, normalized, result, response, now);
    return { ok: true, ...result, ...compareIdentity(input, result), cached: false, stale: false, cacheAgeSeconds: 0 };
  } catch (unknownError) {
    const error = unknownError instanceof RetailerError ? unknownError : new RetailerError("The listing check failed unexpectedly.");
    await writeFailure(db, normalized.cacheKey, normalized, cache, error, now);
    if (!error.broken && cache?.response_json && cache.stale_until > now) return cachedResult(cache, input, now, true);
    return { ok: false, error: error.message, broken: error.broken, cached: false, stale: false };
  }
}

export async function inspectRetailerBatch(db: D1Database, inputs: RetailerInput[]): Promise<JsonRecord[]> {
  const bounded = inputs.slice(0, MAX_BATCH_SIZE);
  const results: JsonRecord[] = new Array(bounded.length);
  const inFlight = new Map<string, Promise<JsonRecord>>();
  let cursor = 0;
  async function worker() {
    while (cursor < bounded.length) {
      const index = cursor;
      cursor += 1;
      const input = bounded[index];
      try {
        const key = `${input.url}|${input.expectedName || ""}|${input.expectedBrand || ""}`;
        let request = inFlight.get(key);
        if (!request) {
          request = inspectRetailerItem(db, input);
          inFlight.set(key, request);
        }
        results[index] = { id: input.id || "", ...(await request) };
      } catch (error) {
        results[index] = {
          id: input.id || "",
          ok: false,
          broken: error instanceof RetailerError ? error.broken : false,
          error: error instanceof Error ? error.message : "The listing check failed unexpectedly.",
        };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(2, bounded.length) }, () => worker()));
  return results;
}

export const retailerLimits = { maxBatchSize: MAX_BATCH_SIZE, successTtlSeconds: SUCCESS_TTL_MS / 1000 };
