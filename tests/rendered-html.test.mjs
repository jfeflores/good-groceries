import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function renderRoot() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("routes the application root to the complete grocery app", async () => {
  const response = await renderRoot();
  assert.ok([301, 302, 303, 307, 308].includes(response.status));
  assert.equal(new URL(response.headers.get("location"), "http://localhost").pathname, "/app.html");
});

test("ships the catalog, cart, cloud state, and installable shell", async () => {
  const [html, client, manifest, serviceWorker] = await Promise.all([
    readFile(new URL("public/app.html", root), "utf8"),
    readFile(new URL("public/app.js", root), "utf8"),
    readFile(new URL("public/manifest.webmanifest", root), "utf8"),
    readFile(new URL("public/sw.js", root), "utf8"),
  ]);

  assert.match(html, /Good Groceries/);
  assert.match(html, /id="product-list"/);
  assert.match(html, /id="cart-page"/);
  assert.match(html, /id="cloud-status"/);
  assert.match(html, /rel="manifest"/);
  assert.match(client, /CLOUD_STATE_ENDPOINT/);
  assert.match(client, /RETAILER_BATCH_SIZE/);
  assert.match(client, /syncAllRetailerData/);
  assert.match(client, /importCatalogBackup/);
  assert.equal(JSON.parse(manifest).display, "standalone");
  assert.match(serviceWorker, /url\.pathname\.startsWith\("\/api\/"\)/);
});
