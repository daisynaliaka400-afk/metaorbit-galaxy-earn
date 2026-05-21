import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MetaOrbit Galaxy Earn",
  description:
    "Earn, invest, and grow your digital assets in the MetaOrbit Galaxy ecosystem",
  keywords: ["crypto", "earn", "metaverse", "galaxy", "blockchain", "defi"],
  authors: [{ name: "MetaOrbit Team" }],
  openGraph: {
    title: "MetaOrbit Galaxy Earn",
    description:
      "Earn, invest, and grow your digital assets in the MetaOrbit Galaxy ecosystem",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
