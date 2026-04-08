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
    <div className="container mx-auto px-6 py-16 max-w-6xl">
      <div className="grid lg:grid-cols-3 gap-16">
        
        {/* Left Col - Media / Preview */}
        <div className="lg:col-span-2 space-y-10">
          <div className="aspect-video bg-slate-50 border border-slate-200 rounded-[2rem] overflow-hidden relative flex items-center justify-center shadow-sm group">
             {isUnlocked ? (
                thumb ? (
                  <img src={thumb} alt={blob?.title} className="object-contain w-full h-full" />
                ) : (
                  <div className="text-center">
                    <PlayCircle className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                    <p className="font-bold text-xl text-slate-900">Content Verified</p>
                    <p className="text-sm text-slate-400 font-medium mt-1">Ready for protocol download.</p>
                  </div>
                )
             ) : (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-slate-900 flex items-center justify-center mb-8 shadow-2xl">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Settlement Required</h3>
                  <p className="text-slate-500 max-w-sm mb-10 font-medium leading-relaxed">
                    Access to this {(cType || 'content').toLowerCase()} requires decentralized ingestion settlement.
                  </p>
                  <Button 
                    size="lg" 
                    onClick={handlePayment} 
                    disabled={isPaying || !connected}
                    className="h-14 px-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all active:scale-95"
                  >
                    {isPaying ? (
                      <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Processing...</>
                    ) : (
                      <>Settle {blob.price} SUSD</>
                    )}
                  </Button>
                  {!connected && (
                    <p className="text-[10px] text-slate-400 mt-5 font-bold uppercase tracking-wider">Authentication Required</p>
                  )}
                </div>
             )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
                variant="outline" 
                className="flex-1 h-12 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all" 
                onClick={handleDownload} 
                disabled={!isUnlocked}
            >
              <Download className="w-4 h-4 mr-2" /> Download Asset
            </Button>
            {cType === 'Video' && isUnlocked && (
              <Button className="flex-1 h-12 rounded-xl bg-slate-900 text-white font-bold">
                <PlayCircle className="w-4 h-4 mr-2" /> Play Stream
              </Button>
            )}
          </div>
        </div>

        {/* Right Col - Meta & Brand */}
        <div className="space-y-10">
          <div className="space-y-4">
             <Badge className="bg-slate-100 text-slate-600 border-none hover:bg-slate-100 font-bold uppercase tracking-wider text-[10px] py-1 px-3">Protocol Verified</Badge>
             <h1 className="text-4xl font-bold tracking-tight text-slate-900 leading-[1.2]">{blob.title}</h1>
          </div>
          
          <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-lg bg-slate-100 flex justify-center items-center font-bold text-slate-600 shadow-inner text-xs">
                 {cAddress ? cAddress.slice(2, 4).toUpperCase() : "??"}
               </div>
               <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1.5">Creator</p>
                  <p className="font-bold text-slate-900 truncate w-24 sm:w-auto text-sm">{shortAddress}</p>
               </div>
             </div>
             <Button 
                variant={isFollowing ? "secondary" : "outline"} 
                size="sm" 
                className={`rounded-lg font-bold h-9 px-4 text-xs transition-all ${isFollowing ? "bg-slate-100 text-slate-500 border-none" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                onClick={handleFollow}
                disabled={isFollowing}
             >
                {isFollowing ? "Following" : "Follow"}
             </Button>
          </div>

          <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
             <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Asset Manifest</p>
             </CardHeader>
             <CardContent className="p-6 space-y-6">
                <div>
                   <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      {blob.description}
                   </p>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                    <span className="text-slate-400">Settlement</span>
                    <span className="text-slate-900">{blob.price === 0 ? "Open Access" : `${blob.price} SUSD`}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                    <span className="text-slate-400">Type</span>
                    <span className="text-slate-900">{cType}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                    <span className="text-slate-400">Published</span>
                    <span className="text-slate-900">{new Date(blob.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
             </CardContent>
          </Card>

          <div className="flex justify-between items-center py-4 px-2">
            <div className="flex gap-8">
              <button 
                 onClick={handleLike}
                 className="flex items-center gap-2 font-bold text-xs text-slate-400 hover:text-red-500 transition-colors"
              >
                <Heart className={`w-4 h-4 ${blob.likes > 0 ? "fill-red-500 text-red-500" : ""}`} /> {blob.likes}
              </button>
              <div className="flex items-center gap-2 font-bold text-xs text-slate-400">
                <Eye className="w-4 h-4" /> {blob.views}
              </div>
            </div>
            <button 
               onClick={handleShare}
               className="flex items-center gap-2 font-bold text-xs text-slate-400 hover:text-slate-900 transition-colors"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>

          <div className="pt-8 border-t border-slate-100 text-center">
             <p className="text-xs font-bold text-slate-900">Build by <span className="text-primary font-black">@Aptos_king</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
