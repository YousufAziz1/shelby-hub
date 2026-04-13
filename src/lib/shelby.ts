import { supabase, BUCKET_NAME } from './supabase';

export interface BlobMetadata {
  id: string;
  title: string;
  description: string;
  contentType: string;
  price: number; 
  creatorAddress: string;
  timestamp: number;
  likes: number;
  views: number;
  thumbnailUrl?: string;
  fileUrl?: string; // Real Supabase Storage URL
  fileSize: number; // In bytes
  isPublic: boolean;
}

export const uploadBlob = async (payload: { data: ArrayBuffer | File, mimeType: string, metadata: Partial<BlobMetadata> }) => {
  const fileId = `blob_${Date.now()}`;
  const fileName = `${fileId}.${payload.mimeType.split('/')[1] || 'bin'}`;
  
  // 1. Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, payload.data, {
      contentType: payload.mimeType,
      upsert: true
    });

  if (uploadError) throw uploadError;

  // 2. Get Public URL
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  // 3. Save Metadata to Supabase DB
  const blobData: BlobMetadata = {
    id: fileId,
    title: payload.metadata.title || "Untitled",
    description: payload.metadata.description || "",
    contentType: payload.metadata.contentType || "Other",
    price: payload.metadata.price || 0,
    creatorAddress: payload.metadata.creatorAddress || "0xUnknown",
    timestamp: Date.now(),
    likes: 0,
    views: 0,
    thumbnailUrl: payload.metadata.thumbnailUrl || publicUrl, // Default to file itself if no thumb
    fileUrl: publicUrl,
    fileSize: (payload.data instanceof File ? payload.data.size : payload.data.byteLength),
    isPublic: true
  };

  const { error: dbError } = await supabase
    .from('blobs')
    .insert([blobData]);

  if (dbError) throw dbError;

  return blobData;
};

let blobsCache: { data: BlobMetadata[], timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 sec cache

export const listBlobs = async (params: { limit?: number, filter?: any } = {}, forceRefresh = false) => {
  const isGlobalFeed = !params.limit && !params.filter;
  if (isGlobalFeed && !forceRefresh && blobsCache && Date.now() - blobsCache.timestamp < CACHE_TTL) {
    return blobsCache.data;
  }

  let query = supabase
    .from('blobs')
    .select('*')
    .order('timestamp', { ascending: false });

  if (params.limit) query = query.limit(params.limit);
  if (params.filter?.creatorAddress) query = query.eq('creatorAddress', params.filter.creatorAddress);

  const { data, error } = await query;
  if (error) throw error;
  
  if (isGlobalFeed) {
    blobsCache = { data: data as BlobMetadata[], timestamp: Date.now() };
  }
  
  return data as BlobMetadata[];
};

export const downloadBlob = async (id: string) => {
  const { data, error } = await supabase
    .from('blobs')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data.fileUrl) throw new Error("File not found");
  
  return data as BlobMetadata;
};

export const getStorageUsage = async () => {
  const { data, error } = await supabase
    .from('blobs')
    .select('fileSize');
    
  if (error) return 0;
  return data.reduce((acc, curr) => acc + (curr.fileSize || 0), 0);
};

export const recordView = async (id: string) => {
  console.log("Recording view for", id);
  const { error } = await supabase.rpc('increment_views', { blob_id: id });
  if (error) console.error("View increment error", error);
};

export const recordLike = async (id: string) => {
  const { error } = await supabase.rpc('increment_likes', { blob_id: id });
  if (error) {
    console.error("Like increment error", error);
    throw error;
  }
};

export const recordUnlike = async (id: string) => {
  const { error } = await supabase.rpc('decrement_likes', { blob_id: id });
  if (error) {
    // Fallback: manual decrement
    const { data } = await supabase.from('blobs').select('likes').eq('id', id).single();
    if (data) {
      await supabase.from('blobs').update({ likes: Math.max(0, (data.likes || 1) - 1) }).eq('id', id);
    }
  }
};

// Per-user like state stored in localStorage (wallet address + blob id)
export const checkUserLiked = (walletAddress: string, blobId: string): boolean => {
  if (typeof window === 'undefined') return false;
  const key = `liked_${walletAddress}_${blobId}`;
  return localStorage.getItem(key) === '1';
};

export const setUserLiked = (walletAddress: string, blobId: string, liked: boolean) => {
  if (typeof window === 'undefined') return;
  const key = `liked_${walletAddress}_${blobId}`;
  if (liked) localStorage.setItem(key, '1');
  else localStorage.removeItem(key);
};

export const followUser = async (follower: string, following: string) => {
  const { error } = await supabase
    .from('follows')
    .insert([{ follower_address: follower, following_address: following }]);
  
  if (error && error.code !== '23505') { 
    console.error("Follow error", error);
    throw error;
  }
};

export const checkFollowStatus = async (follower: string, following: string) => {
  const { data, error } = await supabase
    .from('follows')
    .select('*')
    .eq('follower_address', follower)
    .eq('following_address', following);
    
  if (error || !data) return false;
  return data.length > 0;
};

export const getFollowCount = async (address: string) => {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_address', address);
    
  if (error) return 0;
  return count || 0;
};

export const unfollowUser = async (follower: string, following: string) => {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_address', follower)
    .eq('following_address', following);
    
  if (error) {
    console.error("Unfollow error", error);
    throw error;
  }
};

export const deleteBlob = async (id: string, creator: string) => {
  // 1. Get file metadata to find storage path
  const { data: blob, error: fetchError } = await supabase
    .from('blobs')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !blob) throw new Error("Asset not found in database");

  // 2. Delete from Storage (best-effort — won't fail if file already gone)
  const fileUrl: string = blob.fileUrl || blob.fileurl || "";
  const fileName = fileUrl.split('/').pop();
  if (fileName) {
    await supabase.storage.from(BUCKET_NAME).remove([fileName]);
  }

  // 3. Delete DB record by ID
  const { data: deleteData, error: dbError } = await supabase
    .from('blobs')
    .delete()
    .eq('id', id)
    .select();

  if (dbError) throw new Error("Database delete failed: " + dbError.message);
  if (!deleteData || deleteData.length === 0) {
    throw new Error("Action blocked by Supabase RLS. Please disable RLS or add a complete DELETE policy in your Supabase Dashboard.");
  }
};

export const updateBlob = async (id: string, creator: string, updates: Partial<BlobMetadata>) => {
  const { data: updateData, error } = await supabase
    .from('blobs')
    .update(updates)
    .eq('id', id)
    .eq('creatorAddress', creator)
    .select();

  if (error) throw error;
  if (!updateData || updateData.length === 0) {
    throw new Error("Action blocked by Supabase RLS. Please disable RLS or add a complete UPDATE policy in your Supabase Dashboard.");
  }
};
