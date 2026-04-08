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
    <nav className="border-b border-white/5 bg-black/60 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link href="/" className="font-black text-2xl tracking-tighter text-white flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,20,147,0.4)] group-hover:shadow-[0_0_30px_rgba(255,20,147,0.6)] transition-all">S</div>
            <span className="group-hover:text-primary transition-colors">ShelbyHub</span>
          </Link>
          <div className="hidden md:flex gap-10">
            <Link href="/" className="text-sm font-bold text-zinc-400 hover:text-white transition-colors">Explorer</Link>
            <Link href="/upload" className="text-sm font-bold text-zinc-400 hover:text-white transition-colors">Mint Blob</Link>
            <Link href="/dashboard" className="text-sm font-bold text-zinc-400 hover:text-primary transition-all flex items-center gap-2">
              Dashboard
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="hidden xl:flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
             <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
             <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Node by <span className="text-primary italic">@Aptos_king</span></p>
          </div>
          <Button 
            onClick={handleWalletAction} 
            className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 h-10 transition-all font-bold text-sm shadow-[0_0_15px_rgba(255,20,147,0.2)] hover:shadow-[0_0_25px_rgba(255,20,147,0.4)]"
          >
            {connected ? shortAddress : "Connect Wallet"}
          </Button>
        </div>
      </div>
    </nav>
  );
}
