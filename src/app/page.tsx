'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ShoppingBag, Briefcase } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, Role } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { AceSponsoredCard } from '../components/AceSponsoredCard';
import { DeveloperPanel } from '../components/DeveloperPanel';
import { AdCpPayload } from '../infrastructure/events';

// Internal type for rendering mixed content in the chat stream
type UIBlock =
  | { type: 'text'; id: string; role: Role; content: string }
  | { type: 'adcp_card'; id: string; payload: AdCpPayload };

export default function Home() {
  const getWelcomeMessage = (type: 'groceries' | 'butler'): UIBlock => ({
    type: 'text',
    id: 'welcome-msg',
    role: 'assistant',
    content: type === 'groceries'
      ? 'Hi! I am your Yalor Grocery Assistant. How can I help you plan your meals or shopping today?'
      : 'Hello. I am your Executive Butler. How may I assist you today?'
  });

  const [botType, setBotType] = useState<'groceries' | 'butler'>('groceries');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<UIBlock[]>([getWelcomeMessage('groceries')]);

  const handleBotChange = (type: 'groceries' | 'butler') => {
    setBotType(type);
    setMessages([getWelcomeMessage(type)]);
    setInput('');
  };

  const bottomRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef('');

  useEffect(() => {
    // Generate session ID on mount to avoid hydration mismatch
    sessionId.current = `session-${uuidv4()}`;
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    setIsLoading(true);

    // 1. Optimistically append user message
    setMessages(prev => [
      ...prev,
      { type: 'text', id: uuidv4(), role: 'user', content: userText }
    ]);

    try {
      // 2. Fire concurrent requests to both the AI Provider AND the ACE MCP
      // This is the core magic behind Gen AI + Commerce without latency bottlenecks.
      const endpoint = botType === 'groceries' ? '/api/demo/chat' : '/api/demo/chat-butler';
      const chatPromise = fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
      }).then(res => res.json());

      const acePromise = fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionId.current, message: userText })
      }).then(res => res.json());

      const [chatData, aceData] = await Promise.allSettled([chatPromise, acePromise]);

      // 3. Inject ACE Generative UI Component if a bid was won
      if (aceData.status === 'fulfilled' && aceData.value?.status === 'success' && aceData.value?.payload) {
        const payload = aceData.value.payload as AdCpPayload;

        setMessages(prev => [
          ...prev,
          { type: 'adcp_card', id: uuidv4(), payload }
        ]);
      }

      // 4. Inject the Standard AI Text Response
      if (chatData.status === 'fulfilled' && chatData.value?.content) {
        setMessages(prev => [
          ...prev,
          { type: 'text', id: uuidv4(), role: 'assistant', content: chatData.value.content }
        ]);
      } else {
        setMessages(prev => [...prev, { type: 'text', id: uuidv4(), role: 'assistant', content: "Sorry, I encountered an error." }]);
      }

    } catch (e) {
      console.error({ err: e, sessionId: sessionId.current }, "Chat orchestration error:");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">

      {/* Left Column: Chat UI */}
      <div className="flex flex-col h-full w-full lg:w-2/3 border-r border-slate-200 shadow-sm z-10">

        {/* Header */}
        <header className="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 w-full relative">
          {/* Top-left Toggle */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg z-20">
            <button
              onClick={() => handleBotChange('groceries')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${botType === 'groceries' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Groceries
            </button>
            <button
              onClick={() => handleBotChange('butler')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${botType === 'butler' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Butler
            </button>
          </div>

          {/* Center Title */}
          <div className="flex items-center space-x-3 absolute left-1/2 transform -translate-x-1/2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${botType === 'groceries' ? 'bg-indigo-600 shadow-indigo-500/20' : 'bg-slate-800 shadow-slate-800/20'}`}>
              {botType === 'groceries' ? (
                <ShoppingBag className="w-5 h-5 text-white" />
              ) : (
                <Briefcase className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">
                {botType === 'groceries' ? 'Yalor Groceries' : 'Yalor Butler'}
              </h1>
              <p className="text-xs font-medium text-slate-500 flex items-center space-x-1 uppercase tracking-wider">
                <span>Powered by ACE AI</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1.5 animate-pulse"></span>
              </p>
            </div>
          </div>

          {/* Right Placeholder for balance */}
          <div className="w-[150px]"></div>
        </header>

        {/* Main Chat Area */}
        <main className="flex-grow overflow-y-auto w-full flex flex-col items-center px-4 py-8 space-y-2">
          {messages.map((block) => {
            if (block.type === 'text') {
              return <ChatMessage key={block.id} role={block.role} content={block.content} />;
            }
            if (block.type === 'adcp_card') {
              return <AceSponsoredCard key={block.id} payload={block.payload} />;
            }
            return null;
          })}

          {isLoading && (
            <div className="flex w-full mt-4 space-x-3 max-w-2xl mx-auto justify-start items-center ml-12 opacity-60">
              <div className="flex space-x-1.5 ml-2">
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={bottomRef} className="h-4" />
        </main>

        {/* Input Area */}
        <footer className="flex-shrink-0 bg-white border-t border-slate-200 p-4 pb-6 relative z-10 w-full">
          <div className="max-w-3xl mx-auto flex flex-col items-center">
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </div>
        </footer>
      </div>

      {/* Right Column: Developer SSE Panel */}
      <div className="hidden lg:flex flex-col h-full w-1/3 min-w-[350px]">
        <DeveloperPanel />
      </div>

    </div>
  );
}
