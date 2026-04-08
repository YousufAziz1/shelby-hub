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
    <Card className="overflow-hidden bg-zinc-900 border-none rounded-[2rem] shadow-2xl hover:shadow-primary/20 transition-all duration-500 group relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
      
      <Link href={`/content/${blob.id}`}>
        <div className="aspect-[4/5] bg-zinc-800 relative flex items-center justify-center overflow-hidden">
          {thumb ? (
            <img src={thumb} alt={blob.title} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-1000" />
          ) : (
            <div className="text-zinc-700 group-hover:text-primary transition-colors duration-500 scale-150">
              {getIcon()}
            </div>
          )}
          
          {/* Top Overlays */}
          <div className="absolute top-4 left-4 z-20">
             <Badge className="bg-black/40 backdrop-blur-md text-white border-white/10 font-black text-[10px] uppercase tracking-widest px-3 py-1">
                {cType}
             </Badge>
          </div>
          
          {blob.price > 0 && (
            <div className="absolute top-4 right-4 z-20 bg-primary text-white rounded-full px-4 py-1.5 flex items-center gap-2 shadow-[0_0_20px_rgba(255,20,147,0.4)]">
              <Lock className="w-3.5 h-3.5" />
              <span className="text-xs font-black">{blob.price} SUSD</span>
            </div>
          )}

          {/* Bottom Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-8 z-20 transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
             <h3 className="text-2xl font-black text-white leading-tight mb-2 tracking-tighter">{blob.title}</h3>
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[10px] text-white font-black">
                  {cAddress ? cAddress.slice(2, 4).toUpperCase() : "??"}
                </div>
                <span className="text-xs font-bold text-zinc-300">{shortAddress}</span>
             </div>
          </div>
        </div>
      </Link>
      
      {/* Social Actions (Visible on Hover/Mobile) */}
      <div className="absolute right-4 bottom-24 z-30 flex flex-col gap-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <button 
           onClick={handleLike}
           className="flex flex-col items-center gap-1 group/btn"
        >
          <div className={`p-3 rounded-full backdrop-blur-md border border-white/10 transition-all ${blob.likes > 0 ? "bg-primary text-white scale-110 shadow-[0_0_15px_rgba(255,20,147,0.5)]" : "bg-black/40 text-white hover:bg-primary"}`}>
            <Heart className={`w-5 h-5 ${blob.likes > 0 ? "fill-white" : ""}`} />
          </div>
          <span className="text-[10px] font-black text-white shadow-black drop-shadow-md">{blob.likes}</span>
        </button>
        
        <div className="flex flex-col items-center gap-1">
          <div className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white">
            <Eye className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black text-white shadow-black drop-shadow-md">{blob.views}</span>
        </div>

        <button 
           onClick={handleShare}
           className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white hover:text-black transition-all"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </Card>
  );
}
