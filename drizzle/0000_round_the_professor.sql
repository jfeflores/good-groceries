CREATE TABLE `app_state` (
	`user_id` text PRIMARY KEY NOT NULL,
	`catalog_json` text DEFAULT '' NOT NULL,
	`cart_json` text DEFAULT '{}' NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `listing_cache` (
	`cache_key` text PRIMARY KEY NOT NULL,
	`retailer` text NOT NULL,
	`request_url` text NOT NULL,
	`response_json` text DEFAULT '' NOT NULL,
	`outcome` text DEFAULT 'unchecked' NOT NULL,
	`fetched_at` integer DEFAULT 0 NOT NULL,
	`expires_at` integer DEFAULT 0 NOT NULL,
	`stale_until` integer DEFAULT 0 NOT NULL,
	`next_retry_at` integer DEFAULT 0 NOT NULL,
	`failure_count` integer DEFAULT 0 NOT NULL,
	`etag` text DEFAULT '' NOT NULL,
	`last_modified` text DEFAULT '' NOT NULL,
	`last_error` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_listing_cache_expires_at` ON `listing_cache` (`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_listing_cache_retry` ON `listing_cache` (`next_retry_at`) WHERE "listing_cache"."next_retry_at" > 0;