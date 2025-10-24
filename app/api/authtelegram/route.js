'use server'
const axios = require('axios');
const { TelegramLogin } = require('node-telegram-login')



const TelegramAuth = new TelegramLogin(process.env.NEXT_PUBLIC_TELEGRAM_TOKEN);


export async function POST(request) {
    try {
        const bodysData = await request.json();

        const user = TelegramAuth.checkLoginData(bodysData);
        console.log("🚀 ~ POST ~ user:", user)
        return new Response(JSON.stringify({
            success: true,
            // result: response?.data?.result,
            result: user,
            message: "Verified"
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.log("🚀 ~ POST ~ error:", error)

    }

}
