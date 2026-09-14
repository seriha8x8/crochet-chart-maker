import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ColorMatchingTool } from "@/components/colorMatching/ColorMatchingTool";

export const metadata: Metadata = {
  title: "配色マッチング - rii's crochet tools",
};

export default function ColorMatchingPage() {
  return (
    <div className="flex min-h-dvh flex-col" style={{ backgroundColor: "#EAF7F2" }}>
      <SiteHeader current="color-matching" />
      <main className="flex-1">
        <ColorMatchingTool />
      </main>
      <SiteFooter />
    </div>
  );
}
