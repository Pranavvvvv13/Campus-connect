import type { Metadata } from "next";
import "./globals.css";
import "./spatial.css";
import "./spatial-theme.css";
import "./vision-workspace.css";

export const metadata: Metadata = {
  title: "CampusConnect | University Portal",
  description: "A secure university hub for portfolios, research, clubs and opportunities.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
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
