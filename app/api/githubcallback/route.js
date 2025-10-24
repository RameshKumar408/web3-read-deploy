'use server'
const axios = require('axios');

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");
        console.log("🚀 ~ GET ~ code:", code)
        const state = searchParams.get("state");
        console.log("🚀 ~ GET ~ state:", state)

        if (!code) {
            return new Response("Code not found", { status: 400 });
        }

        // Exchange code for access token

        const tokenRes = await axios.post(
            'https://github.com/login/oauth/access_token',
            {
                client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT,
                client_secret: process.env.NEXT_PUBLIC_GITHUB_SECRET,
                code
            },
            { headers: { Accept: 'application/json' } }
        );
        const accessToken = tokenRes.data.access_token;

        // Get user data from GitHub
        const userRes = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `token ${accessToken}` }
        });
        const user = userRes.data;

        // res.redirect(`https://web3deploy.netlify.app/githubLogin?user=${encodeURIComponent(JSON.stringify(user))}`);

        return new Response(null, {
            status: 302,
            headers: {
                Location: `https://web3deploy.netlify.app/githubLogin?user=${encodeURIComponent(JSON.stringify(user))}`
            }
        });
    } catch (error) {
        console.log("🚀 ~ POST ~ error:", error?.response?.data)
        return new Response(null, {
            status: 302,
            headers: {
                Location: `https://web3deploy.netlify.app/githubLogin?user=${false}`
            }
        });

    }

}
