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
    <div className="container mx-auto px-6 py-16 max-w-3xl">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">Mint Asset</h1>
        <p className="text-slate-500 font-medium">Ingest premium content into the Shelby settlement layer.</p>
      </div>

      <form onSubmit={handleUpload} className="space-y-8">
        <Card className="border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-lg font-bold text-slate-900">Payload Configuration</CardTitle>
            <CardDescription className="text-slate-500 font-medium text-xs">Standard data packet for protocol validation.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            {!file ? (
              <div 
                {...dropzoneMain.getRootProps()} 
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${dropzoneMain.isDragActive ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'}`}
              >
                <input {...dropzoneMain.getInputProps()} />
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="font-bold text-slate-900 mb-1">Upload primary file</p>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Supports any format up to 2GB</p>
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-slate-900 rounded-lg text-white">
                    <FileIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 truncate max-w-[200px]">{file.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB Payload</p>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setFile(null)} className="h-8 w-8 text-slate-400 hover:text-slate-900">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6 md:col-span-2">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Asset Title</Label>
              <Input 
                id="title" 
                className="h-11 rounded-xl bg-white border-slate-200 focus:ring-slate-900 focus:border-slate-900 font-medium"
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Description Memo</Label>
              <Textarea 
                id="description" 
                rows={4} 
                className="resize-none rounded-xl bg-white border-slate-200 focus:ring-slate-900 focus:border-slate-900 font-medium"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="contentType" className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Classification</Label>
              <select 
                id="contentType" 
                className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm focus:outline-none appearance-none text-slate-900"
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
              >
                {CONTENT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Settlement Price (SUSD)</Label>
              <div className="relative">
                <Input 
                  id="price" 
                  type="number" 
                  className="pl-10 h-11 rounded-xl bg-white border-slate-200 focus:ring-slate-900 font-bold"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                <span className="absolute left-4 top-3 text-slate-300 font-bold">$</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
             <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Node Configuration</Label>
             <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="mt-1 w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 accent-slate-900"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                  />
                  <div>
                    <span className="font-bold text-sm block text-slate-900">Broadcast to Explorer</span>
                    <span className="text-[11px] text-slate-400 font-medium">Make this asset visible on the global feed.</span>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="mt-1 w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 accent-slate-900"
                    checked={mintNft}
                    onChange={(e) => setMintNft(e.target.checked)}
                  />
                  <div>
                    <span className="font-bold text-sm block text-slate-900">Mint Verified NFT</span>
                    <span className="text-[11px] text-slate-400 font-medium">Immutable on-chain record for provenance.</span>
                  </div>
                </label>
             </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-xl text-sm font-bold flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></div>
            {error}
          </div>
        )}

        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol Architect</p>
             <p className="text-sm font-bold text-slate-900">Build by <span className="text-primary font-black animate-pulse">@Aptos_king</span></p>
          </div>
          <Button 
            type="submit" 
            size="lg" 
            className="w-full sm:w-[240px] h-12 font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
            disabled={loading || !file || !connected}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : connected ? (
              "Mint and Publish"
            ) : (
              "Connect for Auth"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
