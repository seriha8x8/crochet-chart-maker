"use client";

import { useEffect, useState } from "react";
import { getYarnAppPlan } from "@/lib/yarn/data";
import type { YarnPlan } from "@/lib/yarn/types";

export function useYarnPlan(userId: string): YarnPlan | undefined {
  const [plan, setPlan] = useState<YarnPlan | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getYarnAppPlan(userId)
      .then((p) => {
        if (!cancelled) setPlan(p);
      })
      .catch(() => {
        // Network hiccup: fail closed to "free" rather than leaving the page stuck loading.
        if (!cancelled) setPlan("free");
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return plan;
}
