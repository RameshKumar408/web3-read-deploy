'use server'
const axios = require('axios');
const { Web3 } = require('web3');
const tokenAbi = require('../../tokenDetails/Abi.json');
const networkjson = require('./chainlist.json');

export async function POST(request) {
    const body = await request.json();
    const { ChainId, Address } = body;

    if (!ChainId) {
        return new Response(JSON.stringify({
            success: false,
            result: null,
            message: 'Please Enter ChainId'
        }));
    }
    if (!Address) {
        return new Response(JSON.stringify({
            success: false,
            result: null,
            message: 'Please Enter Address'
        }));
    }

    let url = process.env.NEXT_PUBLIC_ETH_URL;
    var apikey = process.env.NEXT_PUBLIC_ETH_API;

    // Fetch ERC20 token transfer events
    const response = await axios.post(`${url}/api?chainid=${ChainId}`, {
        chainid: ChainId,
        apikey: apikey,
        module: 'account',
        action: 'tokentx',
        address: Address,
        page: 1,
        offset: 1000,
        startblock: 0,
        endblock: 99999999,
        sort: 'asc',
    }, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });

    // Build ERC20 token list
    let erc20 = [];
    if (response?.data?.message == "OK" && Array.isArray(response?.data?.result) && response.data.result.length > 0) {
        const datas = response.data.result;
        for (const element of datas) {
            const alreadyExist = erc20.find(item => item.contractAddress === element?.contractAddress);
            if (!alreadyExist) {
                erc20.push({
                    contractAddress: element.contractAddress,
                    tokenName: element.tokenName,
                    tokenSymbol: element.tokenSymbol,
                    tokenDecimal: element.tokenDecimal,
                    balance: 0
                });
            }
        }
    }
    if (erc20.length === 0) {
        return new Response(JSON.stringify({
            success: true,
            result: [],
            message: "No ERC-20 tokens detected for this address"
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Build rpc url arrays
    let urlsarr = [];
    let urlsarr1 = [];
    for (const element of networkjson) {
        if (element?.chainId == ChainId) {
            for (const rpc of element.rpc) {
                if (rpc?.tracking === "none") {
                    urlsarr.push(rpc?.url);
                } else {
                    urlsarr1.push(rpc?.url);
                }
            }
            break;
        }
    }

    // Combine RPC url arrays for failover
    const allUrls = [...urlsarr, ...urlsarr1];

    // Robust balance fetching with failover
    let found = false;
    for (let urlIndex = 0; urlIndex < allUrls.length && !found; urlIndex++) {
        const rpcUrl = allUrls[urlIndex];
        const web3Instance = new Web3(rpcUrl);

        let success = true;
        for (let i = 0; i < erc20.length; i++) {
            try {
                const element = erc20[i];
                const contractInstance = new web3Instance.eth.Contract(tokenAbi, element.contractAddress);
                const balance = await contractInstance.methods.balanceOf(Address).call();
                const originalBalance = Number(balance) / Math.pow(10, element.tokenDecimal);
                erc20[i].balance = originalBalance;
            } catch (error) {
                // Failover on RPC error
                success = false;
                break;
            }
        }
        if (success) {
            found = true;
        }
    }

    if (!found) {
        return new Response(JSON.stringify({
            success: false,
            result: [],
            message: "All RPC URLs failed"
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({
        success: true,
        result: erc20,
        message: "Compiled Successfully"
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}
