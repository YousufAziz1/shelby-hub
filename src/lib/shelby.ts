/**
 * Shelby Protocol SDK wrapper
 * Interacts with @shelby-protocol/sdk
 */

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
  isPublic: boolean;
}

// Initial Mock Data
const INITIAL_BLOBS: BlobMetadata[] = [
  {
    id: "blob_1",
    title: "Intro to Aptos Move",
    description: "Learn how to build smart contracts on Aptos.",
    contentType: "Course",
    price: 0,
    creatorAddress: "0x123...abc",
    timestamp: Date.now() - 86400000,
    likes: 120,
    views: 1500,
    isPublic: true,
  },
  {
    id: "blob_2",
    title: "Shelby Architecture Diagram",
    description: "High resolution diagram of the protocol.",
    contentType: "Image",
    price: 5,
    creatorAddress: "0x456...def",
    timestamp: Date.now() - 172800000,
    likes: 45,
    views: 300,
    isPublic: true,
  }
];

// Helper to get blobs from localStorage (Client-side only)
const getStoredBlobs = (): BlobMetadata[] => {
  if (typeof window === "undefined") return INITIAL_BLOBS;
  const stored = localStorage.getItem("shelby_blobs");
  if (!stored) {
    localStorage.setItem("shelby_blobs", JSON.stringify(INITIAL_BLOBS));
    return INITIAL_BLOBS;
  }
  return JSON.parse(stored);
};

// Helper to save blobs
const saveBlobs = (blobs: BlobMetadata[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("shelby_blobs", JSON.stringify(blobs));
  }
};

export const uploadBlob = async (payload: { data: ArrayBuffer | File, mimeType: string, metadata?: Partial<BlobMetadata> }) => {
  console.log("Saving to local storage (Mock SDK)", payload);
  
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  const newBlob: BlobMetadata = {
    id: `blob_${Date.now()}`,
    title: payload.metadata?.title || "Untitled",
    description: payload.metadata?.description || "",
    contentType: payload.metadata?.contentType || "Other",
    price: payload.metadata?.price || 0,
    creatorAddress: payload.metadata?.creatorAddress || "0xUnknown",
    timestamp: Date.now(),
    likes: 0,
    views: 0,
    isPublic: true,
    ...payload.metadata
  };

  const currentBlobs = getStoredBlobs();
  saveBlobs([newBlob, ...currentBlobs]);
  
  return newBlob;
};

export const listBlobs = async (params: { limit?: number, filter?: any } = {}) => {
  console.log("Fetching blobs", params);
  await new Promise((resolve) => setTimeout(resolve, 500));
  return getStoredBlobs(); 
};

export const downloadBlob = async (id: string) => {
  console.log("Downloading", id);
  return new ArrayBuffer(0); 
};
