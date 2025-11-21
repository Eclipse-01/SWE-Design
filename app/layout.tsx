import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "IntelliTeach - 智能教学辅助系统",
  description: "基于 Next.js 的企业级 SaaS 教学管理平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider defaultTheme="system" storageKey="intelliteach-ui-theme">
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
