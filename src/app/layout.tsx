import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "flag-icons/css/flag-icons.min.css";
import "./globals.css";
import { RealtimeProvider } from "@/hooks/useRealtimeBus";
import { SiteHeader } from "@/components/SiteHeader";
import { AddToHomePrompt } from "@/components/AddToHomePrompt";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "مفيد | توقعات كأس العالم",
  description: "توقع نتائج مباريات كأس العالم مع مفيد وتنافس في لوحة الصدارة",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "توقعات مفيد",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#a23b9d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          // Apply the saved (or system) theme before paint to avoid a flash of the wrong theme.
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();",
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <RealtimeProvider>
          <SiteHeader />
          {children}
          <AddToHomePrompt />
        </RealtimeProvider>
      </body>
    </html>
  );
}
