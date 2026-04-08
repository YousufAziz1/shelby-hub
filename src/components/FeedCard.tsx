import Link from 'next/link';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Heart, Eye, Image as ImageIcon, Video, Code, FileText, Lock, FileArchive, FileJson } from 'lucide-react';
import { BlobMetadata, recordLike } from '@/lib/shelby';
import { useState, useEffect } from 'react';

export function FeedCard({ blob: initialBlob }: { blob: BlobMetadata }) {
  const [blob, setBlob] = useState(initialBlob);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Resilient property access for Supabase (handles both camelCase and lowercase)
  const thumb = blob.thumbnailUrl || (blob as any).thumbnailurl;
  const cType = blob.contentType || (blob as any).contenttype;
  const cAddress = blob.creatorAddress || (blob as any).creatoraddress;
  
  // Adjusted for "3 at start, 4 at end" (including 0x)
  const shortAddress = cAddress ? `${cAddress.slice(0, 5)}...${cAddress.slice(-4)}` : "0x...";
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

  const getIcon = () => {
    const typeLower = (cType || '').toLowerCase();
    if (typeLower.includes('image')) return <ImageIcon className="w-12 h-12" />;
    if (typeLower.includes('video')) return <Video className="w-12 h-12" />;
    if (typeLower.includes('code') || typeLower.includes('source')) return <Code className="w-12 h-12" />;
    if (typeLower.includes('pdf')) return <FileText className="w-12 h-12" />;
    if (typeLower.includes('zip') || typeLower.includes('rar') || typeLower.includes('archive')) return <FileArchive className="w-12 h-12" />;
    return <FileJson className="w-12 h-12" />;
  };

  if (!mounted) return <div className="aspect-[3/4] bg-surface/50 rounded-[2rem] animate-pulse border border-divider"></div>;

  return (
    <Card className="overflow-hidden bg-surface border border-divider rounded-[2rem] hover:border-primary/40 transition-all duration-500 group flex flex-col h-full shadow-xl hover:shadow-2xl hover:shadow-primary/5">
      <Link href={`/content/${blob.id}`} className="block flex-1">
        {/* Top: Media Section */}
        <div className="aspect-video bg-muted/20 relative flex items-center justify-center overflow-hidden border-b border-divider">
          {thumb ? (
            <img src={thumb} alt={blob.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
          ) : (
            <div className="text-muted-foreground/30 group-hover:text-primary transition-colors duration-500 scale-150">
              {getIcon()}
            </div>
          )}
          
          <div className="absolute top-4 right-4 z-20">
             {blob.price > 0 ? (
               <div className="bg-primary/10 border border-primary/20 backdrop-blur-md text-primary rounded-lg px-3 py-1 flex items-center gap-2 shadow-sm">
                 <Lock className="w-3 h-3" />
                 <span className="text-[10px] font-mono font-black tracking-widest uppercase">{blob.price} SUSD</span>
               </div>
             ) : (
                <div className="bg-surface/80 backdrop-blur-md border border-divider text-muted-foreground rounded-lg px-3 py-1 text-[10px] font-mono font-black tracking-widest uppercase">
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
              <Badge className="bg-primary/5 text-primary border-primary/20 font-mono text-[9px] uppercase tracking-[0.2em] px-3 py-1 rounded-lg font-black">
                 {cType}
              </Badge>
              <span className="text-[10px] font-mono text-muted-foreground font-black uppercase tracking-widest">{date}</span>
           </div>

           <p className="text-muted-foreground text-sm font-medium line-clamp-2 leading-relaxed">
              {blob.description || "No Protocol Metadata."}
           </p>
        </div>
      </Link>

      {/* Bottom: Footer / Engagements */}
      <div className="mt-auto p-8 pt-0">
         <div className="pt-6 border-t border-divider flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
               <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-[11px] text-primary font-black uppercase shadow-inner shrink-0">
                 {cAddress ? cAddress.slice(2, 4).toUpperCase() : "??"}
               </div>
               <span className="text-[10px] font-mono font-black text-muted-foreground uppercase tracking-widest truncate">{shortAddress}</span>
            </div>

            <div className="flex items-center gap-5 shrink-0">
               <div className="flex items-center gap-1.5 group/stat">
                  <Eye className="w-3.5 h-3.5 text-muted-foreground transition-colors group-hover/stat:text-primary" />
                  <span className="text-[11px] font-mono font-black text-muted-foreground group-hover/stat:text-foreground">{blob.views}</span>
               </div>
               <button 
                  onClick={handleLike}
                  className="flex items-center gap-1.5 group/like"
               >
                  <Heart className={`w-3.5 h-3.5 transition-all duration-300 ${blob.likes > 0 ? "fill-primary text-primary" : "text-muted-foreground group-hover/like:text-primary"}`} />
                  <span className={`text-[11px] font-mono font-black ${blob.likes > 0 ? "text-primary" : "text-muted-foreground group-hover/like:text-foreground"}`}>{blob.likes}</span>
               </button>
            </div>
         </div>
      </div>
    </Card>
  );
}
