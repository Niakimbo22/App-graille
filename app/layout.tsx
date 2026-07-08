import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MiamProvider } from "@/context/MiamContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const prefix = process.env.GITHUB_PAGES === "true" ? "/App-graille" : "";

export const metadata: Metadata = {
  title: "Miam — ton plan de repas de la semaine",
  description:
    "Miam prépare ton menu de la semaine selon ton budget, tes goûts et ton magasin, et te sort la liste de courses. 100% gratuit.",
  manifest: `${prefix}/manifest.json`,
  icons: {
    icon: `${prefix}/icon.svg`,
    apple: `${prefix}/icon.svg`,
  },
};

export const viewport: Viewport = {
  themeColor: "#1D5A3C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="miam-bg font-sans">
        <MiamProvider>{children}</MiamProvider>
      </body>
    </html>
  );
}
