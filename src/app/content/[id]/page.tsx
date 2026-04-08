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
    <div className="container mx-auto px-6 py-24 max-w-7xl relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/5 blur-[150px] -z-10 rounded-full"></div>
      
      <div className="grid lg:grid-cols-12 gap-16">
        
        {/* Left Column: Immersive Media */}
        <div className="lg:col-span-8 space-y-12">
          <div className="aspect-video bg-zinc-900 border border-white/5 rounded-[3rem] overflow-hidden relative flex items-center justify-center shadow-2xl group">
             {isUnlocked ? (
                thumb ? (
                  <img src={thumb} alt={blob?.title} className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-1000" />
                ) : (
                  <div className="text-center p-12">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <PlayCircle className="w-10 h-10 text-primary" />
                    </div>
                    <p className="font-black text-2xl text-white tracking-widest uppercase">Blob Verified</p>
                    <p className="text-sm text-zinc-500 font-bold mt-2">Ready for local decryption cycle.</p>
                  </div>
                )
             ) : (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-2xl flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-24 h-24 rounded-[2rem] bg-primary flex items-center justify-center mb-10 shadow-[0_0_40px_rgba(255,20,147,0.5)] animate-pulse">
                    <Lock className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter">Settlement Required</h3>
                  <p className="text-zinc-400 max-w-sm mb-12 font-medium leading-relaxed text-lg">
                    This premium {(cType || 'content').toLowerCase()} requires decentralized node settlement for full ingestion.
                  </p>
                  <Button 
                    size="lg" 
                    onClick={handlePayment} 
                    disabled={isPaying || !connected}
                    className="h-20 px-16 rounded-[2rem] bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-sm shadow-[0_20px_40px_rgba(255,20,147,0.3)] transition-all active:scale-95"
                  >
                    {isPaying ? (
                      <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Node Syncing...</>
                    ) : (
                      <>Unlock for {blob.price} SUSD</>
                    )}
                  </Button>
                  {!connected && (
                    <p className="text-[10px] text-zinc-600 mt-6 font-black uppercase tracking-[0.3em]">Authentication Required</p>
                  )}
                </div>
             )}
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            <Button 
                variant="outline" 
                className="flex-1 h-16 rounded-2xl font-black uppercase tracking-widest text-xs border-white/5 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all" 
                onClick={handleDownload} 
                disabled={!isUnlocked}
            >
              <Download className="w-5 h-5 mr-3" /> Download Payload
            </Button>
            {cType === 'Video' && isUnlocked && (
              <Button className="flex-1 h-16 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-all shadow-xl">
                <PlayCircle className="w-5 h-5 mr-3" /> Play Broadcast
              </Button>
            )}
          </div>
        </div>

        {/* Right Column: Metadata & Engagement */}
        <div className="lg:col-span-4 space-y-12">
          <div className="space-y-6">
             <Badge className="bg-primary text-white border-none font-black uppercase tracking-[0.2em] text-[10px] py-1.5 px-4 shadow-[0_0_15px_rgba(255,20,147,0.4)]">Verified Asset</Badge>
             <h1 className="text-5xl font-black tracking-tighter text-white leading-[1.1]">{blob.title}</h1>
          </div>
          
          <div className="flex items-center justify-between bg-zinc-900 border border-white/5 p-6 rounded-[2rem] shadow-2xl">
             <div className="flex items-center gap-4">
               <div className="w-14 h-14 rounded-2xl bg-primary flex justify-center items-center font-black text-white shadow-lg text-sm">
                 {cAddress ? cAddress.slice(2, 4).toUpperCase() : "??"}
               </div>
               <div>
                  <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest leading-none mb-2">Architect</p>
                  <p className="font-black text-white text-lg leading-none">{shortAddress}</p>
                  <p className="text-[10px] text-primary font-black uppercase mt-1.5">{followers} Followers</p>
               </div>
             </div>
             <Button 
                variant={isFollowing ? "secondary" : "outline"} 
                size="sm" 
                className={`rounded-xl font-black uppercase tracking-widest text-[10px] h-10 px-6 transition-all ${isFollowing ? "bg-zinc-800 text-zinc-500 border-none" : "border-primary/20 text-primary hover:bg-primary/10"}`}
                onClick={handleFollow}
                disabled={isFollowing}
             >
                {isFollowing ? "Followed" : "Follow"}
             </Button>
          </div>

          <Card className="bg-white/5 border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
             <div className="p-8 space-y-8">
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-4">Core Manifesto</p>
                   <p className="text-lg text-zinc-300 leading-relaxed font-medium">
                      "{blob.description || "No metadata manifest provided for this ingestion cycle."}"
                   </p>
                </div>

                <div className="space-y-5 pt-8 border-t border-white/5">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest outline-none">
                    <span className="text-zinc-600">Settlement Type</span>
                    <span className="text-primary">{blob.price === 0 ? "Global Access" : "Premium Tier"}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest outline-none">
                    <span className="text-zinc-600">Ingestion Timestamp</span>
                    <span className="text-white">{new Date(blob.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest outline-none">
                    <span className="text-zinc-600">Content Classification</span>
                    <span className="text-primary">{cType}</span>
                  </div>
                </div>
             </div>
          </Card>

          <div className="flex justify-between items-center px-4">
            <div className="flex gap-10">
              <button 
                 onClick={handleLike}
                 className="flex flex-col items-center gap-1.5 group"
              >
                <div className={`p-4 rounded-full transition-all ${blob.likes > 0 ? "bg-primary text-white shadow-[0_0_20px_rgba(255,20,147,0.4)]" : "bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-white"}`}>
                  <Heart className={`w-6 h-6 ${blob.likes > 0 ? "fill-white" : ""}`} />
                </div>
                <span className="text-xs font-black text-zinc-500 group-hover:text-white">{blob.likes}</span>
              </button>
              <div className="flex flex-col items-center gap-1.5">
                <div className="p-4 rounded-full bg-white/5 text-zinc-500">
                  <Eye className="w-6 h-6" />
                </div>
                <span className="text-xs font-black text-zinc-500">{blob.views}</span>
              </div>
            </div>
            <button 
               onClick={handleShare}
               className="flex flex-col items-center gap-1.5 group"
            >
              <div className="p-4 rounded-full bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-white transition-all">
                <Share2 className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-zinc-500 group-hover:text-white">Share</span>
            </button>
          </div>

          <div className="pt-12 border-t border-white/5 text-center">
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700 mb-3">Protocol Architect</p>
             <p className="text-lg font-black text-white">Build by <span className="text-primary italic">@Aptos_king</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
