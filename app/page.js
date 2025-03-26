'use client'
import { Fragment, useEffect } from "react";
import { useAppKit } from '@reown/appkit/react'
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import Button from '@mui/material/Button';
import { useRouter } from "next/navigation";
import { TonConnectUI } from "@tonconnect/ui";


export default function Home() {
    const router = useRouter();
    const { open } = useAppKit()
    const { address, isConnected, caipAddress } = useAppKitAccount()
    const { chainId } = useAppKitNetwork()
    var tonConnectUI

    useEffect(() => {
        // Initialize TON Connect UI
        tonConnectUI = new TonConnectUI({
            manifestUrl: 'https://web3deploy.netlify.app/api/manifest'
        });

    }, []);

    const handleConnectWallet = async () => {
        // setStatus("Connecting...");
        // Trigger the TON Connect UI to request wallet connection
        try {
            await tonConnectUI.openModal();
        } catch (error) {
            // setStatus("Connection failed");
            console.error("Error connecting to wallet: ", error);
        }
    };


    return (
        <Fragment>
            <div style={{ textAlign: 'center' }}  >
                <h1>Web3 Products</h1>
                <div>
                    <Button variant="outlined" style={{ color: 'black', borderColor: "black" }} onClick={handleConnectWallet} >Connect TON Wallet</Button>
                    {
                        isConnected == false &&
                        <Button variant="outlined" style={{ color: 'black', borderColor: "black" }} onClick={() => { open() }} >Connect Wallet</Button>
                    }

                    {
                        isConnected == true &&
                        <Fragment>
                            Address: <h3>{address}</h3>
                            ChainId: <h4>{chainId}</h4>
                            <Button variant="outlined" style={{ color: 'black', borderColor: "black" }} onClick={() => { router.push('/erc20Deploy') }} >Token Creation</Button>
                            <Button variant="outlined" style={{ color: 'black', borderColor: "black" }} onClick={() => { router.push('/tokenDetails') }} >Token Details</Button>
                        </Fragment>
                    }
                </div>
            </div>
        </Fragment>
    )
}
