"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "./ui/button";

export function Navbar() {
  const { account, connected, connect, disconnect, wallets } = useWallet();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <nav className="border-b border-white/[0.06] bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-6 h-[72px] flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link href="/" className="font-heading text-2xl tracking-tighter text-foreground flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary shadow-[0_0_20px_rgba(34,199,184,0.1)] group-hover:bg-primary group-hover:text-background transition-all duration-300">
              <span className="font-black">S</span>
            </div>
            <span className="font-bold tracking-tight group-hover:translate-x-0.5 transition-transform duration-300">Shelby<span className="text-zinc-500">Hub</span></span>
          </Link>
          <div className="hidden md:flex gap-10">
            <Link href="/" className="text-[12px] font-bold uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors">Browse Assets</Link>
            <Link href="/upload" className="text-[12px] font-bold uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors">Mint Asset</Link>
            <Link href="/dashboard" className="text-[12px] font-bold uppercase tracking-[0.15em] text-muted-foreground hover:text-primary transition-all">
              Protocol Console
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="hidden xl:flex items-center gap-3 px-5 py-2 rounded-xl bg-surface border border-white/5">
             <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(34,199,184,0.5)] animate-pulse"></div>
             <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400">
               NODE <span className="text-zinc-700 mx-1">|</span> <span className="text-foreground tracking-normal font-bold">@APTOS_KING</span>
             </p>
          </div>
          {mounted && (
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-xl border border-white/10 bg-background hover:bg-accent transition-all"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
          <Button 
            onClick={handleWalletAction} 
            className="bg-primary hover:bg-primary/90 text-background rounded-xl px-10 h-11 transition-all font-bold uppercase tracking-widest text-[11px] hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_30px_rgba(34,199,184,0.15)]"
          >
            {connected ? shortAddress : "Launch App"}
          </Button>
        </div>
      </div>
    </nav>
  );
}
