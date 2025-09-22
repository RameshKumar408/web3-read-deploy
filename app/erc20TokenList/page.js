'use client'
import { useEffect, useState } from "react";
import Web3 from "web3";
import { useAppKitNetwork, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { polygon, mainnet, bscTestnet, bsc, polygonAmoy, sepolia } from '@reown/appkit/networks';
import { useForm } from 'react-hook-form';
import CircularProgress from '@mui/material/CircularProgress';
import axios from 'axios'
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from "next/navigation";

export default function Home() {
  const { walletProvider } = useAppKitProvider('eip155')
  var web3 = new Web3(walletProvider)

  useEffect(() => {
    web3 = new Web3(walletProvider)
  }, [walletProvider])

  // useEffect(async () => {
  //   if (window.ethereum) {
  //     web3 = new Web3(window.ethereum)
  //     await window.ethereum.request({ method: 'eth_requestAccounts' });
  //   }
  // }, [])
  const router = useRouter();

  const [networkList, setNetworkList] = useState([
    { label: "Ethereum Mainnet", value: 1 },
    { label: "Sepolia Testnet", value: 11155111 },
    { label: "Holesky Testnet", value: 17000 },
    { label: "Hoodi Testnet", value: 560048 },
    { label: "Abstract Mainnet", value: 2741 },
    { label: "Abstract Sepolia Testnet", value: 11124 },
    { label: "ApeChain Curtis Testnet", value: 33111 },
    { label: "ApeChain Mainnet", value: 33139 },
    { label: "Arbitrum Nova Mainnet", value: 42170 },
    { label: "Arbitrum One Mainnet", value: 42161 },
    { label: "Arbitrum Sepolia Testnet", value: 421614 },
    { label: "Avalanche C-Chain", value: 43114 },
    { label: "Avalanche Fuji Testnet", value: 43113 },
    { label: "Base Mainnet", value: 8453 },
    { label: "Base Sepolia Testnet", value: 84532 },
    { label: "Berachain Mainnet", value: 80094 },
    { label: "Berachain Bepolia Testnet", value: 80069 },
    { label: "BitTorrent Chain Mainnet", value: 199 },
    { label: "BitTorrent Chain Testnet", value: 1029 },
    { label: "Blast Mainnet", value: 81457 },
    { label: "Blast Sepolia Testnet", value: 168587773 },
    { label: "BNB Smart Chain Mainnet", value: 56 },
    { label: "BNB Smart Chain Testnet", value: 97 },
    { label: "Celo Alfajores Testnet", value: 44787 },
    { label: "Celo Mainnet", value: 42220 },
    { label: "Cronos Mainnet", value: 25 },
    { label: "Fraxtal Mainnet", value: 252 },
    { label: "Fraxtal Testnet", value: 2522 },
    { label: "Gnosis", value: 100 },
    { label: "HyperEVM Mainnet", value: 999 },
    { label: "Linea Mainnet", value: 59144 },
    { label: "Linea Sepolia Testnet", value: 59141 },
    { label: "Mantle Mainnet", value: 5000 },
    { label: "Mantle Sepolia Testnet", value: 5003 },
    { label: "Memecore Testnet", value: 43521 },
    { label: "Moonbase Alpha Testnet", value: 1287 },
    { label: "Monad Testnet", value: 10143 },
    { label: "Moonbeam Mainnet", value: 1284 },
    { label: "Moonriver Mainnet", value: 1285 },
    { label: "OP Mainnet", value: 10 },
    { label: "OP Sepolia Testnet", value: 11155420 },
    { label: "Polygon Amoy Testnet", value: 80002 },
    { label: "Polygon zkEVM Cardona Testnet", value: 2442 },
    { label: "Polygon zkEVM Mainnet", value: 1101 },
    { label: "Polygon Mainnet", value: 137 },
    { label: "Katana Mainnet", value: 747474 },
    { label: "Sei Mainnet", value: 1329 },
    { label: "Sei Testnet", value: 1328 },
    { label: "Scroll Mainnet", value: 534352 },
    { label: "Scroll Sepolia Testnet", value: 534351 },
    { label: "Sonic Testnet", value: 14601 },
    { label: "Sonic Mainnet", value: 146 },
    { label: "Sophon Mainnet", value: 50104 },
    { label: "Sophon Sepolia Testnet", value: 531050104 },
    { label: "Swellchain Mainnet", value: 1923 },
    { label: "Swellchain Testnet", value: 1924 },
    { label: "Taiko Hekla L2 Testnet", value: 167009 },
    { label: "Taiko Mainnet", value: 167000 },
    { label: "Unichain Mainnet", value: 130 },
    { label: "Unichain Sepolia Testnet", value: 1301 },
    { label: "World Mainnet", value: 480 },
    { label: "World Sepolia Testnet", value: 4801 },
    { label: "XDC Apothem Testnet", value: 51 },
    { label: "XDC Mainnet", value: 50 },
    { label: "zkSync Mainnet", value: 324 },
    { label: "zkSync Sepolia Testnet", value: 300 },
    { label: "opBNB Mainnet", value: 204 },
    { label: "opBNB Testnet", value: 5611 }
  ])
  const { address, isConnected } = useAppKitAccount()
  const { chainId, switchNetwork } = useAppKitNetwork()

  const [selectedNetwork, setSelectedNetwork] = useState(1)

  const [userAddress, setUserAddress] = useState("")

  const [loading, setLoading] = useState(false)

  const [data, setData] = useState([])

  // Handle form submission
  const getTokenList = async () => {
    try {
      setLoading(true)
      setData([])
      const res = await fetch('/api/getTokenList', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ChainId: selectedNetwork,
          Address: userAddress,
        }),
      });

      const datas = await res.json();
      console.log(datas, "datas")
      setData(datas?.result)
      setLoading(false)
    } catch (error) {
      setLoading(false)
      console.log(error, "error")
    }

  };

  useEffect(() => {
    if (address) {
      // getTokenList()
      setUserAddress(address)
    }
  }, [address])


  const addToken = async (item) => {
    try {
      if (window.ethereum) {


        const hexChainId = '0x' + Number(selectedNetwork).toString(16)


        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: hexChainId }],
        });


        await window.ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20', // Can also be 'ERC721'
            options: {
              address: item?.contractAddress,  // The token contract address
              symbol: item?.tokenSymbol,                         // A ticker symbol (up to 5 chars)
              decimals: item?.tokenDecimal,                          // The token decimals
            },
          },
        });
      }
    } catch (error) {
      console.log("🚀 ~ addToken ~ error:", error)
      toast.error(error?.message)

    }

  }


  return (

    <div className="token-list-top">

      <div className="token-list-main">
        <Toaster />
        <h1 style={{ textAlign: 'center' }} className="title-neon" >TOKEN LIST</h1>


        <div className="field-chrome" style={{ width: "50%" }}>
          <div className="chrome-border"></div>
          <FormControl sx={{ m: 1, width: '100%', color: "white", ".css-w76bbz-MuiSelect-select-MuiInputBase-input-MuiOutlinedInput-input.css-w76bbz-MuiSelect-select-MuiInputBase-input-MuiOutlinedInput-input.css-w76bbz-MuiSelect-select-MuiInputBase-input-MuiOutlinedInput-input": { color: "white" } }}>
            {/* <InputLabel id="demo-simple-select-autowidth-label">Select Network</InputLabel> */}
            <Select
              labelId="demo-simple-select-autowidth-label"
              id="demo-simple-select-autowidth"
              value={selectedNetwork || ""}
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
          <div className="field-hologram"></div>
        </div>
        <div>Address:{address} </div>

        <div className="retro-field">
          <div className="field-chrome">
            <div className="chrome-border"></div>
            <input type='text' id='symbol' placeholder='Address' value={userAddress} onChange={(e) => { setUserAddress(e.target.value) }} />
            {/* <label for="email">Email Address</label> */}
            <div className="field-hologram"></div>
          </div>
        </div>


        <Button style={{ width: "200px", height: "45px", color: "white" }} onClick={() => { getTokenList(); }} >

          <div className="button-chrome"></div>
          <span className="button-text"> Search</span>
          <div className="button-loader">
            <div className="y2k-spinner">
              <div className="spinner-ring ring-1"></div>
              <div className="spinner-ring ring-2"></div>
              <div className="spinner-ring ring-3"></div>
            </div>
          </div>
          <div className="button-hologram"></div>
        </Button>

        <Button style={{ width: "200px", height: "45px", color: "white" }} onClick={() => { router.push("/") }} >

          <div className="button-chrome"></div>
          <span className="button-text"> Back</span>
          <div className="button-loader">
            <div className="y2k-spinner">
              <div className="spinner-ring ring-1"></div>
              <div className="spinner-ring ring-2"></div>
              <div className="spinner-ring ring-3"></div>
            </div>
          </div>
          <div className="button-hologram"></div>
        </Button>
      </div>

      <div>
        <div className="ag-format-container">
          <div className="ag-courses_box">

            {
              loading &&
              <main style={{ margin: 'auto' }}>
                <svg className="lp" viewBox="0 0 128 128" width="128px" height="128px" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#000" />
                      <stop offset="100%" stopColor="#fff" />
                    </linearGradient>
                    <mask id="mask1">
                      <rect x="0" y="0" width="128" height="128" fill="url(#grad1)" />
                    </mask>
                  </defs>
                  <g fill="none" strokeLinecap="round" strokeWidth="16">
                    <circle className="lp__ring" r="56" cx="64" cy="64" stroke="#ddd" />
                    <g stroke="hsl(183,90%,40%)">
                      <polyline className="lp__fall-line" points="64,8 64,120" />
                      <polyline className="lp__fall-line lp__fall-line--delay1" points="64,8 64,120" />
                      <polyline className="lp__fall-line lp__fall-line--delay2" points="64,8 64,120" />
                      <polyline className="lp__fall-line lp__fall-line--delay3" points="64,8 64,120" />
                      <polyline className="lp__fall-line lp__fall-line--delay4" points="64,8 64,120" />
                      <circle className="lp__drops" r="56" cx="64" cy="64" transform="rotate(90,64,64)" />
                      <circle className="lp__worm" r="56" cx="64" cy="64" transform="rotate(-90,64,64)" />
                    </g>
                    <g stroke="hsl(93,90%,40%)" mask="url(#mask1)">
                      <polyline className="lp__fall-line" points="64,8 64,120" />
                      <polyline className="lp__fall-line lp__fall-line--delay1" points="64,8 64,120" />
                      <polyline className="lp__fall-line lp__fall-line--delay2" points="64,8 64,120" />
                      <polyline className="lp__fall-line lp__fall-line--delay3" points="64,8 64,120" />
                      <polyline className="lp__fall-line lp__fall-line--delay4" points="64,8 64,120" />
                      <circle className="lp__drops" r="56" cx="64" cy="64" transform="rotate(90,64,64)" />
                      <circle className="lp__worm" r="56" cx="64" cy="64" transform="rotate(-90,64,64)" />
                    </g>
                  </g>
                </svg>
              </main>
            }

            {
              data?.length > 0 &&
              data?.map((item, index) => {
                return (
                  <div className="ag-courses_item" key={index}>
                    <div className="ag-courses-item_link">
                      <div className="ag-courses-item_bg"></div>

                      <div className="ag-courses-item_title">
                        Name: {item?.tokenName}
                      </div>
                      <div className="ag-courses-item_title">
                        Symbol:  {item?.tokenSymbol}
                      </div>

                      <div className="ag-courses-item_title">
                        Balance:  {item?.balance}
                      </div>

                      <div className="ag-courses-item_date-box" style={{ cursor: "pointer" }} onClick={() => { navigator.clipboard.writeText(item?.contractAddress); toast.success("copyed") }} >
                        contractAddress: {item?.contractAddress?.slice(0, 7) + "..." + item?.contractAddress?.slice(-7)}
                      </div>

                      <div className="ag-courses-item_date-box addToken" onClick={() => { addToken(item) }} >
                        Add Token
                      </div>
                    </div>
                  </div>
                )
              })
            }


          </div>
        </div>
      </div>
    </div>
  );
}
