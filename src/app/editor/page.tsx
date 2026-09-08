import type { Metadata } from "next";
import { Editor } from "@/components/editor/Editor";

export const metadata: Metadata = {
  title: "編み図メーカー - rii's crochet tools",
};

export default function EditorPage() {
  return <Editor />;
}
