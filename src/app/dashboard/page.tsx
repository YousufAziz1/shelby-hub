"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { listBlobs, BlobMetadata } from "@/lib/shelby";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, Activity, DollarSign, Eye, Lock, Globe, ArrowRight } from "lucide-react";
import Link from "next/link";
import { FeedCard } from "@/components/FeedCard";
import { MatrixText } from "@/components/ui/matrix-text";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: "easeOut" }
} as const;

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
      <div className="container mx-auto px-6 py-40 text-center max-w-[1200px] relative bg-grid min-h-[80vh] flex flex-col items-center justify-center">
        <motion.div {...fadeInUp} className="space-y-10">
          <div className="w-24 h-24 bg-surface border border-divider rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl relative overflow-hidden">
             <div className="absolute inset-0 bg-primary/5 animate-pulse"></div>
             <Lock className="w-10 h-10 text-primary relative z-10" />
          </div>
          <div className="space-y-4">
             <h1 className="text-5xl md:text-7xl font-heading font-black text-foreground tracking-tighter uppercase leading-none">Authentication <br /> <span className="text-primary italic">Required.</span></h1>
             <p className="text-muted-foreground text-xl mb-12 max-w-md mx-auto font-medium">Please connect your authorized node identity to access institutional protocol analytics.</p>
          </div>
          
          <div className="p-6 rounded-2xl bg-surface border border-border inline-flex items-center gap-5 text-left shadow-lg">
             <div className="w-12 h-12 rounded-xl border border-divider flex items-center justify-center shadow-lg shadow-primary/10 overflow-hidden bg-surface">
                <img src="/logo.png" alt="Shelby Logo" className="w-full h-full object-cover" />
             </div>
             <div>
                <p className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-zinc-500 leading-none mb-1.5">Verification Node</p>
                <p className="text-sm font-bold text-foreground">Shelby Testnet <span className="text-primary italic">@Aptos_king</span></p>
             </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const totalViews = myBlobs.reduce((acc, current) => acc + current.views, 0);
  const estimatedEarnings = myBlobs.reduce((acc, current) => acc + current.price, 0);

  return (
    <div className="container mx-auto px-6 py-32 max-w-[1200px] bg-grid min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mb-24"
      >
         <div className="space-y-4 relative group">
            {/* Subtle glow behind title */}
            <div className="absolute -inset-10 bg-primary/5 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary font-mono text-[10px] uppercase tracking-[0.3em] font-bold relative z-10">
              Protocol State: <span className="flex items-center gap-2 ml-1"><div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div> ACTIVE_NODE</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-heading font-black tracking-tighter text-foreground leading-none uppercase relative z-10">
               <MatrixText text="Dashboard." className="font-heading tracking-tighter" />
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl font-medium relative z-10">Real-time protocol telemetry. Monitoring ingestion streams, network reach, and settlement performance.</p>
         </div>
         <Link href="/upload">
           <Button className="h-16 px-12 rounded-xl bg-primary text-background font-black uppercase tracking-widest text-[11px] hover:scale-[1.02] transition-all shadow-xl shadow-primary/10 flex items-center">
             <UploadCloud className="w-5 h-5 mr-3" /> Initialize Ingestion
           </Button>
         </Link>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
        {[
          { label: "PROTOCOL REVENUE", value: estimatedEarnings.toFixed(2), unit: "SUSD", icon: DollarSign, desc: "Estimated per 5 settlements" },
          { label: "INGESTION COUNT", value: myBlobs.length, unit: "ASSETS", icon: Globe, desc: "Active index entries" },
          { label: "NETWORK REACH", value: totalViews, unit: "VIEWS", icon: Eye, desc: "Across protocol explorer" },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.8 }}
          >
            <Card className="bg-surface border border-border rounded-[2rem] p-12 relative overflow-hidden group hover:border-primary/30 transition-all shadow-lg">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity">
                <stat.icon className="w-20 h-20 text-primary" />
              </div>
              <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-[0.4em] mb-12 font-bold">{stat.label}</p>
              <div className="flex items-end gap-3 mb-6">
                 <h3 className="text-6xl font-heading font-black text-foreground font-mono tracking-tighter">{stat.value}</h3>
                 <span className="text-[11px] font-mono text-primary font-bold tracking-[0.3em] mb-3">{stat.unit}</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-1.5 h-1.5 rounded-full bg-primary/30"></div>
                 <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest italic">{stat.desc}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="space-y-16">
         <div className="flex items-center justify-between border-b border-divider pb-8">
            <h2 className="text-4xl font-heading font-black text-foreground tracking-tight uppercase">Active Streams.</h2>
            <Link href="#explorer" className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform">
               View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
         </div>
         
         {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
               {[1, 2, 3, 4].map(i => (
                  <div key={i} className="aspect-[4/5] bg-surface rounded-[2rem] border border-border animate-pulse"></div>
               ))}
            </div>
         ) : myBlobs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
               {myBlobs.map(blob => (
                  <FeedCard key={blob.id} blob={blob} />
               ))}
            </div>
         ) : (
            <div className="text-center py-32 bg-surface/50 border border-dashed border-divider rounded-[3.5rem] backdrop-blur-sm">
               <Activity className="w-16 h-16 text-zinc-800 mx-auto mb-8 opacity-20" />
               <p className="text-2xl font-heading font-black text-zinc-600 uppercase tracking-tight">No active ingestions detected.</p>
               <Link href="/upload">
                  <Button variant="link" className="text-primary mt-6 font-mono uppercase tracking-[0.3em] text-[11px] font-bold hover:no-underline">
                    Begin Initial Sync <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
               </Link>
            </div>
         )}
      </div>

      <div className="mt-40 pt-16 border-t border-divider text-center">
         <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-600 mb-10 font-bold">Protocol Verification Authority</p>
         <div className="inline-flex items-center gap-6 p-6 rounded-[2.5rem] bg-surface border border-divider shadow-2xl relative group">
            <div className="absolute inset-0 bg-primary/5 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-14 h-14 border border-divider rounded-2xl flex items-center justify-center shadow-lg shadow-primary/10 overflow-hidden bg-surface">
               <img src="/logo.png" alt="Admin" className="w-full h-full object-cover" />
            </div>
            <div className="text-left relative z-10">
               <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none mb-2 font-bold">Master Node Operator</p>
               <p className="text-lg font-heading font-black text-foreground uppercase tracking-tight">Verified Protocol <span className="text-primary">Admin</span></p>
            </div>
         </div>
      </div>
    </div>
  );
}
