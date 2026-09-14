import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CounterTool } from "@/components/counter/CounterTool";

export const metadata: Metadata = {
  title: "編み物カウンター - rii's crochet tools",
};

export default function CounterPage() {
  return (
    <div className="flex min-h-dvh flex-col" style={{ backgroundColor: "#EAF7F2" }}>
      <SiteHeader current="counter" />
      <main className="flex-1">
        <CounterTool />
      </main>
      <SiteFooter />
    </div>
  );
}
