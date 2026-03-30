/**
 * Types for the SEO dashboard feature
 *
 * SeoSettings  — global site-wide SEO configuration stored as key/value pairs
 * PageSeoData  — per-page SEO fields returned by the pages API
 * SeoScore     — computed score breakdown for a single page
 */

// ---------------------------------------------------------------------------
// Global SEO settings
// ---------------------------------------------------------------------------

/**
 * Record of all global SEO settings managed from the SEO dashboard.
 *
 * Fields that represent arrays (robots_disallow_paths, social_profiles) are
 * stored as serialised JSON strings in the backend and must be parsed before
 * use in components.
 *
 * Fields that represent booleans (allow_indexing, sitemap_enabled) are stored
 * as the string literals "true" | "false" because the settings key/value store
 * keeps every value as a string.
 */
export interface SeoSettings {
  /** Human-readable name of the site, e.g. "ImagiQ" */
  site_name: string;

  /** Canonical base URL of the site, e.g. "https://imagiq.co" */
  site_url: string;

  /**
   * Printf-style title template applied to every page.
   * Use %s as placeholder for the page title, e.g. "%s | ImagiQ"
   */
  title_template: string;

  /** Fallback <title> when a page has no specific title */
  default_title: string;

  /** Fallback <meta name="description"> when a page has no specific description */
  default_description: string;

  /** Absolute URL for the default Open Graph image */
  default_og_image: string;

  /** Google Search Console verification meta content value */
  google_verification: string;

  /**
   * JSON-serialised string array of paths to include in a Disallow rule in
   * robots.txt, e.g. '["/admin", "/checkout"]'
   */
  robots_disallow_paths: string;

  /**
   * Policy applied to known AI / LLM crawlers via robots.txt.
   * - allow_all        : no special restrictions
   * - block_training   : block crawlers that harvest data for model training
   * - block_all        : block all AI crawlers regardless of purpose
   */
  ai_crawlers_policy: "allow_all" | "block_training" | "block_all";

  /**
   * JSON-serialised string array of social profile URLs used for structured
   * data (Schema.org sameAs), e.g. '["https://twitter.com/imagiq"]'
   */
  social_profiles: string;

  /**
   * Whether the site should be indexed by search engines.
   * Stored as a string because the settings store is key/value with string values.
   */
  allow_indexing: "true" | "false";

  /**
   * Whether sitemap.xml generation is enabled.
   * Stored as a string for the same reason as allow_indexing.
   */
  sitemap_enabled: "true" | "false";
}

// ---------------------------------------------------------------------------
// Per-page SEO data
// ---------------------------------------------------------------------------

/** Status values matching those already used across the pages system */
export type PageSeoStatus = "draft" | "published" | "scheduled" | "archived";

/**
 * SEO-relevant fields for a single page, extracted from the full Page object
 * returned by GET /api/multimedia/pages.
 *
 * All optional fields reflect that pages may not have SEO metadata populated.
 */
export interface PageSeoData {
  /** URL slug that uniquely identifies the page, e.g. "promo-verano-2026" */
  slug: string;

  /** Internal display title of the page */
  title: string;

  /** <title> tag content; falls back to SeoSettings.title_template when absent */
  meta_title?: string;

  /** <meta name="description"> content */
  meta_description?: string;

  /** Comma-separated keywords for <meta name="keywords"> */
  meta_keywords?: string;

  /** Absolute URL for the page-level Open Graph image */
  og_image?: string;

  /** Open Graph title override (<meta property="og:title">) */
  seo_og_title?: string;

  /** Open Graph description override (<meta property="og:description">) */
  seo_og_description?: string;

  /**
   * Canonical URL for this page (<link rel="canonical">).
   * When empty the canonical defaults to site_url + slug.
   */
  seo_canonical?: string;

  /**
   * When true, adds "noindex" to the robots meta tag for this page.
   * Stored as a boolean (unlike the global allow_indexing setting).
   */
  seo_no_index: boolean;

  /**
   * When true, adds "nofollow" to the robots meta tag for this page.
   */
  seo_no_follow: boolean;

  /**
   * Whether this page should appear in sitemap.xml.
   * Only meaningful when SeoSettings.sitemap_enabled is "true".
   */
  include_in_sitemap: boolean;

  /** ISO 8601 timestamp of the last update; used as <lastmod> in the sitemap */
  updated_at: string;

  /**
   * Functional category of the page, e.g. "promo", "landing", "category".
   * Used to group pages in the SEO dashboard table.
   */
  page_type?: string;

  /** Current publication status */
  status: PageSeoStatus;
}

// ---------------------------------------------------------------------------
// Computed SEO score
// ---------------------------------------------------------------------------

/** Individual check within an SEO score audit */
export interface SeoScoreCheck {
  /** Short identifier for the check, e.g. "meta_title_length" */
  id: string;

  /** Human-readable label shown in the dashboard */
  label: string;

  /** Whether the check passed */
  passed: boolean;

  /** Optional contextual message explaining the result */
  message?: string;

  /**
   * Relative importance of this check.
   * - critical : directly harms indexability or CTR
   * - major    : significant impact on ranking
   * - minor    : best-practice improvement
   */
  severity: "critical" | "major" | "minor";
}

/**
 * Computed SEO score for a single page.
 *
 * The overall score is a 0-100 integer derived by weighting each check result
 * against its severity. Consumer code should compute this from the checks array
 * rather than trusting a cached value.
 */
export interface SeoScore {
  /** Slug of the page this score belongs to */
  slug: string;

  /** Weighted score from 0 (worst) to 100 (best) */
  score: number;

  /**
   * Qualitative rating bucket derived from the score:
   * - poor    : 0–49
   * - needs_improvement : 50–79
   * - good    : 80–100
   */
  rating: "poor" | "needs_improvement" | "good";

  /** Ordered list of individual SEO checks with their pass/fail status */
  checks: SeoScoreCheck[];

  /** ISO 8601 timestamp of when this score was computed */
  computed_at: string;
}
