"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { listBlobs, BlobMetadata } from "@/lib/shelby";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, Activity, DollarSign, Eye, Lock, Globe } from "lucide-react";
import Link from "next/link";
import { FeedCard } from "@/components/FeedCard";

export default function DashboardPage() {
  const { account, connected } = useWallet();
  const [myBlobs, setMyBlobs] = useState<BlobMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMyData() {
      if (!account?.address) {
         setLoading(false);
         return;
      }
      setLoading(true);
      try {
        const data = await listBlobs({ filter: { creatorAddress: account.address.toString() } });
        setMyBlobs(data); 
      } catch (err) {
        console.error("Failed to load blobs", err);
      } finally {
        setLoading(false);
      }
    }
    loadMyData();
  }, [account]);

  if (!connected) {
    return (
      <div className="container mx-auto px-6 py-40 text-center max-w-2xl relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[150px] -z-10"></div>
        <div className="w-24 h-24 bg-zinc-900 border border-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl">
          <Lock className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-5xl font-black text-white mb-6 tracking-tighter">Identity Required</h1>
        <p className="text-zinc-400 text-lg mb-12 font-medium">Please authenticate with your Petra Wallet to access creator analytics.</p>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 inline-block">
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Architect</p>
           <p className="text-sm font-black text-white italic">Build by @Aptos_king</p>
        </div>
      </div>
    );
  }

  const totalViews = myBlobs.reduce((acc, current) => acc + current.views, 0);
  const estimatedEarnings = myBlobs.reduce((acc, current) => acc + (current.price * 5), 0);

  return (
    <div className="container mx-auto px-6 py-20 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mb-20">
         <div className="space-y-4">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-[10px] uppercase tracking-widest">
             Creator Center
           </div>
           <h1 className="text-6xl font-black tracking-tighter text-white">Dashboard.</h1>
           <p className="text-zinc-400 text-xl font-medium">Monitoring your protocol ingestion and node revenue.</p>
         </div>
         <Link href="/upload">
           <Button className="h-16 px-10 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
             <UploadCloud className="w-5 h-5 mr-3" /> Mint New Asset
           </Button>
         </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
        <Card className="bg-zinc-900/50 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 transition-opacity">
            <DollarSign className="w-16 h-16 text-primary" />
          </div>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-6">Revenue Accumulation</p>
          <h3 className="text-5xl font-black text-white mb-4">{estimatedEarnings.toFixed(2)} <span className="text-xs text-primary font-black tracking-widest ml-1">SUSD</span></h3>
          <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Calculated per 5 settlements</p>
        </Card>
        
        <Card className="bg-zinc-900/50 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 transition-opacity">
            <Globe className="w-16 h-16 text-primary" />
          </div>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-6">Network Footprint</p>
          <h3 className="text-5xl font-black text-white mb-4">{myBlobs.length} <span className="text-xs text-zinc-600 font-black tracking-widest ml-1">BLOBS</span></h3>
          <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Active protocol ingestion</p>
        </Card>

        <Card className="bg-zinc-900/50 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 transition-opacity">
            <Eye className="w-16 h-16 text-primary" />
          </div>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-6">Total Engagement</p>
          <h3 className="text-5xl font-black text-white mb-4">{totalViews} <span className="text-xs text-zinc-600 font-black tracking-widest ml-1">VIEWS</span></h3>
          <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Across global index</p>
        </Card>
      </div>

      <div className="space-y-12">
         <div className="flex items-center gap-4 border-l-4 border-primary pl-6">
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase">My Ingested Content</h2>
         </div>
         
         {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
               {[1, 2, 3, 4].map(i => (
                  <div key={i} className="aspect-[4/5] bg-white/5 rounded-[2rem] animate-pulse"></div>
               ))}
            </div>
         ) : myBlobs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
               {myBlobs.map(blob => (
                  <FeedCard key={blob.id} blob={blob} />
               ))}
            </div>
         ) : (
            <div className="text-center py-24 bg-white/5 border border-dashed border-white/10 rounded-[3rem]">
               <Activity className="w-12 h-12 text-zinc-700 mx-auto mb-6" />
               <p className="text-xl font-bold text-zinc-500">No active assets detected on your node.</p>
               <Link href="/upload">
                  <Button variant="link" className="text-primary mt-4 font-black uppercase tracking-widest text-xs">Begin Ingestion</Button>
               </Link>
            </div>
         )}
      </div>

      <div className="mt-24 pt-10 border-t border-white/5 text-center">
         <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-800 mb-2">Protocol Architect</p>
         <div className="inline-flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/5">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black text-xs">AK</div>
            <p className="text-sm font-black text-white">Integrated by <span className="text-primary italic">@Aptos_king</span></p>
         </div>
      </div>
    </div>
  );
}
