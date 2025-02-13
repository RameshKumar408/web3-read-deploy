'use client'
import { useEffect, useState } from 'react';
import { useAppKitAccount, useAppKitNetwork, useAppKitProvider } from "@reown/appkit/react";
import { polygon, mainnet, bscTestnet, bsc, polygonAmoy, sepolia } from '@reown/appkit/networks';
import Web3 from 'web3';
import axios from 'axios';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

import toast from 'react-hot-toast';
import AbiArray from './Abi.json'
import { useRouter } from "next/navigation";
import $ from 'jquery';

function TokenDetails() {

    const { walletProvider } = useAppKitProvider('eip155')
    const web3 = new Web3(walletProvider)

    const { address, isConnected } = useAppKitAccount()

    const { chainId, switchNetwork } = useAppKitNetwork()

    const router = useRouter();

    const [Balance, setBalance] = useState(0)

    // contract Address
    const [contractAddress, setContractAddress] = useState('')

    const [viewContract, setViewContract] = useState([])
    const [writeContract, setWriteContract] = useState([])

    const [ContractInstances, setContractInstances] = useState()

    // network List
    const [networkList, setNetworkList] = useState([
        { label: 'Select Network' },
        { label: 'Ethereum', value: mainnet },
        { label: 'Sepolia', value: sepolia },
        { label: 'BSC Testnet', value: bscTestnet },
        { label: 'BSC Mainnet', value: bsc },
        { label: 'Polygon', value: polygon },
        { label: 'Polygon Amoy', value: polygonAmoy },
    ])

    // selected Network List
    const [selectedNetwork, setSelectedNetwork] = useState('')
    // check address is contract address or not
    async function isContractAddress(address) {
        try {
            // Get the code at the specified address
            const code = await web3.eth.getCode(address);
            // If the code is '0x', it's an externally owned account (EOA), not a contract
            return code !== '0x';
        } catch (error) {
            console.error('Error checking address:', error);
            return false;
        }
    }

    useEffect(() => {
        if (selectedNetwork) {
            switchNetwork(JSON.parse(selectedNetwork));
        }
    }, [selectedNetwork])

    const checkBalance = async () => {
        const bal = await web3.eth.getBalance(address)
        setBalance(web3.utils.fromWei(bal, "ether"))
    }

    useEffect(() => {
        if (chainId) {
            checkBalance()
        }
    }, [chainId])

    useEffect(() => {
        if (isConnected == false) {
            router.push('/')
        }
    }, [isConnected])

    // get Contract Abi
    const getContractAbi = async () => {
        try {
            var add = web3.utils.isAddress(contractAddress);
            var checkAdd = await isContractAddress(contractAddress)
            console.log("🚀 ~ getContractAbi ~ checkAdd:", checkAdd)
            if (!contractAddress) return toast.error("Please enter contract address")
            if (!add) return toast.error("Please enter valid contract address")
            if (!checkAdd) return toast.error("Please enter valid contract address")

            let url
            var apikey
            if (chainId == 97) {
                url = process.env.NEXT_PUBLIC_BSC_TEST_URL
                apikey = process.env.NEXT_PUBLIC_BSC_API
            } else if (chainId == 56) {
                url = process.env.NEXT_PUBLIC_BSC_URL
                apikey = process.env.NEXT_PUBLIC_BSC_API
            } else if (chainId == 11155111) {
                url = process.env.NEXT_PUBLIC_ETH_TEST_URL
                apikey = process.env.NEXT_PUBLIC_ETH_API
            } else if (chainId == 1) {
                url = process.env.NEXT_PUBLIC_ETH_URL
                apikey = process.env.NEXT_PUBLIC_ETH_API
            } else if (chainId == 137) {
                url = process.env.NEXT_PUBLIC_POLY_URL
                apikey = process.env.NEXT_PUBLIC_POLY_API
            } else if (chainId == 80002) {
                url = process.env.NEXT_PUBLIC_POLY_TEST_URL
                apikey = process.env.NEXT_PUBLIC_POLY_API
            }
            console.log(url, "url", `${url}/api?module=contract&action=getabi&address=${contractAddress}&apikey=${apikey}`)

            const { data } = await axios.get(`${url}/api?module=contract&action=getabi&address=${contractAddress}&apikey=${apikey}`)
            var Abi
            console.log("🚀 ~ getContractAbi ~ data:", data)
            if (data?.status == "1") {
                Abi = JSON.parse(data?.result)
            } else {
                Abi = AbiArray
            }
            console.log(Abi, "Abi")
            const ContractInstance = new web3.eth.Contract(Abi, contractAddress)
            setContractInstances(ContractInstance.methods)
            var arr = []
            var arr1 = []
            for (let i = 0; i < Abi.length; i++) {
                const element = Abi[i];
                if (element?.type == "function" && element?.stateMutability == "view") {
                    arr.push(element)
                } else if (element?.type == "function" && (element?.stateMutability == "nonpayable" || element?.stateMutability == "payable")) {
                    arr1.push(element)
                }
            }
            setViewContract(arr)
            setWriteContract(arr1)
        } catch (error) {
            console.log("🚀 ~ getContractAbi ~ error:", error)
        }
    }

    //set only non input type view functions
    const setTokens = async (item) => {
        var datas = await ContractInstances[item?.name]().call()

        if (typeof (datas) === "object") {
            var entryes = Object.entries(datas)
            for (let i = 0; i < entryes.length; i++) {
                const element = entryes[i];
                $('<div/>', {
                    class: 'new-div',
                    text: `${element[0]}: ${element[1]}`
                }).appendTo(`.div_${item?.name}`);
            }

            // $(`.view_${item}`).html(bals)
        } else {
            $(`.view_${item?.name}`).html(datas)
        }
    }


    const setInputs = async (item, itm) => {
        try {
            var objs = []
            for (let i = 0; i < itm.length; i++) {
                const element = itm[i];
                var values = $(`.inner_${item}_${element?.name}`).val()
                objs.push(values)
            }
            var bals = await ContractInstances[item](...objs).call({ from: address })
            console.log("🚀 ~ setInputs ~ bals:", Object.entries(bals), typeof (bals), `div_${item}`)
            if (typeof (bals) === "object") {
                var entryes = Object.entries(bals)
                for (let i = 0; i < entryes.length; i++) {
                    const element = entryes[i];
                    $('<div/>', {
                        class: 'new-div',
                        text: `${element[0]}: ${element[1]}`
                    }).appendTo(`.div_${item}`);
                }

                // $(`.view_${item}`).html(bals)
            } else {
                typeof (bals) == 'bigint' ?
                    $(`.view_${item}`).html(bals.toString()) :
                    $(`.view_${item}`).html(bals)
            }
        } catch (error) {
            console.log("🚀 ~ setInputs ~ error:", error)
            toast.error(error?.message)
        }


    }

    //set only non input type Send functions
    const setTokens1 = async (item) => {
        var datas = await ContractInstances[item?.name]().send()
        $(`.view_${item?.name}`).html(datas)
    }

    // set only input type Send functions
    const setInputs1 = async (item, itm) => {
        var urls
        if (chainId == 56) {
            urls = process.env.NEXT_PUBLIC_BSCURL_WEB
        } else if (chainId == 97) {
            urls = process.env.NEXT_PUBLIC_BSCURL_TEST_WEB
        } else if (chainId == 11155111) {
            urls = process.env.NEXT_PUBLIC_ETHURL_TEST_WEB
        } else if (chainId == 1) {
            urls = process.env.NEXT_PUBLIC_ETHURL_WEB
        } else if (chainId == 137) {
            urls = process.env.NEXT_PUBLIC_POLURL_WEB
        } else if (chainId == 80002) {
            urls = process.env.NEXT_PUBLIC_POLURL_TEST_WEB
        }

        var objs = []
        for (let i = 0; i < itm.length; i++) {
            const element = itm[i];
            var values = $(`.inner_${item}_${element?.name}`).val()
            objs.push(values)
        }
        console.log("setInputs1  objs:", objs)
        console.log("setInputs1  item:", item)
        var bals = await ContractInstances[item](...objs).send({ from: address })
        console.log("🚀 ~ setInputs1 ~ bals:", bals, `${urls}/tx/${bals?.transactionHash}`)
        if (bals) {
            $('<a/>', {
                class: 'new-a',
                href: `${urls}/tx/${bals?.transactionHash}`,
                target: '_blank',
                text: `View Transaction`
            }).appendTo(`.div_${item}`);
        }
    }

    return (
        <div style={{ textAlign: 'center' }} >
            <h1>Token Details</h1>
            <div style={{
                display: 'flex',
                gap: '20px',
                width: "50%",
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                margin: '0 auto'
            }} >

                <FormControl sx={{ m: 1, minWidth: 80 }}>
                    <InputLabel id="demo-simple-select-autowidth-label">Select Network</InputLabel>
                    <Select
                        labelId="demo-simple-select-autowidth-label"
                        id="demo-simple-select-autowidth"
                        // value={selectedNetwork}
                        onChange={(e) => { setSelectedNetwork(e.target.value); }}
                        autoWidth
                        label="Select Network"
                    >
                        {
                            networkList?.map((item, index) => {
                                return (
                                    <MenuItem key={index} value={JSON.stringify(item?.value)} >{item?.label}</MenuItem>
                                )
                            })
                        }
                    </Select>
                </FormControl>
                <div>Balance: {Balance}</div>
                <TextField type="text" placeholder="Contract Address" aria-label="default input example" onChange={(e) => { setContractAddress(e.target.value) }} />
                <Button color="primary" style={{ color: 'black', borderColor: "black" }} variant="outlined" onClick={() => { getContractAbi(); }} >Token Details</Button>
                <Button color="primary" style={{ color: 'black', borderColor: "black" }} variant="outlined" onClick={() => { router.back() }} >Back</Button>
            </div>
            {
                viewContract?.length > 0 && writeContract?.length > 0 &&
                <div className='main_div'>
                    <div className='read_div'>
                        {
                            viewContract?.length > 0 &&
                            viewContract?.map((item, index) => {
                                if (item?.inputs.length == 0) {
                                    return (
                                        <div key={index} >
                                            <h2 className={`div_${item?.name}`} > {item?.name}</h2 >
                                            <div className={`view_${item?.name}`} ></div>
                                            <Button color="primary" style={{ color: 'black', borderColor: "black" }} variant="outlined" onClick={() => { setTokens(item); console.log(item, "items") }} >Sumbit</Button>
                                            <hr style={{ border: '3px solid', color: 'black' }} />
                                        </div>
                                    )
                                } else {
                                    return (
                                        <div key={index}>
                                            <h2 className={`div_${item?.name}`}>{item?.name}</h2>
                                            {item?.inputs?.map((itm, idx) => {
                                                return (
                                                    <div key={idx}>
                                                        <h4>{itm?.name}</h4>
                                                        <TextField type="text" placeholder={itm?.type} aria-label="default input example" className={`inner_${item?.name}_${itm?.name}`} />
                                                    </div>
                                                )
                                            })}
                                            <div className={`view_${item?.name}`} ></div>
                                            <Button color="primary" style={{ color: 'black', borderColor: "black" }} variant="outlined" onClick={() => { setInputs(item?.name, item?.inputs) }} >Sumbit</Button>
                                            <hr style={{ border: '3px solid', color: 'black' }} />
                                        </div>
                                    )

                                }
                            })
                        }
                    </div>
                    <div className='write_div'>
                        {
                            writeContract?.length > 0 &&
                            writeContract?.map((item, index) => {
                                if (item?.inputs.length == 0) {
                                    return (
                                        <div key={index}>
                                            <h2 className={`div_${item?.name}`} > {item?.name}</h2 >
                                            <div className={`view_${item?.name}`} ></div>
                                            <Button color="primary" style={{ color: 'black', borderColor: "black" }} variant="outlined" onClick={() => { setTokens1(item) }} >Sumbit</Button>
                                            <hr style={{ border: '3px solid', color: 'black' }} />
                                        </div>
                                    )
                                } else {
                                    return (
                                        <div key={index}>
                                            <h2 className={`div_${item?.name}`} > {item?.name}</h2 >
                                            {item?.inputs?.map((itm, idx1) => {
                                                return (
                                                    <div key={idx1} >
                                                        <h4>{itm?.name}</h4>
                                                        <TextField type="text" placeholder={itm?.type} aria-label="default input example" className={`inner_${item?.name}_${itm?.name}`} />
                                                    </div>
                                                )
                                            })}
                                            <div className={`view_${item?.name}`} ></div>
                                            <Button color="primary" style={{ color: 'black', borderColor: "black" }} variant="outlined" onClick={() => { setInputs1(item?.name, item?.inputs) }} >Sumbit</Button>
                                            <hr style={{ border: '3px solid', color: 'black' }} />
                                        </div>
                                    )

                                }
                            })
                        }
                    </div>
                </div>
            }

        </div >
    )


}
export default TokenDetails;