import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const requestedHost = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost:3000";
  const host = /^[a-z0-9.-]+(?::\d{1,5})?$/i.test(requestedHost) ? requestedHost : "localhost:3000";
  const requestedProtocol = requestHeaders.get("x-forwarded-proto");
  const protocol = requestedProtocol === "http" || requestedProtocol === "https"
    ? requestedProtocol
    : host.startsWith("localhost")
      ? "http"
      : "https";
  const imageUrl = `${protocol}://${host}/og.png`;
  const description = "A quality-first grocery catalog, budget planner, and retailer-linked cart.";
  return {
    title: "Good Groceries",
    description,
    manifest: "/manifest.webmanifest",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "Good Groceries",
      description,
      images: [{ url: imageUrl, width: 1659, height: 948, alt: "Good Groceries quality-first catalog and cart" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Good Groceries",
      description,
      images: [imageUrl],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
