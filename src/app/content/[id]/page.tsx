"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { getShelbyClient, downloadBlob, listBlobs, BlobMetadata } from "@/lib/shelby";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Lock, Unlock, Download, Eye, Heart, Share2, Loader2, PlayCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function ContentPage() {
  const { id } = useParams() as { id: string };
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const [blob, setBlob] = useState<BlobMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [contentBuffer, setContentBuffer] = useState<ArrayBuffer | null>(null);

  useEffect(() => {
    async function loadContent() {
      setLoading(true);
      try {
        const data = await listBlobs();
        const found = data.find(b => b.id === id);
        if (found) {
          setBlob(found);
          if (found.price === 0) {
            setIsUnlocked(true);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadContent();
  }, [id]);

  const handlePayment = async () => {
    if (!connected || !account) {
      alert("Please connect your Petra wallet first.");
      return;
    }
    
    setIsPaying(true);
    try {
      // MOCK APTOS TRANSACTION FOR SHELBY USD 
      // Real code would use:
      /*
      const response = await signAndSubmitTransaction({
        type: "entry_function_payload",
        function: "0x1::aptos_account::transfer",
        type_arguments: [],
        arguments: [blob?.creatorAddress, blob?.price * 100_000_000] // simple APT transfer
      });
      console.log(response);
      */
      
      // Simulate transaction confirmation
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      setIsUnlocked(true);
      alert("Payment successful! Content unlocked.");
    } catch (e: any) {
      console.error(e);
      alert("Payment failed: " + e.message);
    } finally {
      setIsPaying(false);
    }
  };

  const handleDownload = async () => {
    try {
      // Simulate download using SDK
      const data = await downloadBlob(id);
      // Create a fake URI to download
      const blobPart = new window.Blob([data], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blobPart);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shelby_content_${id}`;
      a.click();
    } catch (e) {
      console.error("Download error", e);
      alert("Failed to download content. Note: this is a mock implementation.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!blob) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Content Not Found</h1>
        <p className="text-muted-foreground mb-8">The blob you are looking for might have been removed or is completely private.</p>
        <Button asChild><Link href="/">Return to Feed</Link></Button>
      </div>
    );
  }

  const shortAddress = `${blob.creatorAddress.slice(0, 6)}...${blob.creatorAddress.slice(-4)}`;

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Left Col - Media / Preview */}
        <div className="md:col-span-2 space-y-6">
          <div className="aspect-video bg-muted/30 border rounded-2xl overflow-hidden relative flex items-center justify-center bg-gradient-to-br from-background to-muted group">
             {isUnlocked ? (
                blob.thumbnailUrl ? (
                  <img src={blob.thumbnailUrl} alt={blob.title} className="object-contain w-full h-full" />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <PlayCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="font-semibold text-lg">Content Unlocked</p>
                    <p className="text-sm">Click download to access full file.</p>
                  </div>
                )
             ) : (
                <div className="absolute inset-0 backdrop-blur-xl bg-background/50 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Lock className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Premium Content</h3>
                  <p className="text-muted-foreground max-w-sm mb-6">
                    Unlock full access to this {blob.contentType.toLowerCase()} by paying the creator directly via smart contract.
                  </p>
                  <Button size="lg" onClick={handlePayment} disabled={isPaying || !connected}>
                    {isPaying ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing Payment...</>
                    ) : (
                      <>Pay {blob.price} SUSD to Unlock</>
                    )}
                  </Button>
                  {!connected && (
                    <p className="text-xs text-red-400 mt-3 font-medium">Please connect wallet using top navigation</p>
                  )}
                </div>
             )}
          </div>

          <div className="flex gap-4">
            <Button variant="secondary" className="flex-1" onClick={handleDownload} disabled={!isUnlocked}>
              <Download className="w-4 h-4 mr-2" /> Download Full File ({isUnlocked ? "Available" : "Locked"})
            </Button>
            {blob.contentType === 'Video' && isUnlocked && (
              <Button className="flex-1">
                <PlayCircle className="w-4 h-4 mr-2" /> Shelby Breakpoint Stream
              </Button>
            )}
          </div>
        </div>

        {/* Right Col - Meta & Buy */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">{blob.title}</h1>
          
          <div className="flex items-center justify-between border-b pb-4">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-600 flex justify-center items-center font-bold text-white shadow-sm">
                 {blob.creatorAddress.slice(2, 4)}
               </div>
               <div>
                  <p className="text-sm text-muted-foreground leading-tight">Creator</p>
                  <p className="font-semibold text-foreground">{shortAddress}</p>
               </div>
             </div>
             <Button variant="outline" size="sm" className="rounded-full">Follow</Button>
          </div>

          <div>
             <h3 className="font-semibold mb-2">About this {blob.contentType}</h3>
             <p className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed">
               {blob.description || "No description provided."}
             </p>
          </div>

          <div className="bg-muted/30 p-4 rounded-xl border space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price</span>
              <span className="font-semibold">{blob.price === 0 ? "Free" : `${blob.price} ShelbyUSD`}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Published</span>
              <span className="font-medium">{new Date(blob.timestamp).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Content Type</span>
              <Badge variant="secondary">{blob.contentType}</Badge>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-border/50">
            <div className="flex gap-4">
              <button className="flex items-center gap-1.5 text-muted-foreground hover:text-red-500 transition-colors text-sm font-medium">
                <Heart className="w-5 h-5" /> {blob.likes}
              </button>
              <div className="flex items-center gap-1.5 text-muted-foreground text-sm font-medium">
                <Eye className="w-5 h-5" /> {blob.views}
              </div>
            </div>
            <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              <Share2 className="w-5 h-5" /> Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
