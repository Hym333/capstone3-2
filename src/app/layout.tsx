// app/layout.tsx
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import SocketProvider from "../../providers/SocketProvide";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Video Conference App",
  description: "A video conferencing application with meeting summary feature",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={cn(inter.className, 'relative')}>
          <SocketProvider>
          {children}
          </SocketProvider>
          </body>
      </html>
    </ClerkProvider>
  );
}
