"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FeedCard } from "@/components/FeedCard";
import { listBlobs, BlobMetadata, getStorageUsage } from "@/lib/shelby";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { 
  Globe, 
  Image as ImageIcon, 
  Video, 
  BookOpen, 
  Code, 
  Zap,
  Shield,
  Zap as ZapIcon,
  Search,
  ArrowRight,
  Database,
  Activity,
  Cpu,
  Lock,
  Terminal,
  Server,
  ChevronRight,
  Share2,
  ExternalLink
} from "lucide-react";

// --- ANIMATION VARIANTS ---
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: "easeOut" }
} as const;

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.1 } }
} as const;

// --- COMPONENTS ---
const AnimatedCounter = ({ value, unit = "" }: { value: string, unit?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const target = parseFloat(value.replace(/,/g, ''));
  const decimals = value.includes('.') ? value.split('.')[1].length : 0;

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setDisplayValue(progress * target);
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }, [target]);

  return (
    <span className="tabular-nums">
      {displayValue.toLocaleString(undefined, { 
        minimumFractionDigits: decimals, 
        maximumFractionDigits: decimals 
      })}{unit}
    </span>
  );
};

const FILTERS = [
  { name: "All", icon: Globe },
  { name: "Images", icon: ImageIcon },
  { name: "Videos", icon: Video },
  { name: "Courses", icon: BookOpen },
  { name: "Source Code", icon: Code },
  { name: "Trending", icon: Zap }
];

const FEATURES = [
  {
    title: "Immutable Media Layer",
    description: "Every blob is assigned a unique cryptographic digest on Aptos, ensuring permanent data integrity for all media-rich assets.",
    icon: Shield
  },
  {
    title: "Extreme Throughput",
    description: "Built on Aptos' parallel execution engine, ShelbyHub delivers sub-second settlement for high-frequency intake.",
    icon: ZapIcon
  },
  {
    title: "Discovery Protocol",
    description: "Advanced metadata indexing allows institutional-grade search and surfacing for complex on-chain blobs.",
    icon: Search
  }
];

