"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FeedCard } from "@/components/FeedCard";
import { listBlobs, BlobMetadata } from "@/lib/shelby";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight, Sparkles, LayoutGrid } from "lucide-react";

const FILTERS = ["All", "Images", "Videos", "Courses", "Source Code", "Trending"];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: "easeOut" }
} as const;

export default function Home() {
  const [blobs, setBlobs] = useState<BlobMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await listBlobs();
        setBlobs(data);
      } catch (err) {
        console.error("Failed to load blobs", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredBlobs = blobs.filter((blob) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Trending") return true; 
    if (activeFilter === "Images") return blob.contentType === "Image";
    if (activeFilter === "Videos") return blob.contentType === "Video";
    return blob.contentType === activeFilter;
  });

  return (
    <div className="relative min-h-screen bg-grid">
      {/* High-Impact Centered Hero */}
      <section className="container mx-auto px-6 pt-32 pb-24 text-center max-w-[1200px]">
        <motion.div {...fadeInUp} className="space-y-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary font-mono text-[10px] uppercase tracking-[0.4em] font-bold mx-auto shadow-2xl shadow-primary/5">
             <Sparkles className="w-3.5 h-3.5" /> Powered by Shelby Protocol Testnet 🚀
          </div>
          
          <h1 className="text-6xl md:text-9xl font-heading font-black tracking-tighter text-foreground leading-[0.85] uppercase">
            Discover. <br />
            Create. <span className="text-primary italic">Own.</span>
          </h1>
          
          <p className="text-muted-foreground text-xl md:text-2xl leading-relaxed max-w-2xl mx-auto font-medium">
            The ultimate decentralized content marketplace. Upload your premium files, set 
            pricing in ShelbyUSD, and get paid instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
             <Button className="h-16 px-10 rounded-xl bg-primary text-background font-black uppercase tracking-widest text-[11px] hover:scale-[1.02] transition-all shadow-xl shadow-primary/20">
               Initialize Ingestion <ArrowRight className="ml-2 w-4 h-4" />
             </Button>
             <Button variant="outline" className="h-16 px-10 rounded-xl border-border bg-surface text-foreground font-black uppercase tracking-widest text-[11px] hover:bg-muted transition-all">
               Documentation
             </Button>
          </div>
        </motion.div>
      </section>

      {/* Discovery Feed Section */}
      <section className="container mx-auto px-6 pb-40 max-w-[1200px]">
        {/* Simplified Filters */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
          {FILTERS.map((f, i) => (
            <motion.div 
               key={f} 
               initial={{ opacity: 0, scale: 0.9 }} 
               animate={{ opacity: 1, scale: 1 }} 
               transition={{ delay: 0.1 + i * 0.05 }}
            >
              <Button
                variant="ghost"
                onClick={() => setActiveFilter(f)}
                className={`h-11 px-8 rounded-full text-[10px] font-mono font-black uppercase tracking-[0.2em] transition-all border ${
                  activeFilter === f 
                    ? "bg-primary border-primary text-background shadow-lg shadow-primary/20 pointer-events-none" 
                    : "bg-surface border-border text-zinc-500 hover:text-foreground hover:border-zinc-400"
                }`}
              >
                {f}
              </Button>
            </motion.div>
          ))}
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
              <div className="w-9 h-9 bg-primary flex items-center justify-center rounded-xl shadow-lg shadow-primary/10">
                 <span className="font-heading font-black text-background text-sm">S</span>
              </div>
              <span className="text-xl font-heading font-black uppercase tracking-tight text-foreground">ShelbyHub</span>
           </div>
           
           <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.4em] font-bold">
              Institutional Protocol | 2026 ShelbyHub
           </div>

           <div className="flex items-center gap-8">
              <a href="#" className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold hover:text-primary transition-colors">GitHub</a>
              <a href="#" className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold hover:text-primary transition-colors">Status</a>
           </div>
        </div>
      </footer>
    </div>
  );
}
