'use client'
import { Fragment, useEffect, useState } from "react";
import { useAppKit } from '@reown/appkit/react'
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import Button from '@mui/material/Button';
import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();
    const { open } = useAppKit()
    const { address, isConnected, caipAddress } = useAppKitAccount()
    const { chainId } = useAppKitNetwork()


    return (
        <Fragment>
            <div style={{ textAlign: 'center' }}  >
                <h1>Web3 Products</h1>
                <div>
                    {/* <Button variant="outlined" style={{ color: 'black', borderColor: "black" }} onClick={handleConnectWallet} >Connect TON Wallet</Button> */}
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
