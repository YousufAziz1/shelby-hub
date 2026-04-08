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
    <Card className="overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group">
      <Link href={`/content/${blob.id}`}>
        <div className="aspect-video bg-slate-50 relative flex items-center justify-center overflow-hidden border-b border-slate-100">
          {thumb ? (
            <img src={thumb} alt={blob.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
          ) : (
            <div className="text-slate-300 group-hover:text-slate-400 transition-colors duration-500">
              {getIcon()}
            </div>
          )}
          {blob.price > 0 && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-900 rounded-lg px-2.5 py-1 flex items-center gap-1.5 shadow-sm border border-slate-200">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px] font-bold">{blob.price} SUSD</span>
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-6">
        <div className="flex justify-between items-start gap-4 mb-2">
          <Link href={`/content/${blob.id}`} className="hover:text-primary transition-colors flex-1">
            <h3 className="font-bold text-lg text-slate-900 leading-tight line-clamp-1">{blob.title}</h3>
          </Link>
          <Badge variant="secondary" className="shrink-0 font-bold bg-slate-100 text-slate-600 border-none px-2 py-0 h-5 text-[10px] uppercase">
            {cType}
          </Badge>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 h-10 mb-6">
          {blob.description}
        </p>
        
        <div className="flex justify-between items-center pt-5 border-t border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-[10px] text-slate-600 font-bold">
              {cAddress ? cAddress.slice(2, 4).toUpperCase() : "??"}
            </div>
            <span className="font-semibold text-slate-500 text-[11px] truncate w-20">{shortAddress}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
              <Eye className="w-3.5 h-3.5" />
              {blob.views}
            </div>
            <button 
               onClick={handleLike}
               className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-red-500 transition-colors"
            >
              <Heart className={`w-3.5 h-3.5 ${blob.likes > 0 ? "fill-red-500 text-red-500" : ""}`} />
              {blob.likes}
            </button>
            <button 
               onClick={handleShare}
               className="p-1 hover:bg-slate-50 rounded-md transition-colors text-slate-400 hover:text-slate-900"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
