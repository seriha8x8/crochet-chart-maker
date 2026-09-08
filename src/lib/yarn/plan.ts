import type { YarnPlan } from "@/lib/yarn/types";

// No payment processing yet. Free plan caps yarns/projects at one photo each;
// this is the single place a future Stripe entitlement check plugs in.
export const FREE_PLAN_PHOTO_LIMIT = 1;

export function canAddPhoto(plan: YarnPlan, currentPhotoCount: number): boolean {
  if (plan === "premium") return true;
  return currentPhotoCount < FREE_PLAN_PHOTO_LIMIT;
}
