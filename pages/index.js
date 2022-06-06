import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Web3Modal from 'web3modal'
import { providers, Contract, utils, BigNumber } from 'ethers'
import { useEffect, useRef, useState } from 'react'
import {
  NFT_CONTRACT_ADDRESS,
  NFT_CONTRACT_ABI,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS
} from '../contants'

export default function Home() {
  const zero = BigNumber.from(0)
  const [walletConnected, setWalletConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero)
  const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] = useState(zero)
  const [tokenAmount, setTokenAmount] = useState(zero)
  const [tokensMinted, setTokensMinted] = useState(zero)
  const web3ModalRef = useRef()

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect()
    const web3Provider = new providers.Web3Provider(provider)

    const { chainId } = await web3Provider.getNetwork()
    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby")
      throw new Error("Change network to Rinkeby")
    }

    if (needSigner) {
      const signer = web3Provider.getSigner()
      return signer
    }
    return web3Provider
  }

  const getTokensToBeClaimed = async () => {
    try {
      const provider = await getProviderOrSigner()
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider)
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider)

      const signer = await getProviderOrSigner(true)
      const address = await signer.getAddress()
      const balance = await nftContract.balanceOf(address)
      if (balance === zero) {
        setTokensToBeClaimed(zero)
      } else {
        let amount = 0
        for (let i = 0; i < balance; i++) {
          const tokenId = await nftContract.tokenOfOwnerByIndex(address, i)
          const claimed = await tokenContract.tokenIdsCalimed(tokenId);
          if (!claimed) {
            amount++
          }
        }
        setTokensToBeClaimed(BigNumber.from(amount))
      }
    } catch (error) {
      console.log(error)
      setTokensToBeClaimed(zero)
    }
  }

  const getBalanceOfCryptoDevTokens = async () => {
    try {
      const provider = await getProviderOrSigner()
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider)

      const signer = await getProviderOrSigner(true)
      const address = await signer.getAddress()
      const balance = await tokenContract.balanceOf(address)
      setBalanceOfCryptoDevTokens(balance)
    } catch (error) {
      console.log(error)
      setBalanceOfCryptoDevTokens(zero)
    }
  }

  const mintCryptoDevToken = async (amount) => {
    try {
      const signer = await getProviderOrSigner(true)
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, signer)

      const value = 0.001 * amount
      const tx = await tokenContract.mint(amount, {
        value: utils.parseEther(value.toString()),
      })
      setLoading(true)
      await tx.wait()
      setLoading(false)
      window.alert('Successfully minted Crypto Dev Tokens')
      await getBalanceOfCryptoDevTokens()
      await getTotalTokensMinted()
      await getTokensToBeClaimed()
    } catch (error) {
      console.log(error)
    }
  }

  const getTotalTokensMinted = async () => {
    try {
      const provider = await getProviderOrSigner()
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider)

      const _tokensMinted = await tokenContract.totalSupply()
      setTokensMinted(_tokensMinted)
    } catch (error) {
      console.log(error)
      return false
    }
  }

  const claimCrptoDevTokens = async () => {
    try {
      const signer = await getProviderOrSigner(true)
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, signer)

      const tx = await tokenContract.claim()
      setLoading(true)
      await tx.wait()
      setLoading(false)
      window.alert('Successfully cliamed Crypto Dev Tokens')
      await getBalanceOfCryptoDevTokens()
      await getTokensToBeClaimed()
      await getTotalTokensMinted()
    } catch (error) {
      console.log(error)
    }
  }

  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner()
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider)

      const _owner = await nftContract.owner()
      const signer = await getProviderOrSigner(true)
      const address = await signer.getAddress()

      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true)
      }
    } catch (error) {
      console.error(error.message)
    }
  }

  const connectWallet = async () => {
    try {
      await getProviderOrSigner()
      setWalletConnected(true)
    } catch (error) {
      console.log(error)
    }
  }

  const renderButton = () => {
    if (loading) {
      return <button className={styles.button}>Loading...</button>
    }

    if (tokensToBeClaimed > 0) {
      return (
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed * 10} Tokens can be claimed!
          </div>
          <button className={styles.button} onClick={claimCrptoDevTokens}>
            Claim Tokens
          </button>
        </div>
      )
    }

    return (
      <div style={{ display: 'flex-col' }}>
        <div>
          <input
            type='number'
            placeholder='Amount of Tokens'
            onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
            className={styles.input}
          />
        </div>
        <button
          className={styles.button}
          onClick={() => mintCryptoDevToken(tokenAmount)}
          disabled={!(tokenAmount > 0)}
        >
          Mint Tokens
        </button>
      </div>
    )

  }

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: 'rinkeby',
        providerOptions: {},
        disableInjectedProvider: false
      })
      connectWallet()
      getTotalTokensMinted()
      getBalanceOfCryptoDevTokens()
      getTokensToBeClaimed()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletConnected])

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name='description' content='ICO-Dapp' />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs ICO!</h1>
          <div className={styles.description}>
            You can claim or mint Crypto Dev tokens here
          </div>
          {walletConnected ? (
            <div>
              <div className={styles.description}>
                You have minted {utils.formatEther(balanceOfCryptoDevTokens)} Crpto Dev Tokens
              </div>
              <div className={styles.description}>
                Overall {utils.formatEther(tokensMinted)}/10000 have been minted!!!
              </div>
              {renderButton()}
            </div>
          ) : (
            <button onClick={connectWallet} className={styles.button}>Connect Your Wallet</button>
          )}
        </div>
        <div>
          <img className={styles.image} src='./crypto-devs.svg' />
        </div>
      </div>
      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  )
}
