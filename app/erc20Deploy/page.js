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
import toast from 'react-hot-toast';
import { useRouter } from "next/navigation";

export default function Home() {
  const { walletProvider } = useAppKitProvider('eip155')
  const web3 = new Web3(walletProvider)
  // useEffect(async () => {
  //   if (window.ethereum) {
  //     web3 = new Web3(window.ethereum)
  //     await window.ethereum.request({ method: 'eth_requestAccounts' });
  //   }
  // }, [])
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm();

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


  // Handle form submission
  const onSubmit = async (data) => {
    try {
      if (!selectedNetwork) return toast.error("Please enter contract address")
      const accounts = await web3.eth.getAccounts();
      console.log(data);
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

      setdeployContractAddress(`${urls}/address/${tx?._address}`)
      const response = await axios.post(`${url}/api`, {
        apikey: apikey,
        module: 'contract',
        action: 'verifysourcecode',
        contractaddress: tx?._address,
        sourceCode: `${datas?.result?.sourceCode}`,
        codeformat: 'solidity-single-file',
        contractname: data.contract_name, // Replace with your contract name
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
      if (response?.data?.message == 'OK') {
        var uid = response?.data?.result
        const resp = await axios.post(`https://api-testnet.bscscan.com/api`, null, {
          params: {
            apikey: apikey,
            module: 'contract',
            action: 'checkverifystatus',
            guid: uid,
          }
        });
        if (resp) {
          if (resp.data?.status === 1) {
            alert(resp?.data?.result);
          } else {
            alert(resp?.data?.result);
          }
        }
      }
    } catch (error) {
      console.log(error, "error")
    }

  };


  return (
    <div className="main_div1">
      <h1 style={{ textAlign: 'center' }} >Token Deploy</h1>

      <FormControl sx={{ m: 1, minWidth: 80 }}>
        <InputLabel id="demo-simple-select-autowidth-label">Select Network</InputLabel>
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

      <div>Address:{address} </div>
      <div>Balance: {loader ? < CircularProgress size={20} /> : Balance} </div>
      <form style={{ display: 'flex', flexDirection: 'column', gap: '25px', width: '50%' }} onSubmit={handleSubmit(onSubmit)} >
        <TextField type='text' id='name' placeholder='name' {...register('name', { required: true })} />
        {errors?.name && <span>Please Enter Name</span>}
        <TextField type='text' id='symbol' placeholder='symbol' {...register('symbol', { required: true })} />
        {errors?.symbol && <span>Please Enter Symbol</span>}
        <TextField type='text' id='decimal' placeholder='decimal' {...register('decimal', { required: true })} />
        {errors?.decimal && <span>Please Enter Decimal</span>}
        <TextField type='text' id='total_supply' placeholder='total supply' {...register('total_supply', { required: true })} />
        {errors?.total_supply && <span>Please Enter Total Supply</span>}
        <TextField type='text' id='contract_name' placeholder='contract name' {...register('contract_name', { required: true })} />
        {errors?.contract_name && <span>Please Enter Contract Name</span>}
        <Button color="primary" style={{ color: 'black', borderColor: "black" }} variant="outlined" type='submit' >Submit</Button>
      </form>
      <a href={deployContractAddress} >{deployContractAddress}</a>

      <Button onClick={() => { router.push('/') }} >Back</Button>
    </div>
  );
}
