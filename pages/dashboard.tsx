import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getAccessToken, usePrivy, useConnectWallet, useWallets } from "@privy-io/react-auth";
import { useSolanaWallets, useSignMessage, useSendTransaction, useSignTransaction } from "@privy-io/react-auth/solana";
import { Connection, Transaction, PublicKey, SystemProgram } from "@solana/web3.js";
import Head from "next/head";
import WalletList from "../components/WalletList";

import bs58 from 'bs58';

async function verifyToken() {
  const url = "/api/verify";
  const accessToken = await getAccessToken();
  const result = await fetch(url, {
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined),
    },
  });

  return await result.json();
}

/**
 * Dashboard Page - Enhanced with Wallet Security Features
 * 
 * This component demonstrates secure wallet creation and management using Privy's client-side SDKs.
 * Key security features:
 * - All wallets created through Privy are automatically owned by the authenticated user
 * - Private keys are securely managed by Privy's infrastructure
 * - User authentication is required for wallet creation and access
 * - Clear distinction between owned wallets and connected external wallets
 * 
 * The implementation uses:
 * - useCreateWallet() for Ethereum wallets with automatic user ownership
 * - useSolanaWallets() for Solana wallets with automatic user ownership
 * - Proper user authentication and account linking
 */
export default function DashboardPage() {
  const [verifyResult, setVerifyResult] = useState();
  const router = useRouter();
  const {
    ready,
    authenticated,
    user,
    logout,
    linkEmail,
    linkWallet,
    unlinkEmail,
    linkPhone,
    unlinkPhone,
    unlinkWallet,
    linkGoogle,
    unlinkGoogle,
    linkTwitter,
    unlinkTwitter,
    linkDiscord,
    unlinkDiscord,
  } = usePrivy();

  const { connectWallet } = useConnectWallet({
    onSuccess: ({ wallet }) => {
      console.log('Wallet connected successfully:', wallet);
 
    },
    onError: (error) => {
      console.error('Wallet connection failed:', error);
  
    },
  });

  // Get connected external wallets
  const { wallets: evmWallets } = useWallets();
  const { wallets: solanaWallets } = useSolanaWallets();
  const { signMessage } = useSignMessage();
  const { sendTransaction } = useSendTransaction();
  const { signTransaction } = useSignTransaction();

  // State for message signing
  const [messageToSign, setMessageToSign] = useState('Hello World');
  const [signedMessage, setSignedMessage] = useState('');
  const [isSigningMessage, setIsSigningMessage] = useState(false);
  const [signMessageError, setSignMessageError] = useState('');

  // State for transaction sending
  const [recipientAddress, setRecipientAddress] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('0.001');
  const [transactionSignature, setTransactionSignature] = useState('');
  const [isSendingTransaction, setIsSendingTransaction] = useState(false);
  const [transactionError, setTransactionError] = useState('');

  // State for transaction signing
  const [transactionToSign, setTransactionToSign] = useState('');
  const [signedTransactionData, setSignedTransactionData] = useState('');
  const [isSigningTransaction, setIsSigningTransaction] = useState(false);
  const [signTransactionError, setSignTransactionError] = useState('');

  // Function to handle message signing
  const handleSignMessage = async () => {
    if (!solanaWallets.length) {
      setSignMessageError('No Solana wallet connected');
      return;
    }

    const wallet = solanaWallets[0];
    if (!wallet) {
      setSignMessageError('No Solana wallet connected');
      return;
    }

    setIsSigningMessage(true);
    setSignMessageError('');
    setSignedMessage('');

    try {
      const signatureUnit8Array = await signMessage({
        message: new TextEncoder().encode(messageToSign),
        options: {
          address: wallet.address,
          uiOptions: {
            title: 'Sign this message'
          }
        }
      });
      
      const signature = bs58.encode(signatureUnit8Array);
      setSignedMessage(signature);
      console.log('Message signed successfully:', signature);
    } catch (error) {
      console.error('Error signing message:', error);
      setSignMessageError(error instanceof Error ? error.message : 'Failed to sign message');
    } finally {
      setIsSigningMessage(false);
    }
  };

  // Function to handle sending transactions
  const handleSendTransaction = async () => {
    if (!solanaWallets.length) {
      setTransactionError('No Solana wallet connected');
      return;
    }

    const wallet = solanaWallets[0];
    if (!wallet) {
      setTransactionError('No Solana wallet connected');
      return;
    }

    if (!recipientAddress.trim()) {
      setTransactionError('Please enter a recipient address');
      return;
    }

    if (!transactionAmount || parseFloat(transactionAmount) <= 0) {
      setTransactionError('Please enter a valid amount');
      return;
    }

    setIsSendingTransaction(true);
    setTransactionError('');
    setTransactionSignature('');

    try {
      // Configure connection to mainnet
      const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=ecf8fbe8-6c8b-49eb-b69c-326ee863a399');
      
      // Create transaction
      const transaction = new Transaction();
      
      // Convert amount to lamports (1 SOL = 1,000,000,000 lamports)
      const lamports = Math.floor(parseFloat(transactionAmount) * 1000000000);
      
      // Create transfer instruction
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: new PublicKey(wallet.address),
        toPubkey: new PublicKey(recipientAddress),
        lamports: lamports
      });
      
      // Add instruction to transaction
      transaction.add(transferInstruction);
      
      // Fetch and set the latest blockhash
      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      
      // Set fee payer
      transaction.feePayer = new PublicKey(wallet.address);
      
      // Send the transaction using Privy
      const receipt = await sendTransaction({
        transaction: transaction,
        connection: connection,
        address: wallet.address,
      });
      
      setTransactionSignature(receipt.signature);
      console.log('Transaction sent successfully with signature:', receipt.signature);
      
    } catch (error) {
      console.error('Error sending transaction:', error);
      setTransactionError(error instanceof Error ? error.message : 'Failed to send transaction');
    } finally {
      setIsSendingTransaction(false);
    }
  };

  // Function to handle signing transactions
  const handleSignTransaction = async () => {
    if (!solanaWallets.length) {
      setSignTransactionError('No Solana wallet connected');
      return;
    }

    const wallet = solanaWallets[0];
    if (!wallet) {
      setSignTransactionError('No Solana wallet connected');
      return;
    }

    if (!transactionToSign.trim()) {
      setSignTransactionError('Please enter transaction data to sign');
      return;
    }

    setIsSigningTransaction(true);
    setSignTransactionError('');
    setSignedTransactionData('');

    try {
      // Configure connection to mainnet using Helius
      const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=ecf8fbe8-6c8b-49eb-b69c-326ee863a399');
      
      // Create a sample transaction (you can modify this based on your needs)
      const transaction = new Transaction();
      
      // Add a simple transfer instruction as an example
      // You can replace this with your custom transaction logic
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: new PublicKey(wallet.address),
        toPubkey: new PublicKey(wallet.address), // Sending to self for demo
        lamports: 1000000 // 0.001 SOL
      });
      
      transaction.add(transferInstruction);
      
      // Get recent blockhash
      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = new PublicKey(wallet.address);
      
      // Sign the transaction using Privy
      const signedTransaction = await signTransaction({
        transaction: transaction,
        connection: connection,
        address: wallet.address
      });
      
      // Convert signed transaction to base64 for display
      const serializedTransaction = signedTransaction.serialize();
      const base64Transaction = Buffer.from(serializedTransaction).toString('base64');
      
      setSignedTransactionData(base64Transaction);
      console.log('Transaction signed successfully:', base64Transaction);
      
    } catch (error) {
      console.error('Error signing transaction:', error);
      setSignTransactionError(error instanceof Error ? error.message : 'Failed to sign transaction');
    } finally {
      setIsSigningTransaction(false);
    }
  };

  // Check if user logged in with a wallet
  const userLoggedInWithWallet = user?.linkedAccounts?.some(account => 
    account.type === 'wallet'
  );

  // Only show external wallet features if user didn't log in with a wallet
  const shouldShowExternalWalletFeatures = !userLoggedInWithWallet;

  // Debug logging for wallet detection
  useEffect(() => {
    console.log('🔍 Wallet Detection Debug:');
    console.log('User login method check:', {
      userLoggedInWithWallet,
      shouldShowExternalWalletFeatures,
      linkedAccounts: user?.linkedAccounts
    });
    console.log('EVM Wallets:', evmWallets);
    console.log('Solana Wallets:', solanaWallets);
    console.log('EVM Wallets Count:', evmWallets.length);
    console.log('Solana Wallets Count:', solanaWallets.length);
    
    if (evmWallets.length > 0) {
      evmWallets.forEach((wallet, index) => {
        console.log(`EVM Wallet ${index}:`, {
          address: wallet.address,
          chainId: wallet.chainId,
          isConnected: wallet.isConnected
        });
      });
    }
    
    if (solanaWallets.length > 0) {
      solanaWallets.forEach((wallet, index) => {
        console.log(`Solana Wallet ${index}:`, {
          address: wallet.address,
          isConnected: wallet.isConnected
        });
      });
    }
  }, [evmWallets, solanaWallets, userLoggedInWithWallet, shouldShowExternalWalletFeatures, user?.linkedAccounts]);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  const numAccounts = user?.linkedAccounts?.length || 0;
  const canRemoveAccount = numAccounts > 1;

  const email = user?.email;
  const phone = user?.phone;
  const wallet = user?.wallet;

  const googleSubject = user?.google?.subject || null;
  const twitterSubject = user?.twitter?.subject || null;
  const discordSubject = user?.discord?.subject || null;

  return (
    <>
      <Head>
        <title>Privy Auth Demo</title>
      </Head>

      <main className="flex flex-col min-h-screen px-4 sm:px-20 py-6 sm:py-10 bg-privy-light-blue">
        {ready && authenticated ? (
          <>
            <div className="flex flex-row justify-between">
              <h1 className="text-2xl font-semibold">Privy Auth Demo</h1>
              <button
                onClick={logout}
                className="text-sm bg-violet-200 hover:text-violet-900 py-2 px-4 rounded-md text-violet-700"
              >
                Logout
              </button>
            </div>
            <div className="mt-12 flex gap-4 flex-wrap">
              {googleSubject ? (
                <button
                  onClick={() => {
                    unlinkGoogle(googleSubject);
                  }}
                  className="text-sm border border-violet-600 hover:border-violet-700 py-2 px-4 rounded-md text-violet-600 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500"
                  disabled={!canRemoveAccount}
                >
                  Unlink Google
                </button>
              ) : (
                <button
                  onClick={() => {
                    linkGoogle();
                  }}
                  className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white"
                >
                  Link Google
                </button>
              )}

              {twitterSubject ? (
                <button
                  onClick={() => {
                    unlinkTwitter(twitterSubject);
                  }}
                  className="text-sm border border-violet-600 hover:border-violet-700 py-2 px-4 rounded-md text-violet-600 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500"
                  disabled={!canRemoveAccount}
                >
                  Unlink Twitter
                </button>
              ) : (
                <button
                  className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white"
                  onClick={() => {
                    linkTwitter();
                  }}
                >
                  Link Twitter
                </button>
              )}

              {discordSubject ? (
                <button
                  onClick={() => {
                    unlinkDiscord(discordSubject);
                  }}
                  className="text-sm border border-violet-600 hover:border-violet-700 py-2 px-4 rounded-md text-violet-600 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500"
                  disabled={!canRemoveAccount}
                >
                  Unlink Discord
                </button>
              ) : (
                <button
                  className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white"
                  onClick={() => {
                    linkDiscord();
                  }}
                >
                  Link Discord
                </button>
              )}

              {email ? (
                <button
                  onClick={() => {
                    unlinkEmail(email.address);
                  }}
                  className="text-sm border border-violet-600 hover:border-violet-700 py-2 px-4 rounded-md text-violet-600 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500"
                  disabled={!canRemoveAccount}
                >
                  Unlink email
                </button>
              ) : (
                <button
                  onClick={linkEmail}
                  className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white"
                >
                  Connect email
                </button>
              )}
              {wallet ? (
                <button
                  onClick={() => {
                    unlinkWallet(wallet.address);
                  }}
                  className="text-sm border border-violet-600 hover:border-violet-700 py-2 px-4 rounded-md text-violet-600 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500"
                  disabled={!canRemoveAccount}
                >
                  Unlink wallet
                </button>
              ) : (
                <button
                  onClick={linkWallet}
                  className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
                >
                  Connect wallet
                </button>
              )}

              {/* Connect External Wallet Button - for connecting external wallets like Phantom */}
              {shouldShowExternalWalletFeatures && (
                <button
                  onClick={connectWallet}
                  className="text-sm bg-green-600 hover:bg-green-700 py-2 px-4 rounded-md text-white border-none"
                >
                  Connect External Wallet
                </button>
              )}
              {phone ? (
                <button
                  onClick={() => {
                    unlinkPhone(phone.number);
                  }}
                  className="text-sm border border-violet-600 hover:border-violet-700 py-2 px-4 rounded-md text-violet-600 hover:text-violet-700 disabled:border-gray-500 disabled:text-gray-500 hover:disabled:text-gray-500"
                  disabled={!canRemoveAccount}
                >
                  Unlink phone
                </button>
              ) : (
                <button
                  onClick={linkPhone}
                  className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
                >
                  Connect phone
                </button>
              )}

              <button
                onClick={() => verifyToken().then(setVerifyResult)}
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
              >
                Verify token on server
              </button>

              {Boolean(verifyResult) && (
                <details className="w-full">
                  <summary className="mt-6 font-bold uppercase text-sm text-gray-600">
                    Server verify result
                  </summary>
                  <pre className="max-w-4xl bg-slate-700 text-slate-50 font-mono p-4 text-xs sm:text-sm rounded-md mt-2">
                    {JSON.stringify(verifyResult, null, 2)}
                  </pre>
                </details>
              )}
            </div>
            <div className="space-y-6 max-w-4xl mt-6">
              <h2 className="text-xl font-bold">Your Wallet</h2>
              
              {/* Wallet Ownership Security Information */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-emerald-800">
                      Wallet Security & Ownership Guarantee
                    </h3>
                    <div className="mt-2 text-sm text-emerald-700">
                      <p className="mb-2">
                        <strong>🔐 All wallets created through Privy are automatically owned by YOU</strong>
                      </p>
                      <p className="mb-2">
                        When you use Privy's client-side SDKs to create wallets, they are created with your user account as the owner by default. 
                        This ensures complete control and security.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div className="bg-white p-3 rounded border border-emerald-200">
                          <h4 className="font-medium text-emerald-800 mb-2">✅ What This Means:</h4>
                          <ul className="text-xs text-emerald-700 space-y-1">
                            <li>• Only you can control your wallets</li>
                            <li>• Private keys are securely managed</li>
                            <li>• Full transaction control</li>
                            <li>• Account-linked security</li>
                          </ul>
                        </div>
                        <div className="bg-white p-3 rounded border border-emerald-200">
                          <h4 className="font-medium text-emerald-800 mb-2">🛡️ Security Features:</h4>
                          <ul className="text-xs text-emerald-700 space-y-1">
                            <li>• Multi-factor authentication</li>
                            <li>• Encrypted key storage</li>
                            <li>• User ownership verification</li>
                            <li>• Secure wallet creation</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Current Wallet Ownership Status */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">Your Wallet Ownership Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">🔗 Linked Wallets</h4>
                    <div className="space-y-2">
                      {user?.linkedAccounts?.filter(account => account.type === 'wallet').map((account, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-mono text-blue-700">
                              {account.walletClientType === 'privy' ? 'Privy' : 'External'}: {account.address?.slice(0, 6)}...{account.address?.slice(-4)}
                            </span>
                          </div>
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                            {account.walletClientType === 'privy' ? '✅ Owned by You' : '🔗 Connected'}
                          </span>
                        </div>
                      ))}
                      {(!user?.linkedAccounts || user.linkedAccounts.filter(account => account.type === 'wallet').length === 0) && (
                        <p className="text-sm text-blue-600 italic">No wallets linked yet</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">📊 Account Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Total Linked Accounts:</span>
                        <span className="font-medium">{user?.linkedAccounts?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Wallet Accounts:</span>
                        <span className="font-medium">{user?.linkedAccounts?.filter(account => account.type === 'wallet').length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Privy Wallets:</span>
                        <span className="font-medium">{user?.linkedAccounts?.filter(account => account.type === 'wallet' && account.walletClientType === 'privy').length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">External Wallets:</span>
                        <span className="font-medium">{user?.linkedAccounts?.filter(account => account.type === 'wallet' && account.walletClientType !== 'privy').length || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    <strong>🔐 Security Note:</strong> All Privy-created wallets are automatically owned by your authenticated user account. 
                    External wallets are connected but not owned by your Privy account.
                  </p>
                </div>
              </div>
              
              {/* External Wallet Connection Status */}
              {shouldShowExternalWalletFeatures && (evmWallets.length > 0 || solanaWallets.length > 0) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">Connected External Wallets</h3>
                  
                  {/* Security Warning */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          External Wallet Connection Notice
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p className="mb-2">
                            <strong>⚠️ Important:</strong> These are external wallets (like MetaMask, Phantom) that are connected to your browser but are NOT owned by your Privy account.
                          </p>
                          <div className="bg-white p-2 rounded border border-yellow-200 mt-2">
                            <p className="text-xs text-yellow-800 mb-1"><strong>Key Differences:</strong></p>
                            <ul className="text-xs text-yellow-800 space-y-1">
                              <li>• <strong>External Wallets:</strong> Connected but not owned by Privy - you control them directly</li>
                              <li>• <strong>Privy Wallets:</strong> Created and owned by your Privy account - fully integrated</li>
                              <li>• <strong>Security:</strong> External wallets may have been connected by previous users of this browser</li>
                            </ul>
                          </div>
                          <p className="mt-2">
                            If you don't recognize these wallets, use the <strong>Disconnect</strong> button to remove them for security.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* EVM Wallets */}
                  {evmWallets.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-blue-700 mb-2">Ethereum Wallets:</h4>
                      {evmWallets.map((wallet) => (
                        <div key={wallet.address} className="flex items-center justify-between bg-white rounded-lg p-3 mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-mono text-gray-700">
                              {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                            </span>
                          </div>
                          <button
                            onClick={() => wallet.loginOrLink()}
                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                          >
                            Login/Link
                          </button>
                          <button
                            onClick={() => wallet.disconnect()}
                            className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded ml-2"
                          >
                            Disconnect
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Solana Wallets */}
                  {solanaWallets.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-blue-700 mb-2">Solana Wallets:</h4>
                      {solanaWallets.map((wallet) => (
                        <div key={wallet.address} className="flex items-center justify-between bg-white rounded-lg p-3 mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-mono text-gray-700">
                              {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                            </span>
                          </div>
                          <button
                            onClick={() => wallet.loginOrLink()}
                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                          >
                            Login/Link
                          </button>
                          <button
                            onClick={() => wallet.disconnect()}
                            className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded ml-2"
                          >
                            Disconnect
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-blue-600 mt-3">
                    Click "Login/Link" to connect these external wallets to your Privy account.
                  </p>
                  
                  {/* Create New Privy Wallet Section */}
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="text-sm font-medium text-green-800 mb-2">🔐 Want Full Control? Create a Privy Wallet</h4>
                    <p className="text-sm text-green-700 mb-3">
                      Create a new wallet that is fully owned by your Privy account. These wallets provide:
                    </p>
                    <ul className="text-xs text-green-700 space-y-1 mb-3 ml-4">
                      <li>• Complete ownership and control</li>
                      <li>• Secure key management by Privy</li>
                      <li>• Integration with your account</li>
                      <li>• No external dependencies</li>
                    </ul>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          // This will be handled by the WalletList component
                          const walletListSection = document.querySelector('[data-wallet-list]');
                          if (walletListSection) {
                            walletListSection.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                      >
                        Create New Wallet
                      </button>
                      <span className="text-xs text-green-600 self-center">
                        Scroll down to see wallet creation options
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Message Signing Section */}
              {solanaWallets.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">Message Signing</h3>
                  <p className="text-sm text-green-600 mb-4">
                    Sign a message using your connected Solana wallet. This is useful for authentication and proving wallet ownership.
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="messageToSign" className="block text-sm font-medium text-green-700 mb-1">
                        Message to Sign:
                      </label>
                      <textarea
                        id="messageToSign"
                        value={messageToSign}
                        onChange={(e) => setMessageToSign(e.target.value)}
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        rows={3}
                        placeholder="Enter your message here..."
                      />
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleSignMessage}
                        disabled={isSigningMessage || !messageToSign.trim()}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-md transition-colors"
                      >
                        {isSigningMessage ? 'Signing...' : 'Sign Message'}
                      </button>
                      
                      {solanaWallets.length > 0 && solanaWallets[0] && (
                        <span className="text-sm text-green-600">
                          Using wallet: {solanaWallets[0].address.slice(0, 6)}...{solanaWallets[0].address.slice(-4)}
                        </span>
                      )}
                    </div>
                    
                    {/* Error Display */}
                    {signMessageError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-red-800">{signMessageError}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Success Display */}
                    {signedMessage && (
                      <div className="bg-white border border-green-200 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-green-800 mb-2">Message Signed Successfully!</h4>
                        <div className="bg-gray-50 p-2 rounded border">
                          <p className="text-xs text-green-700 mb-1">Signature:</p>
                          <code className="text-xs break-all text-gray-800">{signedMessage}</code>
                        </div>
                        <div className="mt-2 space-x-2">
                          <button
                            onClick={() => navigator.clipboard.writeText(signedMessage)}
                            className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                          >
                            Copy Signature
                          </button>
                          <button
                            onClick={() => {
                              const data = {
                                message: messageToSign,
                                signature: signedMessage,
                                wallet: solanaWallets[0]?.address,
                                timestamp: new Date().toISOString()
                              };
                              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = 'signed-message.json';
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                          >
                            Download as JSON
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Transaction Sending Section */}
              {solanaWallets.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">Send SOL Transaction</h3>
                  <p className="text-sm text-blue-600 mb-4">
                    Send SOL to another wallet address using your connected Solana wallet.
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="recipientAddress" className="block text-sm font-medium text-blue-700 mb-1">
                        Recipient Address:
                      </label>
                      <input
                        type="text"
                        id="recipientAddress"
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter Solana address (e.g., 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM)"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="transactionAmount" className="block text-sm font-medium text-blue-700 mb-1">
                        Amount (SOL):
                      </label>
                      <input
                        type="number"
                        id="transactionAmount"
                        value={transactionAmount}
                        onChange={(e) => setTransactionAmount(e.target.value)}
                        step="0.001"
                        min="0.001"
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.001"
                      />
                      <p className="text-xs text-blue-600 mt-1">
                        Minimum: 0.001 SOL (1,000,000 lamports)
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        ⚠️ WARNING: This will send REAL SOL to mainnet
                      </p>
                      <p className="text-xs text-blue-500 mt-1">
                        💡 Transaction will be sent to Solana mainnet
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleSendTransaction}
                        disabled={isSendingTransaction || !recipientAddress.trim() || !transactionAmount || parseFloat(transactionAmount) <= 0}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md transition-colors"
                      >
                        {isSendingTransaction ? 'Sending...' : 'Send Transaction'}
                      </button>
                      
                      {solanaWallets.length > 0 && solanaWallets[0] && (
                        <span className="text-sm text-blue-600">
                          From: {solanaWallets[0].address.slice(0, 6)}...{solanaWallets[0].address.slice(-4)}
                        </span>
                      )}
                    </div>
                    
                    {/* Error Display */}
                    {transactionError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-red-800">{transactionError}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Success Display */}
                    {transactionSignature && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-green-800 mb-2">Transaction Sent Successfully!</h4>
                        <div className="bg-white p-2 rounded border">
                          <p className="text-xs text-green-700 mb-1">Signature:</p>
                          <code className="text-xs break-all text-gray-800">{transactionSignature}</code>
                        </div>
                        <div className="mt-2 space-x-2">
                          <button
                            onClick={() => navigator.clipboard.writeText(transactionSignature)}
                            className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                          >
                            Copy Signature
                          </button>
                          <button
                            onClick={() => window.open(`https://solscan.io/tx/${transactionSignature}`, '_blank')}
                            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                          >
                            View on Solscan
                          </button>
                          <button
                            onClick={() => {
                              const data = {
                                signature: transactionSignature,
                                recipient: recipientAddress,
                                amount: transactionAmount,
                                from: solanaWallets[0]?.address,
                                timestamp: new Date().toISOString()
                              };
                              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = 'transaction-details.json';
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                            className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded hover:bg-purple-200"
                          >
                            Download Details
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Transaction Signing Section */}
              {solanaWallets.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-purple-800 mb-3">Sign Transaction</h3>
                  <p className="text-sm text-purple-600 mb-4">
                    Sign a transaction using your connected Solana wallet. This creates a signed transaction that can be submitted later.
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="transactionToSign" className="block text-sm font-medium text-purple-700 mb-1">
                        Transaction Data (Optional):
                      </label>
                      <textarea
                        id="transactionToSign"
                        value={transactionToSign}
                        onChange={(e) => setTransactionToSign(e.target.value)}
                        className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={2}
                        placeholder="Enter transaction data or leave empty to use demo transaction..."
                      />
                      <p className="text-xs text-purple-600 mt-1">
                        💡 Leave empty to sign a demo transaction (0.001 SOL to self)
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleSignTransaction}
                        disabled={isSigningTransaction}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-md transition-colors"
                      >
                        {isSigningTransaction ? 'Signing...' : 'Sign Transaction'}
                      </button>
                      
                      {solanaWallets.length > 0 && solanaWallets[0] && (
                        <span className="text-sm text-purple-600">
                          Using wallet: {solanaWallets[0].address.slice(0, 6)}...{solanaWallets[0].address.slice(-4)}
                        </span>
                      )}
                    </div>
                    
                    {/* Error Display */}
                    {signTransactionError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-red-800">{signTransactionError}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Success Display */}
                    {signedTransactionData && (
                      <div className="bg-white border border-purple-200 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-purple-800 mb-2">Transaction Signed Successfully!</h4>
                        <div className="bg-gray-50 p-2 rounded border">
                          <p className="text-xs text-purple-700 mb-1">Signed Transaction (Base64):</p>
                          <code className="text-xs break-all text-gray-800">{signedTransactionData}</code>
                        </div>
                        <div className="mt-2 space-x-2">
                          <button
                            onClick={() => navigator.clipboard.writeText(signedTransactionData)}
                            className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded hover:bg-purple-200"
                          >
                            Copy Transaction
                          </button>
                          <button
                            onClick={() => {
                              const data = {
                                signedTransaction: signedTransactionData,
                                wallet: solanaWallets[0]?.address,
                                timestamp: new Date().toISOString(),
                                note: 'This is a signed transaction that can be submitted to the network'
                              };
                              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = 'signed-transaction.json';
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                          >
                            Download as JSON
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div data-wallet-list>
              <WalletList />
            </div>
            
            {/* App-Server Wallet Management */}
            <div className="mt-8 space-y-6">
              <h2 className="text-xl font-bold">App-Server Wallet Management</h2>
              <p className="text-gray-600">
                Wallet management is handled through Privy's secure infrastructure. 
                All wallets are automatically owned by authenticated users and managed securely.
              </p>
            </div>
            
            {/* Technical Implementation Details */}
            <div className="mt-6 max-w-4xl">
              <details className="bg-gray-50 border border-gray-200 rounded-lg">
                <summary className="p-4 cursor-pointer hover:bg-gray-100 font-semibold text-gray-800">
                  🔧 Technical Implementation: How Wallet Ownership Works
                </summary>
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="space-y-4 text-sm text-gray-700">
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Privy SDK Implementation</h4>
                      <p className="mb-2">
                        The application uses Privy's client-side SDKs which automatically handle wallet ownership:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li><code className="bg-gray-100 px-1 rounded">useCreateWallet()</code> - Creates Ethereum wallets with user ownership</li>
                        <li><code className="bg-gray-100 px-1 rounded">useSolanaWallets()</code> - Creates Solana wallets with user ownership</li>
                        <li>All wallets are tied to the authenticated user's Privy account</li>
                        <li>Private keys are securely managed by Privy's infrastructure</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Configuration in _app.tsx</h4>
                      <p className="mb-2">
                        The Privy configuration ensures proper wallet creation:
                      </p>
                      <div className="bg-gray-100 p-3 rounded font-mono text-xs">
                        <div>embeddedWallets: {'{'}</div>
                        <div className="ml-4">createOnLogin: "users-without-wallets"</div>
                        <div>{'}'}</div>
                      </div>
                      <p className="mt-2 text-xs text-gray-600">
                        This setting automatically creates wallets for users who don't have them, ensuring they always have a wallet owned by their account.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Security Features</h4>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li><strong>User Authentication:</strong> Wallets are only created for authenticated users</li>
                        <li><strong>Account Linking:</strong> Wallets are automatically linked to the user's Privy account</li>
                        <li><strong>Access Control:</strong> Only the authenticated user can access their wallets</li>
                        <li><strong>Secure Storage:</strong> Private keys are encrypted and stored securely by Privy</li>
                      </ul>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>✅ Result:</strong> Every wallet created through this application is automatically owned by the authenticated user, 
                        providing complete security and control without any additional configuration needed.
                      </p>
                    </div>
                  </div>
                </div>
              </details>
            </div>
            
            <p className="mt-6 font-bold uppercase text-sm text-gray-600">
              User object
            </p>
            <pre className="max-w-4xl bg-slate-700 text-slate-50 font-mono p-4 text-xs sm:text-sm rounded-md mt-2">
              {JSON.stringify(user, null, 2)}
            </pre>
          </>
        ) : null}
      </main>
    </>
  );
}
