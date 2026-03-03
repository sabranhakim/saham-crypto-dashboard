import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saham & Crypto Dashboard",
  description: "Dashboard realtime saham dan crypto ala TradingView.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
