'use client';
import Link from 'next/link';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import {
  Heart, Eye, Image as ImageIcon, Video, Code, FileText,
  Lock, FileArchive, FileJson, Trash2, Edit3, Loader2, Zap,
  X, Save,
} from 'lucide-react';
import { BlobMetadata, recordLike, recordUnlike, deleteBlob, updateBlob, checkUserLiked, setUserLiked } from '@/lib/shelby';
import { useState, useEffect } from 'react';
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { createProtocolFeePayload, aptos, PROTOCOL_FEES } from "@/lib/shelby-protocol";

const FEES = {
  LIKE:   PROTOCOL_FEES.LIKE,
  DELETE: PROTOCOL_FEES.DELETE,
  EDIT:   PROTOCOL_FEES.EDIT,
} as const;

export function FeedCard({ blob: initialBlob }: { blob: BlobMetadata }) {
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const [blob, setBlob] = useState(initialBlob);
  const [mounted, setMounted] = useState(false);

  // Action states
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLiking,  setIsLiking]  = useState(false);
  const [isLiked,   setIsLiked]   = useState(false);
  const [txStatus,  setTxStatus]  = useState<string | null>(null);

  // Edit modal state
  const [showEdit,    setShowEdit]    = useState(false);
  const [editTitle,   setEditTitle]   = useState(blob.title);
  const [editDesc,    setEditDesc]    = useState(blob.description);
  const [editPrice,   setEditPrice]   = useState(String(blob.price));
  const [isSaving,   setIsSaving]    = useState(false);

  useEffect(() => {
    setMounted(true);
    if (account?.address) {
      setIsLiked(checkUserLiked(account.address.toString(), initialBlob.id));
    }
  }, [account?.address, initialBlob.id]);

  const thumb    = blob.thumbnailUrl  || (blob as any).thumbnailurl;
  const cType    = blob.contentType   || (blob as any).contenttype;
  const cAddress = blob.creatorAddress || (blob as any).creatoraddress;

  const isOwner = mounted && connected && account?.address &&
    (account.address.toString().toLowerCase() === (cAddress || "").toLowerCase());

  const shortAddress = cAddress ? `${cAddress.slice(0, 5)}...${cAddress.slice(-4)}` : "0x...";
  const date = new Date(blob.timestamp).toLocaleDateString();

  // ─── Settle Fee ─────────────────────────────────────────────────────────────
  const settleFee = async (amount: number, label: string) => {
    if (!connected || !account) throw new Error("Wallet not connected");
    setTxStatus(`Signing ${label} fee (${amount} SUSD)…`);
    const payload = createProtocolFeePayload(amount);
    const res = await signAndSubmitTransaction({ data: payload as any });
    setTxStatus("Confirming on ShelbyNet…");
    await aptos.waitForTransaction({ transactionHash: res.hash });
    setTxStatus(null);
  };

  // ─── Like / Unlike Toggle ────────────────────────────────────────────────────
  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (isLiking) return;
    if (!connected) { alert("Connect your Petra wallet to like content."); return; }

    setIsLiking(true);
    try {
      if (isLiked) {
        // UNLIKE — free
        await recordUnlike(blob.id);
        setUserLiked(account!.address.toString(), blob.id, false);
        setIsLiked(false);
        setBlob(prev => ({ ...prev, likes: Math.max(0, prev.likes - 1) }));
      } else {
        // LIKE — fee (removed confirm)
        await settleFee(FEES.LIKE, "Like");
        await recordLike(blob.id);
        setUserLiked(account!.address.toString(), blob.id, true);
        setIsLiked(true);
        setBlob(prev => ({ ...prev, likes: prev.likes + 1 }));
      }
    } catch (err: any) {
      alert((isLiked ? "Unlike" : "Like") + " failed: " + (err.message || "Error"));
    } finally {
      setIsLiking(false);
      setTxStatus(null);
    }
  };

  // ─── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDeleting(true);
    try {
      await settleFee(FEES.DELETE, "Delete");
      await deleteBlob(blob.id, account!.address.toString());
      window.location.reload();
    } catch (err: any) {
      console.error("Delete error:", err);
      alert("Delete failed: " + (err.message || "Unknown error"));
      setIsDeleting(false);
      setTxStatus(null);
    }
  };

  // ─── Edit — open modal ───────────────────────────────────────────────────────
  const handleEditOpen = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setEditTitle(blob.title);
    setEditDesc(blob.description);
    setEditPrice(String(blob.price));
    setShowEdit(true);
  };

  // ─── Edit — save ─────────────────────────────────────────────────────────────
  const handleEditSave = async () => {
    if (!editTitle.trim()) { alert("Title cannot be empty."); return; }
    setIsSaving(true);
    try {
      await settleFee(FEES.EDIT, "Edit");
      const updates = {
        title:       editTitle.trim(),
        description: editDesc.trim(),
        price:       parseFloat(editPrice) || 0,
      };
      await updateBlob(blob.id, account!.address.toString(), updates);
      setBlob(prev => ({ ...prev, ...updates }));
      setShowEdit(false);
    } catch (err: any) {
      console.error("Edit error:", err);
      alert("Edit failed: " + (err.message || "Unknown error"));
    } finally {
      setIsSaving(false);
      setTxStatus(null);
    }
  };

  const getIcon = () => {
    const t = (cType || '').toLowerCase();
    if (t.includes('image'))  return <ImageIcon className="w-12 h-12" />;
    if (t.includes('video'))  return <Video     className="w-12 h-12" />;
    if (t.includes('code') || t.includes('source')) return <Code className="w-12 h-12" />;
    if (t.includes('pdf'))    return <FileText  className="w-12 h-12" />;
    if (t.includes('zip') || t.includes('rar')) return <FileArchive className="w-12 h-12" />;
    return <FileJson className="w-12 h-12" />;
  };

  if (!mounted) return <div className="aspect-[3/4] bg-surface/50 rounded-[2rem] animate-pulse border border-divider" />;

  return (
    <>
      {/* ─── Edit Modal ───────────────────────────────────────────────────────── */}
      {showEdit && (
        <div
          className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setShowEdit(false)}
        >
          <div
            className="bg-[hsl(var(--surface))] border border-divider rounded-[2rem] p-8 w-full max-w-md shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-heading font-black text-xl uppercase tracking-tight">Edit Asset</h2>
              <button onClick={() => setShowEdit(false)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-[9px] font-mono font-black uppercase tracking-[0.3em] text-muted-foreground mb-2 block">
                  Title
                </label>
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full bg-background border border-divider rounded-xl px-4 py-3 text-sm font-medium text-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="Asset title…"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono font-black uppercase tracking-[0.3em] text-muted-foreground mb-2 block">
                  Description
                </label>
                <textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-background border border-divider rounded-xl px-4 py-3 text-sm font-medium text-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                  placeholder="Describe your asset…"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono font-black uppercase tracking-[0.3em] text-muted-foreground mb-2 block">
                  Price (SUSD) — 0 for free
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editPrice}
                  onChange={e => setEditPrice(e.target.value)}
                  className="w-full bg-background border border-divider rounded-xl px-4 py-3 text-sm font-medium text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowEdit(false)}
                className="flex-1 h-12 rounded-xl border border-divider text-muted-foreground text-[10px] font-mono font-black uppercase tracking-widest hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={isSaving}
                className="flex-1 h-12 rounded-xl bg-primary text-background text-[10px] font-mono font-black uppercase tracking-widest hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                  : <><Save className="w-3.5 h-3.5" /> Save · {FEES.EDIT} SUSD</>
                }
              </button>
            </div>

            {txStatus && (
              <p className="text-[9px] font-mono text-primary uppercase tracking-widest text-center mt-4 animate-pulse">
                {txStatus}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ─── Card ─────────────────────────────────────────────────────────────── */}
      <Card className="overflow-hidden bg-surface border border-divider rounded-[2rem] hover:border-primary/40 transition-all duration-500 group flex flex-col h-full shadow-xl hover:shadow-2xl hover:shadow-primary/5 relative">

        {/* Tx Banner */}
        {txStatus && !showEdit && (
          <div className="absolute inset-x-0 top-0 z-50 bg-primary text-background text-[10px] font-mono font-black uppercase tracking-widest px-4 py-2 flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin shrink-0" />
            <span className="truncate">{txStatus}</span>
          </div>
        )}
        {/* Absolute Controls (Outside Link to avoid router interruption) */}
        <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2 pointer-events-none">
          {isOwner && (
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
              <button
                onClick={handleEditOpen}
                className="p-2.5 rounded-xl bg-surface/80 backdrop-blur-md border border-divider text-muted-foreground hover:bg-primary hover:text-background transition-all shadow-xl"
                title={`Edit · ${FEES.EDIT} SUSD`}
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2.5 rounded-xl bg-surface/80 backdrop-blur-md border border-divider text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-xl disabled:opacity-50"
                title={`Delete · ${FEES.DELETE} SUSD`}
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
          {blob.price > 0 ? (
            <div className="bg-primary/10 border border-primary/20 backdrop-blur-md text-primary rounded-lg px-3 py-1 flex items-center gap-2 shadow-sm pointer-events-none">
              <Lock className="w-3 h-3" />
              <span className="text-[10px] font-mono font-black tracking-widest uppercase">{blob.price} SUSD</span>
            </div>
          ) : (
            <div className="bg-surface/80 backdrop-blur-md border border-divider text-muted-foreground rounded-lg px-3 py-1 text-[10px] font-mono font-black tracking-widest uppercase pointer-events-none">
              Free
            </div>
          )}
        </div>

        <Link href={`/content/${blob.id}`} className="block flex-1">
          {/* Media */}
          <div className="aspect-video bg-muted/20 relative flex items-center justify-center overflow-hidden border-b border-divider">
            {(thumb && (cType || "").toLowerCase().includes("image")) ? (
              <img src={thumb} alt={blob.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-1000 opacity-90 group-hover:opacity-100" />
            ) : (
              <div className="text-muted-foreground/30 group-hover:text-primary transition-colors duration-500 scale-150">
                {getIcon()}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-8 space-y-5">
            <h3 className="text-2xl font-heading font-black text-foreground leading-tight tracking-tight uppercase group-hover:text-primary transition-colors">
              {blob.title}
            </h3>
            <div className="flex items-center gap-3">
              <Badge className="bg-primary/5 text-primary border-primary/20 font-mono text-[9px] uppercase tracking-[0.2em] px-3 py-1 rounded-lg font-black">
                {cType}
              </Badge>
              <span className="text-[10px] font-mono text-muted-foreground font-black uppercase tracking-widest">{date}</span>
            </div>
            <p className="text-muted-foreground text-sm font-medium line-clamp-2 leading-relaxed">
              {blob.description || "No Protocol Metadata."}
            </p>
          </div>
        </Link>

        {/* Footer */}
        <div className="mt-auto p-8 pt-0">
          <div className="pt-6 border-t border-divider flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-[11px] text-primary font-black uppercase shadow-inner shrink-0">
                {cAddress ? cAddress.slice(2, 4).toUpperCase() : "??"}
              </div>
              <span className="text-[10px] font-mono font-black text-muted-foreground uppercase tracking-widest truncate">{shortAddress}</span>
            </div>

            <div className="flex items-center gap-5 shrink-0">
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[11px] font-mono font-black text-muted-foreground">{blob.views}</span>
              </div>
              <button onClick={handleLike} disabled={isLiking} className="flex items-center gap-1.5 group/like disabled:opacity-50">
                {isLiking
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  : <Heart className={`w-3.5 h-3.5 transition-all duration-300 ${isLiked ? "fill-primary text-primary scale-110" : "text-muted-foreground group-hover/like:text-primary"}`} />
                }
                <span className={`text-[11px] font-mono font-black ${isLiked ? "text-primary" : "text-muted-foreground"}`}>{blob.likes}</span>
              </button>
            </div>
          </div>

          {/* Fee Legend */}
          <div className="mt-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Zap className="w-2.5 h-2.5 text-primary/40" />
            <span className="text-[8px] font-mono text-muted-foreground/40 uppercase tracking-widest">
              Like {FEES.LIKE} · Edit {FEES.EDIT} · Delete {FEES.DELETE} SUSD
            </span>
          </div>
        </div>
      </Card>
    </>
  );
}
