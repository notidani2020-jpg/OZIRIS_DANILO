import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import { AuthProvider } from "@/context/AuthContext";
import { PlayerProvider } from "@/context/PlayerContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import CartDrawer from "@/components/cart/CartDrawer";
import { GlobalAudioPlayer } from "@/components/player";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OZIRIS - Plataforma de Beats y Música",
  description: "Encuentra y compra los mejores beats y producciones musicales.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
              <PlayerProvider>
                {children}
                <CartDrawer />
                <GlobalAudioPlayer />
              </PlayerProvider>
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
