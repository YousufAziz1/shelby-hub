"use client";

import { useEffect, useState } from "react";
import { FeedCard } from "@/components/FeedCard";
import { listBlobs, BlobMetadata, getStorageUsage } from "@/lib/shelby";
import { Button } from "@/components/ui/button";
import { Database, HardDrive } from "lucide-react";

const FILTERS = ["All", "Images", "Videos", "Courses", "Source Code", "Trending"];
const STORAGE_LIMIT_MB = 500; // 500MB Free Limit

export default function Home() {
  const [blobs, setBlobs] = useState<BlobMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [usedBytes, setUsedBytes] = useState(0);

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
    if (activeFilter === "All") return true;
    if (activeFilter === "Trending") return true; // Just a mock bypass for now
    if (activeFilter === "Images") return blob.contentType === "Image";
    if (activeFilter === "Videos") return blob.contentType === "Video";
    return blob.contentType === activeFilter;
  });

  return (
    <div className="container mx-auto px-6 py-20 max-w-7xl">
      {/* Social Hero Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-16 mb-24">
        <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase tracking-widest">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
            Accelerated Protocol Node
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white leading-[0.9]">
            The Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">Blobs.</span>
          </h1>
          <p className="text-xl md:text-2xl text-zinc-400 font-medium leading-relaxed max-w-2xl">
            Explore and mint premium assets on the world's most performant decentralized settlement layer.
          </p>
        </div>

        {/* Protocol Stats: Storage Card */}
        <div className="w-full lg:w-[400px] bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-right-5 duration-700 delay-200 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Global Capacity</span>
              <Badge className="bg-primary/20 text-primary border-none font-black text-[10px]">{percentUsed.toFixed(1)}%</Badge>
            </div>
            
            <div className="space-y-4">
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-1000 shadow-[0_0_15px_rgba(255,20,147,0.5)] rounded-full"
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
              
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-2xl font-black text-white">{usedMB}<span className="text-sm text-zinc-600 ml-1">MB</span></p>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Ingested Today</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest">Active Sync</p>
                  <p className="text-[10px] text-zinc-600 mt-1">Shelby Protocol v2</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Filters (YouTube Inspired) */}
      <div className="flex items-center gap-4 mb-12 overflow-x-auto pb-6 scrollbar-hide snap-x">
        {FILTERS.map((f) => (
          <Button
            key={f}
            variant="ghost"
            onClick={() => setActiveFilter(f)}
            className={`rounded-full px-8 h-12 text-sm font-black transition-all snap-start border-2 ${
              activeFilter === f 
                ? "bg-primary border-primary text-white shadow-[0_0_20px_rgba(255,20,147,0.3)] scale-105" 
                : "bg-white/5 border-transparent text-zinc-500 hover:text-white hover:bg-white/10"
            }`}
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Feed Layout */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-96 bg-muted/40 animate-pulse rounded-2xl border border-border/40"></div>
          ))}
        </div>
      ) : filteredBlobs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredBlobs.map((blob) => (
            <FeedCard key={blob.id} blob={blob} />
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-muted/10 rounded-3xl border border-dashed border-border/50">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">📭</span>
          </div>
          <h3 className="text-2xl font-bold mb-2">No content found</h3>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Try adjusting your filters or be the first to upload content in this category!
          </p>
        </div>
      )}
    </div>
  );
}
