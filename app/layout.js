import { headers } from 'next/headers' // added
import './globals.css';

import ContextProvider from '@/context'

export const metadata = {
  title: "HashMint | ERC-20 Token Creator",
  description: "Create and deploy ERC-20 tokens on Ethereum, BNB Smart Chain, and Polygon.",
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
