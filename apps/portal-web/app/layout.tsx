import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "BenchOS Portal",
  description: "Secure access to consultancy recruitment operations",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

