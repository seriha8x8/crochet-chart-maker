"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function YarnRootPage() {
  const router = useRouter();

  useEffect(() => {
    // The yarns list itself now handles both signed-in and signed-out visitors, so there's
    // no need to resolve auth state here first.
    router.replace("/yarn/yarns");
  }, [router]);

  return <p className="px-4 py-10 text-center text-sm text-stone-500">読み込み中…</p>;
}
