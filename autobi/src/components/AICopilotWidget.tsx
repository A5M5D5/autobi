import React, { useState, useRef, useEffect } from 'react';
import { Language, UserRole } from '../types';
import { translations } from '../lib/translations';
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  Minimize2,
} from 'lucide-react';

interface AICopilotWidgetProps {
  lang: Language;
  role: UserRole;
  initialQuery?: string;
  onClearInitialQuery?: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AICopilotWidget: React.FC<AICopilotWidgetProps> = ({
  lang,
  role,
  initialQuery,
  onClearInitialQuery,
}) => {
  const t = translations[lang];

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: t.assistantWelcome,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === 'assistant') {
        return [{ ...prev[0], content: t.assistantWelcome }];
      }
      return prev;
    });
  }, [lang, t.assistantWelcome]);

  useEffect(() => {
    if (!initialQuery) return;
    setIsOpen(true);
    const timer = window.setTimeout(() => {
      if (!loading) void handleSendMessage(initialQuery);
      if (onClearInitialQuery) onClearInitialQuery();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        const fallbackMessage =
          res.status === 401
            ? t.sessionExpired
            : res.status === 503
            ? t.assistantFailed
            : data.error || t.assistantFailed;
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: fallbackMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: t.assistantFailed,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [t.q1, t.q2, t.q3, t.q4];

  return (
    <div className="no-print">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 rtl:right-auto rtl:left-5 z-[60] flex items-center gap-2 px-3.5 py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-full shadow-xl border border-slate-700/80 transition-all"
        >
          <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold">{t.copilotTitle}</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-5 right-5 rtl:right-auto rtl:left-5 z-[60] w-[95vw] sm:w-[410px] h-[540px] bg-white rounded-xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden">
          <div className="p-4 bg-[#0F172A] text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-300 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">{t.copilotTitle}</h3>
                <div className="text-[11px] text-slate-400">{t.copilotSubtitle}</div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label={t.close}
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          {role === 'Employee' && (
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-[11px] text-amber-800">
              {t.assistantRoleNotice}
            </div>
          )}

          <div className="p-2.5 bg-slate-50 border-b border-slate-200 overflow-x-auto flex gap-1.5 no-scrollbar">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                disabled={loading}
                onClick={() => handleSendMessage(q)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
            {messages.map((m, index) => {
              const isAssistant = m.role === 'assistant';
              return (
                <div
                  key={index}
                  className={`flex gap-2.5 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  {isAssistant && (
                    <div className="w-7 h-7 rounded-lg bg-[#0F172A] text-blue-300 flex items-center justify-center shrink-0 text-xs">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      isAssistant
                        ? 'bg-white text-slate-800 border border-slate-200/90 shadow-2xs'
                        : 'bg-[#2563EB] text-white rounded-br-sm rtl:rounded-br-2xl rtl:rounded-bl-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>
                    <div
                      className={`text-[9px] mt-1.5 font-mono ${
                        isAssistant ? 'text-slate-400 text-right' : 'text-slate-300 text-right'
                      }`}
                    >
                      {m.timestamp}
                    </div>
                  </div>

                  {!isAssistant && (
                    <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 text-xs font-bold">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>{t.assistantQuerying}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder={t.askPlaceholder}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2.5 rounded-lg bg-[#2563EB] text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
              >
                <Send className="w-4 h-4 rtl:rotate-180" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
