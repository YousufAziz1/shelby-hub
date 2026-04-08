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
    <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 border-slate-200">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="font-bold text-xl tracking-tight text-slate-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white text-xs">S</div>
            ShelbyHub
          </Link>
          <div className="hidden md:flex gap-8">
            <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Explorer</Link>
            <Link href="/upload" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Mint</Link>
            <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Analytics</Link>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden lg:block text-right">
             <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Creator</p>
             <p className="text-xs font-medium text-slate-600">@Aptos_king</p>
          </div>
          <Button 
            onClick={handleWalletAction} 
            variant="default" 
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-5 h-10 transition-all font-medium text-sm shadow-sm"
          >
            {connected ? shortAddress : "Connect Wallet"}
          </Button>
        </div>
      </div>
    </nav>
  );
}
