"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { downloadBlob, listBlobs, BlobMetadata, recordView, recordLike, followUser, getFollowCount, checkFollowStatus } from "@/lib/shelby";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Lock, Unlock, Download, Eye, Heart, Share2, Loader2, PlayCircle, UserCheck } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function ContentPage() {
  const { id } = useParams() as { id: string };
  const { account, connected } = useWallet();
  const [blob, setBlob] = useState<BlobMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  
  useEffect(() => {
    async function loadContent() {
      if (!id) return;
      setLoading(true);
      try {
        const data = await listBlobs();
        const found = data.find(b => b.id === id);
        if (found) {
          setBlob(found);
          if (found.price === 0) {
            setIsUnlocked(true);
          }
          // 1. Record View (Now with real DB update)
          await recordView(id);
          
          // 2. Get Creator Follows
          const count = await getFollowCount(found.creatorAddress);
          setFollowers(count);

          // 3. Check if current user already follows (Persistence)
          if (account?.address) {
            const following = await checkFollowStatus(account.address.toString(), found.creatorAddress);
            setIsFollowing(following);
          }
        }
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadContent();
  }, [id, account?.address]);

  const handleLike = async () => {
    try {
      await recordLike(id);
      if (blob) setBlob({ ...blob, likes: blob.likes + 1 });
    } catch (e) {
      console.error(e);
    }
  };

  const handleFollow = async () => {
    if (!connected || !account) {
      alert("Connect wallet to follow creators.");
      return;
    }
    try {
      if (blob) {
        await followUser(account.address.toString(), blob.creatorAddress);
        setIsFollowing(true);
        setFollowers(prev => prev + 1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("Shareable link copied to clipboard!");
  };

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
    if (!blob) return;
    try {
      const metadata = await downloadBlob(id);
      if (!metadata.fileUrl) throw new Error("No URL found");

      // Fetch the binary data
      const response = await fetch(metadata.fileUrl);
      const buffer = await response.blob();
      
      // Determine extension
      let ext = "bin";
      const cType = metadata.contentType || (metadata as any).contenttype; // Resilient
      if (cType === "Image") ext = "png";
      else if (cType === "Video") ext = "mp4";
      else if (cType === "Source Code") ext = "txt";
      else if (cType === "Course") ext = "pdf";

      const url = URL.createObjectURL(buffer);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${metadata.title.replace(/\s+/g, '_')}_shelbyhub.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download error", e);
      alert("Failed to download content. Please check your connection.");
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
        <Link href="/"><Button>Return to Feed</Button></Link>
      </div>
    );
  }

  const thumb = blob?.thumbnailUrl || (blob as any)?.thumbnailurl;
  const cType = blob?.contentType || (blob as any)?.contenttype;
  const cAddress = blob?.creatorAddress || (blob as any)?.creatoraddress;

  const shortAddress = cAddress ? `${cAddress.slice(0, 6)}...${cAddress.slice(-4)}` : "0xUnknown";

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Left Col - Media / Preview */}
        <div className="md:col-span-2 space-y-6">
          <div className="aspect-video bg-muted/30 border rounded-2xl overflow-hidden relative flex items-center justify-center bg-gradient-to-br from-background to-muted group">
             {isUnlocked ? (
                thumb ? (
                  <img src={thumb} alt={blob?.title} className="object-contain w-full h-full" />
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
                    Unlock full access to this {(cType || 'content').toLowerCase()} by paying the creator directly via smart contract.
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
                  <p className="font-semibold text-foreground truncate w-24 sm:w-auto">{shortAddress}</p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">{followers} Followers</p>
               </div>
             </div>
             <Button 
                variant={isFollowing ? "secondary" : "outline"} 
                size="sm" 
                className="rounded-full"
                onClick={handleFollow}
                disabled={isFollowing}
             >
                {isFollowing ? <><UserCheck className="w-4 h-4 mr-1" /> Followed</> : "Follow"}
             </Button>
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
              <button 
                 onClick={handleLike}
                 className="flex items-center gap-1.5 text-muted-foreground hover:text-red-500 transition-colors text-sm font-medium"
              >
                <Heart className={`w-5 h-5 ${blob.likes > 0 ? "fill-red-500 text-red-500" : ""}`} /> {blob.likes}
              </button>
              <div className="flex items-center gap-1.5 text-muted-foreground text-sm font-medium">
                <Eye className="w-5 h-5" /> {blob.views}
              </div>
            </div>
            <button 
               onClick={handleShare}
               className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              <Share2 className="w-5 h-5" /> Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
