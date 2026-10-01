'use client'

import { useEffect, useState } from 'react'
import Web3 from 'web3'
import { useAccount, useBalance, useDisconnect } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'
import toast, { Toaster } from 'react-hot-toast'
import networkOptions from './networkOptions'
import theme from '../erc20Deploy/page.module.css'
import styles from './page.module.css'

const shortAddress = (value) => value ? `${value.slice(0, 8)}…${value.slice(-6)}` : ''

export default function TokenList() {
  const { open } = useAppKit()
  const { address, chainId, connector, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: balance, isPending: balancePending, isFetching: balanceFetching, isError: balanceError } = useBalance({
    address: isConnected ? address : undefined,
    chainId,
    query: { enabled: Boolean(isConnected && address && chainId), refetchOnWindowFocus: true },
  })
  const [selectedNetwork, setSelectedNetwork] = useState(1)
  const [userAddress, setUserAddress] = useState('')
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [addingToken, setAddingToken] = useState('')
  const selectedNetworkName = networkOptions.find((network) => network.value === selectedNetwork)?.label || 'Selected network'
  const balanceText = balanceError ? 'Balance unavailable'
    : balancePending || balanceFetching || !balance ? 'Loading balance…'
    : `${Number(balance.formatted).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${balance.symbol}`

  useEffect(() => {
    if (address) setUserAddress(address)
  }, [address])

  const searchTokens = async (event) => {
    event.preventDefault()
    if (!Web3.utils.isAddress(userAddress.trim())) return toast.error('Enter a valid wallet address')
    try {
      setLoading(true)
      setSearched(false)
      setTokens([])
      const response = await fetch('/api/getTokenList', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ChainId: selectedNetwork, Address: userAddress.trim() }),
      })
      if (!response.ok) throw new Error('Token search is unavailable right now')
      const data = await response.json()
      if (!data?.success || !Array.isArray(data.result)) throw new Error(data?.message || 'Could not load tokens')
      setTokens(data.result)
      setSearched(true)
    } catch (error) {
      toast.error(error?.message || 'Could not load tokens')
    } finally {
      setLoading(false)
    }
  }

  const copyAddress = async (contractAddress) => {
    try {
      await navigator.clipboard.writeText(contractAddress)
      toast.success('Contract address copied')
    } catch (error) {
      toast.error('Could not copy the address')
    }
  }

  const addToken = async (token) => {
    if (!isConnected || !connector) {
      await open()
      return
    }
    try {
      setAddingToken(token.contractAddress)
      const provider = await connector.getProvider()
      if (!provider?.request) throw new Error('This wallet does not support adding tokens')
      const hexChainId = `0x${selectedNetwork.toString(16)}`
      const currentChainId = await provider.request({ method: 'eth_chainId' })
      if (Number(currentChainId) !== selectedNetwork) {
        await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hexChainId }] })
      }
      const added = await provider.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: token.contractAddress,
            symbol: token.tokenSymbol,
            decimals: Number(token.tokenDecimal),
          },
        },
      })
      if (added) toast.success(`${token.tokenSymbol || 'Token'} added to wallet`)
    } catch (error) {
      toast.error(error?.message || 'Could not add token to wallet')
    } finally {
      setAddingToken('')
    }
  }

  return <div className={`${theme.site} ${styles.page}`}>
    <Toaster position="top-center" />
    <header className={theme.header}>
      <a className={theme.brand} href="/" aria-label="HashMint home"><span className={theme.brandMark}>H<span>✦</span></span><span>HashMint</span></a>
      <nav className={theme.nav} aria-label="Main navigation"><a href="/">Create token</a><a href="/tokenDetails">Token details</a><a className={styles.activeNav} href="/erc20TokenList" aria-current="page">Token list</a></nav>
      <div className={theme.walletArea}>{isConnected ? <><div className={theme.walletDetails}><span className={theme.walletAddress}><span className={theme.statusDot} />{shortAddress(address)}</span><span className={theme.walletBalance}>{balanceText}</span></div><button className={theme.walletButton} type="button" onClick={() => disconnect()}>Disconnect</button></> : <button className={theme.walletButton} type="button" onClick={() => open()}>Connect wallet <span aria-hidden="true">↗</span></button>}</div>
    </header>
    <main>
      <section className={styles.intro}><div className={styles.introInner}><span className={theme.eyebrow}><span className={theme.eyebrowDot} /> ERC-20 TOKEN LIST</span><h1>See what’s in<br /><em>your wallet.</em></h1><p>Find ERC-20 tokens associated with an address across supported networks. Copy a contract address or add a token to your wallet.</p></div><div className={styles.introArt} aria-hidden="true"><span>✦</span></div></section>
      <section className={styles.workspace}><div className={styles.content}><span className={theme.sectionIndex}>01 / SEARCH</span><h2>Find tokens by address.</h2><p>Search any wallet address. Connecting your wallet fills in its address automatically.</p><form className={styles.searchCard} onSubmit={searchTokens}><div className={styles.cardHeading}><div><span className={theme.cardKicker}>TOKEN SEARCH</span><h3>Choose where to look</h3></div><span className={theme.stepPill}>Step 1 of 2</span></div><div className={styles.searchFields}><label><span>Network</span><select value={selectedNetwork} onChange={(event) => { setSelectedNetwork(Number(event.target.value)); setSearched(false); setTokens([]) }}>{networkOptions.map((network) => <option key={network.value} value={network.value}>{network.label}</option>)}</select></label><label><span>Wallet address</span><input value={userAddress} onChange={(event) => { setUserAddress(event.target.value); setSearched(false); setTokens([]) }} placeholder="0x…" spellCheck="false" /></label></div><div className={styles.searchFooter}><span>Results are based on the network’s available ERC-20 transfer history.</span><button className={theme.submitButton} type="submit" disabled={loading}>{loading ? 'Searching…' : 'Search tokens'} <span aria-hidden="true">↗</span></button></div></form></div></section>
      <section className={styles.resultsSection}><div className={styles.content}><div className={styles.resultsHeading}><div><span className={theme.sectionIndex}>02 / RESULTS</span><h2>Tokens found.</h2><p>{searched ? `${tokens.length} token${tokens.length === 1 ? '' : 's'} found for this address on ${selectedNetworkName}.` : 'Search an address above to see its tokens.'}</p></div>{searched && <span className={styles.countPill}>{tokens.length} results</span>}</div>{loading && <div className={styles.emptyState} role="status">Searching token transfers…</div>}{searched && tokens.length === 0 && <div className={styles.emptyState}>No ERC-20 tokens were found for this address on {selectedNetworkName}.</div>}{tokens.length > 0 && <div className={styles.tokenGrid}>{tokens.map((token) => <article className={styles.tokenCard} key={`${selectedNetwork}:${token.contractAddress}`}><div className={styles.tokenTop}><div className={styles.tokenIcon}>{token.tokenSymbol?.slice(0, 2)?.toUpperCase() || 'T'}</div><span className={styles.tokenSymbol}>{token.tokenSymbol || 'TOKEN'}</span></div><h3>{token.tokenName || 'Unnamed token'}</h3><div className={styles.balance}><span>Transfer history balance</span><strong>{Number(token.balance).toLocaleString(undefined, { maximumFractionDigits: 8 })}</strong></div><div className={styles.addressRow}><span>Contract</span><code title={token.contractAddress}>{shortAddress(token.contractAddress)}</code></div><div className={styles.cardActions}><button type="button" onClick={() => copyAddress(token.contractAddress)}>Copy address</button><button type="button" onClick={() => addToken(token)} disabled={Boolean(addingToken)}>{addingToken === token.contractAddress ? 'Adding…' : 'Add to wallet'} <span aria-hidden="true">↗</span></button></div></article>)}</div>}</div></section>
    </main>
    <footer className={theme.footer}><a className={theme.brand} href="/"><span className={theme.brandMark}>H<span>✦</span></span><span>HashMint</span></a><p>ERC-20 token minting, made simple.</p><span>© {new Date().getFullYear()} HashMint</span></footer>
  </div>
}
