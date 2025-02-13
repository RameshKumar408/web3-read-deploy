import { headers } from 'next/headers' // added
import './globals.css';

import ContextProvider from '@/context'

export const metadata = {
  title: "AppKit in Next.js + wagmi",
  description: "AppKit example dApp",
};

export default async function RootLayout({ children }) {
  const headersData = await headers();
  const cookies = headersData.get('cookie');

  return (
    <html lang="en">
      <body>
        <ContextProvider cookies={cookies}>{children}</ContextProvider>
      </body>
    </html>
  );
}