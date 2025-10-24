'use client'
import { Fragment, useEffect, useState } from "react";
import Button from '@mui/material/Button';
import { useRouter, useSearchParams } from "next/navigation";
import TelegramLoginButton from 'react-telegram-login';


export default function Home() {
    const router = useRouter();

    const [githubDetails, setGithubDetails] = useState()

    const searchParams = useSearchParams();
    const user = searchParams.get('user');
    console.log("🚀 ~ Home ~ user:", user)


    useEffect(() => {
        if (user && user != "false") {
            setGithubDetails(JSON.parse(user))
        }
    }, [user])

    const handleGithubResponse = async () => {
        try {
            const res = await fetch('/api/github', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            var result = await res.json();
            console.log(result, "resufhdis")

            if (result?.success) {
                window.open(result?.result)
            }

        } catch (error) {
            console.log("🚀 ~ handleGithubResponse ~ error:", error)

        }

    };


    return (
        <Fragment>
            <div style={{ textAlign: 'center' }}  >
                <h1 className="title-neon" >WEB3 PRODUCTS</h1>
                <div>
                    {
                        !githubDetails &&
                        //Login with GitHub

                        <Button style={{ width: "200px", height: "45px", color: "white" }} onClick={() => { handleGithubResponse() }} >
                            <div className="button-chrome"></div>
                            <span className="button-text">Login with GitHub</span>
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


                </div>

                {/* <div>

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
                </div> */}
            </div>
        </Fragment>
    )
}