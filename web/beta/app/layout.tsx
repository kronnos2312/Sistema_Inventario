import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Toast from "@/app/components/base/context/Toast";
import "./globals.css";
import Loader from "./components/base/context/Loader";

const appTitle = process.env.NEXT_PUBLIC_SITE_TITLE || '------';
const appDescription = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || '';
const appLogo = process.env.NEXT_PUBLIC_LOGO || '';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: appTitle, 
  description: appDescription,
   icons: {
    icon: appLogo,        // pestaña del navegador
    shortcut: appLogo,    // acceso directo
    apple: appLogo, // iOS (opcional)
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Loader />
        {children}
        <Toast />
      </body>
    </html>
  );
}
