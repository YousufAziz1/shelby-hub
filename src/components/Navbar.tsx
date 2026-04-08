"use client";

import Link from "next/link";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "./ui/button";

export function Navbar() {
  const { account, connected, connect, disconnect, wallets } = useWallet();

  const handleWalletAction = async () => {
    try {
      if (connected) {
        disconnect();
      } else {
        const petra = wallets?.find((w) => w.name === "Petra");
        if (petra) {
          connect(petra.name);
        } else {
          window.open("https://petra.app/", "_blank");
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const shortAddress = account?.address ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` : "";

  return (
    <nav className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-xl tracking-tight text-primary">
            ShelbyHub
          </Link>
          <div className="hidden md:flex gap-4">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Feed</Link>
            <Link href="/upload" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Upload</Link>
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={handleWalletAction} variant={connected ? "outline" : "default"}>
            {connected ? `Connected: ${shortAddress}` : "Connect Petra"}
          </Button>
        </div>
      </div>
    </nav>
  );
}
