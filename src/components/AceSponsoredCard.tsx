import React, { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ExternalLink, Tag } from 'lucide-react';
import { AdCpPayload } from '../infrastructure/events';

interface AceSponsoredCardProps {
    payload: AdCpPayload;
}

/**
 * The Generative UI component that natively renders an ACE AdCP payload 
 * injected directly into the chat stream.
 */
export const AceSponsoredCard: React.FC<AceSponsoredCardProps> = ({ payload }) => {
    const { creative, artf_tracking, conversational_directives } = payload;
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.5 }); // Trigger when 50% visible

    // Simulate ARTF Tracking: on_ad_rendered webhook
    // When this component mounts and enters the viewport, it automatically informs the ACE Network
    // that a viewability standard was met.
    useEffect(() => {
        if (isInView) {
            console.log(`[ARTF Tracking] Emitting on_ad_rendered webhook to: ${artf_tracking.on_ad_rendered}`);
            // In a real implementation: fetch(artf_tracking.on_ad_rendered, { method: 'POST' });
        }
    }, [isInView, artf_tracking.on_ad_rendered]);

    const handleCTAClick = () => {
        console.log(`[ARTF Tracking] Emitting on_ad_clicked webhook to: ${artf_tracking.on_ad_clicked}`);
        // In a real implementation: fetch(artf_tracking.on_ad_clicked, { method: 'POST' });
        window.open(creative.click_url, '_blank');
    };

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="max-w-2xl mx-auto my-4 ml-11 overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-xl shadow-indigo-500/10 group"
        >
            {/* ACE Network Header */}
            <div className="bg-indigo-50/50 px-4 py-2 border-b border-indigo-100 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                    <SparklesIcon className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-[11px] font-semibold tracking-wider text-indigo-600 uppercase">
                        Sponsored Suggestion
                    </span>
                </div>
                <span className="text-[10px] text-slate-400">Powered by ACE</span>
            </div>

            {/* Card Content Layout */}
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 lg:gap-6">

                {/* Ad Image / Creative */}
                <div className="relative w-full sm:w-1/3 aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                    <img
                        src={creative.image_url}
                        alt={creative.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md rounded-md px-2 py-1 flex items-center space-x-1">
                        <Tag className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] font-medium text-white shadow-sm">Special Offer</span>
                    </div>
                </div>

                {/* Ad Text / Content */}
                <div className="flex flex-col flex-grow justify-between">
                    <div>
                        <div className="text-xs font-semibold text-slate-500 tracking-wide uppercase mb-1">
                            {creative.brand_name}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2">
                            {creative.title}
                        </h3>
                        <p className="text-sm text-slate-600 line-clamp-2">
                            {conversational_directives?.must_include || creative.description}
                        </p>
                    </div>

                    <button
                        onClick={handleCTAClick}
                        className="mt-4 sm:mt-0 flex w-full sm:w-auto items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
                    >
                        <span>Claim Offer</span>
                        <ExternalLink className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// Internal icon helper
function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M19 17v4" />
            <path d="M3 5h4" />
            <path d="M17 19h4" />
        </svg>
    );
}
