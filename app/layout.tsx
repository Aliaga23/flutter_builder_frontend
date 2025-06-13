import type React from "react"
import type { Metadata } from "next"
import { oswald } from "@/lib/fonts"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

export const metadata: Metadata = {
  title: "Flutter UI Builder",
  description: "Professional drag and drop Flutter UI builder with AI assistance",
  generator : "Nextjs",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${oswald.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
