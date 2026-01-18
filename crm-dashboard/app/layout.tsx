import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EventGaraget CRM",
  description: "CRM Portal för EventGaraget",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}

