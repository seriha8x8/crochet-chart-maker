import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RelatedAppsNav } from "@/components/yarn/RelatedAppsNav";
import { AdSlot, AD_SLOT_HORIZONTAL } from "@/components/AdSlot";

export const metadata: Metadata = {
  title: "作品管理 - rii's crochet tools",
};

export default function WorksLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col" style={{ backgroundColor: "#EAF7F2" }}>
      <SiteHeader current="works" />
      <RelatedAppsNav current="works" />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        {children}
        <AdSlot slot={AD_SLOT_HORIZONTAL} className="mt-10" />
      </main>
      <SiteFooter />
    </div>
  );
}
