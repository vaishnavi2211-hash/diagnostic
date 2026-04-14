import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Lock, Search, Send, Sparkles, Mic, MicOff } from 'lucide-react';
import { api } from '../../api/client.js';

const SUGGESTED = ["What's my cholesterol?", 'Health tips'];

export function AIHealthBotPanel({ id = 'ai-bot' }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'Your hemoglobin is a bit low. It’s important to eat ',
      linkText: 'iron-rich foods',
      after: '. Have any questions?',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      // 'te-IN' for Telugu, 'hi-IN' for Hindi, but 'en-IN' is safely multi-lingual in India.
      recognition.lang = 'en-IN'; 
      
      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setInput(prev => prev ? prev + ' ' + transcript : transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (!recognitionRef.current) {
        alert("Your browser does not support Voice Recognition.");
        return;
      }
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      window.speechSynthesis.speak(utterance);
    }
  };

  const send = async (text) => {
    const t = (text || input).trim();
    if (!t || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: t }]);
    setLoading(true);
    try {
      const data = await api('/chat', { method: 'POST', body: JSON.stringify({ message: t }) });
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: data.reply },
        { role: 'disclaimer', text: data.disclaimer },
      ]);
      speakText(data.reply);
    } catch {
      const failMsg = 'I could not reach the assistant. Try again in a moment.';
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: failMsg },
      ]);
      speakText(failMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id={id} className="scroll-mt-28">
      <div className="overflow-hidden rounded-3xl border border-white/50 dark:border-slate-700/50 bg-white/35 dark:bg-slate-800/60 shadow-xl backdrop-blur-xl transition-colors">
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <span className="font-bold">AI Health Bot</span>
          </div>
          <div className="flex gap-1">
            <button type="button" className="rounded-lg p-1.5 hover:bg-white/15" aria-label="Privacy">
              <Lock className="h-4 w-4" />
            </button>
            <button type="button" className="rounded-lg p-1.5 hover:bg-white/15" aria-label="Search">
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[280px] space-y-3 overflow-y-auto p-4">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => {
              if (msg.role === 'user') {
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="ml-auto max-w-[92%] rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 px-3 py-2 text-sm text-white shadow-md"
                  >
                    {msg.text}
                  </motion.div>
                );
              }
              if (msg.role === 'disclaimer') {
                return (
                  <p key={i} className="rounded-xl bg-amber-50/90 px-3 py-2 text-[11px] text-amber-900 ring-1 ring-amber-200/80">
                    {msg.text}
                  </p>
                );
              }
              if (msg.role === 'bot' && msg.linkText) {
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mr-auto max-w-[95%] rounded-2xl border border-white/60 dark:border-slate-600 bg-white/70 dark:bg-slate-700/60 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 shadow-sm"
                  >
                    {msg.text}
                    <button type="button" className="font-semibold text-sky-600 hover:underline">
                      {msg.linkText}
                    </button>
                    {msg.after}
                  </motion.div>
                );
              }
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mr-auto max-w-[95%] rounded-2xl border border-white/60 dark:border-slate-600 bg-white/70 dark:bg-slate-700/60 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 shadow-sm"
                >
                  {msg.text}
                </motion.div>
              );
            })}
          </AnimatePresence>
          {loading && <p className="text-xs text-slate-500 dark:text-slate-400">Thinking…</p>}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-white/40 px-3 py-2">
          {SUGGESTED.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-full border border-sky-200/80 bg-sky-50/90 px-3 py-1 text-xs font-semibold text-sky-800 hover:bg-sky-100"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="relative flex items-center gap-2 border-t border-white/40 p-3 pb-6">
          <input
            className="min-w-0 flex-1 rounded-2xl border border-white/50 dark:border-slate-600 bg-white/60 dark:bg-slate-700/50 px-4 py-2.5 pr-12 text-sm outline-none ring-sky-400/30 placeholder:text-slate-400 dark:text-white focus:ring-2"
            placeholder={isListening ? "Listening..." : "Ask about your results…"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button
            type="button"
            onClick={toggleListening}
            className={`absolute right-16 flex h-8 w-8 items-center justify-center rounded-xl transition ${
              isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
            title="Voice Typing"
          >
             {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => send()}
            disabled={loading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-lg disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
          {/* decorative bot peek */}
          <div
            className="pointer-events-none absolute -bottom-1 right-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 text-2xl shadow-lg ring-4 ring-white/80"
            aria-hidden
          >
            🤖
          </div>
        </div>
      </div>
    </div>
  );
}
