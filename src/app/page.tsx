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
    <div className="container mx-auto px-4 py-16 max-w-7xl">
      {/* Hero Section */}
      <div className="mb-20 text-center">
        <div className="inline-flex items-center justify-center px-5 py-2 mb-8 text-[11px] font-extrabold uppercase tracking-widest rounded-full bg-white border border-border shadow-sm text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse"></span>
          Shelby Protocol Testnet Node v2.0
        </div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 text-foreground">
          Blobs <span className="text-primary italic">Explored.</span>
        </h1>
        <p className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-12 font-medium">
          The decentralized settlement layer for premium verifiable content. Powered by ShelbyNet.
        </p>

        {/* Storage Usage Tracker - Branded Version */}
        <div className="max-w-md mx-auto bg-white border border-border rounded-3xl p-6 shadow-xl shadow-primary/5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Database className="w-5 h-5" />
              </div>
              <span className="text-[13px] font-bold uppercase tracking-tight">Mainnet Storage Integrity</span>
            </div>
            <span className="text-xs font-mono font-bold text-primary bg-primary/5 px-2 py-1 rounded-md">{usedMB} MB</span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden p-0.5 border border-border/50">
            <div 
              className="h-full bg-primary transition-all duration-1000 ease-out rounded-full"
              style={{ width: `${percentUsed}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-widest font-extrabold px-1">
            <span>Quota Used: {percentUsed.toFixed(1)}%</span>
            <span className={percentUsed > 90 ? "text-destructive underline" : "text-primary opacity-80"}>
              {percentUsed > 90 ? "Critical Cleanup Required" : "Ready for Ingestion"}
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 overflow-x-auto pb-8 mb-4 scrollbar-hide snap-x justify-center">
        {FILTERS.map((f) => (
          <Button
            key={f}
            variant={activeFilter === f ? "default" : "secondary"}
            onClick={() => setActiveFilter(f)}
            className={`rounded-xl snap-start whitespace-nowrap px-8 h-12 font-bold transition-all ${
              activeFilter === f 
                ? "bg-primary text-white shadow-lg shadow-primary/30 -translate-y-1" 
                : "bg-white border border-border text-muted-foreground hover:border-primary/30 hover:text-primary"
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
