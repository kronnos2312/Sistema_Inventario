import type { Metadata } from "next";
import { cache } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Toast from "@/app/components/base/context/Toast";
import "./globals.css";
import Loader from "./components/base/context/Loader";

const appTitle = process.env.NEXT_PUBLIC_SITE_TITLE || '------';
const appDescription = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || '';

// cache() deduplica llamadas dentro de la misma request (no entre requests)
const resolveLogoUrl = cache(async (): Promise<string> => {
  try {
    const api = process.env.INTERNAL_API_URL || 'http://backend:8080';
    const res = await fetch(`${api}/files/config/logo`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data?.url) return `/api-proxy${data.url}`;
    }
  } catch { /* backend no disponible, usar fallback */ }
  return process.env.NEXT_PUBLIC_LOGO || '/logo/logo.png';
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const appLogo = await resolveLogoUrl();
  return {
    title: appTitle,
    description: appDescription,
    icons: {
      icon: appLogo,
      shortcut: appLogo,
      apple: appLogo,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const appLogo = await resolveLogoUrl();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* Se inyecta en cada carga de página para que useLogo tome el valor actual */}
        <script dangerouslySetInnerHTML={{ __html: `window.__LOGO_URL__=${JSON.stringify(appLogo)}` }} />
        <Loader />
        {children}
        <Toast />
      </body>
    </html>
  );
}
