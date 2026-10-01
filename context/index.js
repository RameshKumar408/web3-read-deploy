'use client'

import { wagmiAdapter, projectId, networks } from '@/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import React from 'react'
import { cookieToInitialState, WagmiProvider } from 'wagmi'

import { GoogleOAuthProvider } from "@react-oauth/google";

// Set up queryClient
const queryClient = new QueryClient()

// Set up metadata
const metadata = {
    name: 'HashMint',
    description: 'ERC-20 token minting',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://hashmint.app',
    icons: []
}

// Create the modal
export const modal = createAppKit({
    adapters: [wagmiAdapter],
    networks: networks,
    projectId,
    metadata,
    enableWalletConnect: true,
    features: {
        analytics: true, // Optional - defaults to your Cloud configuration
        socials: [],
        email: false
    }
})


function ContextProvider({ children, cookies }) {
    const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig, cookies)
    const clientId = "238109330243-jlktg1vog7d540gi5gbr1vmok5725ntn.apps.googleusercontent.com";
    return (
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GCLIENT_ID}>
            <WagmiProvider config={wagmiAdapter.wagmiConfig} initialState={initialState}>
                <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
            </WagmiProvider>
        </GoogleOAuthProvider>
    )
}

export default ContextProvider
