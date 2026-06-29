import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tuition Hours Tracker",
  description: "Track daily tuition hours with weekly and monthly totals."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
