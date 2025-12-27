import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
const inter = Inter({ subsets: ["latin"] });
export const metadata: Metadata = {
  title: "Welth",
  description: "One stop solution for all your needs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className} bg-background text-foreground`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* Header */}
            <Header />

            <main className="min-h-screen">{children}</main>
            <Toaster />
            {/* Footer */}
            <footer className="border-t border-border bg-card py-12">
              <div className="container mx-auto px-4 text-center text-muted-foreground">
                <p>~ Made by Rishi</p>
              </div>
            </footer>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
