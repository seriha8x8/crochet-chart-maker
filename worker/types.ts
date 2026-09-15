/** Minimal local stand-in for @cloudflare/workers-types' ExecutionContext, so this
 *  directory doesn't need that package as a dependency just for one type. */
export interface ExecutionContext {
  waitUntil: (promise: Promise<unknown>) => void;
  passThroughOnException: () => void;
}
