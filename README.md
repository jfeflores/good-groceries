# Good Groceries

Good Groceries is a quality-first grocery catalog and cart for comparing products from Aldi and Walmart. It keeps food priority separate from production verification, shows the evidence behind certifications, and provides direct retailer purchase links without treating marketing language as proof.

## Features

- Search and filter by category, store, food tier, and certification
- Quality and lower-price alternatives for catalog items
- Product nutrition, ingredients, additives, certifications, evidence, and notes
- Emergency 50, Regular 80, and Premium 100 budget carts
- Mini cart and full-page cart with store color coding and sorting
- Live retailer checks with confidence scoring, cache age, and stale-data warnings
- Dark mode, responsive layouts, product imagery, and installable PWA support
- Optional account-backed catalog and cart synchronization on OpenAI Sites
- Local backup export and import

## Data Principles

Food tiers and production grades answer different questions:

- **Food Tier S/A/B** describes nutritional priority within the included model.
- **Verification Grade A/B/C** describes the strength of production, sourcing, and certification evidence.
- Government and independent certifications are recorded separately from retailer or manufacturer marketing claims.
- Live prices and availability are reference data, not guarantees. Final values depend on the retailer session, selected store, fulfillment method, and checkout.

The seeded catalog is designed to be edited. Product records live in `public/data.js` and `public/tier-data.js`; the release audit checks identifiers, retailer links, prices, certifications, and budget totals.

## Privacy

The repository contains no saved carts, account exports, names, email addresses, postal codes, selected-store identifiers, analytics identifiers, credentials, or deployment-specific project IDs.

When deployed privately on OpenAI Sites, cloud state is keyed only by the platform's opaque authenticated-user ID. The application does not read or persist the visitor's email address or full name. Catalog and cart contents are stored in the site's D1 database; local browser storage acts as an offline fallback. Retailers may use their own signed-in session or store selection after a shopper follows a purchase link, but Good Groceries does not store that retailer-session location in the repository.

Before publishing a fork, run `pnpm run audit:public`. You can also supply a comma-separated `PUBLIC_RELEASE_DENYLIST` environment variable to check private terms without committing those terms to the project.

## Local Development

Requirements: Node.js 22.13 or newer and pnpm.

```bash
pnpm install
pnpm run dev
```

The development server uses local D1 state and a local preview identity. Generated state, build output, and local database files are ignored by Git.

## Validation

```bash
pnpm run audit:public
pnpm run audit:data
pnpm run lint
pnpm exec tsc --noEmit
pnpm test
```

## Deployment

The project is configured for OpenAI Sites with a D1 binding named `DB`. The checked-in `.openai/hosting.json` intentionally contains no account-bound project ID, so each fork can create or connect its own deployment. Database migrations are in `drizzle/`.

The retailer synchronization endpoint accepts only exact HTTPS Aldi and Walmart product URLs. It applies request timeouts, response-size limits, bounded concurrency, durable caching, retry backoff, stale-if-error behavior, conditional requests, and identity-confidence checks before updating product data.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Security concerns should follow [SECURITY.md](SECURITY.md).

## License

Released under the [MIT License](LICENSE).
