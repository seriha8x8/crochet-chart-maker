import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CounterTool } from "@/components/counter/CounterTool";

export const metadata: Metadata = {
  title: "カウンター - rii's crochet tools",
  description: "かぎ針編み・棒針編みの段数や目数をタップでカウントできる無料ツール。名前を自由に変更できるカウンターを複数作成できます。",
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
