'use server'

export async function POST(request) {
    try {
        const params = new URLSearchParams({
            client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT,
            redirect_uri: 'https://web3deploy.netlify.app/api/githubcallback',
            scope: 'read:user user:email',
            state: 'rameshtesttokens' // CSRF protection in production
        });

        return new Response(JSON.stringify({
            success: true,
            // result: response?.data?.result,
            result: `https://github.com/login/oauth/authorize?${params}`,
            message: "Verified"
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.log("🚀 ~ POST ~ error:", error)

    }

}
