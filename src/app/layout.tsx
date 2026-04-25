"use client";
import { AuthProvider } from '@/src/lib/auth-context';
import { PwaRegister } from '@/src/components/pwa-register';
import './globals.css';

import { useEffect } from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1f2937" media="(prefers-color-scheme: dark)" />
        <meta name="description" content="Smart grocery list management with templates" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Groceries" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" href="/icons/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-gray-50">
        <AuthProvider>
          <PwaRegister />
          {/* Theme toggle now handled in dashboard header for mobile-first layout */}
          {children && typeof children === 'object' &&
            // Clone children to inject theme and toggleTheme as props if possible
            // Otherwise, children will access theme/toggleTheme via context or props drilling
            children
          }
        </AuthProvider>
      </body>
    </html>
  );
}
