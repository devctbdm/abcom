import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "FuelRide — Fleet, Staff & Fiber Manager",
  description:
    "Manage a company fleet of bikes and cars, staff owners, and optical fiber stock.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
