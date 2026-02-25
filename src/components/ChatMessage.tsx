import React from 'react';
import clsx from 'clsx';
import { User, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export type Role = 'user' | 'assistant' | 'system';

interface ChatMessageProps {
    role: Role;
    content: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ role, content }) => {
    const isUser = role === 'user';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={clsx(
                "flex w-full mt-4 space-x-3 max-w-2xl mx-auto",
                isUser ? "justify-end" : "justify-start"
            )}
        >
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                </div>
            )}

            <div
                className={clsx(
                    "px-4 py-3 rounded-2xl max-w-[85%] text-sm leading-relaxed",
                    isUser
                        ? "bg-slate-900 text-white rounded-tr-none"
                        : "bg-white border border-slate-200 text-slate-800 shadow-sm rounded-tl-none"
                )}
            >
                {content}
            </div>

            {isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300">
                    <User className="w-5 h-5 text-slate-600" />
                </div>
            )}
        </motion.div>
    );
};
