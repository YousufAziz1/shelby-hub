"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { Network } from "@aptos-labs/ts-sdk";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  // Initialize standard Petra Wallet explicitly
  const wallets = [new PetraWallet()];

  return (
    <AptosWalletAdapterProvider
      plugins={wallets}
      autoConnect={true}
      dappConfig={{ network: Network.TESTNET }}
      onError={(error) => {
        console.error("Aptos Wallet Error:", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
