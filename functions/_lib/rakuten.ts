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

/** Searches 楽天市場 for yarn matching a color name (already resolved from a generated
 *  palette color — see colorNames.ts). Returns the top 1-2 hits, or [] on no results or
 *  a Rakuten-side error (e.g. rate limit) — the caller falls back to a "not found" card
 *  rather than surfacing an API error to the visitor. */
export async function searchYarnByColorName(
  colorName: string,
  appId: string,
  affiliateId: string,
): Promise<YarnProduct[]> {
  const url = new URL(SEARCH_ENDPOINT);
  url.searchParams.set("format", "json");
  url.searchParams.set("keyword", `${colorName} 毛糸`);
  url.searchParams.set("applicationId", appId);
  if (affiliateId) url.searchParams.set("affiliateId", affiliateId);
  url.searchParams.set("hits", "2");
  url.searchParams.set("imageFlag", "1");

  let res: Response;
  try {
    res = await fetch(url.toString());
  } catch {
    return [];
  }
  if (!res.ok) return [];

  const data = (await res.json()) as RakutenSearchResponse;
  if (data.error || !data.Items) return [];

  return data.Items.map(({ Item }) => ({
    name: Item.itemName,
    price: Item.itemPrice,
    url: Item.affiliateUrl || Item.itemUrl,
    imageUrl: Item.mediumImageUrls?.[0]?.imageUrl ?? null,
    shopName: Item.shopName,
  }));
}
