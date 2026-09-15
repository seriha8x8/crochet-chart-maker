import { handleYarnSuggestions, type YarnSuggestionsEnv } from "./handleYarnSuggestions";
import type { ExecutionContext } from "./types";

interface Env extends YarnSuggestionsEnv {
  /** The static site itself (out/), bound by the `assets` config in wrangler.jsonc. */
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

/** This site is a static export (see next.config.ts) served via Cloudflare's assets
 *  binding — by default, any request matching a file under out/ is served directly
 *  without ever reaching this worker. Only requests with no matching static asset (like
 *  /api/yarn-suggestions) fall through to here, so this is the one route this handles;
 *  everything else is handed to ASSETS.fetch as a fallback (should rarely actually run). */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/yarn-suggestions") {
      return handleYarnSuggestions(request, env, ctx.waitUntil.bind(ctx));
    }
    return env.ASSETS.fetch(request);
  },
};
