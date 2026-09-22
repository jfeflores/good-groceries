# Good Groceries Data-Sync Audit

Audit date: 2026-08-13

## Scope

The audit covered the 105-product catalog, exact Aldi and Walmart links, seeded prices and images, certification structure, budget references, client-to-server request behavior, retailer response parsing, failure handling, caching, and cross-device state persistence.

## Problems Found

1. The original retailer service existed only on the local computer, so deployed static hosting could not refresh prices, availability, ingredients, or images.
2. Catalog edits, favorites, and the virtual cart were authoritative only in browser storage and could not follow the same shopper to another device.
3. A full refresh made roughly one browser request per product. The five-minute in-memory cache disappeared whenever the server restarted and did not deduplicate concurrent checks.
4. Temporary redirects, throttling, and retailer parser failures had no retry schedule or stale-data fallback.
5. Product matching relied mainly on title-token overlap. It did not separately compare brand or package size before applying a live price.
6. Successful and failed attempts shared a single timestamp, making freshness hard to interpret.
7. Twelve optional products had exact first-party links but no seed price, so price sorting and cart totals were incomplete until a live pull succeeded.
8. No repeatable release audit checked duplicate ids, exact-link shape, certification completeness, price validity, budget integrity, or duplicate retailer URLs.

## Remediation Implemented

- Moved retailer inspection to a hosted server route and restricted it to exact HTTPS Aldi and Walmart product paths.
- Added private account-backed catalog and cart persistence with revision conflict detection. Browser storage remains an offline cache rather than the only copy.
- Added an installable application shell and service worker. Static application assets work offline; retailer checks and cloud saves resume when connectivity returns.
- Replaced 105 individual bulk-refresh requests with batches of up to 20 products. The client now needs six hosted requests for the 105-product catalog.
- Limited server-side retailer concurrency to two requests per batch and deduplicated identical in-flight listing checks.
- Added durable listing cache keys based on retailer item identity rather than the full tracking URL.
- Added six-hour success caching, two-hour out-of-stock caching, 24-hour broken-link caching, seven-day stale-if-error retention, conditional `ETag`/`Last-Modified` requests, and exponential retry backoff from five minutes to six hours.
- Added manual redirect validation, response-size and content-type limits, timeouts, and explicit handling for 404/410, 429, anti-bot redirects, and malformed structured data.
- Added separate name, brand, product-form, and package-size checks. The sync result now records a score, confidence level, reasons, source method, cache age, and stale-data state.
- Live prices are applied only for a matched first-party listing with high identity confidence, USD currency, compatible unit semantics, and no change larger than 60 percent from the saved value. Suspicious values are shown for review without overwriting the catalog.
- Failed checks preserve the last verified data and timestamp. A separate attempt time records the failure.
- Filled all twelve missing seed prices from current first-party Walmart listings and retained exact product links for future refreshes.
- Added `scripts/audit-data.mjs` as a deterministic release audit.

## Current Audit Result

- Products: 105
- Exact Aldi/Walmart product links: 105
- Seeded exact-listing images: 79
- Products with recorded credible certifications: 41
- Choice coverage: 43 quality, 48 cheapest, 10 best-of-both, 4 optional
- Emergency 50: $48.70, $1.30 below target
- Regular 80: $78.03, $1.97 below target
- Premium 100: $98.58, $1.42 below target
- Static catalog errors: 0

## Remaining External Limits

Retailer pages are not stable data contracts and can change markup or temporarily block automated requests. Walmart's documented Marketplace APIs require seller or approved solution-provider credentials and focus on managing a seller's own items, prices, and inventory rather than exposing a shopper's local consumer catalog. The app therefore keeps exact Buy links and last-verified data as the dependable fallback instead of presenting temporary parser failures as product failures.

Local shelf inventory and final checkout price still depend on the store and fulfillment method selected at the retailer. A successful web-listing check is evidence that the exact listing currently exists; it is not proof that a selected nearby store has the item on the shelf.

## Public-Release Privacy Audit

The public release removes account-bound deployment identifiers, author identity from repository history, location-bound retailer parameters, city-specific availability notes, saved browser or database state, generated local build artifacts, and unused code that could read visitor names or email addresses. `scripts/audit-public-release.mjs` provides a repeatable check before future releases.

A follow-up privacy sweep on 2026-09-22 removed remaining conversational attribution and default favorite/exclusion preferences, normalized release commit metadata to UTC, and expanded the release check to reject personal conversation references and preselected favorites. The review also covered all Git objects, image metadata, retailer URL parameters, and public repository metadata. The sample catalog and budget presets remain generic editable examples.

Official Walmart API context:

- https://developer.walmart.com/us-marketplace/docs/introduction-to-marketplace-apis
- https://developer.walmart.com/global-marketplace/reference/getanitem
