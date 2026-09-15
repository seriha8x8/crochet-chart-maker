import { nearestColorName } from "./colorNames";
import { searchYarnByColorName, type YarnProduct } from "./rakuten";

export interface YarnSuggestionsEnv {
  RAKUTEN_APP_ID?: string;
  /** openapi.rakuten.co.jp's separately-issued "アクセスキー" (pk_...) — distinct from
   *  the legacy アプリID above, which this new gateway no longer accepts as auth. */
  RAKUTEN_ACCESS_KEY?: string;
  RAKUTEN_AFFILIATE_ID?: string;
}

export type ColorSuggestion = { hex: string; products: YarnProduct[]; debug?: string };

const HEX_RE = /^[0-9A-F]{6}$/;
/** 配色マッチング only ever sends its 4 generated colors (A/B/C/D) at once — cap well
 *  above that so a malformed request can't be used to fan out a large batch of searches. */
const MAX_COLORS = 8;
/** Matches the Cache-Control below: keep a resolved color's results for a day so the
 *  same color (there are only ~38 possible names) doesn't re-hit Rakuten on every visit —
 *  this app's free-tier Rakuten quota is requested at the lowest QPS bracket. */
const CACHE_TTL_SECONDS = 60 * 60 * 24;

function parseColors(request: Request): string[] {
  const url = new URL(request.url);
  const raw = url.searchParams.get("colors") ?? "";
  const seen = new Set<string>();
  for (const part of raw.split(",")) {
    const hex = part.trim().replace(/^#/, "").toUpperCase();
    if (HEX_RE.test(hex)) seen.add(hex);
    if (seen.size >= MAX_COLORS) break;
  }
  return Array.from(seen);
}

/** Called from worker/index.ts for GET /api/yarn-suggestions?colors=RRGGBB,...
 *  Resolves each requested hex to a color name, checks the Cache API for that name's
 *  search results before calling Rakuten, and returns one entry per requested hex —
 *  `products: []` when nothing was found (or Rakuten errored), which the frontend
 *  renders as "近い商品が見つかりませんでした" for just that color. */
export async function handleYarnSuggestions(
  request: Request,
  env: YarnSuggestionsEnv,
  waitUntil: (promise: Promise<unknown>) => void,
): Promise<Response> {
  const hexes = parseColors(request);
  if (hexes.length === 0) {
    return Response.json({ results: [] satisfies ColorSuggestion[] }, { status: 400 });
  }
  if (!env.RAKUTEN_APP_ID || !env.RAKUTEN_ACCESS_KEY) {
    console.error("[yarn-suggestions] RAKUTEN_APP_ID or RAKUTEN_ACCESS_KEY is not set");
    return Response.json({ error: "rakuten_not_configured", results: [] }, { status: 500 });
  }

  // Cloudflare's edge cache, keyed by a synthetic per-color-name URL — shared across all
  // visitors hitting this edge location, not per-visitor. `.default` is the Workers Cache
  // API's always-available named cache (not part of the standard DOM CacheStorage type).
  const cache = (caches as unknown as { default: Cache }).default;

  const results = await Promise.all(
    hexes.map(async (hex): Promise<ColorSuggestion> => {
      const colorName = nearestColorName(`#${hex}`);
      // Versioned so a code/behavior change (like no longer caching failures, or the v3
      // fix to nearestColorName's distance metric misclassifying pale purples as gray)
      // can't keep getting masked by entries an older version of this code wrote under
      // the same key.
      const cacheKey = new Request(`https://yarn-suggestions.internal/v3/${encodeURIComponent(colorName)}`);

      const cached = await cache.match(cacheKey);
      if (cached) {
        const products = (await cached.json()) as YarnProduct[];
        return { hex, products };
      }

      const { products, debug } = await searchYarnByColorName(
        colorName,
        env.RAKUTEN_APP_ID!,
        env.RAKUTEN_ACCESS_KEY!,
        env.RAKUTEN_AFFILIATE_ID ?? "",
      );

      // Only cache genuine results — never a failure, or a real fix (e.g. a corrected
      // credential) would stay masked by a cached "not found" for up to a day.
      if (!debug) {
        const toCache = new Response(JSON.stringify(products), {
          headers: {
            "content-type": "application/json",
            "cache-control": `public, max-age=${CACHE_TTL_SECONDS}`,
          },
        });
        waitUntil(cache.put(cacheKey, toCache));
      }

      return debug ? { hex, products, debug } : { hex, products };
    }),
  );

  return Response.json(
    { results },
    { headers: { "cache-control": "no-store" } },
  );
}
