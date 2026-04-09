# 🛡️ ShelbyHub | Decentralized Protocol Ingestion

**ShelbyHub** is a high-performance content marketplace and storage verification protocol built on the **Shelby Testnet (Aptos)**. It leverages decentralized blob storage to provide permanent, consensus-backed availability for premium assets including Source Code, Live Video, and institutional-grade Documents.

---

## 🚀 Vision
ShelbyHub empowers creators to tokenize and settle high-value assets directly on-chain. By integrating the **Shelby Protocol**, we provide a seamless bridge between raw data ingestion and decentralized settlement using **ShelbyUSD (SUSD)**.

## 🛠 Features
- **Node Ingestion**: Real-time broadcast of data payloads to protocol nodes.
- **Payload Multi-Class Support**: Native support for:
  - **Source Code**: Encrypted repository streams.
  - **Live Media**: Immediate video broadcast ingestion.
  - **PDF / Documents**: Deep-integrated document viewers for verified users.
- **SUSD Settlement**: Instant peer-to-peer settlement for unlocked content.
- **Live Previews**: Dynamic, client-side decoding and previewing of assets before protocol broadcast.
- **Protocol Verification**: Full lineage tracking and identity verification via Aptos Wallet Adapter.

## ⚙️ Core Technology
- **In-Browser Commitments**: Utilizing the `@shelby-protocol/sdk` for browser-side erasure coding and merkle root generation.
- **Aptos Blockchain**: Leveraging Aptos for sub-second settlement and high-throughput metadata indexing.
- **Cyber-Console UI**: A premium, high-impact aesthetic designed for protocol operators and institutional creators.

## 📦 Getting Started

### Prerequisites
- Node.js 18+
- [Petra Wallet](https://petra.app/) or any Aptos-compatible hardware/extension.
- Authorized Node Identity.

### Installation
```bash
git clone https://github.com/YousufAziz1/shelby-hub.git
cd shelby-hub
npm install
```

### Configuration
Create a `.env` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### Deployment
```bash
npm run build
npm run dev
```

## 📜 Governance & Verification
ShelbyHub is maintained by the protocol verified admin **@Aptos_king**. All asset ingestions are subject to Shelley-standard data verification protocols and on-chain transparency.

---

**Developed for the Shelby Protocol Ecosystem.**
[Explore the Protocol](https://shelby-hub-peach.vercel.app) | [GitHub](https://github.com/YousufAziz1/)
