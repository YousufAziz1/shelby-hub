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

export const listBlobs = async (params: { limit?: number, filter?: any } = {}) => {
  let query = supabase
    .from('blobs')
    .select('*')
    .order('timestamp', { ascending: false });

  if (params.limit) query = query.limit(params.limit);
  if (params.filter?.creatorAddress) query = query.eq('creatorAddress', params.filter.creatorAddress);

  const { data, error } = await query;
  if (error) throw error;
  
  return data as BlobMetadata[];
};

export const downloadBlob = async (id: string) => {
  // Since we use public URLs, we can just fetch the URL
  const { data, error } = await supabase
    .from('blobs')
    .select('fileUrl')
    .eq('id', id)
    .single();

  if (error || !data.fileUrl) throw new Error("File not found");
  
  const response = await fetch(data.fileUrl);
  return await response.arrayBuffer();
};

export const getStorageUsage = async () => {
  const { data, error } = await supabase
    .from('blobs')
    .select('fileSize');
    
  if (error) return 0;
  return data.reduce((acc, curr) => acc + (curr.fileSize || 0), 0);
};

export const recordView = async (id: string) => {
  const { error } = await supabase.rpc('increment_views', { blob_id: id });
  if (error) console.error("View increment error", error);
};

export const recordLike = async (id: string) => {
  const { error } = await supabase.rpc('increment_likes', { blob_id: id });
  if (error) throw error;
};

export const followUser = async (follower: string, following: string) => {
  const { error } = await supabase
    .from('follows')
    .insert([{ follower_address: follower, following_address: following }]);
  
  if (error && error.code !== '23505') { // Ignore duplicate follow errors
    throw error;
  }
};

export const getFollowCount = async (address: string) => {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_address', address);
    
  if (error) return 0;
  return count || 0;
};
