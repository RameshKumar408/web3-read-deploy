'use client'

import { useState } from 'react'
import Web3 from 'web3'
import axios from 'axios'
import { useAccount, useBalance, useDisconnect, useSwitchChain } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'
import { polygon, mainnet, bscTestnet, bsc, polygonAmoy, sepolia } from '@reown/appkit/networks'
import toast, { Toaster } from 'react-hot-toast'
import fallbackAbi from './Abi.json'
import theme from '../erc20Deploy/page.module.css'
import styles from './page.module.css'

const networks = [
  { label: 'Ethereum', value: mainnet, currency: 'ETH', api: process.env.NEXT_PUBLIC_ETH_URL, apiKey: process.env.NEXT_PUBLIC_ETH_API, explorer: process.env.NEXT_PUBLIC_ETHURL_WEB },
  { label: 'Sepolia', value: sepolia, currency: 'ETH', api: process.env.NEXT_PUBLIC_ETH_TEST_URL, apiKey: process.env.NEXT_PUBLIC_ETH_API, explorer: process.env.NEXT_PUBLIC_ETHURL_TEST_WEB },
  { label: 'BNB Smart Chain', value: bsc, currency: 'BNB', api: process.env.NEXT_PUBLIC_BSC_URL, apiKey: process.env.NEXT_PUBLIC_BSC_API, explorer: process.env.NEXT_PUBLIC_BSCURL_WEB },
  { label: 'BSC Testnet', value: bscTestnet, currency: 'BNB', api: process.env.NEXT_PUBLIC_BSC_TEST_URL, apiKey: process.env.NEXT_PUBLIC_BSC_API, explorer: process.env.NEXT_PUBLIC_BSCURL_TEST_WEB },
  { label: 'Polygon', value: polygon, currency: 'POL', api: process.env.NEXT_PUBLIC_POLY_URL, apiKey: process.env.NEXT_PUBLIC_POLY_API, explorer: process.env.NEXT_PUBLIC_POLURL_WEB },
  { label: 'Polygon Amoy', value: polygonAmoy, currency: 'POL', api: process.env.NEXT_PUBLIC_POLY_TEST_URL, apiKey: process.env.NEXT_PUBLIC_POLY_API, explorer: process.env.NEXT_PUBLIC_POLURL_TEST_WEB },
]

const methodKey = (method) => `${method.name}(${(method.inputs || []).map((input) => input.type).join(',')})`
const displayValue = (value) => typeof value === 'bigint' ? value.toString() : JSON.stringify(value, (_, part) => typeof part === 'bigint' ? part.toString() : part, 2) ?? String(value)
const standardMethods = new Set(['allowance', 'approve', 'balanceOf', 'decimals', 'name', 'symbol', 'totalSupply', 'transfer', 'transferFrom'])
const standardAbi = fallbackAbi.filter((item) => item.type === 'function' && standardMethods.has(item.name))

