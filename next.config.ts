import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: this app is entirely client-side (no API routes,
  // no server actions, Supabase auth uses the browser client), so it
  // ships as plain static files — deployable to Cloudflare Pages by
  // pointing the build output directory at `out`.
  output: "export",
};

export default nextConfig;
