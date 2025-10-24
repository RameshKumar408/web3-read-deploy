'use server'
import axios from "axios";

export async function POST(request) {
    try {

        const body = await request.json();
        const { code } = body;


        const params = new URLSearchParams({
            code: code,
            client_id: process.env.NEXT_PUBLIC_GCLIENT_ID,
            client_secret: process.env.NEXT_PUBLIC_GCLIENT_SECRET,
            redirect_uri: "http://localhost:3000",
            grant_type: "authorization_code",
        });


        const { data } = await axios.post(
            "https://oauth2.googleapis.com/token",
            params
        );

        const { data: payload } = await axios.get(
            "https://www.googleapis.com/oauth2/v1/userinfo",
            {
                headers: {
                    Authorization: `Bearer ${data.access_token}`,
                },
            }
        );

        return new Response(JSON.stringify({
            success: true,
            result: payload,
            message: "Verified"
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.log("🚀 ~ POST ~ error:", error)

    }

}
