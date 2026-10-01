'use client'

import { useState } from 'react'
import Web3 from 'web3'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { useAccount, useBalance, useDisconnect, useSwitchChain } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'
import { polygon, mainnet, bscTestnet, bsc, polygonAmoy, sepolia } from '@reown/appkit/networks'
import toast, { Toaster } from 'react-hot-toast'
import styles from './page.module.css'

const networks = [
  { label: 'Ethereum', value: mainnet, currency: 'ETH' },
  { label: 'Sepolia', value: sepolia, currency: 'ETH' },
  { label: 'BNB Smart Chain', value: bsc, currency: 'BNB' },
  { label: 'BSC Testnet', value: bscTestnet, currency: 'BNB' },
  { label: 'Polygon', value: polygon, currency: 'POL' },
  { label: 'Polygon Amoy', value: polygonAmoy, currency: 'POL' },
]

const fields = [
  ['name', 'Token name', 'e.g. HashMint Token', 'The full name shown in wallets and explorers.'],
  ['symbol', 'Token symbol', 'e.g. HMT', 'A short ticker for your token.'],
  ['decimal', 'Decimals', 'e.g. 18', 'How many decimal places your token uses.'],
  ['total_supply', 'Initial supply', 'e.g. 1000000', 'Tokens minted to your wallet at deployment.'],
  ['contract_name', 'Contract name', 'e.g. HashMintToken', 'One word, without spaces, for the smart contract.'],
]

