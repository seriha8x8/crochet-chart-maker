import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t px-4 py-8 text-center text-xs" style={{ borderColor: "#CDEBE1", color: "#7FA99A" }}>
      <Link href="/legal" className="hover:underline">
        利用規約・プライバシーポリシー
      </Link>
    </footer>
  );
}
