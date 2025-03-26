'use server'
const solc = require('solc')

export async function GET(request) {
    return new Response(JSON.stringify({
        "name": "My TON App",
        "url": "https://your-app-url.com",
        "icon": "https://your-app-url.com/icon.png",
        "description": "A sample app that integrates TON Connect.",
        "version": "1.0.0",
        "network": "mainnet",
        "features": {
            "connect": true,
            "sendTransaction": true
        },
        "shortName": "MyApp",
        "methods": ["getAccount", "sendTransaction"],
        "requiredPermissions": ["account"]
    }
    ), {
        headers: {
            'Content-Type': 'application/json',
        },
    });
}