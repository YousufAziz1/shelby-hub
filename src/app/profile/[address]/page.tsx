"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { listBlobs, BlobMetadata, getFollowCount } from "@/lib/shelby";
import { FeedCard } from "@/components/FeedCard";
import { Button } from "@/components/ui/button";
import { Loader2, UploadCloud, Users, Eye, Heart, Copy, Check, ExternalLink, Wallet, Coins } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { address } = useParams() as { address: string };
  const { account, connected } = useWallet();

  const [blobs, setBlobs] = useState<BlobMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState(0);
  const [copied, setCopied] = useState(false);
  const [activeSeries, setActiveSeries] = useState("All");

  const isOwner = connected && account?.address?.toString().toLowerCase() === address?.toLowerCase();

  useEffect(() => {
    if (!address) return;
    async function load() {
      setLoading(true);
      try {
        const all = await listBlobs();
        const mine = all.filter(
          (b) =>
            (b.creatorAddress || (b as any).creatoraddress || "")
              .toLowerCase() === address.toLowerCase()
        );
        setBlobs(mine);
        const count = await getFollowCount(address);
        setFollowers(count);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [address]);

  const totalViews = blobs.reduce((s, b) => s + (b.views || 0), 0);
  const totalLikes = blobs.reduce((s, b) => s + (b.likes || 0), 0);
  const totalEarnings = (totalLikes * 0.04).toFixed(2);

  const seriesOptions = ["All", ...Array.from(new Set(blobs.map(b => b.contentType)))];
  const filteredBlobs = blobs.filter(b => activeSeries === "All" || b.contentType === activeSeries);

  const shortAddr = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-grid">
      {/* Hero glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-primary/5 blur-[140px] -z-10 rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 py-24 max-w-6xl">

        {/* ── Profile Header ────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 mb-16">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-[2rem] bg-primary/10 border-2 border-primary/30 flex items-center justify-center shadow-2xl shadow-primary/10">
              <span className="text-3xl font-black font-heading text-primary uppercase">
                {address ? address.slice(2, 4) : "??"}
              </span>
            </div>
            {isOwner && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary border-2 border-background flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-background animate-pulse" />
              </div>
            )}
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <p className="text-[9px] font-mono font-black uppercase tracking-[0.4em] text-muted-foreground">
                {isOwner ? "Your Node Identity" : "Creator Node"}
              </p>
              {isOwner && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[9px] font-mono font-black uppercase tracking-widest">
                  <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                  Active
                </span>
              )}
            </div>
            <h1 className="text-2xl font-heading font-black tracking-tight text-foreground uppercase truncate mb-4">
              {shortAddr}
            </h1>
            <div className="flex items-center gap-3">
              <button
                onClick={copyAddress}
                className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors"
              >
                {copied ? (
                  <><Check className="w-3.5 h-3.5 text-primary" /> Copied</>
                ) : (
                  <><Copy className="w-3.5 h-3.5" /> {address.slice(0, 10)}...{address.slice(-6)}</>
                )}
              </button>
              <span className="text-divider">·</span>
              <a
                href={`https://explorer.aptoslabs.com/account/${address}?network=testnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="w-3 h-3" /> Explorer
              </a>
            </div>
          </div>

          {/* CTA */}
          {isOwner && (
            <Link href="/upload">
              <Button className="bg-primary hover:bg-primary/90 text-background rounded-xl px-8 h-12 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                <UploadCloud className="w-4 h-4 mr-2.5" /> Upload
              </Button>
            </Link>
          )}
        </div>

        {/* ── Stats Row ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-16">
          {[
            { icon: UploadCloud, label: "Uploads",   value: blobs.length },
            { icon: Users,       label: "Followers",  value: followers },
            { icon: Eye,         label: "Total Views", value: totalViews },
            { icon: Heart,       label: "Total Likes", value: totalLikes },
            { icon: Coins,       label: "SUSD Earned", value: totalEarnings },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="bg-surface border border-divider rounded-[1.5rem] p-6 flex flex-col gap-3 hover:border-primary/30 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-black text-foreground font-heading">
                  {loading ? "—" : value.toLocaleString()}
                </p>
                <p className="text-[9px] font-mono font-black uppercase tracking-[0.25em] text-muted-foreground mt-1">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-heading font-black uppercase tracking-tight text-foreground">
              {isOwner ? "Your Uploads" : "Published Content"}
            </h2>
            <p className="text-[10px] font-mono text-muted-foreground mt-1 uppercase tracking-widest">
              {blobs.length} asset{blobs.length !== 1 ? "s" : ""} on ShelbyNet
            </p>
          </div>
          {blobs.length > 0 && (
            <select 
              className="px-4 py-2 rounded-xl bg-surface border border-divider text-[10px] font-mono font-black uppercase text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              value={activeSeries}
              onChange={(e) => setActiveSeries(e.target.value)}
            >
              {seriesOptions.map(series => (
                <option key={series} value={series}>{series}</option>
              ))}
            </select>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary opacity-30" />
            <p className="text-[10px] font-mono font-black uppercase tracking-[0.4em] text-muted-foreground">
              Fetching Protocol Data…
            </p>
          </div>
        ) : blobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
            <div className="w-20 h-20 rounded-[2rem] bg-surface border border-divider flex items-center justify-center">
              <Wallet className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <div>
              <p className="text-lg font-heading font-black uppercase text-foreground mb-2">
                No Uploads Yet
              </p>
              <p className="text-sm text-muted-foreground max-w-xs">
                {isOwner
                  ? "Start uploading files to the Shelby decentralized storage network."
                  : "This creator hasn't published any content yet."}
              </p>
            </div>
            {isOwner && (
              <Link href="/upload">
                <Button className="bg-primary text-background rounded-xl px-8 h-12 font-black uppercase tracking-widest text-[10px]">
                  <UploadCloud className="w-4 h-4 mr-2" /> Upload Now
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBlobs.map((b) => (
              <FeedCard key={b.id} blob={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
