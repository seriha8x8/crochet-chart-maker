import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "rii's crochet tools",
  description: "編み物がもっと楽しくなる！編み物好きのための便利ツール",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full">
        {/* Plain literal <script> (not next/script) so this is a real, static
            <script src> tag in the server-rendered HTML — Google's AdSense
            site-verification crawler checks the raw response body and doesn't
            necessarily execute the JS that next/script relies on to inject it. */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2416295212272294"
          crossOrigin="anonymous"
        />
        {children}
      </body>
    </html>
  );
}
