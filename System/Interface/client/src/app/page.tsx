"use client";

import { useEffect, useState } from "react";
import { Activity, Shield, Terminal, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { InboxFeed } from "@/components/InboxFeed";

interface SystemStatus {
  status: string;
  system: string;
  timestamp: string;
}

export default function Home() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [toolsCount, setToolsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Status
        const resStatus = await fetch("http://localhost:3001/api/status");
        if (resStatus.ok) setStatus(await resStatus.json());

        // Tools
        const resTools = await fetch("http://localhost:3001/api/tools");
        if (resTools.ok) {
          const data = await resTools.json();
          if (data.success) setToolsCount(data.count);
        }
      } catch (e) {
        console.error("Bridge Connection Failed", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-cyber-black text-neon-cyan p-8 font-mono">
      {/* Header */}
      <header className="flex justify-between items-center mb-12 border-b border-cyber-border pb-4">
        <h1 className="text-4xl font-bold tracking-widest flex items-center gap-4">
          <Terminal className="w-10 h-10" />
          CYCOS<span className="text-neon-green">_C2</span>
        </h1>
        <div className="flex items-center gap-4 text-sm opacity-70">
          <span>{status?.timestamp || "CONNECTING..."}</span>
          <div className={cn("w-3 h-3 rounded-full animate-pulse", status ? "bg-neon-green" : "bg-neon-red")} />
        </div>
      </header>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

        {/* Status Panel */}
        <div className="glass-panel p-6 rounded-lg">
          <h2 className="text-xl text-white mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5" /> SYSTEM STATUS
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>BRIDGE:</span>
              <span className={cn(status ? "text-neon-green" : "text-neon-red")}>
                {status ? "ONLINE" : "OFFLINE"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>CORE:</span>
              <span className="text-neon-green">ACTIVE</span>
            </div>
            <div className="flex justify-between">
              <span>TOOLS:</span>
              <span className="text-neon-cyan">{toolsCount} LOADED</span>
            </div>
          </div>
        </div>

        {/* Sentinel Panel */}
        <div className="glass-panel p-6 rounded-lg border-neon-red/20">
          <h2 className="text-xl text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-neon-red" /> SECURITY
          </h2>
          <div className="text-sm opacity-80">
            SENTINEL: <span className="text-neon-green">WATCHING</span>
            <br />
            THREAT LEVEL: LOW
          </div>
        </div>

        {/* Inbox Link */}
        <InboxFeed />

      </div>
    </div>
  );
}
