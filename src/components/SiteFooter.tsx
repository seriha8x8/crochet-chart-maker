import Link from "next/link";

/** `compact` trims the padding for space-constrained layouts (e.g. the editor's
 *  fixed-height canvas view) while keeping the same link everywhere else gets. */
export function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer
      className={`shrink-0 border-t text-center text-xs ${compact ? "px-4 py-2" : "px-4 py-8"}`}
      style={{ borderColor: "#CDEBE1", color: "#7FA99A" }}
    >
      <Link href="/legal" className="hover:underline">
        利用規約・プライバシーポリシー
      </Link>
    </footer>
  );
}
