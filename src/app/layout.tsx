import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import WagmiWrapper from "./WagmiWrapper";

// Font definitions
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "Mystery Room: The Detective's Case",
  description: "An interactive narrative detective game powered by AI. Explore scenes, discover clues, and solve mysteries.",
  keywords: ["detective game", "mystery", "interactive narrative", "AI", "puzzle"],
  authors: [{ name: "Your Name", url: "https://yourportfolio.com" }],
  creator: "Your Name",
  openGraph: {
    title: "Mystery Room: The Detective's Case",
    description: "Solve mysteries using your detective skills in this interactive narrative game.",
    images: [{ url: "/images/og-image.jpg" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-background antialiased font-sans" suppressHydrationWarning>
        <WagmiWrapper>
          <main className="relative flex min-h-screen flex-col">
            {children}
          </main>
          <Toaster position="bottom-right" />
        </WagmiWrapper>
      </body>
    </html>
  );
}
