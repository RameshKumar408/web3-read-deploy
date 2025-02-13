import { cookieStorage, createStorage } from 'wagmi'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { polygon, mainnet, bscTestnet, bsc, polygonAmoy, sepolia } from '@reown/appkit/networks'

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECTID // this is a public projectId only to use on localhost

if (!projectId) {
    throw new Error('Project ID is not defined')
}

export const networks = [polygon, mainnet, bscTestnet, bsc, polygonAmoy, sepolia]

// Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
    storage: createStorage({
        storage: cookieStorage
    }),
    ssr: true,
    projectId,
    networks
})

export const config = wagmiAdapter.wagmiConfig