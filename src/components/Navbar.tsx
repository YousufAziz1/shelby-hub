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

  const addressStr = account?.address?.toString() || "";
  const shortAddress = addressStr ? `${addressStr.slice(0, 6)}...${addressStr.slice(-4)}` : "";
  return (
    <nav className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur-md border-border/40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-extrabold text-2xl tracking-tighter text-foreground flex items-center gap-1.5">
            <span className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-xs">S</span>
            Shelby<span className="text-primary">Hub</span>
          </Link>
          <div className="hidden md:flex gap-6">
            <Link href="/" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">Explorer</Link>
            <Link href="/upload" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">Mint</Link>
            <Link href="/dashboard" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">Analytics</Link>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden lg:block text-right">
             <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Creator</p>
             <p className="text-xs font-semibold text-primary">@Aptos_king</p>
          </div>
          <Button 
            onClick={handleWalletAction} 
            variant="default" 
            className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 transition-all shadow-md active:scale-95"
          >
            {connected ? `Account: ${shortAddress}` : "Connect Wallet"}
          </Button>
        </div>
      </div>
    </nav>
  );
}
