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
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      <div className="grid lg:grid-cols-3 gap-12">
        
        {/* Left Col - Media / Preview */}
        <div className="lg:col-span-2 space-y-8">
          <div className="aspect-video bg-[#F5F2EE] border border-border rounded-[2rem] overflow-hidden relative flex items-center justify-center shadow-2xl shadow-primary/5 group">
             {isUnlocked ? (
                thumb ? (
                  <img src={thumb} alt={blob?.title} className="object-contain w-full h-full" />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <PlayCircle className="w-16 h-16 mx-auto mb-4 opacity-30 text-primary" />
                    <p className="font-extrabold text-xl tracking-tight text-foreground">Blob Verified</p>
                    <p className="text-sm font-medium">Ready for local decryption/download.</p>
                  </div>
                )
             ) : (
                <div className="absolute inset-0 bg-[#FDFCFB]/80 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 shadow-inner">
                    <Lock className="w-12 h-12 text-primary" />
                  </div>
                  <h3 className="text-3xl font-black mb-3 tracking-tighter">Premium Settlement</h3>
                  <p className="text-muted-foreground max-w-sm mb-10 font-medium leading-relaxed">
                    This {(cType || 'content').toLowerCase()} requires SUSD settlement for node access.
                  </p>
                  <Button 
                    size="lg" 
                    onClick={handlePayment} 
                    disabled={isPaying || !connected}
                    className="h-16 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/30 transition-all active:scale-95"
                  >
                    {isPaying ? (
                      <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Settlement in progress...</>
                    ) : (
                      <>Unlock for {blob.price} SUSD</>
                    )}
                  </Button>
                  {!connected && (
                    <p className="text-[10px] text-primary mt-5 font-black uppercase tracking-widest">Auth session required</p>
                  )}
                </div>
             )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
                variant="secondary" 
                className="flex-1 h-14 rounded-2xl font-bold bg-white border-border border shadow-sm hover:border-primary/30 hover:text-primary transition-all" 
                onClick={handleDownload} 
                disabled={!isUnlocked}
            >
              <Download className="w-5 h-5 mr-2" /> Download Payload
            </Button>
            {cType === 'Video' && isUnlocked && (
              <Button className="flex-1 h-14 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20">
                <PlayCircle className="w-5 h-5 mr-2" /> Stream via ShelbyNet
              </Button>
            )}
          </div>
        </div>

        {/* Right Col - Meta & Brand */}
        <div className="space-y-8">
          <div className="space-y-4">
             <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10 font-black uppercase tracking-widest text-[10px] py-1">Verified Blob</Badge>
             <h1 className="text-4xl font-black tracking-tighter text-foreground leading-[1.1]">{blob.title}</h1>
          </div>
          
          <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-border shadow-sm">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-primary flex justify-center items-center font-black text-white shadow-lg text-xs">
                 {cAddress ? cAddress.slice(2, 4).toUpperCase() : "??"}
               </div>
               <div>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-none mb-1">Creator</p>
                  <p className="font-bold text-foreground truncate w-24 sm:w-auto">{shortAddress}</p>
                  <p className="text-[10px] text-primary font-black uppercase tracking-tighter mt-0.5">{followers} Followers</p>
               </div>
             </div>
             <Button 
                variant={isFollowing ? "secondary" : "outline"} 
                size="sm" 
                className={`rounded-xl font-bold px-5 h-10 transition-all ${isFollowing ? "bg-muted text-muted-foreground" : "border-primary/20 text-primary hover:bg-primary/5"}`}
                onClick={handleFollow}
                disabled={isFollowing}
             >
                {isFollowing ? <><UserCheck className="w-4 h-4 mr-1.5" /> Followed</> : "Follow"}
             </Button>
          </div>

          <Card className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
             <CardHeader className="bg-[#FDFCFB] border-b py-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Blob Manifest</p>
             </CardHeader>
             <CardContent className="p-6 space-y-6">
                <div>
                   <p className="text-sm text-foreground leading-relaxed font-medium italic opacity-80">
                      "{blob.description || "No metadata provided for this ingestion cycle."}"
                   </p>
                </div>

                <div className="space-y-4 border-t pt-6">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                    <span className="text-muted-foreground/60">Node Settlement</span>
                    <span className="text-primary">{blob.price === 0 ? "Open Access" : `${blob.price} SUSD`}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                    <span className="text-muted-foreground/60">Ingestion Date</span>
                    <span className="text-foreground">{new Date(blob.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                    <span className="text-muted-foreground/60">Class</span>
                    <span className="text-primary">{cType}</span>
                  </div>
                </div>
             </CardContent>
          </Card>

          <div className="flex justify-between items-center py-4 px-2">
            <div className="flex gap-6">
              <button 
                 onClick={handleLike}
                 className="flex items-center gap-2 font-black text-[11px] uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
              >
                <Heart className={`w-5 h-5 ${blob.likes > 0 ? "fill-primary text-primary" : "text-primary/40"}`} /> {blob.likes}
              </button>
              <div className="flex items-center gap-2 font-black text-[11px] uppercase tracking-wider text-muted-foreground">
                <Eye className="w-5 h-5 text-primary/40" /> {blob.views}
              </div>
            </div>
            <button 
               onClick={handleShare}
               className="flex items-center gap-2 font-black text-[11px] uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
            >
              <Share2 className="w-5 h-5 text-primary/40" /> Share
            </button>
          </div>

          <div className="pt-6 border-t text-center">
             <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Ingested by</p>
             <p className="text-xs font-bold text-foreground">Build by <span className="text-primary">@Aptos_king</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
