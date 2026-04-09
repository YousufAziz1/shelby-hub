"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, File as FileIcon, X, Loader2, CheckCircle2, ArrowLeft, Wallet, ShieldCheck, Zap, Server, Globe, FileText, Video, Image as ImageIcon, Code } from "lucide-react";
import Link from "next/link";
import { Network } from "@aptos-labs/ts-sdk";
import { ShelbyClient, ShelbyBlobClient, type ShelbyNetwork, generateCommitments, createDefaultErasureCodingProvider, expectedTotalChunksets } from "@shelby-protocol/sdk/browser";
import { aptos, getShelbyBalances, ShelbyBalances } from "@/lib/shelby-protocol";
import { uploadBlob } from "@/lib/shelby";

const CONTENT_TYPES = ["Source Code", "Image", "Video", "PDF", "Other"];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: "easeOut" }
} as const;

type UploadStep = 'IDLE' | 'ENCODING' | 'SIGNING' | 'REGISTERING' | 'UPLOADING' | 'SUCCESS';

export default function UploadPage() {
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const [step, setStep] = useState<UploadStep>('IDLE');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contentType, setContentType] = useState("Source Code");
  const [price, setPrice] = useState("1.0");
  const [balances, setBalances] = useState<ShelbyBalances>({ apt: 0, shelbyUsd: 0 });
  
  const [loading, setLoading] = useState(false);
  const [successId, setSuccessId] = useState("");
  const [error, setError] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  }, [previewUrl]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxFiles: 1 });

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (connected && account?.address) {
      getShelbyBalances(account.address.toString()).then(setBalances);
    }
  }, [connected, account?.address]);

  const handleProtocolLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !account?.address) {
       setError("Connect node identity to begin.");
       return;
    }
    if (!file || !title) {
       setError("Payload and Asset Name are required.");
       return;
    }
    if (balances.shelbyUsd < 1) {
       setError("Insufficient ShelbyUSD. Ingestion requires 1.0 SUSD protocol fee.");
       return;
    }

    setLoading(true);
    setError("");

    try {
      setStep('ENCODING');
      const provider = await createDefaultErasureCodingProvider();
      const buffer = await file.arrayBuffer();
      const commitments = await generateCommitments(provider, new Uint8Array(buffer));
      
      const merkleRoot = commitments.blob_merkle_root;
      const dataSize = commitments.raw_data_size;
      const numChunksets = expectedTotalChunksets(dataSize);

      setStep('SIGNING');
      
      const registerPayload = ShelbyBlobClient.createRegisterBlobPayload({
         account: account.address as any,
         blobName: title,
         blobSize: dataSize,
         blobMerkleRoot: merkleRoot,
         expirationMicros: Date.now() * 1000 + (365 * 24 * 60 * 60 * 1000000), 
         numChunksets: numChunksets,
         encoding: 0, 
      });

      const response = await signAndSubmitTransaction({ data: registerPayload as any });
      
      setStep('REGISTERING');
      await aptos.waitForTransaction({ transactionHash: response.hash });

      setStep('UPLOADING');
      const client = new ShelbyClient({
         network: Network.TESTNET as ShelbyNetwork
      }, provider);
      
      await client.rpc.putBlob({
         account: account.address.toString(),
         blobName: title,
         blobData: new Uint8Array(buffer),
      });

      const uploaded = await uploadBlob({
        data: buffer,
        mimeType: file.type,
        metadata: {
          id: merkleRoot.slice(0, 32), 
          title,
          description,
          contentType,
          price: parseFloat(price) || 1.0,
          creatorAddress: account.address.toString(),
          isPublic: true
        }
      });

      setSuccessId(uploaded.id);
      setStep('SUCCESS');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Protocol ingestion cycle failed.");
      setStep('IDLE');
    } finally {
      setLoading(false);
    }
  };

  const renderPreview = () => {
    if (!file || !previewUrl) return null;
    const type = file.type.toLowerCase();

    if (type.startsWith('image/')) {
        return <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-xl" />;
    }
    if (type.startsWith('video/')) {
        return <video src={previewUrl} className="w-full h-full object-cover rounded-xl" muted />;
    }
    if (type === 'application/pdf') {
        return (
            <div className="flex flex-col items-center justify-center gap-3">
                <FileText className="w-12 h-12 text-primary" />
                <span className="text-[10px] font-mono font-black uppercase text-primary">PDF Payload</span>
            </div>
        );
    }
    return (
        <div className="flex flex-col items-center justify-center gap-3">
            <Code className="w-12 h-12 text-zinc-500" />
            <span className="text-[10px] font-mono font-black uppercase text-zinc-500">Binary Stream</span>
        </div>
    );
  };

  if (step === 'SUCCESS') {
    return (
      <div className="container mx-auto px-6 py-40 max-w-2xl text-center relative bg-grid">
        <motion.div {...fadeInUp}>
          <Card className="border-divider bg-surface shadow-2xl rounded-[2.5rem] p-12 overflow-hidden relative border-t-primary/20">
            <CardContent className="space-y-10">
              <div className="w-24 h-24 bg-primary rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-primary/20">
                <CheckCircle2 className="w-12 h-12 text-background" />
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-heading font-black text-foreground tracking-tight uppercase leading-none">Settled.</h2>
                <p className="text-muted-foreground font-medium text-lg leading-relaxed max-w-sm mx-auto">
                  Asset hash has been broadcast and verified by the Shelby settlement nodes.
                </p>
              </div>
              <div className="bg-background/50 border border-divider p-6 rounded-2xl font-mono text-[10px] uppercase tracking-widest text-zinc-500 shadow-inner">
                <span className="block mb-2 text-primary font-black">PROTOCOL_BLOB_ID</span>
                <span className="text-foreground font-bold break-all">{successId}</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-6 pt-6">
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full h-14 rounded-xl border-divider bg-surface/50 font-black uppercase tracking-widest text-[10px] hover:bg-surface">
                    Explorer Feed
                  </Button>
                </Link>
                <Link href={`/content/${successId}`} className="flex-1">
                  <Button className="w-full h-14 rounded-xl bg-primary text-background font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/10">
                    Verify Node
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
    <div className="container mx-auto px-6 py-32 max-w-5xl relative bg-grid min-h-screen">
      <motion.div {...fadeInUp} className="mb-20 space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest hover:text-primary transition-colors mb-6 group">
           <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Back to Console
        </Link>
        <h1 className="text-6xl md:text-8xl font-heading font-black text-foreground tracking-tighter leading-none uppercase">
          Node <span className="text-primary italic">Ingestion.</span>
        </h1>
        <p className="text-xl text-muted-foreground font-medium max-w-3xl leading-relaxed">
          Store and verify your data on-chain with decentralized security.
        </p>
      </motion.div>

      <form onSubmit={handleProtocolLaunch} className="grid lg:grid-cols-12 gap-12">
        {/* Left Form Section */}
        <div className="lg:col-span-7 space-y-10">
           <Card className="border-divider bg-surface/40 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl">
              <div className="space-y-12">
                 <div className="space-y-6">
                    <div className="space-y-3">
                       <Label className="text-[10px] font-mono font-black uppercase tracking-[0.4em] text-zinc-500 ml-1">Asset Identity</Label>
                       <Input 
                         className="h-16 rounded-xl bg-background border-divider focus:ring-primary focus:border-primary font-black text-foreground text-lg px-8 uppercase"
                         placeholder="Asset Name"
                         value={title} 
                         onChange={(e) => setTitle(e.target.value)} 
                       />
                    </div>
                    <div className="space-y-3">
                       <Label className="text-[10px] font-mono font-black uppercase tracking-[0.4em] text-zinc-500 ml-1">PROTOCOL METADATA (MANIFEST)</Label>
                       <Textarea 
                         rows={4} 
                         className="resize-none rounded-xl bg-background border-divider focus:ring-primary focus:border-primary font-medium text-foreground px-8 py-5"
                         placeholder="Enter metadata details..."
                         value={description}
                         onChange={(e) => setDescription(e.target.value)}
                       />
                    </div>
                 </div>

                 <div className="grid sm:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <Label className="text-[10px] font-mono font-black uppercase tracking-[0.4em] text-zinc-500 ml-1">Payload Class</Label>
                       <select 
                         className="flex h-16 w-full items-center justify-between rounded-xl border border-divider bg-background px-8 py-2 text-sm font-black text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none transition-all uppercase"
                         value={contentType}
                         onChange={(e) => setContentType(e.target.value)}
                       >
                         {CONTENT_TYPES.map(type => (
                           <option key={type} value={type}>{type}</option>
                         ))}
                       </select>
                    </div>
                    <div className="space-y-3">
                       <Label className="text-[10px] font-mono font-black uppercase tracking-[0.4em] text-zinc-500 ml-1">Settlement (SUSD)</Label>
                       <div className="relative">
                          <Input 
                            type="number"
                            className="pl-14 h-16 rounded-xl bg-background border-divider focus:ring-primary font-black text-foreground text-lg"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                          />
                          <span className="absolute left-8 top-5 text-primary font-black">$</span>
                       </div>
                    </div>
                 </div>
              </div>
           </Card>
        </div>

        {/* Right Preview Section */}
        <div className="lg:col-span-5 space-y-10">
           {/* Payload Select & Preview */}
           <div 
             {...getRootProps()} 
             className={`w-full border-2 border-dashed rounded-[2.5rem] p-4 text-center cursor-pointer transition-all duration-500 bg-surface/20 min-h-[300px] flex items-center justify-center overflow-hidden ${isDragActive ? 'border-primary bg-primary/5' : 'border-divider hover:border-primary/40'}`}
           >
              <input {...getInputProps()} />
              {!file ? (
                 <div className="p-8">
                   <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <UploadCloud className="w-8 h-8" />
                   </div>
                   <h3 className="text-xl font-heading font-black text-foreground mb-1 uppercase tracking-tight">DEPLOY PAYLOAD</h3>
                   <p className="text-[9px] text-zinc-600 font-mono font-bold uppercase tracking-widest">Supports files up to 50MB</p>
                 </div>
              ) : (
                 <div className="w-full h-full flex flex-col items-center">
                    <div className="w-full aspect-square max-h-[250px] bg-background/40 rounded-2xl flex items-center justify-center relative mb-4 overflow-hidden border border-divider">
                        {renderPreview()}
                        <button 
                            type="button" 
                            onClick={(e) => { e.stopPropagation(); setFile(null); setPreviewUrl(null); }} 
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors z-10"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="px-4 text-center">
                       <p className="font-heading font-black text-sm text-foreground truncate max-w-[200px] uppercase mb-1">{file.name}</p>
                       <Badge variant="outline" className="border-primary/30 text-primary text-[9px] font-mono">{(file.size / 1024 /1024).toFixed(2)} MB</Badge>
                    </div>
                 </div>
              )}
           </div>

           {/* Fee Summary Section */}
           <Card className="border-divider bg-surface/40 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                 <ShieldCheck className="w-16 h-16 text-primary" />
              </div>
              
              <h4 className="text-[10px] font-mono font-black uppercase tracking-[0.4em] text-zinc-500 mb-8 ml-1">SETTLEMENT MANIFEST</h4>
              
              <div className="space-y-6 relative z-10">
                 <div className="flex items-center justify-between text-[11px] font-mono font-black uppercase tracking-wider">
                    <span className="text-muted-foreground">Protocol Fee</span>
                    <span className="text-foreground">1.0 <span className="text-primary">SUSD</span></span>
                 </div>
                 <div className="flex items-center justify-between text-[11px] font-mono font-black uppercase tracking-wider">
                    <span className="text-muted-foreground">Estimated Gas (Max)</span>
                    <span className="text-foreground">0.003 <span className="text-primary">APT</span></span>
                 </div>
                 <div className="pt-6 border-t border-divider flex items-center justify-between">
                    <span className="text-[10px] font-mono font-black text-zinc-600 uppercase tracking-widest">Namespace Status</span>
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                       <span className="text-[10px] font-mono font-black text-primary uppercase tracking-widest">{account?.address?.toString().slice(0, 8)}...</span>
                    </div>
                 </div>
              </div>

              {/* Confirm Button */}
              <div className="mt-10">
                <Button 
                   type="submit" 
                   disabled={loading || !connected || !file}
                   className="w-full h-16 rounded-xl bg-primary text-background font-black uppercase tracking-widest text-[11px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-primary/20"
                >
                   {loading ? (
                     <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="animate-pulse uppercase">
                          {step}
                        </span>
                     </div>
                   ) : (
                     "CONFIRM & DEPLOY NODE"
                   )}
                </Button>
                {error && <p className="text-[10px] text-red-500 font-bold mt-4 text-center uppercase tracking-widest px-2">{error}</p>}
              </div>
           </Card>
        </div>
      </form>
    </div>
  );
}
