import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Lagman Center — халяль кафе в Щучинске",
    template: "%s — Lagman Center",
  },
  description:
    "Лучший лагман в городе, сочный шашлык, ароматный плов и уютная атмосфера. Халяль. Доставка по Щучинску и району, бронирование столов. Ежедневно 10:00–23:00.",
  keywords: [
    "лагман",
    "халяль кафе",
    "Щучинск",
    "шашлык",
    "плов",
    "доставка еды Щучинск",
    "Lagman Center",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${montserrat.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
