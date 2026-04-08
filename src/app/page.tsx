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
    <div className="container mx-auto px-6 py-12 max-w-7xl">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Live Pool: Shelby Protocol Mainnet Ingestion
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">
            Content Explorer
          </h1>
          <p className="text-lg text-slate-500 font-medium leading-relaxed">
            The decentralized settlement layer for premium verifiable assets.
          </p>
        </div>

        {/* Dashboard Stat: Storage */}
        <div className="w-full md:w-80 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Protocol Storage</span>
            <span className="text-xs font-bold text-slate-900">{percentUsed.toFixed(1)}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-slate-900 transition-all duration-1000"
              style={{ width: `${percentUsed}%` }}
            />
          </div>
          <div className="mt-4 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
            <span className="text-slate-400">{usedMB} / {STORAGE_LIMIT_MB} MB</span>
            <span className={percentUsed > 90 ? "text-red-500" : "text-emerald-500"}>
              {percentUsed > 90 ? "Limit Near" : "Optimal"}
            </span>
          </div>
        </div>
      </div>

      {/* Grid Filters */}
      <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-4 scrollbar-hide">
        {FILTERS.map((f) => (
          <Button
            key={f}
            variant={activeFilter === f ? "default" : "ghost"}
            onClick={() => setActiveFilter(f)}
            className={`rounded-lg px-5 h-9 text-sm font-medium transition-all ${
              activeFilter === f 
                ? "bg-slate-900 text-white shadow-sm" 
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
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
