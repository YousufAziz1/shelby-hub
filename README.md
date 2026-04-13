# ShelbyMarket

> The ultimate decentralized content marketplace built on Shelby Protocol (Aptos Testnet).

Upload your premium files, set pricing in ShelbyUSD (SUSD), and get paid instantly through on-chain micro-transactions.

## Features

- **Decentralized File Storage** — Files are encoded, committed on-chain, and synced to Shelby settlement nodes.
- **SUSD Micro-Payments** — Creators earn SUSD when users like their content.
- **AI Metadata Generator** — Auto-generate rich descriptions for your uploads.
- **Dark Mode First** — Premium Web3 aesthetic with glassmorphism and dynamic animations.
- **Live Search** — Filter content by keyword or uploader address.
- **Creator Profiles** — Analytics dashboard with uploads, followers, views, likes, and SUSD earnings.
- **Media Previews** — Auto-playing video previews, image thumbnails, and premium content gating.
- **Smart Caching** — 30-second local cache for instant feed navigation.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **Blockchain:** Aptos Testnet, Shelby Protocol SDK
- **Wallet:** Petra Wallet Adapter
- **Storage:** Supabase (metadata + file storage)
- **Animations:** Framer Motion
- **UI:** shadcn/ui, Lucide Icons

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env` file:

```env
NEXT_PUBLIC_SHELBY_NETWORK=testnet
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## License

MIT © [YousufAziz1](https://github.com/YousufAziz1)
