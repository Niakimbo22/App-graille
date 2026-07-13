import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MiamProvider } from "@/context/MiamContext";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const prefix = process.env.GITHUB_PAGES === "true" ? "/App-graille" : "";

export const metadata: Metadata = {
  title: "Miam — ton plan de repas de la semaine",
  description:
    "Miam prépare ton menu de la semaine selon ton budget, tes goûts et ton magasin, et te sort la liste de courses. 100% gratuit.",
  applicationName: "Miam",
  manifest: `${prefix}/manifest.json`,
  icons: {
    icon: [
      { url: `${prefix}/icon.svg`, type: "image/svg+xml" },
      { url: `${prefix}/icon-192.png`, sizes: "192x192", type: "image/png" },
      { url: `${prefix}/icon-512.png`, sizes: "512x512", type: "image/png" },
    ],
    apple: `${prefix}/apple-touch-icon.png`,
  },
  appleWebApp: {
    capable: true,
    title: "Miam",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#1D5A3C",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="miam-bg font-sans">
        <MiamProvider>{children}</MiamProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
