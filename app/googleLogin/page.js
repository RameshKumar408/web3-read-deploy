'use client'
import { Fragment, useState } from "react";
import Button from '@mui/material/Button';
import { useGoogleLogin } from "@react-oauth/google";


export default function Home() {

    const [googleDetails, setGoogleDetails] = useState()

    //Google Auth Initializer
    const handleGoogleLogin = useGoogleLogin({
        flow: "auth-code",
        onSuccess: async (response) => {
            try {
                console.log(response, "resposdnfiausdfh");
                const payload = {
                    code: response.code,
                }
                const res = await fetch('/api/googleLogin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });
                var result = await res.json();
                if (result?.success) {
                    setGoogleDetails(result?.result)
                }

            } catch (error) {
                console.log(error);
            }
        },
        onError: () => console.log("Login Failed"),
        scope: "openid email profile",
    });



    return (
        <Fragment>
            <div style={{ textAlign: 'center' }}  >
                <h1 className="title-neon" >WEB3 PRODUCTS</h1>
                <div>
                    {
                        !googleDetails &&
                        //Login with GitHub

                        <Button style={{ width: "200px", height: "45px", color: "white" }} onClick={() => { handleGoogleLogin() }} >
                            <div className="button-chrome"></div>
                            <span className="button-text">Login with Google</span>
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

                <div>

                    {
                        googleDetails?.id &&
                        <>
                            <div>given_name: {googleDetails?.given_name}</div>
                            <div>name: {googleDetails?.name}</div>
                            <div>email: {googleDetails?.email}</div>
                            <div>id: {googleDetails?.id}</div>
                            <div>picture: {googleDetails?.picture}</div>
                            <div>verified_email: {googleDetails?.verified_email ? "true" : "false"}</div>

                            <Button style={{ width: "200px", height: "45px", color: "white" }} onClick={() => { setGoogleDetails("") }} >
                                <div className="button-chrome"></div>
                                <span className="button-text">Clear Login</span>
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