"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { downloadBlob, listBlobs, BlobMetadata, recordView, recordLike, followUser, getFollowCount, checkFollowStatus } from "@/lib/shelby";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lock, Unlock, Download, Eye, Heart, Share2, Loader2, PlayCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { createProtocolFeePayload, aptos, PROTOCOL_FEES } from "@/lib/shelby-protocol";

export default function ContentPage() {
  const { id } = useParams() as { id: string };
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const [blob, setBlob] = useState<BlobMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // Protocol Fee Schedule — ShelbyUSD (from central config)
  const FEES = {
    LIKE:     PROTOCOL_FEES.LIKE,
    DOWNLOAD: PROTOCOL_FEES.DOWNLOAD,
    FOLLOW:   PROTOCOL_FEES.FOLLOW,
    UNLOCK:   blob?.price || 0,
  };

  // Shared fee settlement helper
  const settleFee = async (amount: number, label: string) => {
    if (!connected || !account) throw new Error("Wallet not connected. Connect Petra first.");
    setTxStatus(`Signing ${label} fee (${amount} SUSD)…`);
    const payload = createProtocolFeePayload(amount);
    const res = await signAndSubmitTransaction({ data: payload as any });
    setTxStatus("Confirming on ShelbyNet…");
    await aptos.waitForTransaction({ transactionHash: res.hash });
    setTxStatus(null);
  };

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
          // Record View
          await recordView(id);
          
          // Get Creator Follows
          const count = await getFollowCount(found.creatorAddress);
          setFollowers(count);

          // Check follow status
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
    if (!connected || !account) { alert("Connect Petra wallet to like content."); return; }
    setTxStatus(null);

    setIsLiking(true);
    try {
      await settleFee(FEES.LIKE, "Like");
      await recordLike(id);
      if (blob) setBlob({ ...blob, likes: blob.likes + 1 });
    } catch (e: any) {
      console.error(e);
      alert("Like failed: " + (e.message || "Transaction rejected"));
    } finally {
      setIsLiking(false);
      setTxStatus(null);
    }
  };

  const handleFollow = async () => {
    if (!connected || !account) {
      alert("Connect node identity to initialize follow protocol.");
      return;
    }
    
    setIsFollowLoading(true);
    try {
      if (blob) {
        // 1. Settle Social Fee
        const payload = createProtocolFeePayload(0.1);
        const response = await signAndSubmitTransaction({ data: payload as any });
        await aptos.waitForTransaction({ transactionHash: response.hash });

        // 2. DB Update
        await followUser(account.address.toString(), blob.creatorAddress);
        setIsFollowing(true);
        setFollowers(prev => prev + 1);
      }
    } catch (e: any) {
      console.error(e);
      alert("Follow protocol failed: " + (e.message || "Transaction rejected"));
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("Shareable manifest link copied to clipboard!");
  };

  const handlePayment = async () => {
    if (!connected || !account || !blob) {
      alert("Please connect node identity first.");
      return;
    }
    
    setIsPaying(true);
    try {
      // 1. Settle Unlock Fee (ShelbyUSD)
      const payload = createProtocolFeePayload(blob.price || 0.1);
      const response = await signAndSubmitTransaction({ data: payload as any });
      await aptos.waitForTransaction({ transactionHash: response.hash });
      
      setIsUnlocked(true);
      alert("Node settlement complete. Payload decrypted.");
    } catch (e: any) {
      console.error(e);
      alert("Settlement failed: " + (e.message || "Transaction rejected"));
    } finally {
      setIsPaying(false);
    }
  };

  const handleDownload = async () => {
    if (!blob) return;
    if (!connected || !account) { alert("Connect Petra wallet to download."); return; }
    
    setIsDownloading(true);
    try {
      await settleFee(FEES.DOWNLOAD, "Download");
      const metadata = await downloadBlob(id);
      if (!metadata.fileUrl) throw new Error("No URL found");

      const response = await fetch(metadata.fileUrl);
      const buffer = await response.blob();
      
      let ext = "bin";
      const cType = metadata.contentType || (metadata as any).contenttype;
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
      alert("Failed to download payload. Please check node connectivity.");
    } finally {
      setIsDownloading(false);
      setTxStatus(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  if (!blob) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-heading font-black mb-4">BLOB_NOT_FOUND</h1>
        <p className="text-muted-foreground mb-8">Asset may have been purged from the settlement layer.</p>
        <Link href="/"><Button>Restore Feed</Button></Link>
      </div>
    );
  }

  const thumb = blob?.thumbnailUrl || (blob as any)?.thumbnailurl;
  const cType = blob?.contentType || (blob as any)?.contenttype;
  const cAddress = blob?.creatorAddress || (blob as any)?.creatoraddress;
  const shortAddress = cAddress ? `${cAddress.slice(0, 5)}...${cAddress.slice(-4)}` : "0xUnknown";

  return (
    <div className="container mx-auto px-6 py-24 max-w-7xl relative min-h-screen bg-grid">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-primary/5 blur-[160px] -z-10 rounded-full"></div>
      
      {/* Global Tx Status Banner */}
      {txStatus && (
        <div className="fixed top-0 inset-x-0 z-[100] bg-primary text-background py-3 px-6 flex items-center justify-center gap-3 shadow-2xl">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span className="text-xs font-mono font-black uppercase tracking-widest">{txStatus}</span>
        </div>
      )}
      <div className="grid lg:grid-cols-12 gap-16">
        
        {/* Left Column: Media Interface */}
        <div className="lg:col-span-8 space-y-12">
          <div className="aspect-video bg-surface border border-divider rounded-[3rem] overflow-hidden relative flex items-center justify-center shadow-2xl group ring-1 ring-white/5">
             {isUnlocked ? (
                (cType === 'Video') ? (
                  <video 
                    src={blob?.fileUrl} 
                    controls 
                    autoPlay
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (cType === 'PDF' || cType === 'Course') ? (
                  <iframe 
                    src={blob?.fileUrl} 
                    className="w-full h-full border-0 bg-white"
                    title={blob?.title}
                  />
                ) : thumb ? (
                  <img src={thumb} alt={blob?.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-1000 opacity-90 group-hover:opacity-100" />
                ) : (
                  <div className="text-center p-12">
                    <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner shadow-primary/5">
                      <ShieldCheck className="w-12 h-12 text-primary" />
                    </div>
                    <p className="font-heading font-black text-3xl text-foreground tracking-tighter uppercase">Protocol Verified</p>
                    <p className="text-[10px] text-zinc-500 font-mono font-black uppercase tracking-[0.4em] mt-3">Payload decrypted for session.</p>
                  </div>
                )
             ) : (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-3xl flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-28 h-28 rounded-[2.5rem] bg-primary flex items-center justify-center mb-10 shadow-2xl shadow-primary/20 animate-pulse">
                    <Lock className="w-12 h-12 text-background" />
                  </div>
                  <h3 className="text-5xl font-heading font-black text-foreground mb-4 tracking-tighter uppercase leading-none">Settlement <br /> Required.</h3>
                  <p className="text-muted-foreground max-w-sm mb-12 font-medium leading-relaxed text-lg">
                    This premium {(cType || 'content').toLowerCase()} requires decentralized node settlement for full ingestion.
                  </p>
                  <Button 
                    size="lg" 
                    onClick={handlePayment} 
                    disabled={isPaying || !connected}
                    className="h-20 px-16 rounded-xl bg-primary hover:bg-primary/90 text-background font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20 transition-all active:scale-95"
                  >
                    {isPaying ? (
                      <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Confirming Settlement...</>
                    ) : (
                      <>Unlock for {blob.price || 0.1} SUSD</>
                    )}
                  </Button>
                  {!connected && (
                    <p className="text-[9px] text-zinc-600 mt-8 font-mono font-black uppercase tracking-[0.4em]">Auth Identity Required</p>
                  )}
                </div>
             )}
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            <Button 
                variant="outline" 
                className="flex-1 h-20 rounded-xl font-black uppercase tracking-widest text-[10px] border-divider bg-surface/50 text-zinc-500 hover:text-foreground hover:bg-surface transition-all shadow-lg disabled:opacity-40" 
                onClick={handleDownload} 
                disabled={!isUnlocked || isDownloading}
            >
              {isDownloading
                ? <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Settling Fee…</>
                : <><Download className="w-5 h-5 mr-3" /> Download · {PROTOCOL_FEES.DOWNLOAD} SUSD</>
              }
            </Button>
            {cType === 'Video' && isUnlocked && (
              <Button className="flex-1 h-20 rounded-xl bg-primary text-background font-black uppercase tracking-widest text-[10px] hover:bg-primary/90 transition-all shadow-2xl shadow-primary/10">
                <PlayCircle className="w-5 h-5 mr-3" /> Stream Broadcast
              </Button>
            )}
          </div>
        </div>

        {/* Right Column: Identity & Metadata */}
        <div className="lg:col-span-4 space-y-12">
          <div className="space-y-6">
             <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary font-mono text-[9px] uppercase tracking-[0.3em] font-black">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div> Verified Ingestion
             </div>
             <h1 className="text-5xl font-heading font-black tracking-tighter text-foreground leading-[1.05] uppercase">{blob.title}</h1>
          </div>
          
          <div className="flex items-center justify-between bg-surface border border-divider p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
             <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <div className="flex items-center gap-5">
               <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex justify-center items-center font-black text-primary shadow-inner text-sm font-heading">
                 {cAddress ? cAddress.slice(2, 4).toUpperCase() : "??"}
               </div>
               <div>
                  <p className="text-[9px] text-zinc-600 font-mono font-black uppercase tracking-[0.3em] leading-none mb-2.5">Architect</p>
                  <p className="font-black text-foreground text-xl leading-none uppercase tracking-tight">{shortAddress}</p>
                  <p className="text-[10px] text-primary font-mono font-black uppercase mt-2">{followers} Nodes Following</p>
               </div>
             </div>
             <Button 
                variant={isFollowing ? "secondary" : "outline"} 
                size="sm" 
                className={`rounded-xl font-black uppercase tracking-widest text-[9px] h-11 px-8 transition-all ${isFollowing ? "bg-muted text-foreground/40 border-divider" : "border-primary/20 text-primary hover:bg-primary/10 shadow-lg"}`}
                onClick={handleFollow}
                disabled={isFollowing || isFollowLoading}
             >
                {isFollowLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isFollowing ? "Verified" : "Follow"}
             </Button>
          </div>

          <Card className="bg-surface/50 border border-divider rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl group hover:border-primary/30 transition-all">
             <div className="p-10 space-y-10">
                <div>
                   <h4 className="text-[10px] font-mono font-black uppercase tracking-[0.4em] text-zinc-600 mb-6">Asset Manifest</h4>
                   <p className="text-lg text-muted-foreground leading-relaxed font-black uppercase tracking-tight">
                      "{blob.description || "No Protocol Metadata."}"
                   </p>
                </div>

                <div className="space-y-6 pt-10 border-t border-divider">
                  <div className="flex justify-between items-center text-[10px] font-mono font-black uppercase tracking-[0.2em]">
                    <span className="text-zinc-600">Classification</span>
                    <span className="text-primary">{cType}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono font-black uppercase tracking-[0.2em]">
                    <span className="text-zinc-600">Settlement Tier</span>
                    <span className="text-foreground">{blob.price === 0 ? "Open Protocol" : "Vested Access"}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono font-black uppercase tracking-[0.2em]">
                    <span className="text-zinc-600">Ingested At</span>
                    <span className="text-foreground">{new Date(blob.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
             </div>
          </Card>

          <div className="flex justify-between items-center px-6">
            <div className="flex gap-12">
              <button 
                 onClick={handleLike}
                 disabled={isLiking}
                 className="flex flex-col items-center gap-2.5 group disabled:opacity-50"
              >
                <div className={`p-5 rounded-2xl transition-all duration-300 ${blob.likes > 0 ? "bg-primary text-background shadow-2xl shadow-primary/30 scale-110" : "bg-surface border border-divider text-muted-foreground hover:text-primary hover:border-primary/40"}`}>
                  {isLiking
                    ? <Loader2 className="w-6 h-6 animate-spin" />
                    : <Heart className={`w-6 h-6 ${blob.likes > 0 ? "fill-background" : ""}`} />
                  }
                </div>
                <span className={`text-[11px] font-mono font-black ${blob.likes > 0 ? "text-primary" : "text-zinc-600"}`}>{blob.likes}</span>
              </button>
              <div className="flex flex-col items-center gap-2.5">
                <div className="p-5 rounded-2xl bg-surface border border-divider text-muted-foreground">
                  <Eye className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono font-black text-zinc-600">{blob.views}</span>
              </div>
            </div>
            <button 
               onClick={handleShare}
               className="flex flex-col items-center gap-2.5 group/share"
            >
              <div className="p-5 rounded-2xl bg-surface border border-divider text-muted-foreground group-hover/share:text-primary group-hover/share:border-primary/40 transition-all">
                <Share2 className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-mono font-black text-zinc-600 group-hover/share:text-primary transition-colors">Port</span>
            </button>
          </div>

          <div className="pt-16 border-t border-divider text-center mb-10">
             <p className="text-[9px] font-mono font-black uppercase tracking-[0.5em] text-zinc-800 mb-8">Protocol Authority</p>
             <div className="inline-flex items-center gap-5 p-5 bg-surface border border-divider rounded-2xl shadow-xl">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-background font-black font-heading shadow-md shadow-primary/10">S</div>
                <div className="text-left">
                   <p className="text-[8px] font-mono font-black text-zinc-500 uppercase tracking-widest leading-none mb-1.5">Master Node Identity</p>
                   <p className="text-sm font-bold text-foreground">Authored by <span className="text-primary italic tracking-tight">@Aptos_king</span></p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
