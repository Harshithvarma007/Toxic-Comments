import type React from "react"
import type { Metadata } from "next"
import { Inter_Tight, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SidebarNav } from "@/components/sidebar-nav"
import "./globals.css"

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "N Sai Harshith Varma - Portfolio",
  description: "Data Scientist | Product Analytics | AI Engineer | BI Developer",
  icons: {
    icon: "Black Simple Personal Logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${interTight.variable} ${geistMono.variable} font-sans antialiased bg-[#050505] text-white`}>
        {/* Ambient glowing gradients (Global) */}
        <div className="fixed left-1/4 top-1/4 size-96 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-blue-500 opacity-20 blur-[120px] pointer-events-none" />
        <div
          className="fixed right-1/4 top-3/4 size-96 translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-violet-600 opacity-20 blur-[120px] pointer-events-none"
          style={{ animationDelay: "1s" }}
        />

        {/* Layout Container: Flex column on mobile, Flex row on desktop */}
        <div className="relative min-h-screen flex flex-col md:flex-row">
          <SidebarNav />
          
          {/* Main Content Area 
              - md:ml-64: Pushes content right on desktop to make room for fixed sidebar
              - pt-20: Adds top padding on mobile to account for the fixed mobile header
              - md:pt-8: Standard top padding on desktop
          */}
          <main className="flex-1 md:ml-64 p-4 pt-20 md:p-8 md:pt-8 relative z-10">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
        
        <Analytics />
      </body>
    </html>
  )
}