export default function HashMint() {
  const { open } = useAppKit()
  const { disconnect } = useDisconnect()
  const { address, chainId, connector, isConnected } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  const { register, handleSubmit, formState: { errors }, reset } = useForm()
  const [loading, setLoading] = useState(false)
  const [deployContractAddress, setDeployContractAddress] = useState('')
  const [txData, setTxData] = useState('')
  const [sourceCode, setSourceCode] = useState('')
  const [contractName, setContractName] = useState('')
  const activeNetwork = networks.find((item) => item.value.id === Number(chainId))
  const selectedNetwork = isConnected && activeNetwork ? String(activeNetwork.value.id) : ''
  const { data: balanceData, isPending: balancePending, isFetching: balanceFetching, isError: balanceError, refetch: refetchBalance } = useBalance({
    address: isConnected ? address : undefined,
    chainId: activeNetwork?.value.id,
    query: { enabled: Boolean(isConnected && address && activeNetwork), refetchOnWindowFocus: true },
  })
  const balanceText = !activeNetwork
    ? 'Unsupported network'
    : balanceError
    ? 'Balance unavailable'
    : balancePending || balanceFetching || !balanceData
      ? 'Loading balance…'
      : `${Number(balanceData.formatted).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${balanceData.symbol || activeNetwork?.currency || ''}`

  const onNetworkChange = async (event) => {
    const id = event.target.value
    const network = networks.find((item) => String(item.value.id) === id)
    if (network && isConnected && network.value.id !== Number(chainId)) {
      try { await switchChainAsync({ chainId: network.value.id }) }
      catch (error) { toast.error('Could not switch network') }
    }
  }

  const onSubmit = async (data) => {
    try {
      if (!isConnected || !address || !connector) {
        await open()
        return
      }
      if (!activeNetwork) return toast.error('Select a supported network')
      setLoading(true)
      const provider = await connector.getProvider()
      if (!provider) throw new Error('Wallet provider is unavailable. Reconnect your wallet and try again.')
      const web3 = new Web3(provider)
      if (Number(await web3.eth.getChainId()) !== activeNetwork.value.id) {
        throw new Error('Wallet network changed. Select the deployment network again.')
      }
      const res = await fetch('/api/compile', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, symbol: data.symbol, decimal: data.decimal, totalsupply: data.total_supply, contractName: data.contract_name }),
      })
      const result = await res.json()
      if (!result?.result?.abi || !result?.result?.bytecode) throw new Error(result?.message || 'Contract compilation failed')
      const contract = new web3.eth.Contract(result.result.abi)
      const deployment = contract.deploy({ data: '0x' + result.result.bytecode, arguments: [] })
      const gas = await deployment.estimateGas({ from: address })
      const tx = await deployment.send({ from: address, gas, gasPrice: 10000000000 })
      refetchBalance()
      setTxData(tx)
      setSourceCode(result.result.sourceCode)
      setContractName(data.contract_name)
      const explorerUrls = {
        56: process.env.NEXT_PUBLIC_BSCURL_WEB, 97: process.env.NEXT_PUBLIC_BSCURL_TEST_WEB,
        11155111: process.env.NEXT_PUBLIC_ETHURL_TEST_WEB, 1: process.env.NEXT_PUBLIC_ETHURL_WEB,
        137: process.env.NEXT_PUBLIC_POLURL_WEB, 80002: process.env.NEXT_PUBLIC_POLURL_TEST_WEB,
      }
      const explorer = explorerUrls[chainId]
      setDeployContractAddress(explorer ? `${explorer}/address/${tx?._address}` : '')
      reset()
      toast.success('Token deployed successfully')
    } catch (error) {
      console.error(error)
      toast.error(error?.message || 'Token deployment failed')
    } finally { setLoading(false) }
  }

  const verifyContract = async () => {
    try {
      setLoading(true)
      const response = await axios.post(`${process.env.NEXT_PUBLIC_ETH_URL}/api?chainid=${chainId}`, {
        chainid: chainId, apikey: process.env.NEXT_PUBLIC_ETH_API, module: 'contract', action: 'verifysourcecode',
        contractaddress: txData?._address, sourceCode: `${sourceCode}`, codeformat: 'solidity-single-file',
        contractname: contractName, compilerversion: 'v0.8.28+commit.7893614a', optimizationUsed: 0,
        runs: 200, constructorArguements: '', evmversion: '', licenseType: 3,
      }, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
      if (response?.data?.message === 'OK') {
        toast.success('Contract verified successfully')
        setDeployContractAddress('')
      }
    } catch (error) {
      console.error(error)
      toast.error('Contract verification failed')
    } finally { setLoading(false) }
  }

  return <div className={styles.site}>
    <Toaster position="top-center" />
    <header className={styles.header}>
      <a className={styles.brand} href="/" aria-label="HashMint home"><span className={styles.brandMark}>H<span>✦</span></span><span>HashMint</span></a>
      <nav className={styles.nav} aria-label="Main navigation"><a href="#create">Create token</a><a href="/tokenDetails">Token details</a><a href="/erc20TokenList">Token list</a><a href="#how-it-works">How it works</a><a href="#networks">Networks</a></nav>
      <div className={styles.walletArea}>{isConnected ? <>
        <div className={styles.walletDetails}><span className={styles.walletAddress}><span className={styles.statusDot} />{address?.slice(0, 6)}...{address?.slice(-4)}</span><span className={styles.walletBalance}>{balanceText}</span></div>
        <button className={styles.walletButton} type="button" onClick={() => disconnect()}>Disconnect</button>
      </> : <button className={styles.walletButton} type="button" onClick={() => open()}>Connect wallet <span aria-hidden="true">↗</span></button>}</div>
    </header>
    <main>
      <section className={styles.hero}><div className={styles.eyebrow}><span className={styles.eyebrowDot} /> ERC-20 TOKEN CREATOR</div><h1>Launch your token<br /><em>with confidence.</em></h1><p>Create and deploy an ERC-20 token in minutes. Set your details, choose a supported network, and mint your initial supply to your wallet.</p><a className={styles.heroLink} href="#create">Start creating <span aria-hidden="true">↓</span></a><div className={styles.heroOrnament} aria-hidden="true"><span>HM</span><i /></div></section>
      <section className={styles.workspace} id="create"><div className={styles.sectionIntro}><span className={styles.sectionIndex}>01 / CREATE</span><h2>Your token starts here.</h2><p>Enter the details below to create your ERC-20 contract. Review everything in your wallet before confirming the transaction.</p></div>
        <div className={styles.workspaceGrid}><div className={styles.formCard}><div className={styles.cardHeading}><div><span className={styles.cardKicker}>TOKEN SETUP</span><h3>Token details</h3></div><span className={styles.stepPill}>Step 1 of 1</span></div>
          <form onSubmit={handleSubmit(onSubmit)}><div className={styles.networkField}><label htmlFor="network">Deploy network</label><select id="network" value={selectedNetwork} onChange={onNetworkChange} disabled={!isConnected}><option value="">{isConnected ? 'Select a network' : 'Connect wallet to select a network'}</option>{networks.map((network) => <option key={network.value.id} value={String(network.value.id)}>{network.label}</option>)}</select><small>Make sure your wallet has enough native currency for gas.</small>
            {isConnected && <div className={styles.networkBalance}><span>Wallet balance{activeNetwork ? ` · ${activeNetwork.label}` : ''}</span><strong>{balanceText}</strong></div>}
          </div>
            <div className={styles.fieldGrid}>{fields.map(([name, label, placeholder, hint]) => <div className={styles.field} key={name}><label htmlFor={name}>{label}</label><input id={name} type="text" placeholder={placeholder} aria-invalid={Boolean(errors[name])} {...register(name, { required: true })} /><small>{errors[name] ? `${label} is required.` : hint}</small></div>)}</div>
            <div className={styles.formFooter}><p><span aria-hidden="true">✦</span> Initial supply is minted to your connected wallet.</p><button className={styles.submitButton} type={isConnected ? 'submit' : 'button'} onClick={isConnected ? undefined : () => open()} disabled={loading}>{loading ? 'Deploying token…' : 'Create token'} <span aria-hidden="true">↗</span></button></div></form>
          {txData && <div className={styles.successPanel} role="status"><div><strong>Token deployed</strong><p>Your contract is ready on the selected network.</p></div>{deployContractAddress && <a href={deployContractAddress} target="_blank" rel="noopener noreferrer">View on explorer ↗</a>}<button type="button" onClick={verifyContract} disabled={loading}>{loading ? 'Verifying…' : 'Verify contract'}</button></div>}
        </div><aside className={styles.sidePanel}><div className={styles.sideIcon} aria-hidden="true">✦</div><h3>Built for a smooth launch.</h3><p>From token details to on-chain deployment, everything you need is in one place.</p><div className={styles.sideDivider} /><div className={styles.sideItem}><span>01</span><div><strong>Choose your network</strong><p>Deploy on Ethereum, BNB Smart Chain, or Polygon.</p></div></div><div className={styles.sideItem}><span>02</span><div><strong>Set token details</strong><p>Define the name, symbol, decimals, and initial supply.</p></div></div><div className={styles.sideItem}><span>03</span><div><strong>Confirm in your wallet</strong><p>Approve the deployment transaction to create your token.</p></div></div><div className={styles.sideNote}>Your wallet stays in control of every transaction.</div></aside></div>
      </section>
      <section className={styles.howSection} id="how-it-works"><span className={styles.sectionIndex}>02 / THE PROCESS</span><div><h2>Simple from start<br />to launch.</h2><p>Connect your wallet, customize your ERC-20 token, and confirm the deployment. Once complete, open your contract in the network explorer.</p></div></section>
      <section className={styles.networksSection} id="networks"><div><span className={styles.sectionIndex}>03 / SUPPORTED NETWORKS</span><h2>Go where your community is.</h2><p>Launch on mainnet or try a testnet first.</p></div><div className={styles.networkTags}>{networks.map((network) => <span key={network.value.id}>{network.label}</span>)}</div></section>
    </main>
    <footer className={styles.footer}><div className={styles.brand}><span className={styles.brandMark}>H<span>✦</span></span><span>HashMint</span></div><p>ERC-20 token minting, made simple.</p><span>© {new Date().getFullYear()} HashMint</span></footer>
  </div>
}
