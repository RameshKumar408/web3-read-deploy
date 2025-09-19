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
        <div className="retro-background">
          <div className="y2k-grid">
            <div className="grid-dots"></div>
            <div className="scanner-lines">
              <div className="scan-line scan-1"></div>
              <div className="scan-line scan-2"></div>
              <div className="scan-line scan-3"></div>
            </div>
          </div>
          <div className="floating-orbs">
            <div className="retro-orb orb-1"></div>
            <div className="retro-orb orb-2"></div>
            <div className="retro-orb orb-3"></div>
          </div>
        </div>
        <ContextProvider cookies={cookies}>{children}</ContextProvider>
      </body>
    </html>
  );
}