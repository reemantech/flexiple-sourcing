import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flexiple Sourcing",
  description: "The sourcing refinement loop — free text to a frozen shortlist.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full flex flex-col overflow-hidden">{children}</body>
    </html>
  );
}
