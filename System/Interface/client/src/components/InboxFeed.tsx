"use client";

import { useEffect, useState } from "react";
import { Activity, CheckCircle, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface InboxResponse {
    success: boolean;
    content: string;
}

export function InboxFeed() {
    const [tasks, setTasks] = useState<string[]>([]);

    useEffect(() => {
        const fetchInbox = async () => {
            try {
                const res = await fetch("http://localhost:3001/api/inbox");
                if (res.ok) {
                    const data: InboxResponse = await res.json();
                    if (data.success) {
                        // Parse markdown list items
                        const lines = data.content.split('\n')
                            .filter(line => line.trim().startsWith('- [ ]') || line.trim().startsWith('- [x]'))
                            .slice(0, 5); // Show top 5
                        setTasks(lines);
                    }
                }
            } catch (e) {
                console.error("Inbox Fetch Error", e);
            }
        };

        fetchInbox();
        const interval = setInterval(fetchInbox, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="glass-panel p-6 rounded-lg">
            <h2 className="text-xl text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-neon-cyan" /> INBOX FEED
            </h2>
            <div className="space-y-3">
                {tasks.length === 0 ? (
                    <div className="text-sm opacity-50 italic">No active tasks...</div>
                ) : (
                    tasks.map((task, i) => {
                        const isDone = task.includes('[x]');
                        const text = task.replace(/- \[[ x]\]/, '').trim();
                        return (
                            <div key={i} className="flex items-start gap-3 text-sm font-mono border-b border-white/10 pb-2 last:border-0">
                                {isDone ?
                                    <CheckCircle className="w-4 h-4 text-neon-green mt-0.5" /> :
                                    <Circle className="w-4 h-4 text-neon-cyan mt-0.5" />
                                }
                                <span className={cn(isDone ? "opacity-50 line-through" : "opacity-90")}>
                                    {text}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
