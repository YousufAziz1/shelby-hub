"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { uploadBlob } from "@/lib/shelby";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, File as FileIcon, X, Loader2, CheckCircle2, Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

const CONTENT_TYPES = ["Image", "Video", "Course", "Source Code", "Other"];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: "easeOut" }
} as const;

export default function UploadPage() {
  const { account, connected } = useWallet();
  const [file, setFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contentType, setContentType] = useState("Course");
  const [price, setPrice] = useState("0");
  const [isPublic, setIsPublic] = useState(true);
  const [mintNft, setMintNft] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ id: string } | null>(null);
  const [error, setError] = useState("");

  const onDropMain = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) setContentType('Image');
      else if (selectedFile.type.startsWith('video/')) setContentType('Video');
      else if (selectedFile.name.endsWith('.pdf')) setContentType('Course');
      else if (selectedFile.name.endsWith('.zip') || selectedFile.name.endsWith('.js') || selectedFile.name.endsWith('.ts')) setContentType('Source Code');
    }
  }, []);

  const onDropPreview = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) setPreviewFile(acceptedFiles[0]);
  }, []);

  const dropzoneMain = useDropzone({ onDrop: onDropMain, maxFiles: 1 });
  const dropzonePreview = useDropzone({ onDrop: onDropPreview, maxFiles: 1 });

  const generateThumbnail = async (selectedFile: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (!selectedFile.type.startsWith('image') && !selectedFile.type.startsWith('video')) {
        resolve(undefined);
        return;
      }
      if (selectedFile.type.startsWith('image')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 400;
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(selectedFile);
      } else if (selectedFile.type.startsWith('video')) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;
        video.src = URL.createObjectURL(selectedFile);
        video.onloadeddata = () => { video.currentTime = 1; };
        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 400;
          canvas.height = (video.videoHeight / video.videoWidth) * 400;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
          URL.revokeObjectURL(video.src);
        };
      }
    });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !account?.address) {
      setError("Please connect your node identity to initialize ingestion.");
      return;
    }
    if (!file) {
      setError("Primary payload is required.");
      return;
    }
    if (!title) {
      setError("Asset identifier (title) is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const thumb = await generateThumbnail(previewFile || file);
      const buffer = await file.arrayBuffer();
      const uploaded = await uploadBlob({
        data: buffer,
        mimeType: file.type,
        metadata: {
          title,
          description,
          contentType,
          price: parseFloat(price) || 0,
          creatorAddress: account.address.toString(),
          timestamp: Date.now(),
          likes: 0,
          views: 0,
          thumbnailUrl: thumb,
          isPublic
        }
      });
      setSuccess({ id: uploaded.id });
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Protocol ingestion failed. Check network state.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto px-6 py-40 max-w-2xl text-center relative bg-grid">
        <motion.div {...fadeInUp}>
          <Card className="border-border bg-surface shadow-2xl rounded-[2rem] p-12 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
            <CardContent className="space-y-10">
              <div className="w-24 h-24 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
                <CheckCircle2 className="w-12 h-12 text-background" />
              </div>
              
              <div className="space-y-4">
                <h2 className="text-4xl font-heading font-black text-foreground tracking-tight uppercase">Settled.</h2>
                <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                  Your asset has been securely ingested and indexed on the Aptos settlement layer.
                </p>
              </div>

              <div className="bg-background border border-border p-6 rounded-2xl font-mono text-[10px] uppercase tracking-widest text-zinc-500 shadow-inner">
                <span className="block mb-2 text-primary font-bold">CRYPTO_DIGEST_ID</span>
                <span className="text-foreground font-bold break-all">{success.id}</span>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-6 pt-6">
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full h-14 rounded-xl border-border bg-surface/50 font-bold uppercase tracking-widest text-[10px] hover:bg-surface">
                    Return to Feed
                  </Button>
                </Link>
                <Link href={`/content/${success.id}`} className="flex-1">
                  <Button className="w-full h-14 rounded-xl bg-primary text-background font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/10">
                    Verify Asset
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-32 max-w-4xl relative bg-grid min-h-screen">
      <motion.div {...fadeInUp} className="mb-20 space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest hover:text-primary transition-colors mb-6 group">
           <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Back to Protocol
        </Link>
        <h1 className="text-6xl md:text-8xl font-heading font-black text-foreground tracking-tighter leading-none uppercase">
          Asset <span className="text-primary italic">Ingestion.</span>
        </h1>
        <p className="text-xl text-muted-foreground font-medium max-w-2xl">
          Broadcast high-fidelity blobs into the Shelby Protocol settlement layer. 
          Permanent integrity. Sub-second discovery.
        </p>
      </motion.div>

      <form onSubmit={handleUpload} className="space-y-12">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.8 }}>
          <Card className="border-border bg-surface/50 backdrop-blur-xl rounded-[2.5rem] overflow-hidden p-10 shadow-2xl">
            <div className="flex flex-col items-center gap-12">
              {!file ? (
                <div 
                  {...dropzoneMain.getRootProps()} 
                  className={`w-full border-2 border-dashed rounded-[2rem] p-24 text-center cursor-pointer transition-all duration-500 ${dropzoneMain.isDragActive ? 'border-primary bg-primary/5' : 'border-divider hover:border-primary/40 hover:bg-muted/50'}`}
                >
                  <input {...dropzoneMain.getInputProps()} />
                  <div className="w-20 h-20 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-8">
                    <UploadCloud className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-heading font-black text-foreground mb-2 uppercase tracking-tight">Deploy Payload</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Institutional Binary Entry Point</p>
                </div>
              ) : (
                <div className="w-full bg-background/50 p-8 rounded-2xl border border-divider flex flex-col sm:flex-row items-center justify-between gap-6 shadow-inner">
                  <div className="flex items-center gap-6">
                    <div className="p-5 bg-primary rounded-xl text-background shadow-lg shadow-primary/10">
                      <FileIcon className="w-8 h-8" />
                    </div>
                    <div className="text-left">
                      <p className="font-heading font-black text-xl text-foreground truncate max-w-[200px] sm:max-w-md">{file.name}</p>
                      <div className="flex gap-3 items-center mt-1">
                        <Badge variant="outline" className="border-primary/30 text-primary text-[10px] font-mono px-2">{(file.size / 1024 / 1024).toFixed(2)} MB</Badge>
                        <span className="text-[9px] text-zinc-600 font-mono font-bold uppercase tracking-widest">Metadata Sync Ready</span>
                      </div>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setFile(null)} className="h-12 w-12 text-zinc-500 hover:text-foreground hover:bg-surface rounded-xl">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              )}
              
              <div className="w-full grid md:grid-cols-2 gap-10">
                <div className="space-y-8 md:col-span-2">
                  <div className="space-y-3">
                    <Label htmlFor="title" className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-zinc-500 ml-1">Asset Identifier</Label>
                    <Input 
                      id="title" 
                      className="h-16 rounded-xl bg-background border-border focus:ring-primary focus:border-primary font-bold text-foreground text-lg px-8"
                      placeholder="Protocol naming convention..."
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="description" className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-zinc-500 ml-1">Manifesto (Metadata)</Label>
                    <Textarea 
                      id="description" 
                      rows={5} 
                      className="resize-none rounded-xl bg-background border-border focus:ring-primary focus:border-primary font-medium text-foreground px-8 py-5"
                      placeholder="Enter cryptographic asset context..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="contentType" className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-zinc-500 ml-1">Payload Class</Label>
                  <select 
                    id="contentType" 
                    className="flex h-16 w-full items-center justify-between rounded-xl border border-border bg-background px-8 py-2 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none transition-all"
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                  >
                    {CONTENT_TYPES.map(type => (
                      <option key={type} value={type} className="bg-muted">{type}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="price" className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-zinc-500 ml-1">Settlement Value (SUSD)</Label>
                  <div className="relative">
                    <Input 
                      id="price" 
                      type="number" 
                      className="pl-14 h-16 rounded-xl bg-background border-border focus:ring-primary font-bold text-foreground text-lg"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                    <span className="absolute left-8 top-5 text-primary font-black">$</span>
                  </div>
                </div>
              </div>
              
              <div className="w-full pt-8 border-t border-divider">
                 <div className="grid sm:grid-cols-2 gap-5">
                    <label className="flex items-center gap-4 p-6 bg-background rounded-2xl cursor-pointer hover:border-primary/30 transition-all border border-border">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-zinc-700 text-primary focus:ring-primary accent-primary"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                      />
                      <div className="text-left">
                        <span className="font-heading font-black text-sm block text-foreground uppercase tracking-tight">Broadcast Public</span>
                        <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase tracking-widest mt-1.5 block">Global Explorer Sync</span>
                      </div>
                    </label>
                    <label className="flex items-center gap-4 p-6 bg-background rounded-2xl cursor-pointer hover:border-primary/30 transition-all border border-border">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-zinc-700 text-primary focus:ring-primary accent-primary"
                        checked={mintNft}
                        onChange={(e) => setMintNft(e.target.checked)}
                      />
                      <div className="text-left">
                        <span className="font-heading font-black text-sm block text-foreground uppercase tracking-tight">Mint Provenance</span>
                        <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase tracking-widest mt-1.5 block">Immutable NFT Record</span>
                      </div>
                    </label>
                 </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-primary/5 border border-primary/20 text-primary px-10 py-8 rounded-[2rem] text-sm font-bold flex items-center gap-5 shadow-xl">
            <div className="w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_10px_rgba(34,199,184,1)] animate-pulse"></div>
            {error}
          </motion.div>
        )}

        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-5 p-5 rounded-2xl bg-surface border border-border">
             <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-background font-black shadow-lg shadow-primary/10 font-heading">S</div>
             <div>
                <p className="text-[9px] font-mono font-bold uppercase tracking-[0.3em] text-zinc-500 leading-none mb-1.5">Verification Node</p>
                <p className="text-sm font-bold text-foreground">Authored by <span className="text-primary italic tracking-tight">@Aptos_king</span></p>
             </div>
          </div>
          
          <Button 
            type="submit" 
            size="lg" 
            className="w-full md:w-[320px] h-20 font-heading font-black uppercase tracking-[0.2em] text-xs bg-primary hover:bg-primary/90 text-background rounded-xl shadow-2xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50"
            disabled={loading || !file || !connected}
          >
            {loading ? (
              <><Loader2 className="w-6 h-6 mr-3 animate-spin" /> Ingesting...</>
            ) : connected ? (
              "Initialize Ingestion"
            ) : (
              "Auth Required"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
