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
    <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 bg-white border border-border group">
      <Link href={`/content/${blob.id}`}>
        <div className="aspect-video bg-[#F5F2EE] relative flex items-center justify-center overflow-hidden">
          {thumb ? (
            <img src={thumb} alt={blob.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <div className="text-muted-foreground/20 group-hover:scale-110 group-hover:text-primary/30 transition-all duration-700">
              {getIcon()}
            </div>
          )}
          {blob.price > 0 && (
            <div className="absolute top-4 right-4 bg-primary text-white rounded-lg px-3 py-1.5 flex items-center gap-1.5 shadow-lg border border-white/20">
              <Lock className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">{blob.price} SUSD</span>
            </div>
          )}
        </div>
      </Link>
      
      <CardHeader className="p-6 pb-2">
        <div className="flex justify-between items-start gap-4">
          <Link href={`/content/${blob.id}`} className="hover:text-primary transition-colors flex-1">
            <h3 className="font-extrabold text-xl leading-tight line-clamp-1 tracking-tight">{blob.title}</h3>
          </Link>
          <Badge variant="secondary" className="shrink-0 font-bold bg-primary/5 text-primary border-primary/20">
            {blob.price > 0 ? 'Settlement' : 'Free Entry'}
          </Badge>
        </div>
        <div className="flex items-center text-[10px] text-muted-foreground mt-2 font-black uppercase tracking-widest">
          <span className="text-primary mr-2">•</span>
          {cType}
          <span className="mx-2 opacity-30">|</span>
          {date}
        </div>
      </CardHeader>
      
      <CardContent className="p-6 pt-2 pb-6">
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 h-10 italic">
          "{blob.description}"
        </p>
      </CardContent>
      
      <CardFooter className="p-6 pt-5 flex justify-between items-center text-sm text-muted-foreground border-t border-border bg-[#FDFCFB]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-sm bg-primary flex items-center justify-center text-[10px] text-white font-black">
            {cAddress ? cAddress.slice(2, 4).toUpperCase() : "??"}
          </div>
          <span className="font-bold text-foreground hover:text-primary transition-colors cursor-pointer text-xs">{shortAddress}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-bold text-[11px]"><Eye className="w-4 h-4 text-primary opacity-60" /> {blob.views}</span>
          <button 
             onClick={handleLike}
             className="flex items-center gap-1.5 font-bold text-[11px] hover:text-primary transition-colors"
          >
            <Heart className={`w-4 h-4 ${blob.likes > 0 ? "fill-primary text-primary" : "text-primary opacity-60"}`} /> {blob.likes}
          </button>
          <button 
             onClick={handleShare}
             className="p-1 hover:bg-primary/10 rounded-md transition-colors"
          >
            <Share2 className="w-4 h-4 text-primary" />
          </button>
        </div>
      </CardFooter>
    </Card>
  );
}
