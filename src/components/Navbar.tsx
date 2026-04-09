"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useTheme } from "next-themes";
import { Sun, Moon, Database, Wallet, Coins, LogOut, User } from "lucide-react";
import { Button } from "./ui/button";
import { getShelbyBalances, ShelbyBalances } from "@/lib/shelby-protocol";

export function Navbar() {
  const { account, connected, connect, disconnect, wallets } = useWallet();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [balances, setBalances] = useState<ShelbyBalances>({ apt: 0, shelbyUsd: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Poll for balances when connected
  useEffect(() => {
    if (!connected || !account?.address) return;

    const fetchBalances = async () => {
      const b = await getShelbyBalances(account.address.toString());
      setBalances(b);
    };

    fetchBalances();
    const interval = setInterval(fetchBalances, 30000); // 30s poll
    return () => clearInterval(interval);
  }, [connected, account?.address]);

  const handleConnect = async () => {
    try {
      const petra = wallets?.find((w) => w.name === "Petra");
      if (petra) {
        connect(petra.name);
      } else {
        window.open("https://petra.app/", "_blank");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDisconnect = () => {
    try { disconnect(); } catch (e) { console.error(e); }
  };

  const addressStr = account?.address?.toString() || "";
  const shortAddress = addressStr ? `${addressStr.slice(0, 5)}...${addressStr.slice(-4)}` : "";
  
  return (
    <nav className="border-b border-divider bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-6 h-[72px] flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link href="/" className="font-heading text-2xl tracking-tighter text-foreground flex items-center gap-3 group">
            <div className="w-10 h-10 border border-primary/20 bg-surface rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(34,199,184,0.1)] group-hover:bg-primary/5 transition-all duration-300 overflow-hidden">
              <img src="/logo.png" alt="Shelby Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-black tracking-tight group-hover:translate-x-0.5 transition-transform duration-300">Shelby<span className="text-primary italic">Hub</span></span>
          </Link>
          <div className="hidden md:flex gap-10">
            <Link href="/" className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">Explore</Link>
            <Link href="/upload" className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">Upload</Link>
            <Link href="/dashboard" className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all">
              Dashboard
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {connected && mounted && (
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-4 bg-surface border border-divider px-4 py-2 rounded-xl shadow-sm">
                <div className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] font-mono font-black text-foreground uppercase tracking-wider">{balances.apt.toFixed(3)} <span className="text-zinc-500">APT</span></span>
                </div>
                <div className="w-px h-3 bg-divider"></div>
                <div className="flex items-center gap-2">
                  <Coins className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] font-mono font-black text-foreground uppercase tracking-wider">{balances.shelbyUsd.toFixed(1)} <span className="text-zinc-500">SUSD</span></span>
                </div>
              </div>
              <div className="bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                <span className="text-[9px] font-mono font-black text-primary uppercase tracking-[0.2em]">ShelbyNet</span>
              </div>
            </div>
          )}

          {mounted && (
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-xl border border-divider bg-surface hover:bg-muted transition-all"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-primary" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          {connected && mounted ? (
            <div className="flex items-center gap-2">
              {/* Address chip → opens profile */}
              <Link
                href={`/profile/${addressStr}`}
                className="flex items-center gap-2 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary rounded-xl px-4 h-11 transition-all font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/5"
              >
                <User className="w-3.5 h-3.5 opacity-70" />
                {shortAddress}
              </Link>
              {/* Disconnect */}
              <button
                onClick={handleDisconnect}
                title="Disconnect wallet"
                className="p-2.5 rounded-xl border border-divider bg-surface hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 text-muted-foreground transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Button
              onClick={handleConnect}
              className="bg-primary hover:bg-primary/90 text-background rounded-xl px-8 h-11 transition-all font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/10"
            >
              Launch App
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
