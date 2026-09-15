export type YarnProduct = {
  name: string;
  price: number;
  url: string;
  imageUrl: string | null;
  shopName: string;
};

const SEARCH_ENDPOINT = "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601";

type RakutenItem = {
  itemName: string;
  itemPrice: number;
  itemUrl: string;
  affiliateUrl?: string;
  shopName: string;
  mediumImageUrls?: { imageUrl: string }[];
};

type RakutenSearchResponse = {
  Items?: { Item: RakutenItem }[];
  error?: string;
  error_description?: string;
};

export type SearchResult = {
  products: YarnProduct[];
  /** Set only when products is empty for a reason other than a genuine 0-hit search —
   *  surfaced in the API response (not just console.error) so it's visible straight from
   *  the browser's Network tab without needing to dig through Cloudflare's Logs UI. Remove
   *  this once "見つかりませんでした" is confirmed to only ever mean a genuine 0 hits. */
  debug?: string;
};

/** Searches 楽天市場 for yarn matching a color name (already resolved from a generated
 *  palette color — see colorNames.ts). Returns the top 1-2 hits, or [] on no results or
 *  a Rakuten-side error (e.g. rate limit) — the caller falls back to a "not found" card
 *  rather than surfacing an API error to the visitor. */
export async function searchYarnByColorName(
  colorName: string,
  appId: string,
  affiliateId: string,
): Promise<SearchResult> {
  // Trim defensively — a stray leading/trailing space or newline from copy-pasting the
  // value into Cloudflare's dashboard is enough for Rakuten to reject it as invalid.
  const trimmedAppId = appId.trim();
  const trimmedAffiliateId = affiliateId.trim();

  const url = new URL(SEARCH_ENDPOINT);
  url.searchParams.set("format", "json");
  url.searchParams.set("keyword", `${colorName} 毛糸`);
  url.searchParams.set("applicationId", trimmedAppId);
  if (trimmedAffiliateId) url.searchParams.set("affiliateId", trimmedAffiliateId);
  url.searchParams.set("hits", "2");
  url.searchParams.set("imageFlag", "1");

  let res: Response;
  try {
    res = await fetch(url.toString());
  } catch (err) {
    const debug = `fetch failed: ${String(err)}`;
    console.error("[rakuten]", debug);
    return { products: [], debug };
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const debug = `http ${res.status}: ${body.slice(0, 400)}`;
    console.error("[rakuten]", debug);
    return { products: [], debug };
  }

  const data = (await res.json()) as RakutenSearchResponse;
  if (data.error) {
    const debug = `rakuten error: ${data.error} — ${data.error_description ?? ""}`;
    console.error("[rakuten]", debug);
    return { products: [], debug };
  }
  if (!data.Items) {
    return { products: [], debug: "response had no Items field" };
  }

  return {
    products: data.Items.map(({ Item }) => ({
      name: Item.itemName,
      price: Item.itemPrice,
      url: Item.affiliateUrl || Item.itemUrl,
      imageUrl: Item.mediumImageUrls?.[0]?.imageUrl ?? null,
      shopName: Item.shopName,
    })),
  };
}
