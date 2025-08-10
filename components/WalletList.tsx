import {
  useCreateWallet,
  useSolanaWallets,
  WalletWithMetadata,
  useUser,
} from "@privy-io/react-auth";
import { useCallback, useMemo, useState } from "react";
import WalletCard from "./WalletCard";

// Extend Window interface to include Solana wallet
declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      [key: string]: any;
    };
  }
}

/**
 * WalletList Component - Secure Wallet Management
 * 
 * This component provides secure wallet creation and management using Privy's client-side SDKs.
 * Security features:
 * - useCreateWallet() creates Ethereum wallets with automatic user ownership
 * - useSolanaWallets() creates Solana wallets with automatic user ownership
 * - All wallets are tied to the authenticated user's Privy account
 * - Clear security messaging about wallet ownership and control
 * 
 * The component automatically ensures that all created wallets belong to the authenticated user.
 */
export default function WalletList() {
  const { user } = useUser();
  const { createWallet: createEthereumWallet } = useCreateWallet();
  const { createWallet: createSolanaWallet } = useSolanaWallets();
  const [isCreating, setIsCreating] = useState(false);

  // Debug logging for wallet detection
  console.log('Phantom detected:', window.solana?.isPhantom);
  console.log('Solana object:', window.solana);
  console.log('Available wallets:', user?.linkedAccounts);

  const ethereumEmbeddedWallets = useMemo<WalletWithMetadata[]>(
    () =>
      (user?.linkedAccounts.filter(
        (account) =>
          account.type === "wallet" &&
          account.walletClientType === "privy" &&
          account.chainType === "ethereum"
      ) as WalletWithMetadata[]) ?? [],
    [user]
  );

  const solanaEmbeddedWallets = useMemo<WalletWithMetadata[]>(
    () =>
      (user?.linkedAccounts.filter(
        (account) =>
          account.type === "wallet" &&
          account.walletClientType === "privy" &&
          account.chainType === "solana"
      ) as WalletWithMetadata[]) ?? [],
    [user]
  );

  const handleCreateWallet = useCallback(
    async (type: "ethereum" | "solana") => {
      setIsCreating(true);
      try {
        if (type === "ethereum") {
          await createEthereumWallet();
        } else if (type === "solana") {
          await createSolanaWallet();
        }
      } catch (error) {
        console.error("Error creating wallet:", error);
      } finally {
        setIsCreating(false);
      }
    },
    [createEthereumWallet, createSolanaWallet]
  );

  return (
    <div className="space-y-6">
      {/* Security Information Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Wallet Security & Ownership
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p className="mb-2">
                <strong>✅ Your wallets are created with YOU as the owner by default</strong>
              </p>
              <p className="mb-2">
                When you create a wallet using Privy's embedded wallet system, it automatically assigns you as the wallet owner. 
                This means:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Only you can control and access your wallets</li>
                <li>Your private keys are securely managed by Privy</li>
                <li>Wallets are tied to your authenticated Privy account</li>
                <li>You maintain full control over all transactions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Ethereum Wallets Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Ethereum Embedded Wallets</h3>
        {ethereumEmbeddedWallets.length === 0 ? (
          <div className="p-4 border border-gray-200 rounded-lg text-center">
            <p className="text-gray-600 mb-4">
              No Ethereum embedded wallets found.
            </p>
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                <strong>🔐 Secure:</strong> New wallets will be created with you as the owner
              </p>
            </div>
            <button
              onClick={() => handleCreateWallet("ethereum")}
              disabled={isCreating}
              className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white disabled:bg-violet-400 disabled:cursor-not-allowed"
            >
              {isCreating ? "Creating..." : "Create Ethereum Embedded Wallet"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                <strong>✅ {ethereumEmbeddedWallets.length} Ethereum wallet(s) owned by you</strong>
              </p>
            </div>
            {ethereumEmbeddedWallets.map((wallet) => (
              <WalletCard key={wallet.address} wallet={wallet} />
            ))}
          </div>
        )}
      </div>

      {/* Solana Wallets Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Solana Embedded Wallets</h3>
        {solanaEmbeddedWallets.length === 0 ? (
          <div className="p-4 border border-gray-200 rounded-lg text-center">
            <p className="text-gray-600 mb-4">
              No Solana embedded wallets found.
            </p>
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                <strong>🔐 Secure:</strong> New wallets will be created with you as the owner
              </p>
            </div>
            <button
              onClick={() => handleCreateWallet("solana")}
              disabled={isCreating}
              className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white disabled:bg-violet-400 disabled:cursor-not-allowed"
            >
              {isCreating ? "Creating..." : "Create Solana Embedded Wallet"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                <strong>✅ {solanaEmbeddedWallets.length} Solana wallet(s) owned by you</strong>
              </p>
            </div>
            {solanaEmbeddedWallets.map((wallet) => (
              <WalletCard key={wallet.address} wallet={wallet} />
            ))}
          </div>
        )}
      </div>

      {/* Additional Security Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Security Best Practices
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Never share your wallet credentials with anyone</li>
                <li>Use strong authentication methods (2FA, email verification)</li>
                <li>Regularly review your connected accounts and wallets</li>
                <li>Keep your Privy account secure - it controls access to your wallets</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
