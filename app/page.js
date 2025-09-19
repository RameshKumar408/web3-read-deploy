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
                <h1 className="title-neon" >WEB3 PRODUCTS</h1>
                <div>
                    {/* <Button variant="outlined" style={{ color: 'black', borderColor: "black" }} onClick={handleConnectWallet} >Connect TON Wallet</Button> */}
                    {
                        isConnected == false &&
                        <Button style={{ width: "200px", height: "45px", color: "white" }} onClick={() => { open() }} >
                            <div className="button-chrome"></div>
                            <span className="button-text">CONNECT WALLET</span>
                            <div className="button-loader">
                                <div className="y2k-spinner">
                                    <div className="spinner-ring ring-1"></div>
                                    <div className="spinner-ring ring-2"></div>
                                    <div className="spinner-ring ring-3"></div>
                                </div>
                            </div>
                            <div className="button-hologram"></div>

                        </Button>
                    }

                    {
                        isConnected == true &&
                        <div style={{ color: "white" }}>
                            Address: <h3>{address}</h3>
                            ChainId: <h4>{chainId}</h4>
                            <Button style={{ width: "200px", height: "45px", color: "white" }} onClick={() => { router.push('/erc20Deploy') }} >


                                <div className="button-chrome"></div>
                                <span className="button-text"> Token Creation</span>
                                <div className="button-loader">
                                    <div className="y2k-spinner">
                                        <div className="spinner-ring ring-1"></div>
                                        <div className="spinner-ring ring-2"></div>
                                        <div className="spinner-ring ring-3"></div>
                                    </div>
                                </div>
                                <div className="button-hologram"></div>

                            </Button>
                            {"    "}
                            <Button style={{ width: "200px", height: "45px", color: "white" }} onClick={() => { router.push('/tokenDetails') }} >


                                <div className="button-chrome"></div>
                                <span className="button-text">  Token Details</span>
                                <div className="button-loader">
                                    <div className="y2k-spinner">
                                        <div className="spinner-ring ring-1"></div>
                                        <div className="spinner-ring ring-2"></div>
                                        <div className="spinner-ring ring-3"></div>
                                    </div>
                                </div>
                                <div className="button-hologram"></div>
                            </Button>
                        </div>
                    }
                </div>
            </div>
        </Fragment>
    )
}
