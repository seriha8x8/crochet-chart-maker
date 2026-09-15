import { handleYarnSuggestions, type YarnSuggestionsEnv } from "../_lib/handleYarnSuggestions";
import type { PagesFunction } from "../types";

/** GET /api/yarn-suggestions?colors=RRGGBB,RRGGBB,...
 *  Called by 配色マッチング's results view once a palette is generated — looks up yarn
 *  on 楽天市場 for each generated color server-side, so RAKUTEN_APP_ID never reaches the
 *  browser. Set RAKUTEN_APP_ID / RAKUTEN_AFFILIATE_ID as encrypted environment variables
 *  on the Cloudflare Pages project (Settings → Environment variables) — not in this repo. */
export const onRequestGet: PagesFunction<YarnSuggestionsEnv> = (context) =>
  handleYarnSuggestions(context.request, context.env, context.waitUntil);
