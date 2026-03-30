import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import { Toaster } from "react-hot-toast";
import { GAMEBLOC_LOGO_PNG } from "@/lib/gamebloc-logo-path";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gamebloc - Live Sports Chat",
  description:
    "Real-time sports chat platform. Join the conversation during live games across soccer, NCAA, and more.",
  icons: {
    icon: [
      { url: GAMEBLOC_LOGO_PNG, type: "image/png" },
      { url: "/images/logo.svg", type: "image/svg+xml" },
    ],
    apple: GAMEBLOC_LOGO_PNG,
  },
  keywords: [
    "sports",
    "chat",
    "live",
    "soccer",
    "NCAA",
    "Premier League",
    "Champions League",
    "football",
  ],
  openGraph: {
    title: "Gamebloc - Live Sports Chat",
    description:
      "Real-time sports chat platform. Join the conversation during live games.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.className}`}>
      <body className="bg-dark-950 text-white">
        <Providers>
          <Navbar />
          <main className="pt-16 min-h-screen">{children}</main>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#1e293b",
                color: "#f1f5f9",
                border: "1px solid rgba(51, 65, 85, 0.5)",
                borderRadius: "12px",
                fontSize: "14px",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
