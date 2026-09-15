/** Minimal local stand-in for @cloudflare/workers-types' PagesFunction, so this directory
 *  doesn't need that package as a dependency just for one type. Shaped to match what
 *  Cloudflare actually passes into a Pages Function handler. */
export interface EventContext<Env> {
  request: Request;
  env: Env;
  params: Record<string, string | string[]>;
  waitUntil: (promise: Promise<unknown>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
}

export type PagesFunction<Env = unknown> = (context: EventContext<Env>) => Response | Promise<Response>;
