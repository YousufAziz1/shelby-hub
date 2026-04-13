"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FeedCard } from "@/components/FeedCard";
import { DottedSurface } from "@/components/ui/dotted-surface";
import AnimatedTextCycle from "@/components/ui/animated-text-cycle";
import { Tabs } from "@/components/ui/vercel-tabs";
import { cn } from "@/lib/utils";
import { listBlobs, BlobMetadata, getStorageUsage } from "@/lib/shelby";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight, Loader2, Sparkles, LayoutGrid, Database, Activity } from "lucide-react";

const FILTERS = ["All", "Images", "Videos", "PDFs", "Source Code", "Trending"];
const STORAGE_LIMIT_MB = 500;

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: "easeOut" }
} as const;

export default function Home() {
  const [blobs, setBlobs] = useState<BlobMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [usedBytes, setUsedBytes] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("q");
      if (q) setSearchQuery(q.toLowerCase());
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [data, usage] = await Promise.all([
          listBlobs(),
          getStorageUsage()
        ]);
        setBlobs(data);
        setUsedBytes(usage);
      } catch (err) {
        console.error("Failed to load blobs", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const usedMB = (usedBytes / (1024 * 1024)).toFixed(2);
  const percentUsed = Math.min((parseFloat(usedMB) / STORAGE_LIMIT_MB) * 100, 100);

  const filteredBlobs = blobs.filter((blob) => {
    const matchesSearch = searchQuery 
      ? blob.title.toLowerCase().includes(searchQuery) || (blob.creatorAddress || "").toLowerCase().includes(searchQuery)
      : true;
      
    if (!matchesSearch) return false;

    if (activeFilter === "All") return true;
    if (activeFilter === "Trending") return true; 
    if (activeFilter === "Images") return blob.contentType === "Image";
    if (activeFilter === "Videos") return blob.contentType === "Video";
    if (activeFilter === "PDFs") return blob.contentType === "PDF" || blob.contentType === "Course";
    return blob.contentType === activeFilter;
  });

  return (
    <div className="relative min-h-screen bg-grid overflow-hidden">
      {/* High-Impact Centered Hero */}
      <section className="relative w-full pt-32 pb-16 min-h-[80vh] flex flex-col items-center justify-center">
        
        {/* 3D Dotted Surface Background */}
        <DottedSurface className="absolute inset-0 z-0 h-full w-full opacity-60" />

        {/* Ambient Glow similar to DemoOne */}
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute -top-20 left-1/2 h-full w-[150%] -translate-x-1/2 rounded-full',
            'bg-[radial-gradient(ellipse_at_center,hsla(var(--primary)/0.15),transparent_60%)]',
            'blur-[60px] z-0'
          )}
        />

        <div className="container relative z-10 mx-auto px-6 text-center max-w-[1200px]">
          <motion.div {...fadeInUp} className="space-y-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary font-mono text-[10px] uppercase tracking-[0.4em] font-bold mx-auto shadow-2xl shadow-primary/5">
             Powered by Shelby Protocol Testnet
          </div>
          
          <div className="flex justify-center my-16 relative z-20">
             <AnimatedTextCycle 
               words={["DISCOVER.", "CREATE.", "OWN.", "SHELBY."]} 
               interval={3000}
               className="text-6xl md:text-[8rem] font-heading font-black tracking-tighter text-foreground px-2"
             />
          </div>
          
          <p className="text-muted-foreground text-xl md:text-2xl leading-relaxed max-w-2xl mx-auto font-medium">
            The ultimate decentralized content marketplace. Upload your premium files, set 
            pricing in ShelbyUSD, and get paid instantly.
          </p>

          <div className="max-w-md mx-auto pt-10">
             <div className="bg-surface/40 backdrop-blur-xl border border-divider rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group transition-colors duration-500">
                <div className="absolute -bottom-6 -right-6 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                   <Database className="w-32 h-32 text-primary" />
                </div>
                
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_12px_rgba(34,199,184,0.6)]"></div>
                      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black">Storage Pressure</span>
                   </div>
                   <span className="font-mono text-[10px] text-primary font-black uppercase tracking-widest">{percentUsed.toFixed(1)}%</span>
                </div>

                <div className="space-y-6 text-left">
                   <div className="h-2.5 w-full bg-muted/30 rounded-full overflow-hidden p-0.5 border border-divider">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentUsed}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(34,199,184,0.4)]"
                      />
                   </div>
                   <div className="flex justify-between items-end">
                      <div>
                         <p className="text-3xl font-heading font-black text-foreground leading-none mb-1 tracking-tight">{usedMB}<span className="text-xs text-muted-foreground ml-1 uppercase font-mono font-bold">MB</span></p>
                         <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest font-black">Protocol Capacity</p>
                      </div>
                      <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
                         <Activity className="w-4 h-4 text-primary animate-pulse" />
                         <span className="text-[10px] font-mono text-primary uppercase tracking-widest font-black italic">Live Sync</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
          </motion.div>
        </div>
      </section>

      {/* Discovery Feed Section */}
      <section className="container mx-auto px-6 pb-40 max-w-[1200px]">
        
        {/* Sleek Animated Tabs Filter & Search */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-16 w-full relative z-10">
           <div className="flex-1" />
           <div className="flex justify-center">
              <Tabs 
                tabs={FILTERS.map(f => ({ id: f, label: f }))}
                activeTab={activeFilter}
                onTabChange={(id) => setActiveFilter(id)}
              />
           </div>
           
           <div className="flex-1 flex justify-end">
              <div className="relative group/search flex items-center">
                  <Search className="w-4 h-4 absolute left-4 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search files or address..." 
                    className="pl-11 pr-4 py-3 rounded-2xl bg-surface border border-divider text-xs font-mono font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all w-64 focus:w-80 shadow-sm hover:shadow-md"
                  />
              </div>
           </div>
        </div>

        {/* Dynamic Content Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="aspect-[4/5] bg-surface rounded-[2rem] border border-border animate-pulse"></div>
              ))}
            </div>
          ) : filteredBlobs.length > 0 ? (
            <motion.div 
               key={activeFilter}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               transition={{ duration: 0.5 }}
               className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            >
              {filteredBlobs.map((blob) => (
                <FeedCard key={blob.id} blob={blob} />
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-40 bg-surface/50 border border-dashed border-divider rounded-[3.5rem] backdrop-blur-sm max-w-4xl mx-auto">
               <Search className="w-16 h-16 text-zinc-800 mx-auto mb-8 opacity-20" />
               <p className="text-2xl font-heading font-black text-zinc-600 uppercase tracking-tight">No assets found.</p>
               <p className="text-muted-foreground mt-4 font-medium max-w-xs mx-auto text-sm italic">The index is currently empty for this sector.</p>
            </div>
          )}
        </AnimatePresence>
      </section>

      {/* Minimalism Institutional Footer */}
      <footer className="container mx-auto px-6 py-20 border-t border-divider max-w-[1200px]">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center rounded-xl shadow-lg shadow-primary/10 overflow-hidden border border-primary/20 bg-surface">
                 <img src="/logo.jpg" alt="ShelbyMarket" className="w-full h-full object-cover" />
              </div>
           </div>
           
           <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.4em] font-bold">
              Institutional Protocol | 2026 ShelbyMarket
           </div>

           <div className="flex items-center gap-8">
              <a href="https://github.com/YousufAziz1/" target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold hover:text-primary transition-colors">GitHub</a>
           </div>
        </div>
      </footer>
    </div>
  );
}
