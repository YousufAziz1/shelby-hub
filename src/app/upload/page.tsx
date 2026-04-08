"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { uploadBlob } from "@/lib/shelby";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, File as FileIcon, X, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const CONTENT_TYPES = ["Image", "Video", "Course", "Source Code", "Other"];

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
      
      // Auto-detect content type
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
        video.onloadeddata = () => {
          video.currentTime = 1; // Capture at 1 second
        };
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
      setError("Please connect your Petra wallet to upload on Shelby testnet.");
      return;
    }
    if (!file) {
      setError("Main content file is required.");
      return;
    }
    if (!title) {
      setError("Title is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Generate thumbnail if possible
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

      if (mintNft) {
        console.log(`Minting NFT for Blob ID ${uploaded.id}...`);
      }

      setSuccess({ id: uploaded.id });
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "An unexpected error occurred during upload.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <Card className="text-center py-12 border-primary/20 bg-primary/5">
          <CardContent>
            <CheckCircle2 className="w-20 h-20 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Upload Successful!</h2>
            <p className="text-muted-foreground mb-8">
              Your content has been securely pinned on the Shelby Protocol testnet.
            </p>
            <div className="bg-background p-4 rounded-lg border font-mono text-sm mb-8 break-all">
              Blob ID: <span className="text-primary">{success.id}</span>
            </div>
            <div className="flex justify-center gap-4">
              <Link href="/">
                <Button variant="outline">Back to Feed</Button>
              </Link>
              <Link href={`/content/${success.id}`}>
                <Button>View Content</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <div className="mb-12">
        <h1 className="text-5xl font-black mb-3 tracking-tighter">Mint <span className="text-primary italic">Blob.</span></h1>
        <p className="text-lg text-muted-foreground font-medium">Decentralized ingestion for the Shelby settlement layer.</p>
      </div>

      <form onSubmit={handleUpload} className="space-y-8">
        <Card className="border shadow-xl shadow-primary/5 bg-white rounded-3xl overflow-hidden">
          <CardHeader className="bg-[#FDFCFB] border-b">
            <CardTitle className="text-xl font-bold">Standard Ingestion</CardTitle>
            <CardDescription className="font-medium">Primary data packet for ShelbyNet validation.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            {!file ? (
              <div 
                {...dropzoneMain.getRootProps()} 
                className={`border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all duration-300 ${dropzoneMain.isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-[#FDFCFB]'}`}
              >
                <input {...dropzoneMain.getInputProps()} />
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <p className="font-extrabold text-xl mb-1 tracking-tight">Select Packer File</p>
                <p className="text-sm text-muted-foreground font-medium">Max Payload: 2GB (Encrypted)</p>
              </div>
            ) : (
              <div className="bg-[#FDFCFB] p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between border border-primary/20 shadow-inner">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary rounded-xl text-white shadow-lg">
                    <FileIcon className="w-6 h-6" />
                  </div>
                  <div className="text-left w-full max-w-[200px] sm:max-w-xs">
                    <p className="font-bold truncate text-foreground">{file.name}</p>
                    <p className="text-xs text-primary font-black uppercase tracking-widest mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB Payload</p>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setFile(null)} className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/5">
                  <X className="w-5 h-5" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6 md:col-span-2">
            <div className="space-y-2.5">
              <Label htmlFor="title" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Blob Title</Label>
              <Input 
                id="title" 
                placeholder="Unique Identifier..." 
                className="h-12 rounded-xl bg-white border-border focus:ring-primary focus:border-primary font-semibold"
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
              />
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Protocol Memo</Label>
              <Textarea 
                id="description" 
                placeholder="Metadata description for validation..." 
                rows={4} 
                className="resize-none rounded-xl bg-white border-border focus:ring-primary focus:border-primary font-medium"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2.5">
              <Label htmlFor="contentType" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Ingestion Class</Label>
              <select 
                id="contentType" 
                className="flex h-12 w-full items-center justify-between rounded-xl border border-border bg-white px-4 py-2 text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none text-foreground"
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
              >
                {CONTENT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="price" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Settlement Price (SUSD)</Label>
              <div className="relative">
                <Input 
                  id="price" 
                  type="number" 
                  step="0.01"
                  min="0"
                  placeholder="0.00" 
                  className="pl-10 h-12 rounded-xl bg-white border-border focus:ring-primary font-bold"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                <span className="absolute left-4 top-3.5 text-primary font-black">$</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2.5">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Rights & Validation</Label>
              <Card className="p-5 bg-white border-border overflow-hidden rounded-2xl shadow-sm">
                <div className="space-y-5">
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <div className="pt-1">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded-md border-border text-primary focus:ring-primary transition-all cursor-pointer accent-primary"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="font-extrabold text-sm block group-hover:text-primary transition-colors">Public Ledger</span>
                      <span className="text-[11px] text-muted-foreground block font-medium leading-relaxed">Broadcast this blob to the synchronized global explorer.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-4 cursor-pointer group">
                    <div className="pt-1">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded-md border-border text-primary focus:ring-primary transition-all cursor-pointer accent-primary"
                        checked={mintNft}
                        onChange={(e) => setMintNft(e.target.checked)}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="font-extrabold text-sm block group-hover:text-primary transition-colors">On-Chain Provenance (NFT)</span>
                      <span className="text-[11px] text-muted-foreground block font-medium leading-relaxed">Immutable NFT record for ownership verification.</span>
                    </div>
                  </label>
                </div>
              </Card>
            </div>
          </div>
          
          <div className="space-y-2.5 md:col-span-2">
             <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Preview Packet (Optional)</Label>
             {!previewFile ? (
                <div 
                  {...dropzonePreview.getRootProps()} 
                  className={`border border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dropzonePreview.isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 bg-white'}`}
                >
                  <input {...dropzonePreview.getInputProps()} />
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Drop verification preview here</p>
                </div>
              ) : (
                <div className="bg-primary/5 px-6 py-4 rounded-xl flex items-center justify-between border border-primary/20 text-sm font-bold shadow-inner">
                  <span className="truncate text-primary">{previewFile.name}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setPreviewFile(null)} className="h-8 w-8 hover:bg-primary/10 text-primary">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              )}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/5 border border-red-500/20 text-red-600 px-6 py-4 rounded-2xl text-sm font-bold flex items-center gap-3">
            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
            {error}
          </div>
        )}

        <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-left">
             <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Developer</p>
             <p className="text-xs font-bold text-foreground">Build by <span className="text-primary">@Aptos_king</span></p>
          </div>
          <Button 
            type="submit" 
            size="lg" 
            className="w-full sm:w-[280px] h-14 font-black uppercase tracking-widest text-xs bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
            disabled={loading || !file || !connected}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                Validating...
              </>
            ) : connected ? (
              "Submit to Protocol"
            ) : (
              "Connect for Auth"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
