"use client";

import { useEffect, useState } from "react";
import { FeedCard } from "@/components/FeedCard";
import { listBlobs, BlobMetadata } from "@/lib/shelby";
import { Button } from "@/components/ui/button";

const FILTERS = ["All", "Images", "Videos", "Courses", "Source Code", "Trending"];

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
        <p className="text-lg md:text-xl text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed">
          The ultimate decentralized content marketplace. Upload your premium files, set pricing in ShelbyUSD, and get paid instantly.
        </p>
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
