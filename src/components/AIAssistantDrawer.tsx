import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  ExternalLink,
  Bot,
  User as UserIcon,
  RefreshCw,
  AlertTriangle,
  HelpCircle,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  sources?: Array<{ title: string; uri: string }>;
}

export const AIAssistantDrawer: React.FC = () => {
  const {
    isAIChatOpen,
    setIsAIChatOpen,
    products,
    sales,
    lowStockAlerts,
    suppliers,
    settings,
  } = usePOS();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      role: 'model',
      text: `Hello! I am your AI Store & Inventory Co-Pilot for **Osutua Wines and Spirits**. I can analyze your real-time inventory levels, draft supplier reorder purchase orders (EABL, KWAL, etc.), advise on high-margin products, and search regulatory or market intelligence in Nairobi. How can I assist you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAIChatOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isAIChatOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isAIChatOpen) return null;

  // Build real-time store snapshot for context
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySales = sales
    .filter((s) => s.date.slice(0, 10) === todayStr && s.status !== 'refunded')
    .reduce((sum, s) => sum + s.totalAmount, 0);

  const contextInfo = {
    business: 'Osutua Wines and Spirits',
    location: 'Ngong Road, Nairobi, Kenya',
    todaySalesTotalKES: todaySales,
    totalProductsCatalogued: products.length,
    activeLowStockCount: lowStockAlerts.length,
    criticalItems: lowStockAlerts.slice(0, 6).map((a) => ({
      name: a.productName,
      sku: a.sku,
      currentStock: a.currentStock,
      minStock: a.minStockLevel,
      suggestedReorder: a.suggestedReorder,
      supplier: a.supplierName,
    })),
    suppliers: suppliers.map((s) => ({ name: s.name, contact: s.phone })),
    vatRate: `${settings.vatRate}%`,
  };

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || input).trim();
    if (!prompt || loading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({
            role: m.role,
            content: m.text,
          })),
          contextInfo,
        }),
      });

      const data = await response.json();
      if (response.ok && data.reply) {
        const modelMsg: ChatMessage = {
          id: `mod_${Date.now()}`,
          role: 'model',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: data.sources || [],
        };
        setMessages((prev) => [...prev, modelMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: `err_${Date.now()}`,
          role: 'model',
          text: `Error processing request: ${data.error || 'Unable to connect to AI engine'}. Please try again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'model',
          text: `Network failure connecting to Gemini AI assistant: ${err.message || 'Check dev server'}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={() => setIsAIChatOpen(false)}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-out Drawer */}
      <aside className="relative w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full z-10">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Osutua AI Co-Pilot</span>
                <span className="text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Real-time stock intelligence &amp; Google Search grounding
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAIChatOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Context Banner */}
        <div className="px-5 py-2.5 bg-amber-500/5 dark:bg-amber-950/20 border-b border-amber-500/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>
              <strong>{lowStockAlerts.length}</strong> items below threshold
            </span>
          </div>
          <div className="text-slate-500 dark:text-slate-400 font-mono-numbers text-[11px]">
            Today's Sales: KES {todaySales.toLocaleString()}
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-amber-600 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {isUser ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`max-w-[82%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-amber-600 text-white rounded-tr-xs'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 rounded-tl-xs whitespace-pre-wrap'
                  }`}
                >
                  <div>{m.text}</div>

                  {/* Grounded Web Sources */}
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/80 space-y-1.5">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <ExternalLink className="w-2.5 h-2.5" /> Grounded Search Sources:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {m.sources.map((src, idx) => (
                          <a
                            key={idx}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] text-amber-600 dark:text-amber-400 hover:underline max-w-[200px] truncate"
                          >
                            <span className="truncate">{src.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div
                    className={`text-[9px] mt-1 text-right ${
                      isUser ? 'text-amber-200' : 'text-slate-400'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-amber-600 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-2xl rounded-tl-xs text-xs text-slate-500 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                <span>Analyzing store stock and generating advice...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggested Action Chips */}
        <div className="px-5 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
          <button
            onClick={() => handleSendMessage('Which items urgently need restocking right now?')}
            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 text-slate-600 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700 whitespace-nowrap transition flex items-center gap-1"
          >
            <AlertTriangle className="w-3 h-3 text-red-500" />
            <span>Low Stock Reorders</span>
          </button>
          <button
            onClick={() => handleSendMessage('Draft a recommended Purchase Order for EABL (East African Breweries).')}
            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 text-slate-600 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700 whitespace-nowrap transition flex items-center gap-1"
          >
            <FileText className="w-3 h-3 text-amber-500" />
            <span>Draft EABL PO</span>
          </button>
          <button
            onClick={() => handleSendMessage('Suggest high-margin red and white wines for Nairobi clientele.')}
            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 text-slate-600 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700 whitespace-nowrap transition flex items-center gap-1"
          >
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span>Wine Margins</span>
          </button>
        </div>

        {/* Prompt Input Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask AI about stock levels, reorders, cocktails, KRA rules..."
              className="flex-1 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500"
              disabled={loading}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || loading}
              className="p-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-xl shadow-xs transition"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 text-center">
            Grounded with Google Search • Real-time Osutua till analytics
          </p>
        </div>
      </aside>
    </div>
  );
};
