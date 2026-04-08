import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Heart, Eye, Image as ImageIcon, Video, Code, FileText, Lock, Share2 } from 'lucide-react';
import { BlobMetadata, recordLike } from '@/lib/shelby';
import { useState } from 'react';

export function FeedCard({ blob: initialBlob }: { blob: BlobMetadata }) {
  const [blob, setBlob] = useState(initialBlob);
  
  // Resilient property access for Supabase (handles both camelCase and lowercase)
  const thumb = blob.thumbnailUrl || (blob as any).thumbnailurl;
  const cType = blob.contentType || (blob as any).contenttype;
  const cAddress = blob.creatorAddress || (blob as any).creatoraddress;
  
  const shortAddress = cAddress ? `${cAddress.slice(0, 6)}...${cAddress.slice(-4)}` : "0xUnknown";
  const date = new Date(blob.timestamp).toLocaleDateString();

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await recordLike(blob.id);
      setBlob({ ...blob, likes: blob.likes + 1 });
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/content/${blob.id}`;
    navigator.clipboard.writeText(url);
    alert("Link copied!");
  };

  const getIcon = () => {
    switch (cType) {
      case 'Image': return <ImageIcon className="w-12 h-12" />;
      case 'Video': return <Video className="w-12 h-12" />;
      case 'Source Code': return <Code className="w-12 h-12" />;
      default: return <FileText className="w-12 h-12" />;
    }
  };

  return (
    <Card className="overflow-hidden bg-[#0F1419] border border-white/[0.05] rounded-[2rem] hover:border-primary/30 transition-all duration-500 group flex flex-col h-full shadow-2xl">
      <Link href={`/content/${blob.id}`} className="block flex-1">
        {/* Top: Media Section */}
        <div className="aspect-video bg-background relative flex items-center justify-center overflow-hidden border-b border-white/[0.03]">
          {thumb ? (
            <img src={thumb} alt={blob.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
          ) : (
            <div className="text-zinc-800 group-hover:text-primary transition-colors duration-500 scale-150">
              {getIcon()}
            </div>
          )}
          
          <div className="absolute top-4 right-4 z-20">
             {blob.price > 0 ? (
               <div className="bg-primary/10 border border-primary/20 backdrop-blur-md text-primary rounded-lg px-3 py-1 flex items-center gap-2 shadow-sm">
                 <Lock className="w-3 h-3" />
                 <span className="text-[10px] font-mono font-bold tracking-widest uppercase">{blob.price} SUSD</span>
               </div>
             ) : (
                <div className="bg-zinc-800/80 backdrop-blur-md text-zinc-300 rounded-lg px-3 py-1 text-[10px] font-mono font-bold tracking-widest uppercase">
                   Free Demo
                </div>
             )}
          </div>
        </div>

        {/* Middle: Content Details */}
        <div className="p-8 space-y-5">
           <div className="flex justify-between items-start gap-4">
              <h3 className="text-2xl font-heading font-black text-foreground leading-tight tracking-tight uppercase group-hover:text-primary transition-colors">
                 {blob.title}
              </h3>
           </div>

           <div className="flex items-center gap-3">
              <Badge className="bg-primary/10 text-primary border-primary/20 font-mono text-[9px] uppercase tracking-[0.2em] px-3 py-1 rounded-lg">
                 {cType}
              </Badge>
              <span className="text-[10px] font-mono text-zinc-600 font-bold uppercase tracking-widest">{date}</span>
           </div>

           <p className="text-muted-foreground text-sm font-medium line-clamp-2 leading-relaxed">
              {blob.description || "No specific technical protocol details provided for this ingestion."}
           </p>
        </div>
      </Link>

      {/* Bottom: Footer / Engagements */}
      <div className="mt-auto p-8 pt-0">
         <div className="pt-6 border-t border-white/[0.05] flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-[11px] text-primary font-black uppercase shadow-inner">
                 {cAddress ? cAddress.slice(2, 4).toUpperCase() : "??"}
               </div>
               <span className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest">{shortAddress}</span>
            </div>

            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2 group/stat">
                  <Eye className="w-4 h-4 text-zinc-600 transition-colors group-hover/stat:text-primary" />
                  <span className="text-[11px] font-mono font-bold text-zinc-600">{blob.views}</span>
               </div>
               <button 
                  onClick={handleLike}
                  className="flex items-center gap-2 group/like"
               >
                  <Heart className={`w-4 h-4 transition-all duration-300 ${blob.likes > 0 ? "fill-primary text-primary" : "text-zinc-600 group-hover/like:text-primary"}`} />
                  <span className={`text-[11px] font-mono font-bold ${blob.likes > 0 ? "text-primary" : "text-zinc-600"}`}>{blob.likes}</span>
               </button>
            </div>
         </div>
      </div>
    </Card>
  );
}
