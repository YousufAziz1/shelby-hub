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
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Hero Section */}
      <div className="mb-16 text-center">
        <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
          Powered by Shelby Protocol Testnet 🚀
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-br from-foreground via-foreground/90 to-muted-foreground">
          Discover. Create. <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">Own.</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed mb-8">
          The ultimate decentralized content marketplace. Upload your premium files, set pricing in ShelbyUSD, and get paid instantly.
        </p>

        {/* Storage Usage Tracker */}
        <div className="max-w-md mx-auto bg-muted/30 border border-border/50 rounded-2xl p-5 backdrop-blur-sm shadow-inner relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <HardDrive className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold">Decentralized Storage Usage</span>
            </div>
            <span className="text-xs font-mono text-muted-foreground">{usedMB} MB / {STORAGE_LIMIT_MB} MB</span>
          </div>
          <div className="w-full h-2.5 bg-background/50 rounded-full overflow-hidden border border-border/20">
            <div 
              className="h-full bg-gradient-to-r from-primary via-blue-500 to-purple-600 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              style={{ width: `${percentUsed}%` }}
            />
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground text-center uppercase tracking-widest font-bold opacity-60">
            {percentUsed > 90 ? "⚠️ Storage nearly full" : "Free Tier Active"}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 overflow-x-auto pb-6 mb-8 scrollbar-hide snap-x">
        {FILTERS.map((f) => (
          <Button
            key={f}
            variant={activeFilter === f ? "default" : "outline"}
            onClick={() => setActiveFilter(f)}
            className={`rounded-full snap-start whitespace-nowrap px-6 transition-all ${
              activeFilter === f 
                ? "shadow-md shadow-primary/20 scale-105" 
                : "hover:bg-muted/50"
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
