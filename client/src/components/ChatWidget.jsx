import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Send, X } from 'lucide-react';
import { useState } from 'react';
import { api } from '../api/client.js';

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hi — ask me to explain lab values in simple words. I am not a doctor; always confirm with your clinician.',
    },
  ]);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text }]);
    setLoading(true);
    try {
      const data = await api('/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text }),
      });
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: data.reply },
        { role: 'disclaimer', text: data.disclaimer },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: 'Sorry, I could not reach the assistant. Please try again shortly.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.button
        type="button"
        layoutId="chat-fab"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary-dark"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        aria-label="Open health assistant chat"
      >
        <MessageCircle className="h-7 w-7" />
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            className="fixed bottom-24 right-6 z-50 flex h-[min(520px,80vh)] w-[min(380px,92vw)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between bg-primary px-4 py-3 text-white">
              <div>
                <p className="text-sm font-semibold">Health assistant</p>
                <p className="text-[11px] opacity-90">Plain-language explanations</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'ml-auto bg-primary text-white'
                      : msg.role === 'disclaimer'
                        ? 'mx-auto max-w-full bg-amber-50 text-amber-900 ring-1 ring-amber-200'
                        : 'mr-auto bg-white text-slate-800 shadow-sm ring-1 ring-slate-100'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              {loading && (
                <p className="text-xs text-muted px-1">Thinking…</p>
              )}
            </div>
            <div className="flex gap-2 border-t border-slate-200 bg-white p-3">
              <input
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="e.g. Is my sugar level high?"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
              />
              <button
                type="button"
                onClick={send}
                disabled={loading}
                className="rounded-xl bg-primary p-2 text-white hover:bg-primary-dark disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
