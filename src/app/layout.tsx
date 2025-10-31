import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/contexts/auth-context";
import { MicrosoftAuthProvider } from "@/contexts/microsoft-auth-context";
import { GoogleAuthProvider } from "@/contexts/google-auth-context";


export const metadata: Metadata = {
  title: "GridMapper",
  description: "Precisely grid uploaded images for coordinate referencing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn("font-body antialiased", "dark")}>
        <AuthProvider>
          <MicrosoftAuthProvider>
            <GoogleAuthProvider>
              <>
                {children}
                <Toaster />
              </>
            </GoogleAuthProvider>
          </MicrosoftAuthProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
