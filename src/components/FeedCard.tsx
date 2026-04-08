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
          
          {/* Top Overlays */}
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

          {/* Bottom Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-8 z-20 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
             <h3 className="text-2xl font-heading font-bold text-foreground leading-[1.1] mb-5 tracking-tight drop-shadow-2xl">{blob.title}</h3>
             <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] text-primary font-bold shadow-inner">
                  {cAddress ? cAddress.slice(2, 4).toUpperCase() : "??"}
                </div>
                <div>
                   <span className="block text-[10px] font-mono font-bold text-zinc-300 uppercase tracking-widest leading-none mb-1">{shortAddress}</span>
                   <span className="block text-[8px] font-mono text-zinc-600 uppercase tracking-[0.2em]">Verified Asset</span>
                </div>
             </div>
          </div>
        </div>
      </Link>
      
      {/* Social Actions (Minimal Protocol Indicators) */}
      <div className="absolute right-6 bottom-32 z-30 flex flex-col gap-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
        <button 
           onClick={handleLike}
           className="flex flex-col items-center gap-2 group/btn"
        >
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${blob.likes > 0 ? "bg-primary border-primary text-background shadow-[0_0_15px_rgba(34,199,184,0.3)]" : "bg-background/60 border-white/10 text-zinc-400 hover:text-foreground hover:border-white/20"}`}>
            <Heart className={`w-4 h-4 ${blob.likes > 0 ? "fill-background" : ""}`} />
          </div>
          <span className="text-[10px] font-mono text-zinc-500">{blob.likes}</span>
        </button>
        
        <div className="flex flex-col items-center gap-2">
          <div className="w-11 h-11 rounded-xl bg-background/60 border border-white/10 text-zinc-400 flex items-center justify-center">
            <Eye className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-mono text-zinc-500">{blob.views}</span>
        </div>
      </div>
    </Card>
  );
}
