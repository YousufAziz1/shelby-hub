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
    <Card className="overflow-hidden bg-surface border border-white/[0.04] rounded-[2rem] hover:border-primary/30 transition-all duration-300 group relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/90 opacity-80 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
      
      <Link href={`/content/${blob.id}`}>
        <div className="aspect-[4/5] bg-background relative flex items-center justify-center overflow-hidden border-b border-white/[0.02]">
          {thumb ? (
            <img src={thumb} alt={blob.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
          ) : (
            <div className="text-zinc-800 group-hover:text-primary transition-colors duration-500 scale-150">
              {getIcon()}
            </div>
          )}
          
          <div className="absolute top-5 left-5 z-20">
             <Badge className="bg-background/80 backdrop-blur-md text-zinc-400 border-white/5 font-mono text-[9px] uppercase tracking-[0.2em] px-3 py-1 rounded-lg">
                {cType}
             </Badge>
          </div>
          
          {blob.price > 0 && (
            <div className="absolute top-5 right-5 z-20 bg-primary/10 border border-primary/20 backdrop-blur-md text-primary rounded-lg px-3 py-1 flex items-center gap-2 shadow-sm">
              <Lock className="w-3 h-3" />
              <span className="text-[10px] font-mono tracking-widest uppercase">{blob.price} SUSD</span>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-8 z-20 transition-all duration-500">
             <h3 className="text-2xl font-heading font-black text-foreground leading-[1.1] mb-5 tracking-tight drop-shadow-2xl uppercase">{blob.title}</h3>
             
             <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                   <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] text-primary font-bold shadow-inner uppercase">
                     {cAddress ? cAddress.slice(2, 4).toUpperCase() : "??"}
                   </div>
                   <div>
                      <span className="block text-[10px] font-mono font-black text-zinc-300 uppercase tracking-widest leading-none mb-1">{shortAddress}</span>
                   </div>
                </div>

                {/* X-Style Engagements */}
                <div className="flex items-center gap-6">
                   <button 
                      onClick={handleLike}
                      className="flex items-center gap-2 group/like"
                   >
                      <Heart className={`w-4 h-4 transition-colors ${blob.likes > 0 ? "fill-primary text-primary" : "text-zinc-500 group-hover/like:text-primary"}`} />
                      <span className={`text-[11px] font-mono font-bold ${blob.likes > 0 ? "text-primary" : "text-zinc-500"}`}>{blob.likes}</span>
                   </button>
                   <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-zinc-500" />
                      <span className="text-[11px] font-mono font-bold text-zinc-500">{blob.views}</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}
