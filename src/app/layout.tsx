import type { Metadata } from 'next';
import { AuthProvider } from '@/src/lib/auth-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nest Groceries - Shopping List Manager',
  description: 'Manage your shopping lists efficiently',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

