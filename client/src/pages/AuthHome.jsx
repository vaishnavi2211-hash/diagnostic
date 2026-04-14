import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ShieldCheck, Moon, Sun, ArrowRight, UserPlus, LogIn, User, CircleUserRound, Eye } from 'lucide-react';

export function AuthHome() {
  const { login, register, user } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const from = loc.state?.from?.pathname;
  
  const [isLogin, setIsLogin] = useState(loc.pathname !== '/register');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [labName, setLabName] = useState('');
  const [role, setRole] = useState('patient');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/home', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const validatePassword = (pass) => {
    if (pass.length < 8) return 'Password must be at least 8 characters long.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setBusy(true);
    try {
      if (isLogin) {
        await login(email, password);
        navigate('/home', { replace: true });
      } else {
        const payload = role === 'lab'
          ? { email, password, role, fullName, labName }
          : { email, password, role, fullName };
          
        await register(payload);
        navigate('/home', { replace: true });
      }
    } catch (err) {
      setError(err.data?.error || err.data?.errors?.[0]?.msg || err.message || (isLogin ? 'Login failed. Please check your credentials.' : 'Registration failed. Check details.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`relative min-h-screen flex items-center justify-center overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Animated Waves Background */}
      <div className="ocean">
        <div className={`wave ${theme === 'dark' ? 'wave-dark' : 'wave-light'}`} />
        <div className={`wave ${theme === 'dark' ? 'wave-dark' : 'wave-light'} animation-delay`} />
      </div>

      {/* Theme Toggle Button */}
      <button 
        onClick={toggleTheme}
        className="absolute top-6 right-6 z-50 p-2 rounded-full bg-white/10 backdrop-blur border border-white/20 shadow-lg hover:scale-110 transition-transform"
        aria-label="Toggle Theme"
      >
        {theme === 'light' ? <Moon className="h-5 w-5 text-slate-800" /> : <Sun className="h-5 w-5 text-yellow-300" />}
      </button>

      {/* Login / Signup Container */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: 'spring' }}
        className={`relative z-10 w-full max-w-md p-8 sm:p-10 rounded-[2rem] shadow-2xl backdrop-blur-md border ${theme === 'dark' ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white/80 border-white/50'}`}
      >
        <div className="flex flex-col items-center justify-center mb-6">
          <div className={`p-4 rounded-2xl mb-4 shadow-lg ${theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-primary text-white'}`}>
            <ShieldCheck className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Transparent
          </h1>
          <p className={`text-sm tracking-wide mt-1 uppercase font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Diagnostics
          </p>
        </div>

        {/* Form Toggle */}
        <div className={`flex rounded-xl p-1 mb-6 ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-200/50'}`}>
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${isLogin ? (theme === 'dark' ? 'bg-slate-700 text-white shadow' : 'bg-white text-primary shadow') : (theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')}`}
          >
            <LogIn className="h-4 w-4" /> Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${!isLogin ? (theme === 'dark' ? 'bg-slate-700 text-white shadow' : 'bg-white text-primary shadow') : (theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')}`}
          >
            <UserPlus className="h-4 w-4" /> Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="signup-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <div>
                  <label className={`text-xs font-bold uppercase tracking-wider block mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Who are you?</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('patient')}
                      className={`flex-1 flex flex-col items-center justify-center py-4 rounded-2xl border-2 transition-all ${role === 'patient' ? (theme === 'dark' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-primary bg-primary/10 text-primary') : (theme === 'dark' ? 'border-slate-700 text-slate-400 hover:border-slate-600' : 'border-slate-200 text-slate-500 hover:border-slate-300')}`}
                    >
                      <User className="h-7 w-7 mb-1.5" />
                      <span className="text-sm font-bold">User</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('lab')}
                      className={`flex-1 flex flex-col items-center justify-center py-4 rounded-2xl border-2 transition-all ${role === 'lab' ? (theme === 'dark' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-primary bg-primary/10 text-primary') : (theme === 'dark' ? 'border-slate-700 text-slate-400 hover:border-slate-600' : 'border-slate-200 text-slate-500 hover:border-slate-300')}`}
                    >
                      <CircleUserRound className="h-7 w-7 mb-1.5" />
                      <span className="text-sm font-bold">Lab Partner</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Full Name</label>
                  <input
                    type="text"
                    required={!isLogin}
                    className={`mt-1.5 w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${theme === 'dark' ? 'bg-slate-900/50 border-slate-700 focus:border-blue-500 placeholder-slate-500 text-white' : 'bg-white border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder-slate-400'}`}
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                {role === 'lab' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Laboratory Name</label>
                    <input
                      type="text"
                      required={!isLogin && role === 'lab'}
                      className={`mt-1.5 w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${theme === 'dark' ? 'bg-slate-900/50 border-slate-700 focus:border-blue-500 placeholder-slate-500 text-white' : 'bg-white border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder-slate-400'}`}
                      placeholder="Apollo Diagnostics"
                      value={labName}
                      onChange={(e) => setLabName(e.target.value)}
                    />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Email Address</label>
            <input
              type="email"
              required
              className={`mt-1.5 w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${theme === 'dark' ? 'bg-slate-900/50 border-slate-700 focus:border-blue-500 placeholder-slate-500 text-white' : 'bg-white border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder-slate-400'}`}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="relative">
            <label className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              className={`mt-1.5 w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all pr-10 ${theme === 'dark' ? 'bg-slate-900/50 border-slate-700 focus:border-blue-500 placeholder-slate-500 text-white' : 'bg-white border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder-slate-400'}`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute right-3 top-9 p-1 rounded-md transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
            >
              <Eye className="h-4 w-4" opacity={showPassword ? 0.5 : 1} />
            </button>
            {!isLogin && password.length > 0 && password.length < 8 && (
              <p className="text-[10px] mt-1 text-red-500 font-semibold text-right">Needs 8+ chars</p>
            )}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`p-3 rounded-lg text-sm font-medium ${theme === 'dark' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-600 border border-red-200'}`}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={busy}
            className={`w-full mt-2 flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/25' : 'bg-primary hover:bg-primary-dark shadow-primary/25'} shadow-xl`}
          >
            {busy ? (isLogin ? 'Authenticating...' : 'Creating Account...') : (isLogin ? 'Sign In' : 'Create Account')}
            {!busy && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