export default function Home() {
  const [blobs, setBlobs] = useState<BlobMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [usedBytes, setUsedBytes] = useState(0);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [data, usage] = await Promise.all([listBlobs(), getStorageUsage()]);
        setBlobs(data);
        setUsedBytes(usage);
      } catch (err) {
        console.error("Failed to load blobs", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const usedMB = (usedBytes / (1024 * 1024)).toFixed(2);
  const percentUsed = Math.min((parseFloat(usedMB) / 500) * 100, 100);
  const filteredBlobs = blobs.filter((blob) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Trending") return true;
    if (activeFilter === "Images") return blob.contentType === "Image";
    if (activeFilter === "Videos") return blob.contentType === "Video";
    return blob.contentType === activeFilter;
  });

  return (
    <div className="flex flex-col bg-grid">
      {/* --- HERO SECTION --- */}
      <section className="container mx-auto px-6 pt-40 pb-32 max-w-[1200px]">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="space-y-10"
          >
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-[0.3em]">
              Protocol State: Synced
            </Badge>
            <h1 className="text-6xl md:text-8xl font-heading font-black tracking-tight text-foreground leading-[0.9] max-w-[10ch]">
              The Future of Blobs.
            </h1>
            <p className="text-muted-foreground text-xl font-medium leading-relaxed max-w-[58ch]">
              Institutional-grade digital asset settlement layer. High-throughput ingestion, 
              cryptographic integrity, and sub-second settlement on Aptos.
            </p>
            <div className="flex flex-wrap gap-5">
              <Link href="/upload">
                <Button className="h-16 px-10 rounded-xl bg-primary text-background font-bold uppercase tracking-widest text-[11px] hover:scale-[1.02] transition-all shadow-xl shadow-primary/10">
                  Initialize Ingestion <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/docs">
                <Button variant="outline" className="h-16 px-10 rounded-xl border-border bg-surface/50 font-bold uppercase tracking-widest text-[11px] hover:bg-surface transition-all">
                  Documentation
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* REAL DASHBOARD MOCKUP HERO VISUAL */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, x: 30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="relative group lg:block hidden"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-background rounded-[2.5rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-surface/80 backdrop-blur-3xl border border-divider rounded-[2rem] overflow-hidden shadow-2xl p-6 h-[480px]">
               {/* Terminal Header */}
               <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                       <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-600 ml-4 font-bold border-l border-border pl-4 uppercase tracking-[0.2em]">SHELBY_TERMINAL_V.01</span>
                  </div>
                  <Badge variant="outline" className="font-mono text-[9px] uppercase border-primary/30 text-primary">Live Data</Badge>
               </div>

               {/* Dashboard Charts & Widgets */}
               <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 space-y-4">
                     <div className="flex justify-between items-end">
                        <div>
                           <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Storage Pressure</p>
                           <h4 className="text-2xl font-heading font-black text-foreground">{percentUsed.toFixed(1)}%</h4>
                        </div>
                        <div className="flex gap-1 h-8 items-end">
                           {[40, 70, 45, 90, 65, 80, 55, 30].map((h, i) => (
                              <div key={i} className="w-2 bg-primary/20 rounded-t-sm transition-all duration-1000" style={{ height: `${h}%` }}></div>
                           ))}
                        </div>
                     </div>
                     <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-border">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentUsed}%` }}
                          transition={{ duration: 2, delay: 1 }}
                          className="h-full bg-primary shadow-[0_0_10px_rgba(34,199,184,0.5)]" 
                        />
                     </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-background/50 border border-border">
                     <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mb-2">Network Health</p>
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                           <Activity className="w-4 h-4 text-emerald-500" />
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-500">EXCELLENT</span>
                     </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-background/50 border border-border">
                     <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mb-2">Validators</p>
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                           <Server className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-xs font-mono font-bold text-foreground">1,248 ACTIVE</span>
                     </div>
                  </div>

                  <div className="col-span-2 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                     <div className="flex justify-between items-center mb-4">
                        <span className="text-[9px] font-mono text-primary uppercase tracking-widest">Recent Settlements</span>
                        <ChevronRight className="w-3 h-3 text-primary" />
                     </div>
                     <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                           <div key={i} className="flex justify-between items-center text-[10px] font-mono border-b border-white/5 pb-2 last:border-0">
                              <span className="text-zinc-400">0x{Math.random().toString(16).slice(2, 6)}...{Math.random().toString(16).slice(2, 4)}</span>
                              <span className="text-foreground font-bold">SETTLED</span>
                              <span className="text-primary">+1.24 APT</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- TRUSTED STRIP (MARQUEE) --- */}
      <div className="border-y border-border py-10 bg-muted/30 overflow-hidden relative">
         <div className="container mx-auto px-6 mb-8 max-w-[1200px]">
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.4em] text-center md:text-left">TRUSTED BY BUILDERS INFRASTRUCTURE</p>
         </div>
         <div className="flex whitespace-nowrap animate-marquee">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-20 mx-10">
                {["AMNIS", "PETRA", "THALA", "ECONIA", "APTOS", "KANALABS", "ARIES"].map(brand => (
                  <span key={brand} className="text-3xl font-heading font-black text-foreground/20 hover:text-primary transition-colors cursor-default tracking-tighter italic">
                    {brand}
                  </span>
                ))}
              </div>
            ))}
         </div>
      </div>

      {/* --- PROTOCOL STATS --- */}
      <section className="container mx-auto px-6 py-24 max-w-[1200px]">
        <motion.div 
          {...fadeInUp}
          className="grid md:grid-cols-3 gap-px bg-border border border-border rounded-[2rem] overflow-hidden"
        >
          {[
            { label: "PROTOCOL CAPACITY", value: "500", unit: "MB", icon: Database },
            { label: "NETWORK UPTIME", value: "99.9", unit: "%", icon: Activity },
            { label: "VERIFICATION NODES", value: "1248", unit: "", icon: Cpu },
          ].map((stat, i) => (
            <div key={i} className="bg-surface p-12 group hover:bg-muted/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-primary transition-all duration-500">
                <stat.icon className="w-6 h-6 text-primary group-hover:text-background" />
              </div>
              <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-[0.3em] mb-3">{stat.label}</p>
              <h3 className="text-6xl font-heading font-black text-foreground tracking-tighter">
                <AnimatedCounter value={stat.value} unit={stat.unit} />
              </h3>
            </div>
          ))}
        </motion.div>
      </section>

      {/* --- WHY SHELBYHUB --- */}
      <section className="container mx-auto px-6 py-32 max-w-[1200px]">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <motion.div {...fadeInUp} className="lg:col-span-4 space-y-6">
            <h2 className="text-5xl font-heading font-black text-foreground tracking-tight uppercase leading-none">The Engineering Integrity.</h2>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-[58ch]">Built for scalability. Optimized for the digital absolute.</p>
            <div className="pt-8">
               <Button variant="link" className="text-primary p-0 font-mono uppercase tracking-[0.2em] text-[11px] hover:no-underline flex items-center gap-2">
                 Verify Protocol Specs <ChevronRight className="w-4 h-4" />
               </Button>
            </div>
          </motion.div>
          <div className="lg:col-span-8 grid md:grid-cols-2 gap-8">
            {FEATURES.map((feat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`p-10 rounded-[2rem] bg-surface/50 border border-border group hover:border-primary/30 transition-all ${i === 0 ? "md:col-span-2" : ""}`}
              >
                <div className="w-12 h-12 rounded-xl border border-divider flex items-center justify-center mb-8 text-primary group-hover:bg-primary/10 transition-colors">
                  <feat.icon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-heading font-black text-foreground mb-4 tracking-tight uppercase">{feat.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm font-medium">{feat.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- EXPLORER SECTION --- */}
      <section id="explorer" className="container mx-auto px-6 py-32 max-w-[1200px]">
        <motion.div {...fadeInUp} className="space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-end gap-10">
            <div className="space-y-4">
               <h2 className="text-5xl font-heading font-black text-foreground tracking-tight uppercase">Protocol Explorer.</h2>
               <p className="text-muted-foreground text-lg font-medium">Global indices of verified cryptographic blobs.</p>
            </div>
            
            <div className="flex flex-wrap gap-2 p-1.5 bg-surface border border-border rounded-2xl">
              {FILTERS.map((f) => (
                <button
                  key={f.name}
                  onClick={() => setActiveFilter(f.name)}
                  className={`px-6 py-3 rounded-xl text-[11px] font-mono uppercase border transition-all ${
                    activeFilter === f.name
                      ? "bg-primary border-primary text-background font-bold shadow-lg"
                      : "bg-transparent border-transparent text-zinc-500 hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <f.icon className="w-3.5 h-3.5" />
                    {f.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
               {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="aspect-[4/5] bg-muted/50 rounded-[2rem] animate-pulse"></div>
               ))}
            </div>
          ) : (
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10"
            >
              <AnimatePresence>
                {filteredBlobs.map((blob) => (
                  <motion.div 
                    layout
                    key={blob.id} 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5 }}
                  >
                    <FeedCard blob={blob} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* --- INSTITUTIONAL FOOTER --- */}
      <footer className="container mx-auto px-6 py-32 border-t border-border max-w-[1200px]">
        <div className="grid md:grid-cols-5 gap-20 mb-32">
           {/* Branding */}
           <div className="col-span-2 space-y-10">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-xl">
                  <Shield className="w-6 h-6 text-background" />
                </div>
                <span className="text-2xl font-heading font-black uppercase tracking-tight">ShelbyHub</span>
              </Link>
              <p className="text-muted-foreground text-sm max-w-xs leading-relaxed font-medium">
                The institutional digital asset settlement layer for the Aptos ecosystem. 
                Securing data, ensuring discovery, accelerating innovation.
              </p>
              <div className="flex items-center gap-5">
                 <Link href="#" className="p-3 rounded-lg border border-border hover:border-primary/30 transition-colors text-foreground opacity-60 hover:opacity-100">
                    <Globe className="w-5 h-5" />
                 </Link>
                 <Link href="#" className="p-3 rounded-lg border border-border hover:border-primary/30 transition-colors text-foreground opacity-60 hover:opacity-100">
                    <ExternalLink className="w-5 h-5" />
                 </Link>
                 <Link href="#" className="p-3 rounded-lg border border-border hover:border-primary/30 transition-colors text-foreground opacity-60 hover:opacity-100">
                    <Share2 className="w-5 h-5" />
                 </Link>
              </div>
           </div>

           {/* Quick Links */}
           <div className="space-y-6">
              <h5 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em]">Protocol</h5>
              <ul className="space-y-4">
                 <li><Link href="#" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">Console</Link></li>
                 <li><Link href="#" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">Explorer</Link></li>
                 <li><Link href="#" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">Ecosystem</Link></li>
                 <li><Link href="#" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">Governance</Link></li>
              </ul>
           </div>

           {/* Legal */}
           <div className="space-y-6">
              <h5 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em]">Legal</h5>
              <ul className="space-y-4">
                 <li><Link href="#" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
                 <li><Link href="#" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
                 <li><Link href="#" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">Cookie Policy</Link></li>
              </ul>
           </div>

           {/* Support */}
           <div className="space-y-6">
              <h5 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em]">Support</h5>
              <ul className="space-y-4">
                 <li><Link href="#" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors flex items-center justify-between">Documentation <ExternalLink className="w-3.5 h-3.5 opacity-40" /></Link></li>
                 <li><Link href="#" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">GitHub</Link></li>
                 <li><Link href="#" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">Status</Link></li>
              </ul>
           </div>
        </div>

        <div className="pt-10 border-t border-border flex flex-col md:flex-row justify-between items-center gap-10">
           <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.2em]">
              © 2026 ShelbyHub Protocol | All Rights Reserved
           </div>
           <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-surface border border-border shadow-sm">
              <Lock className="w-3.5 h-3.5 text-zinc-700" />
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em]">Infrastructure Secured by Aptos Network</span>
           </div>
        </div>
      </footer>
    </div>
  );
}
