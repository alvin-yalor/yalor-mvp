'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Activity, Zap, Network, Gavel, Send, Terminal } from 'lucide-react';
import {
    AceEvent,
    OpportunityIdentifiedPayload,
    OpportunityFannedOutPayload,
    BidAcceptedPayload,
    AdCpPayload
} from '../infrastructure/events';

interface LoggedEvent {
    id: string;
    timestamp: number;
    type: string;
    data: any;
}

export const DeveloperPanel = () => {
    const [events, setEvents] = useState<LoggedEvent[]>([]);
    const [latestIntent, setLatestIntent] = useState<OpportunityIdentifiedPayload | null>(null);
    const [latestFanOut, setLatestFanOut] = useState<OpportunityFannedOutPayload | null>(null);
    const [latestBid, setLatestBid] = useState<BidAcceptedPayload | null>(null);
    const [latestPayload, setLatestPayload] = useState<AdCpPayload | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const eventContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll the all-events log
    useEffect(() => {
        if (eventContainerRef.current) {
            eventContainerRef.current.scrollTop = eventContainerRef.current.scrollHeight;
        }
    }, [events]);

    useEffect(() => {
        const eventSource = new EventSource('/api/demo/sse');

        eventSource.onopen = () => setIsConnected(true);
        eventSource.onerror = () => setIsConnected(false);

        // Listen for all predefined ACE events
        Object.values(AceEvent).forEach((eventName) => {
            eventSource.addEventListener(eventName, (e: MessageEvent) => {
                const data = JSON.parse(e.data);

                // 1. Add to running log
                setEvents((prev) => [...prev, {
                    id: Math.random().toString(36).substring(7),
                    timestamp: Date.now(),
                    type: eventName,
                    data
                }]);

                // 2. Update specific sections
                switch (eventName) {
                    case AceEvent.OPPORTUNITY_IDENTIFIED:
                        setLatestIntent(data as OpportunityIdentifiedPayload);
                        break;
                    case AceEvent.OPPORTUNITY_FANNED_OUT:
                        setLatestFanOut(data as OpportunityFannedOutPayload);
                        break;
                    case AceEvent.BID_ACCEPTED:
                        setLatestBid(data as BidAcceptedPayload);
                        break;
                    case AceEvent.MEDIA_PAYLOAD_READY:
                        setLatestPayload(data as AdCpPayload);
                        break;
                }
            });
        });

        return () => {
            eventSource.close();
        };
    }, []);

    const formatJson = (obj: any) => JSON.stringify(obj, null, 2);

    return (
        <div className="flex flex-col h-full bg-slate-900 text-slate-300 font-mono text-xs overflow-y-auto w-full border-l border-slate-700">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <h2 className="text-sm font-semibold text-white tracking-wider uppercase">ACE Dev Console</h2>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500">SSE Stream</span>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                </div>
            </div>

            <div className="p-4 flex flex-col space-y-6">

                {/* Section 1: All Events Log */}
                <section>
                    <div className="flex items-center space-x-2 mb-2 text-slate-400">
                        <Activity className="w-3.5 h-3.5" />
                        <h3 className="uppercase tracking-wider font-semibold">Event Firehose</h3>
                    </div>
                    <div
                        ref={eventContainerRef}
                        className="bg-slate-950 rounded-lg p-3 max-h-48 overflow-y-auto border border-slate-800 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700"
                    >
                        {events.length === 0 ? (
                            <span className="text-slate-600 italic">Waiting for events...</span>
                        ) : (
                            events.map(ev => (
                                <div key={ev.id} className="flex space-x-2">
                                    <span className="text-slate-600 shrink-0">
                                        [{new Date(ev.timestamp).toISOString().split('T')[1].slice(0, 8)}]
                                    </span>
                                    <span className="text-indigo-400 font-bold shrink-0">{ev.type}</span>
                                    <span className="text-slate-500 truncate flex-grow">
                                        {JSON.stringify(ev.data).substring(0, 50)}...
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Section 2: Intent Identified */}
                <section>
                    <div className="flex items-center space-x-2 mb-2 text-amber-400">
                        <Zap className="w-3.5 h-3.5" />
                        <h3 className="uppercase tracking-wider font-semibold">Latest Intent</h3>
                    </div>
                    <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 overflow-x-auto">
                        {latestIntent ? (
                            <pre className="text-emerald-400">{formatJson(latestIntent)}</pre>
                        ) : (
                            <span className="text-slate-600 italic">No intent identified yet</span>
                        )}
                    </div>
                </section>

                {/* Section 3: Fanned Out */}
                <section>
                    <div className="flex items-center space-x-2 mb-2 text-blue-400">
                        <Network className="w-3.5 h-3.5" />
                        <h3 className="uppercase tracking-wider font-semibold">Media Network Fan Out</h3>
                    </div>
                    <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 overflow-x-auto">
                        {latestFanOut ? (
                            <pre className="text-sky-300">{formatJson(latestFanOut)}</pre>
                        ) : (
                            <span className="text-slate-600 italic">No fan out events yet</span>
                        )}
                    </div>
                </section>

                {/* Section 4: Bid Accepted */}
                <section>
                    <div className="flex items-center space-x-2 mb-2 text-purple-400">
                        <Gavel className="w-3.5 h-3.5" />
                        <h3 className="uppercase tracking-wider font-semibold">Auction Result</h3>
                    </div>
                    <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 overflow-x-auto">
                        {latestBid ? (
                            <pre className="text-purple-300">{formatJson(latestBid)}</pre>
                        ) : (
                            <span className="text-slate-600 italic">No auction completed yet</span>
                        )}
                    </div>
                </section>

                {/* Section 5: Payload Ready */}
                <section>
                    <div className="flex items-center space-x-2 mb-2 text-rose-400">
                        <Send className="w-3.5 h-3.5" />
                        <h3 className="uppercase tracking-wider font-semibold">Egress Payload (AdCP)</h3>
                    </div>
                    <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 overflow-x-auto">
                        {latestPayload ? (
                            <pre className="text-rose-300">{formatJson(latestPayload)}</pre>
                        ) : (
                            <span className="text-slate-600 italic">No payload sent to client yet</span>
                        )}
                    </div>
                </section>

            </div>
        </div>
    );
};