export default function TokenDetails() {
  const { open } = useAppKit()
  const { address, chainId, connector, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { switchChainAsync } = useSwitchChain()
  const [contractAddress, setContractAddress] = useState('')
  const [loadedAddress, setLoadedAddress] = useState('')
  const [loadedChainId, setLoadedChainId] = useState(null)
  const [abi, setAbi] = useState([])
  const [abiSource, setAbiSource] = useState('')
  const [inputs, setInputs] = useState({})
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(false)
  const [busyMethod, setBusyMethod] = useState('')
  const activeNetwork = networks.find((item) => item.value.id === chainId)
  const { data: balance, isPending: balancePending } = useBalance({
    address: isConnected ? address : undefined,
    chainId: activeNetwork?.value.id,
    query: { enabled: Boolean(isConnected && address && activeNetwork) },
  })
  const balanceText = !activeNetwork ? 'Unsupported network' : balancePending || !balance
    ? 'Loading balance…'
    : `${Number(balance.formatted).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${balance.symbol || activeNetwork.currency}`
  const methods = abi.filter((item) => item.type === 'function')
  const readMethods = methods.filter((item) => item.stateMutability === 'view' || item.stateMutability === 'pure')
  const writeMethods = methods.filter((item) => item.stateMutability === 'nonpayable' || item.stateMutability === 'payable')
  const loadedOnCurrentNetwork = Boolean(loadedAddress && loadedChainId === chainId)

  const clearContract = () => {
    setAbi([])
    setAbiSource('')
    setLoadedAddress('')
    setLoadedChainId(null)
    setInputs({})
    setResults({})
  }

  const getWeb3 = async () => {
    if (!isConnected || !address || !connector) {
      await open()
      return null
    }
    const provider = await connector.getProvider()
    if (!provider) throw new Error('Wallet provider is unavailable. Reconnect your wallet and try again.')
    const web3 = new Web3(provider)
    if (Number(await web3.eth.getChainId()) !== chainId) throw new Error('Wallet network changed. Select the network again.')
    return web3
  }

  const onNetworkChange = async (event) => {
    const nextChainId = Number(event.target.value)
    if (!nextChainId || nextChainId === chainId) return
    try {
      await switchChainAsync({ chainId: nextChainId })
      clearContract()
    } catch (error) {
      toast.error(error?.shortMessage || error?.message || 'Could not switch network')
    }
  }

  const loadContract = async (event) => {
    event.preventDefault()
    if (!Web3.utils.isAddress(contractAddress.trim())) return toast.error('Enter a valid contract address')
    if (!activeNetwork) return toast.error('Select a supported network')
    try {
      const web3 = await getWeb3()
      if (!web3) return
      setLoading(true)
      clearContract()
      const normalizedAddress = contractAddress.trim()
      const code = await web3.eth.getCode(normalizedAddress)
      if (!code || code === '0x') throw new Error('No contract found at this address on the selected network')

      let contractAbi = standardAbi
      let source = 'Standard ERC-20 ABI'
      if (activeNetwork.api) {
        try {
          const { data } = await axios.get(`${activeNetwork.api.replace(/\/$/, '')}/api`, {
            params: { module: 'contract', action: 'getabi', address: normalizedAddress, apikey: activeNetwork.apiKey },
          })
          if (data?.status === '1') {
            contractAbi = JSON.parse(data.result)
            source = 'Verified contract ABI'
          }
        } catch (error) {
          console.error('Could not load verified ABI:', error)
        }
      }
      setAbi(contractAbi)
      setAbiSource(source)
      setLoadedAddress(normalizedAddress)
      setLoadedChainId(chainId)
      toast.success('Contract loaded')
    } catch (error) {
      toast.error(error?.message || 'Could not load contract')
    } finally {
      setLoading(false)
    }
  }

  const runMethod = async (method, mode) => {
    const key = methodKey(method)
    if (!loadedOnCurrentNetwork) return toast.error('Load this contract on the current network first')
    try {
      const web3 = await getWeb3()
      if (!web3) return
      setBusyMethod(`${mode}:${key}`)
      setResults((previous) => ({ ...previous, [`${mode}:${key}`]: null }))
      const contract = new web3.eth.Contract(abi, loadedAddress)
      const args = (method.inputs || []).map((input, index) => inputs[`${mode}:${key}:${index}`] ?? '')
      const call = contract.methods[key](...args)
      const result = mode === 'read' ? await call.call({ from: address }) : await call.send({ from: address })
      const transactionHash = mode === 'write' ? result?.transactionHash : null
      setResults((previous) => ({ ...previous, [`${mode}:${key}`]: {
        value: mode === 'read' ? displayValue(result) : 'Transaction confirmed', transactionHash,
      } }))
      if (mode === 'write') toast.success('Transaction confirmed')
    } catch (error) {
      toast.error(error?.shortMessage || error?.message || 'Contract action failed')
    } finally {
      setBusyMethod('')
    }
  }

  const renderMethod = (method, mode) => {
    const key = methodKey(method)
    const result = results[`${mode}:${key}`]
    const explorer = activeNetwork?.explorer?.replace(/\/$/, '')
    return <div className={styles.methodCard} key={`${mode}:${key}`}>
      <div className={styles.methodHeading}><strong>{method.name}</strong><span>{method.stateMutability}</span></div>
      <p className={styles.signature}>{key}</p>
      {(method.inputs || []).map((input, index) => <label className={styles.methodInput} key={`${key}:${index}`}>
        <span>{input.name || `Parameter ${index + 1}`} <small>{input.type}</small></span>
        <input value={inputs[`${mode}:${key}:${index}`] ?? ''} onChange={(event) => setInputs((previous) => ({ ...previous, [`${mode}:${key}:${index}`]: event.target.value }))} placeholder={`Enter ${input.type}`} />
      </label>)}
      <button className={mode === 'write' ? styles.writeButton : styles.readButton} type="button" disabled={Boolean(busyMethod)} onClick={() => runMethod(method, mode)}>{busyMethod === `${mode}:${key}` ? 'Processing…' : mode === 'read' ? 'Read value' : 'Send transaction'} <span aria-hidden="true">↗</span></button>
      {result && <div className={styles.result} role="status"><span>{mode === 'read' ? 'Result' : 'Status'}</span><pre>{result.value}</pre>{result.transactionHash && explorer && <a href={`${explorer}/tx/${result.transactionHash}`} target="_blank" rel="noopener noreferrer">View transaction ↗</a>}</div>}
    </div>
  }

  return <div className={`${theme.site} ${styles.page}`}>
    <Toaster position="top-center" />
    <header className={theme.header}>
      <a className={theme.brand} href="/" aria-label="HashMint home"><span className={theme.brandMark}>H<span>✦</span></span><span>HashMint</span></a>
      <nav className={theme.nav} aria-label="Main navigation"><a href="/">Create token</a><a className={styles.activeNav} href="/tokenDetails" aria-current="page">Token details</a><a href="/erc20TokenList">Token list</a></nav>
      <div className={theme.walletArea}>{isConnected ? <><div className={theme.walletDetails}><span className={theme.walletAddress}><span className={theme.statusDot} />{address?.slice(0, 6)}...{address?.slice(-4)}</span><span className={theme.walletBalance}>{balanceText}</span></div><button className={theme.walletButton} type="button" onClick={() => disconnect()}>Disconnect</button></> : <button className={theme.walletButton} type="button" onClick={() => open()}>Connect wallet <span aria-hidden="true">↗</span></button>}</div>
    </header>
    <main>
      <section className={styles.intro}><div className={styles.introInner}><span className={theme.eyebrow}><span className={theme.eyebrowDot} /> TOKEN EXPLORER</span><h1>Get to know<br /><em>your token.</em></h1><p>Look up a contract, read its on-chain details, and interact with its available functions on the network you choose.</p></div><div className={styles.introArt} aria-hidden="true"><span>ERC<br />20</span></div></section>
      <section className={styles.workspace}><div className={styles.sectionIntro}><span className={theme.sectionIndex}>01 / LOOK UP</span><h2>Explore a contract.</h2><p>Connect your wallet, select a network, and enter a contract address to view its available functions.</p></div>
        <div className={styles.lookupGrid}><form className={styles.lookupCard} onSubmit={loadContract}><div className={styles.cardHeading}><div><span className={theme.cardKicker}>CONTRACT LOOKUP</span><h3>Find token details</h3></div><span className={theme.stepPill}>Step 1 of 2</span></div><label className={styles.field}><span>Network</span><select value={activeNetwork ? String(chainId) : ''} onChange={onNetworkChange} disabled={!isConnected}><option value="">{isConnected ? 'Select a supported network' : 'Connect wallet to select a network'}</option>{networks.map((network) => <option key={network.value.id} value={network.value.id}>{network.label}</option>)}</select></label><label className={styles.field}><span>Contract address</span><input value={contractAddress} onChange={(event) => { setContractAddress(event.target.value); clearContract() }} placeholder="0x…" spellCheck="false" /></label><div className={styles.lookupFooter}><span>Use the address of an ERC-20 contract on the selected network.</span><button className={theme.submitButton} type={!isConnected ? 'button' : 'submit'} onClick={!isConnected ? () => open() : undefined} disabled={loading}>{loading ? 'Loading…' : 'Load contract'} <span aria-hidden="true">↗</span></button></div></form><aside className={styles.helpCard}><div className={theme.sideIcon} aria-hidden="true">✦</div><h3>Your contract, in focus.</h3><p>Read functions show on-chain data. Write functions request a wallet transaction.</p><div className={styles.helpDivider} /><div><strong>01</strong><span>Choose the network where your token lives.</span></div><div><strong>02</strong><span>Paste its contract address and load the ABI.</span></div><div><strong>03</strong><span>Read values or confirm a transaction in your wallet.</span></div></aside></div>
      </section>
      <section className={styles.methodsSection}><div className={styles.methodsIntro}><div><span className={theme.sectionIndex}>02 / INTERACT</span><h2>Contract functions.</h2><p>{loadedOnCurrentNetwork ? `${abiSource} · ${loadedAddress}` : 'Load a contract above to see its read and write functions.'}</p></div>{loadedOnCurrentNetwork && <span className={styles.methodCount}>{methods.length} functions</span>}</div>{loadedOnCurrentNetwork && <div className={styles.methodColumns}><div><div className={styles.columnHeading}><span>READ CONTRACT</span><h3>Explore on-chain values</h3><p>Reading does not submit a transaction.</p></div>{readMethods.length ? readMethods.map((method) => renderMethod(method, 'read')) : <p className={styles.emptyColumn}>No read functions found.</p>}</div><div><div className={styles.columnHeading}><span>WRITE CONTRACT</span><h3>Make a change</h3><p>Your wallet will ask you to confirm each transaction.</p></div>{writeMethods.length ? writeMethods.map((method) => renderMethod(method, 'write')) : <p className={styles.emptyColumn}>No write functions found.</p>}</div></div>}</section>
    </main>
    <footer className={theme.footer}><a className={theme.brand} href="/"><span className={theme.brandMark}>H<span>✦</span></span><span>HashMint</span></a><p>ERC-20 token minting, made simple.</p><span>© {new Date().getFullYear()} HashMint</span></footer>
  </div>
}
