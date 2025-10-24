'use client'
import { Fragment, useEffect, useState } from "react";
import Button from '@mui/material/Button';
import { useRouter } from "next/navigation";
import TelegramLoginButton from 'react-telegram-login';


export default function Home() {
    const router = useRouter();

    const [telegramDetails, setTelegramDetails] = useState()

    const handleTelegramResponse = async (response) => {
        try {
            console.log("🚀 ~ handleTelegramResponse ~ response:", response)

            const res = await fetch('/api/authtelegram', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(response),
            });

            console.log(res, "resufhdis")

            setTelegramDetails(response)
        } catch (error) {
            console.log("🚀 ~ handleTelegramResponse ~ error:", error)

        }

    };


    return (
        <Fragment>
            <div style={{ textAlign: 'center' }}  >
                <h1 className="title-neon" >WEB3 PRODUCTS</h1>
                <div>
                    {
                        !telegramDetails?.hash &&
                        <TelegramLoginButton
                            dataOnauth={handleTelegramResponse}
                            botName="web3deploybot" // Replace with your bot's username
                        />
                    }


                </div>

                <div>

                    {
                        telegramDetails?.hash &&
                        <>
                            <div>first_name: {telegramDetails?.first_name}</div>
                            <div>last_name: {telegramDetails?.last_name}</div>
                            <div>username: {telegramDetails?.username}</div>
                            <div>id: {telegramDetails?.id}</div>


                            <Button style={{ width: "200px", height: "45px", color: "white" }} onClick={() => { setTelegramDetails("") }} >
                                <div className="button-chrome"></div>
                                <span className="button-text">Disconnect</span>
                                <div className="button-loader">
                                    <div className="y2k-spinner">
                                        <div className="spinner-ring ring-1"></div>
                                        <div className="spinner-ring ring-2"></div>
                                        <div className="spinner-ring ring-3"></div>
                                    </div>
                                </div>
                                <div className="button-hologram"></div>

                            </Button>
                        </>


                    }
                </div>
            </div>
        </Fragment>
    )
}