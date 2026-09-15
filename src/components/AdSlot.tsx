"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** The one ad unit currently in use (横長ディスプレイ), reused at every placement. */
export const AD_SLOT_HORIZONTAL = "6746693519";

/** One AdSense ad unit. The loader script (`adsbygoogle.js`) is already loaded once,
 *  sitewide, from the root layout — this only renders the <ins> and requests that this
 *  particular slot be filled. Done via useEffect (not a literal inline <script>) so it
 *  still fires after a client-side route change, not just the very first page load. */
export function AdSlot({ slot, className = "" }: { slot: string; className?: string }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script blocked (ad blocker, offline) or not yet loaded — nothing to recover from.
    }
  }, []);

  return (
    <ins
      className={`adsbygoogle block ${className}`}
      style={{ display: "block" }}
      data-ad-client="ca-pub-2416295212272294"
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
