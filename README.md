# Good Groceries

A grocery catalog, budget planner, and retailer-linked cart for comparing products from Aldi and Walmart.

Good Groceries puts the reasoning behind a product choice alongside its price. It separates nutritional priority from sourcing and certification evidence, helps compare quality and lower-price alternatives, and links directly to retailer listings.

## Features

| Area | What you can do |
| --- | --- |
| Catalog | Search and filter products by category, store, food tier, and certification; review ingredients, nutrition, additives, evidence, and notes. |
| Product comparison | Compare quality-focused, lower-price, and best-of-both choices without treating retailer marketing as independent verification. |
| Budget planning | Start from Emergency 50, Regular 80, or Premium 100 example carts, then adjust products and quantities. |
| Cart | Use the mini cart or full cart view, sort items, and follow store-specific purchase links. |
| Retailer checks | Refresh supported Aldi/Walmart listings and inspect identity confidence, freshness, cached results, and stale-data warnings. |
| Editing and backups | Edit the seeded catalog and export or import a JSON backup containing catalog and cart state. |
| Persistence | Keep browser-local state and synchronize catalog/cart changes to D1 when deployed behind the supported Sites identity gateway. |
| Interface | Use responsive layouts, dark mode, product imagery, and an installable application shell with offline asset caching. |

The cart is a planning tool. Purchasing takes place on the retailer's website; the app does not submit an order or complete checkout.

## How the product model works

The catalog keeps two judgments separate:

- **Food Tier S/A/B** expresses nutritional priority within the application's model.
- **Verification Grade A/B/C** expresses the strength of evidence for production, sourcing, and certification claims.

Government and independent certifications are recorded separately from manufacturer and retailer claims. A high food tier does not automatically mean a product's sourcing claims are independently verified.

The bundled catalog is an editable starting point. Its prices, product availability, nutrition records, and certification evidence can become outdated. Store selection, fulfillment method, and the retailer's checkout determine the final purchase price and local availability.

## Technology and structure

The visible catalog and cart use HTML, CSS, and JavaScript in `public/`. A small React/TypeScript App Router application, built with Vinext and Vite, provides the entry route and server APIs. Cloudflare Workers runs the backend, D1 stores saved state and listing caches, and Drizzle defines the database schema.

```text
public/
  app.html                Grocery application shell
  app.js                  Catalog, cart, editing, backups, and sync
  data.js                 Base product catalog
  tier-data.js            Additional product, tier, and evidence data
  styles.css              Application styling
  sw.js                   Offline application-shell caching
app/
  api/state/              Read and save catalog/cart state
  api/retailer-data/      Inspect individual listings or listing batches
lib/
  database.ts             D1 setup and platform identity handling
  retailer.ts             Retailer parsing, matching, caching, and retries
db/                       Drizzle schema
drizzle/                  SQL migration files
worker/                   Cloudflare Worker entry
scripts/                  Catalog and public-release checks
tests/                    Built-Worker routing and application-shell checks
```

## Run locally

### Requirements

- Git
- Node.js 22.13 or newer
- pnpm 10, matching the repository's CI setup

```sh
git clone https://github.com/jfeflores/good-groceries.git
cd good-groceries
pnpm install --frozen-lockfile
pnpm run dev
```

Open the localhost URL printed by the development server. The root route redirects to `/app.html`.

The Cloudflare development integration supplies a local D1 database. The API uses a local preview identity for requests to `localhost` or `127.0.0.1`, and initializes its tables when first needed. Local state is kept in ignored `.wrangler/` files.

No retailer API key or populated environment file is required by the current listing-check implementation. Retailer checks still need an internet connection and may fail when a retailer blocks automated requests.

### Try the app

1. Search the catalog and open a product to review its nutrition, source links, and verification details.
2. Compare alternatives or open one of the budget presets.
3. Add products to the cart and adjust quantities.
4. Refresh a listing to inspect its latest available retailer data.
5. Export a backup before making substantial catalog edits. Importing a backup replaces the catalog and cart currently loaded in the app.

## Storage and hosting

The browser stores catalog/cart state and preferences locally. The `/api/state` endpoint stores catalog and cart JSON, a revision number, and an update timestamp in D1. The `listing_cache` table stores retailer-check results and retry information.

Hosted identity comes from the managed Sites `oai-authenticated-user-id` header. The application expects that header to be supplied by a trusted platform gateway. A standalone deployment needs an equivalent trusted authentication boundary; the repository does not implement an independent sign-up or sign-in system.

The checked-in [`.openai/hosting.json`](.openai/hosting.json) declares the `DB` binding without an account-bound project ID. Use your own Sites deployment and database. SQL migrations are in [`drizzle/`](drizzle/), and the runtime also creates the tables it needs.

Serve the full Worker application when cloud saves and retailer checks are needed. Serving only `public/` provides the frontend assets but does not supply the APIs.

The service worker caches the application shell and skips API requests. Offline use can retain local edits; cloud saving and listing refreshes require connectivity. Browser storage and exports can contain your edited catalog and cart, so use your own private deployment for personal state.

## Retailer synchronization

The backend accepts supported exact HTTPS Aldi and Walmart product URLs. It checks listing identity using name, brand, product form, and package size before the client considers applying a price.

- Batches contain at most 20 items and run two checks concurrently.
- D1 caching, conditional requests, retry backoff, and stale-if-error behavior reduce repeated retailer requests.
- Successful checks normally cache for six hours; out-of-stock and broken listings use separate cache periods.
- Failed checks preserve previously verified data. Low-confidence matches and unusually large price changes are presented for review instead of automatically replacing saved values.

Retailer pages can change markup, redirect, throttle requests, or block automated access. A successful listing check does not establish that a nearby store has the item. Exact purchase links and the retailer's checkout remain the final reference.

See [`DATA_SYNC_AUDIT.md`](DATA_SYNC_AUDIT.md) for the historical implementation review. Its dated catalog counts and prices are snapshots.

## Development commands

| Command | Purpose |
| --- | --- |
| `pnpm run dev` | Start local development |
| `pnpm run build` | Build the Vinext/Worker application |
| `pnpm run start` | Start the built application |
| `pnpm run lint` | Run ESLint |
| `pnpm exec tsc --noEmit` | Check TypeScript |
| `pnpm run audit:data` | Check catalog IDs, links, prices, certifications, and budget references |
| `pnpm run audit:public` | Check public-release content for the script's prohibited patterns |
| `pnpm test` | Build and run routing/application-shell smoke tests |
| `pnpm run db:generate` | Generate a Drizzle migration after schema changes |

Before publishing changes, run:

```sh
pnpm run audit:public
pnpm run audit:data
pnpm run lint
pnpm exec tsc --noEmit
pnpm test
```

CI runs these checks. The tests exercise the built root redirect and the presence of catalog, cart, sync, backup, and PWA components; they do not establish live retailer accuracy or full browser coverage. The public-release check can also use a comma-separated `PUBLIC_RELEASE_DENYLIST` environment variable for private terms that should not be committed.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for data, accessibility, and validation guidance, and [`SECURITY.md`](SECURITY.md) for reporting security concerns. Preserve the distinction between nutritional judgments, independent evidence, and marketing claims when editing products.

## License

Copyright (c) 2026 Good Groceries contributors.

Licensed under the [Apache License, Version 2.0](LICENSE). Third-party packages, product imagery, retailer trademarks, and externally sourced content retain their applicable terms.
