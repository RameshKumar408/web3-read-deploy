'use client'
import { useEffect, useState } from "react";
import Web3 from "web3";
import { useAppKitNetwork, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { polygon, mainnet, bscTestnet, bsc, polygonAmoy, sepolia, } from '@reown/appkit/networks';
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

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const [networkList, setNetworkList] = useState([
    { label: 'Select Network' },
    { label: 'Ethereum', value: mainnet },
    { label: 'Sepolia', value: sepolia },
    { label: 'BSC Testnet', value: bscTestnet },
    { label: 'BSC Mainnet', value: bsc },
    { label: 'Polygon', value: polygon },
    { label: 'Polygon Amoy', value: polygonAmoy },
  ])
  const { address, isConnected } = useAppKitAccount()
  const { chainId, switchNetwork } = useAppKitNetwork()

  const [selectedNetwork, setSelectedNetwork] = useState('')

  useEffect(() => {
    console.log("🚀 ~ Home ~ selectedNetwork:", selectedNetwork)
    if (selectedNetwork) {
      setLoader(true)
      switchNetwork(JSON.parse(selectedNetwork))
    }
  }, [selectedNetwork])

  const [deployContractAddress, setdeployContractAddress] = useState("")

  const [Balance, setBalance] = useState("0")

  const [loader, setLoader] = useState(false)

  const checkBalance = async () => {

    if (!address) {
      setBalance("0");
      return;
    }
    try {

      const bal = await web3.eth.getBalance(address)
      console.log(chainId, await web3.eth.getChainId(), "chainIdchainId")
      console.log("🚀 ~ checkBalance ~ bal:", bal, address)
      setBalance(web3.utils.fromWei(bal, "ether") ?? "0")
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance("0");
    }
    setLoader(false)
  }

  useEffect(() => {
    if (chainId && address) {
      if (chainId == 1) {
        setSelectedNetwork(JSON.stringify(mainnet))
      } else if (chainId == 97) {
        setSelectedNetwork(JSON.stringify(bscTestnet))
      } else if (chainId == 56) {
        setSelectedNetwork(JSON.stringify(bsc))
      } else if (chainId == 11155111) {
        setSelectedNetwork(JSON.stringify(sepolia))
      } else if (chainId == 137) {
        setSelectedNetwork(JSON.stringify(polygon))
      } else if (chainId == 80002) {
        setSelectedNetwork(JSON.stringify(polygonAmoy))
      }

      checkBalance()
    }
  }, [chainId, address])

  const [loading, setLoading] = useState(false)


  const [txData, setTxData] = useState("")
  const [sourceCode, setSourceCode] = useState("")
  const [contractName, setContractName] = useState("")

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      if (!selectedNetwork) return toast.error("Please enter contract address")
      const accounts = await web3.eth.getAccounts();
      console.log(data);
      setLoading(true)
      const res = await fetch('/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          symbol: data.symbol,
          decimal: data.decimal,
          totalsupply: data.total_supply,
          contractName: data.contract_name
        }),
      });

      const datas = await res.json();
      console.log(datas, "datas")

      const Routercontracts = new web3.eth.Contract(datas?.result?.abi);
      const RouterdeployedContract = await Routercontracts
        .deploy({ data: '0x' + datas?.result?.bytecode, arguments: [] })
      const gas = await RouterdeployedContract.estimateGas({
        from: accounts[0],
      });
      const tx = await RouterdeployedContract.send({
        from: accounts[0],
        gas,
        gasPrice: 10000000000,
      });

      setTxData(tx)
      setSourceCode(datas?.result?.sourceCode)
      setContractName(data?.contract_name)
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
      console.log(chainId, "chainId")
      setdeployContractAddress(`${urls}/address/${tx?._address}`)
      setLoading(false)
      reset()
      toast.success("Contract Deployed Successfully")
    } catch (error) {
      setLoading(false)
      console.log(error, "error")
    }

  };

  const verifyContract = async () => {
    try {
      setLoading(true)
      let url = process.env.NEXT_PUBLIC_ETH_URL
      var apikey = process.env.NEXT_PUBLIC_ETH_API

      const response = await axios.post(`${url}/api?chainid=${chainId}`, {
        chainid: chainId,
        apikey: apikey,
        module: 'contract',
        action: 'verifysourcecode',
        contractaddress: txData?._address,
        sourceCode: `${sourceCode}`,
        codeformat: 'solidity-single-file',
        contractname: contractName, // Replace with your contract name
        compilerversion: 'v0.8.28+commit.7893614a',
        optimizationUsed: 0,
        runs: 200, // Number of optimization runs
        constructorArguements: '',
        evmversion: '',
        licenseType: 3 // SPDX License Type (1 for No License, 2 for MIT, etc.)
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
      );
      console.log(response?.data, "response?.data")
      if (response?.data?.message == 'OK') {
        toast.success("contract verified successfully")
        setdeployContractAddress("")
        // var uid = response?.data?.result
        // const resp = await axios.post(`${process.env.NEXT_PUBLIC_ETH_URL}`, null, {
        //   params: {
        //     chainid: chainId,
        //     apikey: apikey,
        //     module: 'contract',
        //     action: 'checkverifystatus',
        //     guid: uid,
        //   }
        // });
        // if (resp) {
        //   if (resp.data?.status === 1) {
        //     alert(resp?.data?.result);
        //   } else {
        //     alert(resp?.data?.result);
        //   }
        // }
      }
      setLoading(false)
    } catch (error) {
      console.log("🚀 ~ verifyContract ~ error:", error)
      setLoading(false)
    }
  }


  return (
    <div className="login-container">
      <Toaster />
      <div className="future-card" >
        <div className="main_div1">
          <h1 style={{ textAlign: 'center' }} className="title-neon" >TOKEN DEPLOY</h1>


          <div className="field-chrome" style={{ width: "100%" }}>
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
          <div>Balance: {loader ? < CircularProgress size={20} /> : Balance} </div>
          <form style={{ display: 'flex', flexDirection: 'column', width: '100%' }} onSubmit={handleSubmit(onSubmit)} >


            <div className="retro-field">
              <div className="field-chrome">
                <div className="chrome-border"></div>
                <input type='text' id='name' placeholder='name' {...register('name', { required: true })} />
                {/* <label for="email">Email Address</label> */}
                <div className="field-hologram"></div>
              </div>
              <span className="retro-error" id="emailError">{errors?.name && <span style={{ color: 'red' }}>Please Enter Name</span>}</span>
            </div>

            <div className="retro-field">
              <div className="field-chrome">
                <div className="chrome-border"></div>
                <input type='text' id='symbol' placeholder='symbol' {...register('symbol', { required: true })} />
                {/* <label for="email">Email Address</label> */}
                <div className="field-hologram"></div>
              </div>
              <span className="retro-error" id="emailError">{errors?.symbol && <span style={{ color: 'red' }}>Please Enter Symbol</span>}</span>
            </div>

            <div className="retro-field">
              <div className="field-chrome">
                <div className="chrome-border"></div>
                <input type='text' id='decimal' placeholder='decimal' {...register('decimal', { required: true })} />
                {/* <label for="email">Email Address</label> */}
                <div className="field-hologram"></div>
              </div>
              <span className="retro-error" id="emailError">  {errors?.decimal && <span style={{ color: 'red' }}>Please Enter Decimal</span>}</span>
            </div>

            <div className="retro-field">
              <div className="field-chrome">
                <div className="chrome-border"></div>
                <input type='text' id='total_supply' placeholder='total supply' {...register('total_supply', { required: true })} />
                {/* <label for="email">Email Address</label> */}
                <div className="field-hologram"></div>
              </div>
              <span className="retro-error" id="emailError">{errors?.total_supply && <span style={{ color: 'red' }}>Please Enter Total Supply</span>}</span>
            </div>

            <div className="retro-field">
              <div className="field-chrome">
                <div className="chrome-border"></div>
                <input type='text' id='contract_name' placeholder='contract name' {...register('contract_name', { required: true })} />
                {/* <label for="email">Email Address</label> */}
                <div className="field-hologram"></div>
              </div>
              <span className="retro-error" id="emailError"> {errors?.contract_name && <span style={{ color: 'red' }}>Please Enter Contract Name</span>}</span>
            </div>


            {/* <TextField type='text' id='name' placeholder='name' {...register('name', { required: true })} /> */}
            {/* {errors?.name && <span style={{ color: 'red' }}>Please Enter Name</span>} */}
            {/* <TextField type='text' id='symbol' placeholder='symbol' {...register('symbol', { required: true })} />
            {errors?.symbol && <span style={{ color: 'red' }}>Please Enter Symbol</span>} */}
            {/* <TextField type='text' id='decimal' placeholder='decimal' {...register('decimal', { required: true })} />
            {errors?.decimal && <span style={{ color: 'red' }}>Please Enter Decimal</span>}
            <TextField type='text' id='total_supply' placeholder='total supply' {...register('total_supply', { required: true })} />
            {errors?.total_supply && <span style={{ color: 'red' }}>Please Enter Total Supply</span>}
            <TextField type='text' id='contract_name' placeholder='contract name' {...register('contract_name', { required: true })} />
            {errors?.contract_name && <span style={{ color: 'red' }}>Please Enter Contract Name</span>} */}
            <Button style={{ height: "45px", color: "white" }} type='submit' disabled={loading} >
              <div className="button-chrome"></div>
              <span className="button-text"> {loading ? < CircularProgress size={20} /> : "Submit"}</span>
              <div className="button-loader">
                <div className="y2k-spinner">
                  <div className="spinner-ring ring-1"></div>
                  <div className="spinner-ring ring-2"></div>
                  <div className="spinner-ring ring-3"></div>
                </div>
              </div>
              <div className="button-hologram"></div>

            </Button>
          </form>
          <a target="_blank" style={{ color: "white" }} href={deployContractAddress} >{deployContractAddress}</a>


          {
            txData &&
            <Button style={{ height: "45px", color: "white" }} disabled={loading} onClick={() => { verifyContract() }} >
              <div className="button-chrome"></div>
              <span className="button-text"> {loading ? < CircularProgress size={20} /> : "Verify Contract"}</span>
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

          <Button style={{ width: "200px", height: "45px", color: "white" }} onClick={() => { router.push('/') }} >

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
      </div>
    </div>
  );
}
