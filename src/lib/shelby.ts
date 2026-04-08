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

// Temporary Mock Database for Testnet UI testing
export const mockBlobs: BlobMetadata[] = [
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
    price: 5, // 5 ShelbyUSD
    creatorAddress: "0x456...def",
    timestamp: Date.now() - 172800000,
    likes: 45,
    views: 300,
    isPublic: true,
  },
  {
    id: "blob_3",
    title: "Web3 Toolkit",
    description: "Useful code snippets for web3 apps.",
    contentType: "Source Code",
    price: 15,
    creatorAddress: "0x789...ghi",
    timestamp: Date.now() - 400000000,
    likes: 80,
    views: 900,
    isPublic: true,
  }
];

export const uploadBlob = async (payload: { data: ArrayBuffer | File, mimeType: string, metadata?: Partial<BlobMetadata> }) => {
  console.log("Mocking SDK uploadBlob", payload);
  // Real implementation: 
  // const client = new ShelbyClient({...});
  // return await client.uploadBlob({ data: payload.data, mimeType: payload.mimeType, metadata: payload.metadata });
  
  // Simulate delay
  await new Promise((resolve) => setTimeout(resolve, 1500));
  
  return { 
    id: `blob_${Date.now()}`, 
    ...payload.metadata 
  };
};

export const listBlobs = async (params: { limit?: number, filter?: any } = {}) => {
  console.log("Mocking SDK listBlobs", params);
  
  // Real implementation:
  // const client = new ShelbyClient({...});
  // const blobs = await client.listBlobs({ limit: params.limit, filter: params.filter });
  
  // Try real fetch logic mentally, fallback to mock:
  return mockBlobs; 
};

export const downloadBlob = async (id: string) => {
  console.log("Mocking SDK downloadBlob", { id });
  
  // Real implementation:
  // const client = new ShelbyClient({...});
  // return await client.downloadBlob(id);
  
  return new ArrayBuffer(0); 
};
