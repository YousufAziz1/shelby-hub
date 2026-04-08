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
    if (acceptedFiles.length > 0) setFile(acceptedFiles[0]);
  }, []);

  const onDropPreview = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) setPreviewFile(acceptedFiles[0]);
  }, []);

  const dropzoneMain = useDropzone({ onDrop: onDropMain, maxFiles: 1 });
  const dropzonePreview = useDropzone({ onDrop: onDropPreview, maxFiles: 1 });

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
      // Typically we'd convert File to ArrayBuffer, but the mock supports File/ArrayBuffer.
      const buffer = await file.arrayBuffer();

      const uploaded = await uploadBlob({
        data: buffer,
        mimeType: file.type,
        metadata: {
          title,
          description,
          contentType,
          price: parseFloat(price) || 0,
          creatorAddress: account.address,
          timestamp: Date.now(),
          likes: 0,
          views: 0,
          isPublic
        }
      });

      // Here you would optionally mint the NFT representing the Blob ID.
      if (mintNft) {
        console.log(`Minting NFT for Blob ID ${uploaded.id}...`);
        // Add NFT minting contract call here
      }

      setSuccess({ id: uploaded.id });
    } catch (err: any) {
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
              <Button asChild variant="outline">
                <Link href="/">Back to Feed</Link>
              </Button>
              <Button asChild>
                <Link href={`/content/${success.id}`}>View Content</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Upload Content</h1>
        <p className="text-muted-foreground">Store your files decentrally and set your access terms via Shelby Protocol.</p>
      </div>

      <form onSubmit={handleUpload} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Main Content File</CardTitle>
            <CardDescription>Drag and drop your primary content (Video, PDF, ZIP, etc.)</CardDescription>
          </CardHeader>
          <CardContent>
            {!file ? (
              <div 
                {...dropzoneMain.getRootProps()} 
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${dropzoneMain.isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}
              >
                <input {...dropzoneMain.getInputProps()} />
                <UploadCloud className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="font-medium text-lg mb-1">Click to upload or drag and drop</p>
                <p className="text-sm text-muted-foreground">Any file up to 2GB</p>
              </div>
            ) : (
              <div className="bg-muted p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between border">
                <div className="flex items-center gap-3">
                  <FileIcon className="w-8 h-8 text-primary" />
                  <div className="text-left w-full max-w-[200px] sm:max-w-xs">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setFile(null)} className="h-8 w-8 text-muted-foreground hover:text-red-500">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6 md:col-span-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
              <Input 
                id="title" 
                placeholder="Intro to Advanced Move Programming" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="In this course, we will cover..." 
                rows={4} 
                className="resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="contentType">Content Type</Label>
              <select 
                id="contentType" 
                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
              >
                {CONTENT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (in ShelbyUSD)</Label>
              <div className="relative">
                <Input 
                  id="price" 
                  type="number" 
                  step="0.01"
                  min="0"
                  placeholder="0.00" 
                  className="pl-8"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-medium">$</span>
              </div>
              <p className="text-xs text-muted-foreground">Set to 0 for free access.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Visibility & Rights</Label>
              <Card className="p-4 bg-muted/30">
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                    />
                    <div className="space-y-0.5">
                      <span className="font-medium text-sm block">Make Public</span>
                      <span className="text-xs text-muted-foreground block">List this content in the global feed.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={mintNft}
                      onChange={(e) => setMintNft(e.target.checked)}
                    />
                    <div className="space-y-0.5">
                      <span className="font-medium text-sm block">Mint as NFT (Aptos)</span>
                      <span className="text-xs text-muted-foreground block">Creates an on-chain record for provenance.</span>
                    </div>
                  </label>
                </div>
              </Card>
            </div>
          </div>
          
          <div className="space-y-2 md:col-span-2">
             <Label>Preview Blob (Optional)</Label>
             <p className="text-xs text-muted-foreground mb-2">Upload a free demo, low-res image, or snippet for users before they buy.</p>
             {!previewFile ? (
                <div 
                  {...dropzonePreview.getRootProps()} 
                  className={`border border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${dropzonePreview.isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                >
                  <input {...dropzonePreview.getInputProps()} />
                  <p className="text-sm text-muted-foreground">Drop a preview file here</p>
                </div>
              ) : (
                <div className="bg-muted px-4 py-2 rounded-lg flex items-center justify-between border text-sm">
                  <span className="truncate">{previewFile.name}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setPreviewFile(null)} className="h-6 w-6">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <div className="pt-4 border-t">
          <Button 
            type="submit" 
            size="lg" 
            className="w-full sm:w-auto font-semibold"
            disabled={loading || !file || !connected}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Encrypting & Uploading to Shelby Protocol...
              </>
            ) : connected ? (
              "Upload and Publish"
            ) : (
              "Connect Petra Wallet to Upload"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
