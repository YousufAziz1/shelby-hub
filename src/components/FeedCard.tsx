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
    <Card className="overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-card/80 backdrop-blur border-border/50">
      <Link href={`/content/${blob.id}`}>
        <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 relative flex items-center justify-center group overflow-hidden">
          {thumb ? (
            <img src={thumb} alt={blob.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="text-muted-foreground/30 group-hover:scale-110 group-hover:text-primary/40 transition-all duration-500">
              {getIcon()}
            </div>
          )}
          {blob.price > 0 && (
            <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-sm border border-border/50">
              <Lock className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold">{blob.price} SUSD</span>
            </div>
          )}
        </div>
      </Link>
      
      <CardHeader className="p-5 pb-3">
        <div className="flex justify-between items-start gap-4">
          <Link href={`/content/${blob.id}`} className="hover:underline flex-1">
            <h3 className="font-bold text-lg leading-tight line-clamp-1">{blob.title}</h3>
          </Link>
          <Badge variant={blob.price > 0 ? "default" : "secondary"} className="shrink-0 font-medium">
            {blob.price > 0 ? 'Premium' : 'Free Demo'}
          </Badge>
        </div>
        <div className="flex items-center text-xs text-muted-foreground mt-1.5 font-medium">
          <Badge variant="outline" className="mr-2 text-[10px] uppercase tracking-wider">{blob.contentType}</Badge>
          {date}
        </div>
      </CardHeader>
      
      <CardContent className="p-5 pt-0 pb-4">
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{blob.description}</p>
      </CardContent>
      
      <CardFooter className="p-5 pt-4 flex justify-between items-center text-sm text-muted-foreground border-t border-border/40 bg-muted/10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary/80 to-blue-500/80 flex items-center justify-center text-[10px] text-white font-bold">
            {blob.creatorAddress.slice(2, 4)}
          </div>
          <span className="font-semibold text-foreground/80 hover:text-foreground transition-colors cursor-pointer">{shortAddress}</span>
        </div>
        <div className="flex items-center gap-3.5">
          <span className="flex items-center gap-1.5 transition-colors cursor-default"><Eye className="w-4 h-4" /> {blob.views}</span>
          <button 
             onClick={handleLike}
             className="flex items-center gap-1.5 hover:text-red-500 transition-colors cursor-pointer"
          >
            <Heart className={`w-4 h-4 ${blob.likes > 0 ? "fill-red-500 text-red-500" : ""}`} /> {blob.likes}
          </button>
          <button 
             onClick={handleShare}
             className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </CardFooter>
    </Card>
  );
}
