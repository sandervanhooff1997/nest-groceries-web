"use client";
import { AuthProvider } from '@/src/lib/auth-context';
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
      <body className="bg-gray-50">
        <AuthProvider>
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
