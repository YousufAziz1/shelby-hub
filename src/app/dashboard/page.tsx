"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { listBlobs, BlobMetadata } from "@/lib/shelby";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, Activity, DollarSign, Users, Eye } from "lucide-react";
import Link from "next/link";
import { FeedCard } from "@/components/FeedCard";

export default function DashboardPage() {
  const { account, connected } = useWallet();
  const [myBlobs, setMyBlobs] = useState<BlobMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMyData() {
      if (!account?.address) {
         setLoading(false);
         return;
      }
      setLoading(true);
      try {
        const data = await listBlobs({ filter: { creatorAddress: account.address.toString() } });
        setMyBlobs(data); 
      } catch (err) {
        console.error("Failed to load blobs", err);
      } finally {
        setLoading(false);
      }
    }
    loadMyData();
  }, [account]);

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-32 text-center max-w-md">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border">
          <LockIcon />
        </div>
        <h1 className="text-3xl font-bold mb-4">Dashboard Blocked</h1>
        <p className="text-muted-foreground mb-8">You must connect your Petra Wallet to access creator analytics and uploaded content.</p>
        <Button size="lg" className="w-full pointer-events-none opacity-80">Connect Wallet in Header</Button>
      </div>
    );
  }

  const totalViews = myBlobs.reduce((acc, current) => acc + current.views, 0);
  const estimatedEarnings = myBlobs.reduce((acc, current) => acc + (current.price * 5), 0); // Demo calculation: assumed 5 sales each

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      <div className="flex justify-between items-end mb-8 border-b pb-6">
         <div>
           <h1 className="text-4xl font-bold tracking-tight mb-2">Creator Dashboard</h1>
           <p className="text-muted-foreground">Manage your uploads and track your testnet earnings.</p>
         </div>
         <Link href="/upload">
           <Button className="hidden sm:flex gap-2">
             <UploadCloud className="w-4 h-4" /> Upload New File
           </Button>
         </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary"/> Total Earnings (SUSD)</CardDescription>
            <CardTitle className="text-4xl">{estimatedEarnings.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-xs text-muted-foreground">+12% from last week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2"><UploadCloud className="w-4 h-4"/> Active Uploads</CardDescription>
            <CardTitle className="text-4xl">{myBlobs.length}</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-xs text-muted-foreground">Hosted on Shelby Protocol</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2"><Eye className="w-4 h-4"/> Total Views</CardDescription>
            <CardTitle className="text-4xl">{totalViews}</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-xs text-muted-foreground">Across all public blobs</p>
          </CardContent>
        </Card>
      </div>

      <div>
         <h2 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-3">
           <Activity className="text-muted-foreground w-6 h-6"/> My Uploaded Content
         </h2>
         
         {loading ? (
            <p>Loading your content...</p>
         ) : myBlobs.length > 0 ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {myBlobs.map(blob => (
               <FeedCard key={blob.id} blob={blob} />
             ))}
           </div>
         ) : (
           <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
              <p className="text-muted-foreground mb-4">You haven't uploaded anything yet.</p>
              <Link href="/upload"><Button variant="outline">Upload Your First File</Button></Link>
           </div>
         )}
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground opacity-50">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}
