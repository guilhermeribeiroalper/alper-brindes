import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

// Família secundária do Alper Design System (texto e interface). Pluto, a família de
// títulos, é proprietária e entra antes dela na pilha --font-display quando instalada.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Catálogo de Brindes · Alper",
  description: "Catálogo interno de brindes e solicitações de cotação",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${montserrat.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
