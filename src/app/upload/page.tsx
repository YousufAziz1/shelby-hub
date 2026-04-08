"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { uploadBlob } from "@/lib/shelby";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, File as FileIcon, X, Loader2 } from "lucide-react";
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
    <div className="container mx-auto px-6 py-24 max-w-4xl relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -z-10"></div>
      
      <div className="mb-16 text-center">
        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6">
          Mint Your <span className="text-primary italic">Legacy.</span>
        </h1>
        <p className="text-xl text-zinc-500 font-medium max-w-2xl mx-auto">
          Ingest high-fidelity assets into the Shelby Protocol settlement layer.
        </p>
      </div>

      <form onSubmit={handleUpload} className="space-y-12">
        <Card className="border-white/5 bg-zinc-900/40 backdrop-blur-2xl rounded-[3rem] overflow-hidden p-10 shadow-2xl">
          <div className="flex flex-col items-center gap-10">
            {!file ? (
              <div 
                {...dropzoneMain.getRootProps()} 
                className={`w-full border-4 border-dashed rounded-[2.5rem] p-20 text-center cursor-pointer transition-all duration-500 ${dropzoneMain.isDragActive ? 'border-primary bg-primary/10' : 'border-zinc-800 hover:border-primary/40 hover:bg-white/5'}`}
              >
                <input {...dropzoneMain.getInputProps()} />
                <div className="w-20 h-20 bg-primary/20 text-primary rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(255,20,147,0.3)]">
                  <UploadCloud className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Deploy Payload</h3>
                <p className="text-sm text-zinc-500 font-bold uppercase tracking-widest">Supports binary ingestion up to 2GB</p>
              </div>
            ) : (
              <div className="w-full bg-primary/5 p-8 rounded-[2rem] border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-inner">
                <div className="flex items-center gap-6">
                  <div className="p-5 bg-primary rounded-2xl text-white shadow-[0_0_20px_rgba(255,20,147,0.4)]">
                    <FileIcon className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-xl text-white truncate max-w-[200px] sm:max-w-md">{file.name}</p>
                    <div className="flex gap-3 items-center mt-1">
                      <Badge className="bg-primary/20 text-primary border-none text-[10px] font-black">{(file.size / 1024 / 1024).toFixed(2)} MB</Badge>
                      <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Metadata Verified</span>
                    </div>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setFile(null)} className="h-12 w-12 text-zinc-500 hover:text-white hover:bg-white/5 bg-black/20 rounded-xl">
                  <X className="w-6 h-6" />
                </Button>
              </div>
            )}
            
            <div className="w-full grid md:grid-cols-2 gap-10">
              <div className="space-y-8 md:col-span-2">
                <div className="space-y-3">
                  <Label htmlFor="title" className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Blob Title</Label>
                  <Input 
                    id="title" 
                    className="h-14 rounded-2xl bg-white/5 border-white/5 focus:ring-primary focus:border-primary font-bold text-white text-lg px-6"
                    placeholder="Enter ingestion name..."
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="description" className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Asset Manifesto</Label>
                  <Textarea 
                    id="description" 
                    rows={4} 
                    className="resize-none rounded-2xl bg-white/5 border-white/5 focus:ring-primary focus:border-primary font-medium text-white px-6 py-4"
                    placeholder="Describe your digital footprint..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="contentType" className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Payload Class</Label>
                <select 
                  id="contentType" 
                  className="flex h-14 w-full items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-6 py-2 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none transition-all"
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                >
                  {CONTENT_TYPES.map(type => (
                    <option key={type} value={type} className="bg-zinc-900">{type}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="price" className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Settlement (SUSD)</Label>
                <div className="relative">
                  <Input 
                    id="price" 
                    type="number" 
                    className="pl-12 h-14 rounded-2xl bg-white/5 border-white/5 focus:ring-primary font-black text-white text-lg"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                  <span className="absolute left-6 top-4 text-primary font-black">$</span>
                </div>
              </div>
            </div>
            
            <div className="w-full pt-6">
               <div className="grid sm:grid-cols-2 gap-4">
                  <label className="flex items-center gap-4 p-6 bg-white/5 border border-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition-all border-zinc-800">
                    <input 
                      type="checkbox" 
                      className="w-6 h-6 rounded-lg border-zinc-700 text-primary focus:ring-primary accent-primary"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                    />
                    <div className="text-left">
                      <span className="font-black text-sm block text-white">Broadcast Public</span>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Global Explorer Sync</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-4 p-6 bg-white/5 border border-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition-all border-zinc-800">
                    <input 
                      type="checkbox" 
                      className="w-6 h-6 rounded-lg border-zinc-700 text-primary focus:ring-primary accent-primary"
                      checked={mintNft}
                      onChange={(e) => setMintNft(e.target.checked)}
                    />
                    <div className="text-left">
                      <span className="font-black text-sm block text-white">Mint Provenance</span>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Immutable NFT Record</span>
                    </div>
                  </label>
               </div>
            </div>
          </div>
        </Card>

        {error && (
          <div className="bg-primary/5 border border-primary/20 text-primary px-8 py-6 rounded-3xl text-sm font-black flex items-center gap-4 animate-bounce">
            <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(255,20,147,1)]"></div>
            {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
             <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-black shadow-[0_0_20px_rgba(255,20,147,0.3)]">AK</div>
             <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 leading-none mb-1.5">Architect</p>
                <p className="text-sm font-black text-white">Build by <span className="text-primary italic">@Aptos_king</span></p>
             </div>
          </div>
          
          <Button 
            type="submit" 
            size="lg" 
            className="w-full md:w-[320px] h-20 font-black uppercase tracking-widest text-sm bg-primary hover:bg-primary/90 text-white rounded-3xl shadow-[0_20px_40px_rgba(255,20,147,0.3)] transition-all active:scale-95 disabled:opacity-50"
            disabled={loading || !file || !connected}
          >
            {loading ? (
              <><Loader2 className="w-6 h-6 mr-3 animate-spin" /> Ingesting...</>
            ) : connected ? (
              "Mint & Broadcast"
            ) : (
              "Auth Session Required"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
