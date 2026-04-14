import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BadgePercent,
  Building2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Heart,
  MapPin,
  Menu,
  Mic,
  MicOff,
  MessageCircle,
  Moon,
  Phone,
  Search,
  ShieldCheck,
  ShoppingCart,
  Stethoscope,
  Sun,
  Truck,
  Upload,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLandingCart } from '../context/LandingCartContext.jsx';
import {
  AGE_BUCKETS_M,
  AGE_BUCKETS_W,
  BLOG_POSTS,
  CAROUSEL_SLIDES,
  CENTRES,
  LIFESTYLE_PACKAGES,
  MOST_BOOKED_TESTS,
  ORGAN_TESTS,
  RECOMMENDED_PACKAGES,
  STATS,
  STEPS,
  TESTIMONIALS,
  WOMEN_PACKAGES,
} from '../data/landingContent.js';
import { api } from '../api/client.js';

const NAV_LINKS = [
  { label: 'Health risks', href: '#lifestyle' },
  { label: 'Health conditions', href: '#organs' },
  { label: 'Packages', href: '#packages' },
  { label: 'Tests', href: '#tests' },
  { label: 'Centres', href: '#centres' },
  { label: 'Blogs', href: '#blogs' },
];

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function formatInr(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    n
  );
}

export function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'lab') {
      navigate('/lab', { replace: true });
    }
  }, [user, navigate]);
  const { items, addItem, removeItem, clear, count, total } = useLandingCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [slide, setSlide] = useState(0);
  const [toast, setToast] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [testimonial, setTestimonial] = useState(0);
  const [headerSolid, setHeaderSolid] = useState(false);
  const [theme, setTheme] = useState(() => 
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
  const fileRef = useRef(null);

  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const voiceRecRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const sp = window.SpeechRecognition || window.webkitSpeechRecognition;
      voiceRecRef.current = new sp();
      voiceRecRef.current.continuous = false;
      voiceRecRef.current.interimResults = false;
      voiceRecRef.current.lang = 'en-IN';
      
      voiceRecRef.current.onresult = async (e) => {
        setIsVoiceActive(false);
        const text = e.results[0][0].transcript.toLowerCase();
        
        let reply = "Hello! I am your AI Health Assistant. Please login or book a test for more precision.";
        let speakOut = true;

        if (text.includes("book") || text.includes("test") || text.includes("packages")) {
          reply = "I am scrolling down to the packages section where you can book a test securely.";
          setTimeout(() => scrollToId('packages'), 1500);
        } else if (text.includes("blood") || text.includes("report") || text.includes("results")) {
          reply = "Please log in to upload your medical documents securely.";
        } else if (text.includes("center") || text.includes("centre") || text.includes("map")) {
          reply = "Opening the diagnostic centres map for you.";
          setTimeout(() => setShowMap(true), 1500);
        } else {
          speakOut = false;
          setToast("Thinking...");
          try {
            const data = await api('/chat/public', {
              method: 'POST',
              body: JSON.stringify({ message: text }),
            });
            reply = data.reply;
          } catch (err) {
            reply = "I'm having trouble connecting to my AI network right now.";
          }
          if ('speechSynthesis' in window) {
             window.speechSynthesis.cancel();
             const u = new SpeechSynthesisUtterance(reply);
             u.lang = 'en-IN';
             window.speechSynthesis.speak(u);
             setToast("🗣 " + (reply.length > 50 ? reply.substring(0, 50) + "..." : reply));
          }
        }
        
        if (speakOut && 'speechSynthesis' in window) {
           window.speechSynthesis.cancel();
           const u = new SpeechSynthesisUtterance(reply);
           u.lang = 'en-IN';
           window.speechSynthesis.speak(u);
           setToast("🗣 " + reply);
        }
      };
      voiceRecRef.current.onerror = () => setIsVoiceActive(false);
      voiceRecRef.current.onend = () => setIsVoiceActive(false);
    }
  }, []);

  const handleGlobalVoice = () => {
    if (isVoiceActive) {
      voiceRecRef.current?.stop();
      setIsVoiceActive(false);
    } else {
      if (!voiceRecRef.current) return setToast("Voice recognition not supported directly here.");
      voiceRecRef.current.start();
      setIsVoiceActive(true);
      setToast("Listening... ask me anything.");
    }
  };

  useEffect(() => {
    const onScroll = () => setHeaderSolid(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % CAROUSEL_SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = useCallback((msg) => setToast(msg), []);

  const onPrescription = () => fileRef.current?.click();

  const onFile = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) {
      showToast(`“${f.name}” received. Create an account to complete booking & track reports.`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] dark:bg-slate-900 text-slate-900 dark:text-slate-200 transition-colors duration-300">
      <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={onFile} />

      {/* Map Modal */}
      <AnimatePresence>
        {showMap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
            onClick={() => setShowMap(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 shadow-2xl border border-transparent dark:border-slate-800/60"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-primary" />
                  Nearest Diagnostic Centres
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMap(false)}
                  className="rounded-full bg-slate-100 dark:bg-slate-800 p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-2 h-[40vh] md:h-[350px] w-full bg-slate-50 dark:bg-slate-900">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15224.9961803704!2d78.3842145!3d17.4477815!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb9158cbed7401%3A0xeab5edcfd91129b0!2sApollo%20Hospitals%20Jubilee%20Hills!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin" 
                  width="100%" 
                  height="100%" 
                  style={{border: 0, borderRadius: '1.5rem'}} 
                  allowFullScreen="" 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <p className="text-sm font-bold text-slate-900 dark:text-white">Suggested Nearest Centres (Based on generic IP location)</p>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[150px] overflow-y-auto pr-2">
                  <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">1. Jubilee Hills Main Centre</p>
                    <p className="text-xs text-slate-500 mt-1">Road No 92, Jubilee Hills, Hyderabad (1.2 km away)</p>
                  </div>
                  <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">2. Madhapur Processing Unit</p>
                    <p className="text-xs text-slate-500 mt-1">Hitech City Road, Madhapur, Hyderabad (3.5 km away)</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top utility bar — apollo-style */}
      <div className="bg-slate-900 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs sm:text-sm">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 hover:text-primary-light transition"
            onClick={() => setShowMap(true)}
          >
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Set location</span>
            <span className="sm:hidden">Location</span>
          </button>
          <div className="flex flex-wrap items-center gap-3 text-white/90">
            <span className="inline-flex items-center gap-1">
              <Truck className="h-3.5 w-3.5" />
              Home collection
            </span>
            <a href="tel:+918885195185" className="inline-flex items-center gap-1 font-semibold hover:text-white transition">
              <Phone className="h-3.5 w-3.5" />
              8885195185
            </a>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header
        className={`sticky top-0 z-50 transition-all ${
          headerSolid ? 'bg-white/95 dark:bg-slate-900/95 shadow-md backdrop-blur-md' : 'bg-white dark:bg-slate-900 border-b border-transparent dark:border-slate-800'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:py-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-primary shrink-0">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-md">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <span className="text-lg leading-tight text-slate-900 dark:text-white">
              Transparent
              <span className="block text-xs font-normal text-muted dark:text-slate-400">Diagnostics</span>
            </span>
          </Link>
          <div className="relative hidden md:flex flex-1 max-w-2xl mx-auto px-4 justify-center">
            <button
               onClick={handleGlobalVoice}
               className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold shadow-md transition-all ${
                 isVoiceActive 
                  ? 'bg-red-50 text-red-600 ring-2 ring-red-400 dark:bg-red-900/40 dark:text-red-400 animate-pulse' 
                  : 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-100 hover:ring-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300 dark:ring-indigo-700'
               }`}
            >
              {isVoiceActive ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              {isVoiceActive ? "Listening..." : "Voice Assistant"}
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => scrollToId('packages')}
              className="hidden rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-primary-dark sm:inline-block transition-transform hover:scale-[1.02]"
            >
              Book a test
            </button>
            <button
              onClick={() => setShowMap(true)}
              className="hidden rounded-full border-2 border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 lg:inline-block transition-all shadow-sm"
            >
              Find centre
            </button>
            <Link
              to={user ? (user.role === 'lab' ? '/lab/reports' : '/patient/reports') : '/login'}
              className="hidden rounded-full border-2 border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-900/30 px-4 py-2.5 text-sm font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-300 dark:hover:border-blue-700 md:inline-flex items-center gap-1.5 transition-all shadow-sm"
            >
              <FileText className="h-4 w-4" /> Download report
            </Link>
            <button
               onClick={() => {
                  const next = theme === 'light' ? 'dark' : 'light';
                  setTheme(next);
                  document.documentElement.classList.toggle('dark', next === 'dark');
                  localStorage.setItem('theme', next);
               }}
               className="relative rounded-full border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition"
               aria-label="Toggle Theme"
            >
               {theme === 'light' ? (
                 <Moon className="h-4 w-4" />
               ) : (
                 <Sun className="h-4 w-4 text-yellow-300" />
               )}
            </button>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative rounded-full border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-200 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              aria-label="Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-md">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </button>
            {user ? (
              <Link
                to={user.role === 'lab' ? '/lab' : '/patient'}
                className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-slate-800 transition-transform hover:scale-[1.02]"
              >
                Dashboard
              </Link>
            ) : (
              <Link to="/login" className="hidden rounded-full px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 sm:inline hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                Sign in
              </Link>
            )}
            <button
              type="button"
              className="rounded-lg p-2 text-slate-700 dark:text-slate-300 lg:hidden hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Secondary Navigation Row - Horizontal list below main header */}
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/95 backdrop-blur-sm hidden md:block transition-colors">
          <nav className="mx-auto flex max-w-7xl items-center gap-8 px-4 py-2.5 overflow-x-auto no-scrollbar">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="whitespace-nowrap rounded-lg px-3 py-1 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-800 dark:hover:text-white transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  if (l.label === 'Centres') {
                    setShowMap(true);
                  } else {
                    scrollToId(l.href.replace('#', ''));
                  }
                }}
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Mobile menu drop-down */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-4 lg:hidden shadow-inner overflow-hidden transition-colors"
            >
              <div className="grid grid-cols-2 gap-2 mb-4">
                {NAV_LINKS.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-center text-sm font-bold text-slate-800 dark:text-slate-200 shadow-sm active:bg-slate-100 dark:active:bg-slate-700 transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      setMobileOpen(false);
                      if (l.label === 'Centres') {
                        setShowMap(true);
                      } else {
                        scrollToId(l.href.replace('#', ''));
                      }
                    }}
                  >
                    {l.label}
                  </a>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => { setMobileOpen(false); scrollToId('packages'); }} 
                  className="rounded-xl bg-primary py-3 text-center text-sm font-bold text-white shadow-md"
                >
                  Book a test
                </button>
                <Link to="/patient/reports" className="rounded-xl border-2 border-blue-200 dark:border-blue-800/60 bg-white dark:bg-slate-800 py-3 text-center text-sm font-bold text-blue-700 dark:text-blue-400">
                  Download report
                </Link>
                <button onClick={() => { setMobileOpen(false); setShowMap(true); }} className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-3 text-center text-sm font-bold text-slate-800 dark:text-slate-200">
                  View Map & Centres
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero carousel */}
      <section className="relative mx-auto max-w-7xl px-4 pt-4">
        <div className="relative overflow-hidden rounded-3xl shadow-card">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className={`bg-gradient-to-br ${CAROUSEL_SLIDES[slide].gradient} px-8 py-14 text-white md:py-20`}
            >
              <div className="mx-auto max-w-2xl text-center">
                <p className="text-sm font-medium text-white/90">AI-powered transparent diagnostics</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{CAROUSEL_SLIDES[slide].title}</h1>
                <p className="mt-3 text-base text-white/90 md:text-lg">{CAROUSEL_SLIDES[slide].subtitle}</p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => scrollToId('packages')}
                    className="rounded-full bg-white px-6 py-3 text-sm font-bold text-primary shadow-lg hover:bg-slate-50"
                  >
                    Book home collection
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToId('packages')}
                    className="rounded-full border-2 border-white/80 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
                  >
                    View packages
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          <button
            type="button"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/25 p-2 text-white backdrop-blur hover:bg-black/40"
            onClick={() => setSlide((s) => (s - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length)}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/25 p-2 text-white backdrop-blur hover:bg-black/40"
            onClick={() => setSlide((s) => (s + 1) % CAROUSEL_SLIDES.length)}
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {CAROUSEL_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === slide ? 'w-8 bg-white' : 'w-2 bg-white/50'}`}
                onClick={() => setSlide(i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Need help */}
      <section className="mx-auto mt-6 max-w-7xl px-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm md:p-6 transition-colors">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Need help?</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button
              type="button"
              onClick={onPrescription}
              className="flex items-start gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 text-left transition hover:border-primary/30 dark:hover:border-primary/50 hover:bg-white dark:hover:bg-slate-800"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400">
                <Upload className="h-5 w-5" />
              </span>
              <span>
                <span className="font-semibold text-slate-900 dark:text-white">Have a prescription?</span>
                <span className="mt-0.5 block text-sm text-muted dark:text-slate-400">Upload and book your tests</span>
              </span>
            </button>
            <a
              href="tel:+918885195185"
              className="flex items-start gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 transition hover:border-primary/30 dark:hover:border-primary/50 hover:bg-white dark:hover:bg-slate-800"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                <Phone className="h-5 w-5" />
              </span>
              <span>
                <span className="font-semibold text-slate-900 dark:text-white">Call us to book</span>
                <span className="mt-0.5 block text-sm text-muted dark:text-slate-400">8885195185</span>
              </span>
            </a>
            <a
               href="tel:8885195185"
               className="flex items-start gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 text-left transition hover:border-primary/30 dark:hover:border-primary/50 hover:bg-white dark:hover:bg-slate-800"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400">
                <Stethoscope className="h-5 w-5" />
              </span>
              <span>
                <span className="font-semibold text-slate-900 dark:text-white">Expert guidance</span>
                <span className="mt-0.5 block text-sm text-muted dark:text-slate-400">Our doctor will call you shortly</span>
              </span>
            </a>
            <a
              href="https://api.whatsapp.com/send?phone=918885195185&text=Hi%2C%20I%27d%20like%20to%20book%20a%20test"
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 transition hover:border-primary/30 dark:hover:border-primary/50 hover:bg-white dark:hover:bg-slate-800"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                <MessageCircle className="h-5 w-5" />
              </span>
              <span>
                <span className="font-semibold text-slate-900 dark:text-white">WhatsApp booking</span>
                <span className="mt-0.5 block text-sm text-muted dark:text-slate-400">Message us to schedule collection</span>
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* Recommended packages */}
      <section id="packages" className="mx-auto mt-12 max-w-7xl scroll-mt-28 px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Packages</p>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Recommended packages</h2>
          </div>
          
          <div className="relative flex-1 max-w-md w-full">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="search"
              placeholder="Search tests and health profiles..."
              className="w-full rounded-full border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-sm focus:bg-white dark:focus:bg-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  showToast('Sign in to search the full catalog. Browse sections below for now.');
                }
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => scrollToId('tests')}
            className="hidden text-sm font-semibold text-primary hover:underline sm:inline-flex sm:items-center sm:gap-1 whitespace-nowrap"
          >
            View all <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {RECOMMENDED_PACKAGES.map((p, i) => (
            <motion.article
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
              className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm transition hover:shadow-md dark:hover:border-slate-500"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold leading-snug text-slate-900 dark:text-white">{p.name}</h3>
                <span className="shrink-0 rounded bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800">
                  Safe
                </span>
              </div>
              <p className="mt-2 text-xs text-muted dark:text-slate-400">{p.tag}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{p.report}</p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-xl font-bold text-slate-900 dark:text-white">{formatInr(p.price)}</span>
                <span className="text-sm text-muted dark:text-slate-500 line-through">{formatInr(p.was)}</span>
                <span className="text-xs font-semibold text-red-600 dark:text-red-400">{p.off}% off</span>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setDetailItem({ type: 'package', ...p })}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  View details
                </button>
                <button
                  type="button"
                  onClick={() => {
                    addItem({ id: p.id, name: p.name, price: p.price, kind: 'package' });
                    showToast(`${p.name} added to cart`);
                  }}
                  className="flex-1 rounded-xl bg-primary py-2 text-sm font-semibold text-white hover:bg-primary-dark"
                >
                  Add to cart
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Lifestyle */}
      <section id="lifestyle" className="mx-auto mt-14 max-w-7xl scroll-mt-28 px-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Packages</p>
            <h2 className="text-2xl font-bold text-slate-900">Lifestyle packages</h2>
          </div>
          <Link to="/register" className="text-sm font-semibold text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {LIFESTYLE_PACKAGES.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => {
                addItem({ id: `life-${x.id}`, name: `${x.label} Profile`, price: 1499, kind: 'package' });
                showToast(`${x.label} screening profile added to cart!`);
              }}
              className="flex min-w-[140px] flex-col items-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-center shadow-sm hover:border-primary/40 dark:hover:border-primary/60 transition-colors"
            >
              <span className="text-3xl">{x.emoji}</span>
              <span className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">{x.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Personalized banner */}
      <section className="mx-auto mt-12 max-w-7xl px-4">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-primary-dark px-8 py-10 text-white">
          <p className="text-xs font-bold uppercase tracking-wider text-white/70">Packages</p>
          <h2 className="mt-2 text-2xl font-bold md:text-3xl">Personalized health checkup</h2>
          <p className="mt-2 max-w-xl text-sm text-white/85">
            Tell us age, gender, and goals — we suggest panels aligned with common clinical practice. Always confirm with
            your doctor.
          </p>
          <Link
            to="/register"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-primary"
          >
            Build my package <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Men's / Women's */}
      <section className="mx-auto mt-14 max-w-7xl px-4">
        <div className="grid gap-10 lg:grid-cols-2">
          <div id="mens">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Men&apos;s health</h2>
              <Link to="/register" className="text-sm font-semibold text-primary">
                View all
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {AGE_BUCKETS_M.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    addItem({ id: `mens-${b.id}`, name: `Men’s Screening: ${b.label}`, price: 2999, kind: 'package' });
                    showToast(`Men's ${b.label} screening added to cart.`);
                  }}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-200 p-4 text-center text-sm font-semibold shadow-sm hover:border-primary/40 transition-colors"
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
          <div id="womens">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Women&apos;s health</h2>
              <Link to="/register" className="text-sm font-semibold text-primary">
                View all
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {AGE_BUCKETS_W.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    addItem({ id: `womens-${b.id}`, name: `Women’s Screening: ${b.label}`, price: 2999, kind: 'package' });
                    showToast(`Women's ${b.label} screening added to cart.`);
                  }}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-200 p-4 text-center text-sm font-semibold shadow-sm hover:border-primary/40 transition-colors"
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Most booked tests */}
      <section id="tests" className="mx-auto mt-14 max-w-7xl scroll-mt-28 px-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Tests</p>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Most booked tests</h2>
          </div>
          <Link to="/register" className="text-sm font-semibold text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MOST_BOOKED_TESTS.map((t, i) => (
            <motion.article
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 6) * 0.03 }}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t.name}</h3>
                <span className="shrink-0 text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">Safe</span>
              </div>
              <p className="mt-1 text-xs text-muted dark:text-slate-400">{t.tag}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">Report — {t.delivery}</p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-lg font-bold dark:text-white">{formatInr(t.price)}</span>
                <span className="text-sm text-muted dark:text-slate-500 line-through">{formatInr(t.was)}</span>
                <BadgePercent className="h-4 w-4 text-red-500" />
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setDetailItem({ type: 'test', ...t })}
                  className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-semibold hover:bg-slate-50"
                >
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => {
                    addItem({ id: t.id, name: t.name, price: t.price, kind: 'test' });
                    showToast(`${t.name} added to cart`);
                  }}
                  className="flex-1 rounded-xl bg-primary py-2 text-xs font-semibold text-white hover:bg-primary-dark"
                >
                  Add to cart
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Organs */}
      <section id="organs" className="mx-auto mt-14 max-w-7xl scroll-mt-28 px-4">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Tests</p>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Tests by body organs</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {ORGAN_TESTS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => {
                addItem({ id: `organ-${o.id}`, name: `${o.label} Intensive Panel`, price: 999, kind: 'test' });
                showToast(`${o.label} intensive panel added to cart.`);
              }}
              className="flex flex-col items-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm hover:border-primary/40 dark:hover:border-primary/60 transition-colors"
            >
              <span className="text-4xl">{o.emoji}</span>
              <span className="mt-2 text-sm font-semibold dark:text-slate-200">{o.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Women packages */}
      <section className="mx-auto mt-14 max-w-7xl px-4">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Packages</p>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Women health packages</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {WOMEN_PACKAGES.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => {
                addItem({ id: `wp-${w.id}`, name: `Women's Check: ${w.label}`, price: 1899, kind: 'package' });
                showToast(`Women's ${w.label} package added to cart.`);
              }}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 text-center text-sm font-bold dark:text-slate-200 shadow-sm hover:border-primary/40 dark:hover:border-primary/60 transition-colors"
            >
              {w.label}
            </button>
          ))}
        </div>
      </section>

      {/* Tax saver — reuse packages */}
      <section className="mx-auto mt-14 max-w-7xl px-4">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Tax packages</p>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Tax saver packages</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RECOMMENDED_PACKAGES.slice(0, 3).map((p) => (
            <div key={`tax-${p.id}`} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm transition-colors">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">{p.name}</h3>
              <p className="mt-2 text-sm text-muted dark:text-slate-400">Eligible under employer preventive benefit (where applicable).</p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => addItem({ id: `tax-${p.id}`, name: p.name, price: p.price, kind: 'package' })}
                  className="flex-1 rounded-xl bg-slate-900 py-2 text-sm font-semibold text-white"
                >
                  Add
                </button>
                <Link to="/register" className="flex-1 rounded-xl border border-slate-200 py-2 text-center text-sm font-semibold">
                  Enquire
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto mt-16 max-w-7xl px-4">
        <h2 className="text-center text-2xl font-bold text-slate-900">Why choose Transparent Diagnostics?</h2>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 text-center shadow-sm transition-colors"
            >
              <p className="text-2xl font-black text-primary md:text-3xl">{s.value}</p>
              <p className="mt-2 text-xs text-muted dark:text-slate-400 md:text-sm">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3 steps */}
      <section className="mx-auto mt-16 max-w-7xl px-4">
        <p className="text-center text-xs font-bold uppercase tracking-wider text-primary">Our process</p>
        <h2 className="text-center text-2xl font-bold text-slate-900">Easy ordering in 3 steps</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 text-center shadow-sm transition-colors">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 font-bold text-slate-900 dark:text-white">{step.title}</h3>
              <p className="mt-2 text-sm text-muted dark:text-slate-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto mt-16 max-w-7xl px-4">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 shadow-sm md:p-12 transition-colors">
          <div className="mx-auto max-w-3xl text-center">
            <Heart className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Experience at Transparent Diagnostics</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300 md:text-base">
              Reliable diagnostics depend on quality systems: standardized protocols, trained phlebotomists, and
              traceability from sample to report. Our platform surfaces{' '}
              <strong className="text-slate-800">accreditation, ratings, and verified report IDs</strong> so you know what
              you are looking at — similar in spirit to how leading networks publish{' '}
              <a
                href="https://apollodiagnostics.in/"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                Apollo Diagnostics
              </a>{' '}
              style transparency around scale and quality — implemented here for your own lab and patients.
            </p>
          </div>
        </div>
      </section>

      {/* Blogs */}
      <section id="blogs" className="mx-auto mt-16 max-w-7xl scroll-mt-28 px-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Blogs</p>
            <h2 className="text-2xl font-bold text-slate-900">Blogs corner</h2>
          </div>
          <button
            type="button"
            onClick={() => showToast('Full blog CMS coming soon — content is illustrative.')}
            className="text-sm font-semibold text-primary hover:underline"
          >
            View all
          </button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {BLOG_POSTS.map((b) => (
            <article key={b.id} className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm transition-colors">
              <p className="text-xs text-muted dark:text-slate-400">{b.read}</p>
              <h3 className="mt-2 font-bold text-slate-900 dark:text-white">{b.title}</h3>
              <p className="mt-2 flex-1 text-sm text-muted dark:text-slate-400">{b.excerpt}</p>
              <button
                type="button"
                onClick={() => showToast('Article page placeholder — not medical advice.')}
                className="mt-4 text-sm font-semibold text-primary"
              >
                Read more
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto mt-16 max-w-7xl px-4">
        <h2 className="text-center text-2xl font-bold text-slate-900">What people say</h2>
        <div className="relative mx-auto mt-8 max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={testimonial}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center shadow-sm transition-colors"
            >
              <p className="text-lg text-slate-700 dark:text-slate-300">&ldquo;{TESTIMONIALS[testimonial].quote}&rdquo;</p>
              <footer className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">
                {TESTIMONIALS[testimonial].name}
                <span className="font-normal text-muted dark:text-slate-400"> — {TESTIMONIALS[testimonial].city}</span>
              </footer>
            </motion.blockquote>
          </AnimatePresence>
          <div className="mt-4 flex justify-center gap-2">
            <button
              type="button"
              className="rounded-full border border-slate-200 p-2"
              onClick={() => setTestimonial((t) => (t - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-200 p-2"
              onClick={() => setTestimonial((t) => (t + 1) % TESTIMONIALS.length)}
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Centres */}
      <section id="centres" className="mx-auto mt-16 max-w-7xl scroll-mt-28 px-4 pb-8">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Find nearest centre</h2>
        </div>
        <p className="mt-2 text-sm text-muted dark:text-slate-400">
          Representative cities — connect your lab network in the dashboard to show real locations.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {CENTRES.map((c) => (
            <Link
              key={c}
              to="/register"
              className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm hover:border-primary/40 dark:hover:border-primary/60 hover:text-primary transition-colors"
            >
              {c}
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 font-bold text-primary">
              <ShieldCheck className="h-8 w-8" />
              Transparent Diagnostics
            </div>
            <p className="mt-3 text-sm text-muted">
              AI-powered transparency: sample tracking, verified reports, plain-language help. Not a substitute for
              professional care.
            </p>
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white">Quick links</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <Link to="/" className="hover:text-primary">
                  Home
                </Link>
              </li>
              <li>
                <button type="button" className="hover:text-primary" onClick={() => scrollToId('packages')}>
                  Book a test
                </button>
              </li>
              <li>
                <Link to="/login" className="hover:text-primary">
                  Download report
                </Link>
              </li>
              <li>
                <button type="button" className="hover:text-primary" onClick={() => scrollToId('blogs')}>
                  Blogs
                </button>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white">For labs</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <Link to="/register" className="hover:text-primary">
                  Register lab account
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-primary">
                  Lab sign in
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-bold text-slate-900">Contact</p>
            <p className="mt-3 text-sm text-muted">
              Bulk bookings:{' '}
              <a href="mailto:care@transparentdiagnostics.example" className="text-primary hover:underline">
                care@transparentdiagnostics.example
              </a>
            </p>
            <p className="mt-2 text-sm text-muted">
              Phone:{' '}
              <a href="tel:+914044442424" className="text-primary hover:underline">
                040-4444-2424
              </a>
            </p>
          </div>
        </div>
        <div className="border-t border-slate-100 dark:border-slate-800 py-4 text-center text-xs text-muted dark:text-slate-500 transition-colors">
          © {new Date().getFullYear()} Transparent Diagnostic System — educational / demo layout inspired by public
          diagnostic portals.
        </div>
      </footer>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-6 left-1/2 z-[60] max-w-md -translate-x-1/2 rounded-2xl bg-slate-900 px-5 py-3 text-center text-sm text-white shadow-xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Package / test detail modal */}
      <AnimatePresence>
        {detailItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 sm:items-center"
            role="dialog"
            aria-modal="true"
            onClick={() => setDetailItem(null)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-bold text-slate-900">{detailItem.name}</h3>
                <button type="button" className="rounded-lg p-1 hover:bg-slate-100" onClick={() => setDetailItem(null)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-2 text-sm text-muted">
                {detailItem.type === 'package'
                  ? 'Includes physician-reviewed panels, home collection where available, and digital report with verification ID in our app.'
                  : 'Individual test with standardized processing. Report turnaround varies by assay.'}
              </p>
              <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-slate-700">
                <li>Home collection slots subject to availability</li>
                <li>Fasting rules communicated at booking</li>
                <li>Track sample status after patient sign-in</li>
              </ul>
              {'price' in detailItem && detailItem.price != null && (
                <p className="mt-4 text-xl font-bold text-slate-900">{formatInr(detailItem.price)}</p>
              )}
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    addItem({
                      id: detailItem.id,
                      name: detailItem.name,
                      price: detailItem.price,
                      kind: detailItem.type,
                    });
                    showToast('Added to cart');
                    setDetailItem(null);
                  }}
                  className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white"
                >
                  Add to cart
                </button>
                <Link
                  to="/register"
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-center text-sm font-semibold"
                  onClick={() => setDetailItem(null)}
                >
                  Book now
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart drawer */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[65] bg-black/30"
            onClick={() => setCartOpen(false)}
          >
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
                <h2 className="text-lg font-bold">Your cart</h2>
                <button type="button" onClick={() => setCartOpen(false)} className="rounded-lg p-2 hover:bg-slate-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {items.length === 0 ? (
                  <p className="text-sm text-muted">Cart is empty. Add packages or tests from above.</p>
                ) : (
                  <ul className="space-y-3">
                    {items.map((it) => (
                      <li key={it.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{it.name}</p>
                          <p className="text-xs text-muted capitalize">{it.kind}</p>
                          <p className="text-sm font-bold text-primary">{formatInr(it.price)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(it.id)}
                          className="text-xs font-semibold text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="border-t border-slate-100 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Estimated</span>
                  <span className="font-bold">{formatInr(total)}</span>
                </div>
                <Link
                  to="/register"
                  onClick={() => setCartOpen(false)}
                  className="mt-4 block w-full rounded-xl bg-primary py-3 text-center text-sm font-bold text-white"
                >
                  Proceed to checkout
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    clear();
                    showToast('Cart cleared');
                  }}
                  className="mt-2 w-full text-center text-sm text-muted hover:text-slate-900"
                >
                  Clear cart
                </button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
