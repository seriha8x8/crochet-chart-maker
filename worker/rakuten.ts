export type YarnProduct = {
  name: string;
  price: number;
  url: string;
  imageUrl: string | null;
  shopName: string;
};

// Rakuten moved this API off app.rakuten.co.jp/services/api/... (what this pointed at
// before, and what every request was failing against) to a new gateway host/path, dated
// into the URL itself — per the current docs, 2026-07-01 is the live version.
const SEARCH_ENDPOINT = "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701";

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
/** Never the raw secret — just enough to eyeball in a debug message whether the value
 *  Cloudflare handed us actually looks like the one that was pasted in (right length,
 *  right start/end), without echoing the whole thing back. */
function maskedPreview(value: string): string {
  if (value.length <= 8) return `len=${value.length}`;
  return `len=${value.length} preview=${value.slice(0, 4)}…${value.slice(-4)}`;
}

export async function searchYarnByColorName(
  colorName: string,
  appId: string,
  accessKey: string,
  affiliateId: string,
): Promise<SearchResult> {
  // Trim defensively — a stray leading/trailing space or newline from copy-pasting the
  // value into Cloudflare's dashboard is enough for Rakuten to reject it as invalid.
  const trimmedAppId = appId.trim();
  const trimmedAccessKey = accessKey.trim();
  const trimmedAffiliateId = affiliateId.trim();
  const credentialInfo = `[accessKey ${maskedPreview(trimmedAccessKey)}]`;

  const url = new URL(SEARCH_ENDPOINT);
  url.searchParams.set("format", "json");
  url.searchParams.set("keyword", `${colorName} 毛糸`);
  // openapi.rakuten.co.jp's gateway auth is the separately-issued "アクセスキー" (pk_...),
  // not the legacy アプリID — applicationId is still sent alongside since the response
  // payload itself is still shaped around the classic IchibaItem Search API.
  url.searchParams.set("accessKey", trimmedAccessKey);
  url.searchParams.set("applicationId", trimmedAppId);
  if (trimmedAffiliateId) url.searchParams.set("affiliateId", trimmedAffiliateId);
  url.searchParams.set("hits", "2");
  url.searchParams.set("imageFlag", "1");

  let res: Response;
  try {
    // This access key was originally registered as a "Webアプリケーション" (Referer-checked),
    // and a Cloudflare Worker's fetch() turned out unable to make that check pass no matter
    // how the Referer was set — headers, `referrer`, and `referrer`+`referrerPolicy` all
    // produced the identical error against production. Workers apparently never transmits a
    // custom Referer to the upstream origin. Re-registering the same app as
    // "API/バックエンドサービス" switched it to IP allowlisting instead (Cloudflare's published
    // edge ranges are now registered on the Rakuten side), which needs nothing special here.
    res = await fetch(url.toString());
  } catch (err) {
    const debug = `fetch failed: ${String(err)} ${credentialInfo}`;
    console.error("[rakuten]", debug);
    return { products: [], debug };
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const debug = `http ${res.status}: ${body.slice(0, 400)} ${credentialInfo}`;
    console.error("[rakuten]", debug);
    return { products: [], debug };
  }

  const data = (await res.json()) as RakutenSearchResponse;
  if (data.error) {
    const debug = `rakuten error: ${data.error} — ${data.error_description ?? ""} ${credentialInfo}`;
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
