import { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Brain, 
  Compass, 
  Smartphone, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  ArrowRight,
  RefreshCcw,
  Wind,
  X,
  Target,
  Zap,
  Heart,
  Moon,
  Sun,
  Trophy,
  Flame,
  AlertCircle,
  Info,
  Book,
  GraduationCap,
  Pencil,
  Star,
  Mic,
  MicOff
} from 'lucide-react';
import { solveChaos, generateResumeTasks, ZenithActionPlan, CareerResumeTasks } from './services/geminiService';

// --- Constants ---
const SANCTUARY_TASKS = [
  "Turn off the lights and listen to the furthest sound you can hear.",
  "Find a physical book and read exactly one page slowly.",
  "Step outside and identify three different textures with your hands.",
  "Close your eyes and trace the outline of your own hand in your mind.",
  "Drink a glass of water, focusing entirely on the sensation of swallowing.",
  "Write one thing you're proud of on a physical scrap of paper.",
  "Look out a window and follow the path of one moving object until it's gone."
];

// --- Custom Hooks ---

function useVoiceToText(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const silenceTimeoutRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setMicError("Speech recognition not supported in this browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setMicError(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        onTranscript(transcript);

        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = setTimeout(() => {
          stopListening();
        }, 2000);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          setMicError("Please check your microphone settings.");
        } else {
          setMicError("Speech recognition error. Please try again.");
        }
        stopListening();
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      setMicError("Please check your microphone settings.");
      setIsListening(false);
    }
  }, [onTranscript, stopListening]);

  return { isListening, micError, startListening, stopListening };
}

/**
 * Manages persistence for action plans and gamification stats.
 */
function usePersistence() {
  const [actionPlans, setActionPlans] = useState<ZenithActionPlan[]>([]);
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState(1);
  const [exp, setExp] = useState(0);
  const [bigDream, setBigDream] = useState("Graduate with honors and launch a meaningful career.");

  useEffect(() => {
    const savedPlans = localStorage.getItem('zenith_plans');
    const savedStats = localStorage.getItem('zenith_stats');
    if (savedPlans) setActionPlans(JSON.parse(savedPlans));
    if (savedStats) {
      const stats = JSON.parse(savedStats);
      setStreak(stats.streak || 0);
      setLevel(stats.level || 1);
      setExp(stats.exp || 0);
      setBigDream(stats.bigDream || "Graduate with honors and launch a meaningful career.");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('zenith_plans', JSON.stringify(actionPlans));
    localStorage.setItem('zenith_stats', JSON.stringify({ streak, level, exp, bigDream }));
  }, [actionPlans, streak, level, exp, bigDream]);

  const addExp = (amount: number) => {
    setExp(prev => {
      const newExp = prev + amount;
      const nextLevelThreshold = level * 100;
      if (newExp >= nextLevelThreshold) {
        setLevel(l => l + 1);
        return newExp - nextLevelThreshold;
      }
      return newExp;
    });
  };

  const toggleTaskCompletion = (planId: string, taskIdx: number) => {
    setActionPlans(prev => prev.map(plan => {
      if (plan.id === planId) {
        const newCompleted = [...plan.completedActions];
        newCompleted[taskIdx] = !newCompleted[taskIdx];
        
        // Celebrate with confetti if marked as completed
        if (newCompleted[taskIdx]) {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#1B1B3A', '#FFC107', '#E0F2F1']
          });
          addExp(25);
        }
        
        return { ...plan, completedActions: newCompleted };
      }
      return plan;
    }));
  };

  return { actionPlans, setActionPlans, streak, setStreak, level, exp, addExp, toggleTaskCompletion, bigDream, setBigDream };
}

/**
 * Manages the Sanctuary Timer logic.
 */
function useResetTimer(onComplete: () => void) {
  const [isResetMode, setIsResetMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [currentTask, setCurrentTask] = useState('');

  useEffect(() => {
    let timer: any;
    if (isResetMode && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsResetMode(false);
      setTimeLeft(300);
      onComplete();
    }
    return () => clearInterval(timer);
  }, [isResetMode, timeLeft, onComplete]);

  const startReset = () => {
    setCurrentTask(SANCTUARY_TASKS[Math.floor(Math.random() * SANCTUARY_TASKS.length)]);
    setIsResetMode(true);
    setTimeLeft(300);
  };

  return { isResetMode, setIsResetMode, timeLeft, currentTask, startReset };
}

// --- Components ---

const ZenithIndicator = ({ progress }: { progress: number }) => (
  <div className="relative w-10 h-10 flex items-center justify-center">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute inset-0 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-full"
    />
    <motion.div 
      animate={{ scale: [1, 1.15, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      className="w-3.5 h-3.5 rounded-full shadow-lg"
      style={{ 
        backgroundColor: 'var(--color-zenith-gold)',
        boxShadow: '0 0 15px var(--color-zenith-gold-glow)'
      }}
    />
  </div>
);

const LoadingHeart = () => (
  <div className="flex flex-col items-center justify-center gap-6 py-12">
    <div className="relative">
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        className="text-indigo-600 dark:text-indigo-400"
      >
        <Heart size={64} fill="currentColor" className="pulse-ring" />
      </motion.div>
    </div>
    <p className="text-slate-400 font-serif italic animate-pulse">Consulting the Zenith Coach...</p>
  </div>
);

const Toast = ({ message, type, onClose }: { message: string, type: 'error' | 'success', onClose: () => void }) => (
  <motion.div 
    role="alert"
    aria-live="assertive"
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 50 }}
    className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl border ${
      type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-600' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
    }`}
  >
    {type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
    <span className="font-bold text-sm">{message}</span>
    <button 
      onClick={onClose} 
      aria-label="Close notification"
      className="ml-2 opacity-50 hover:opacity-100 transition-opacity"
    >
      <X size={16} />
    </button>
  </motion.div>
);

const WaveDividerSignature = () => (
  <div className="relative w-full h-12 md:h-20 overflow-hidden">
    <svg className="wave-signature h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
      <path d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,149.3C672,149,768,203,864,202.7C960,203,1056,149,1152,149.3C1248,149,1344,203,1392,234.7L1440,267V320H1392C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320H0Z"></path>
    </svg>
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.5em] text-slate-400 opacity-30 select-none">
      FZZ
    </div>
  </div>
);

const AboutModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" 
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-12 shadow-2xl border border-white/20 dark:border-white/5"
        >
          <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={24} />
          </button>
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap size={32} />
            </div>
            <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">The Story</h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              This project was built by Fatima Zahra Zouhair to bring life to student goals. 
              Designed as a sanctuary for those navigating academic noise and career fog.
            </p>
            <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
              <span className="hidden-credit">Fatima Zahra Zouhair</span>
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const Tooltip = ({ children, text }: { children: ReactNode, text: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div 
            initial={{ opacity: 0, y: 10, x: '-50%' }}
            animate={{ opacity: 1, y: -40, x: '-50%' }}
            exit={{ opacity: 0, y: 10, x: '-50%' }}
            className="absolute left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900 text-white text-[10px] rounded-md whitespace-nowrap z-50 pointer-events-none"
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="floating-particle bg-indigo-400/10 dark:bg-amber-400/5 blur-sm"
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: Math.random() * 100 + "%",
            scale: Math.random() * 1 + 0.5,
            opacity: Math.random() * 0.3 + 0.1
          }}
          animate={{ 
            x: [
              Math.random() * 100 + "%", 
              (Math.random() * 100) + "%", 
              Math.random() * 100 + "%"
            ],
            y: [
              Math.random() * 100 + "%", 
              (Math.random() * 100) + "%", 
              Math.random() * 100 + "%"
            ],
            opacity: [0.1, 0.4, 0.2, 0.4, 0.1],
            scale: [1, 1.2, 0.8, 1.1, 1]
          }}
          transition={{ 
            duration: Math.random() * 40 + 40, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          style={{
            width: Math.random() * 40 + 10 + "px",
            height: Math.random() * 40 + 10 + "px",
          }}
        />
      ))}
    </div>
  );
};

const SuccessSidebar = ({ 
  plans, 
  streak, 
  level, 
  bigDream,
  setBigDream
}: { 
  plans: ZenithActionPlan[], 
  streak: number, 
  level: number,
  bigDream: string,
  setBigDream: (val: string) => void
}) => {
  const latestPlan = plans[0];
  const [isEditingDream, setIsEditingDream] = useState(false);
  const [dreamInput, setDreamInput] = useState(bigDream);

  const totalTasks = plans.reduce((acc, p) => acc + p.keyActions.length, 0);
  const completedTasks = plans.reduce((acc, p) => acc + p.completedActions.filter(c => c).length, 0);
  
  const progressRatio = totalTasks > 0 ? completedTasks / totalTasks : 0;
  const progressBar = "🟩".repeat(Math.round(progressRatio * 5)) + "⬜".repeat(5 - Math.round(progressRatio * 5));

  return (
    <div className="space-y-8 h-full">
      {/* Plus Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.4em]">Success Intelligence</h3>
        <div className="px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-bold rounded-full animate-pulse">PLUS</div>
      </div>

      {/* Dream Tracker */}
      <div className="glass-card p-6 border-indigo-500/20 bg-indigo-50/10">
        <div className="flex items-center gap-3 mb-4">
          <Target size={18} className="text-amber-500 dark:text-indigo-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#1B1B3A] dark:text-slate-300">The Big Dream</span>
        </div>
        {isEditingDream ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={dreamInput}
              onChange={(e) => setDreamInput(e.target.value)}
              className="w-full bg-white/40 dark:bg-slate-800/40 border border-indigo-200/50 rounded-xl p-3 text-sm text-[#1B1B3A] dark:text-slate-200 focus:outline-none"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setIsEditingDream(false)}
                className="text-[10px] font-bold uppercase tracking-widest text-slate-400"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setBigDream(dreamInput);
                  setIsEditingDream(false);
                }}
                className="text-[10px] font-bold uppercase tracking-widest text-indigo-600"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p 
            className="text-base font-serif italic text-[#1B1B3A] dark:text-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setIsEditingDream(true)}
          >
            "{bigDream}"
          </p>
        )}
      </div>

      {/* Daily Progress */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Zap size={18} className="text-indigo-600" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#1B1B3A] dark:text-slate-300">Success Progress</span>
        </div>
        <div className="space-y-3">
          <div className="text-xl tracking-tighter font-mono">{progressBar}</div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {completedTasks}/{totalTasks} Success Milestones
          </p>
        </div>
      </div>

      {/* Priority Matrix & Wisdom */}
      {latestPlan && (
        <>
          <div className="glass-card p-6 border-amber-500/20 bg-amber-50/5 dark:border-indigo-500/20">
            <div className="flex items-center gap-3 mb-4">
              <Compass size={18} className="text-amber-640 dark:text-indigo-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#1B1B3A] dark:text-slate-300">Priority Matrix</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center ${latestPlan.priorityMatrix.urgent ? 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-900/40' : 'bg-slate-50 opacity-40'}`}>
                <span className="text-[8px] font-bold uppercase tracking-widest">Urgent</span>
                {latestPlan.priorityMatrix.urgent && <div className="mt-1 w-1 h-1 bg-red-500 rounded-full" />}
              </div>
              <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center ${latestPlan.priorityMatrix.important ? 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-900/40' : 'bg-slate-50 opacity-40'}`}>
                <span className="text-[8px] font-bold uppercase tracking-widest">Important</span>
                {latestPlan.priorityMatrix.important && <div className="mt-1 w-1 h-1 bg-indigo-500 rounded-full" />}
              </div>
            </div>
          </div>

          <div className="glass-card p-6 bg-emerald-50/5 border-emerald-500/20">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles size={18} className="text-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#1B1B3A] dark:text-slate-300">Advice of the Day</span>
            </div>
            <p className="text-sm font-bold text-[#1B1B3A] dark:text-slate-200 leading-relaxed italic">
              "{latestPlan.plusAdvice}"
            </p>
          </div>

          {latestPlan.roadblockWarning && (
            <div className="p-6 rounded-[2rem] bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20">
              <div className="flex items-center gap-3 mb-3 text-rose-600">
                <AlertCircle size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Roadblock Predictor</span>
              </div>
              <p className="text-xs text-rose-700 dark:text-rose-400">
                {latestPlan.roadblockWarning}
              </p>
            </div>
          )}
        </>
      )}

      {/* Action-Oriented Challenge */}
      <div className="p-8 bg-[#1B1B3A] rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Trophy size={48} className="text-white" />
        </div>
        <h4 className="text-white text-xs font-bold uppercase tracking-[0.3em] mb-3">Daily Challenge</h4>
        <p className="text-indigo-100 text-sm leading-relaxed mb-4">
          Complete your <strong>top priority</strong> task before noon to unlock deep momentum.
        </p>
        <div className="flex items-center gap-2 text-amber-500 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
          <Star size={12} fill="currentColor" />
          <span>+50 EXP on completion</span>
        </div>
      </div>
    </div>
  );
};

const FloatingPlusBar = ({ 
  onConsult, 
  isLoading 
}: { 
  onConsult: (input: string) => void, 
  isLoading: boolean 
}) => {
  const [input, setInput] = useState('');
  const { isListening, micError, startListening, stopListening } = useVoiceToText(setInput);

  return (
    <div className="plus-floating-bar group">
      <div className="plus-inner">
        <div className="plus-logo">
          <span className="text-white font-bold text-sm tracking-tighter flex items-center gap-2 text-nowrap">
            Student Success Studio <span className="plus-badge">PLUS</span> 🚀
          </span>
        </div>
        <div className="plus-input">
          <button
            onClick={isListening ? stopListening : startListening}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${isListening ? 'bg-red-500/20 animate-pulse' : 'hover:bg-white/10'}`}
            title={isListening ? "Stop listening" : "Voice to words"}
          >
            <span style={{ color: 'unset' }} className="text-lg grayscale-0">🎤</span>
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Listening..." : "What is your dream today?"}
            className="bg-transparent border-none outline-none w-full text-white placeholder:text-white/40 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && input.trim() && !isLoading) {
                onConsult(input);
                setInput('');
              }
            }}
          />
        </div>
        <button 
          onClick={() => {
            onConsult(input);
            setInput('');
          }}
          disabled={isLoading || !input.trim()}
          className="plus-btn"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              <span>Analyzing...</span>
            </div>
          ) : (
            'Consult Coach'
          )}
        </button>
      </div>
      <AnimatePresence>
        {micError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] px-3 py-1 rounded-md font-bold whitespace-nowrap shadow-lg"
          >
            {micError}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'Declutter' | 'Career' | 'Reset'>('Declutter');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'error' | 'success' } | null>(null);
  const [isSuccessAnimating, setIsSuccessAnimating] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  const { 
    actionPlans, 
    setActionPlans, 
    streak, 
    setStreak,
    level, 
    exp, 
    addExp,
    toggleTaskCompletion,
    bigDream,
    setBigDream
  } = usePersistence();
  
  const triggerReward = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#e2f3f0', '#fff1e6', '#f3e8ff', '#22d3ee', '#a78bfa']
    });
    addExp(50);
    setStreak(s => s + 1);
    setIsSuccessAnimating(true);
    setTimeout(() => setIsSuccessAnimating(false), 1000);
  }, [addExp, setStreak]);

  const { isResetMode, setIsResetMode, timeLeft, currentTask, startReset } = useResetTimer(triggerReward);

  // Declutter State
  const [stressInput, setStressInput] = useState('');
  const [isSolvingChaos, setIsSolvingChaos] = useState(false);
  
  // Career State
  const [careerFear, setCareerFear] = useState('');
  const [resumeTasks, setResumeTasks] = useState<CareerResumeTasks | null>(null);
  const [isCareerLoading, setIsCareerLoading] = useState(false);

  const { 
    isListening: isListeningChaos, 
    micError: micErrorChaos, 
    startListening: startListeningChaos, 
    stopListening: stopListeningChaos 
  } = useVoiceToText(setStressInput);

  const { 
    isListening: isListeningCareer, 
    micError: micErrorCareer, 
    startListening: startListeningCareer, 
    stopListening: stopListeningCareer 
  } = useVoiceToText(setCareerFear);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const handleSolveChaos = async (customInput?: string) => {
    const finalInput = customInput || stressInput;
    if (!finalInput.trim()) return;
    setIsSolvingChaos(true);
    try {
      const plan = await solveChaos(finalInput);
      setActionPlans(prev => [plan, ...prev]);
      if (!customInput) setStressInput('');
      triggerReward();
      setToast({ message: "Chaos solved! Your action plan is ready.", type: 'success' });
    } catch (err) {
      setToast({ message: "Oops! Our coach is taking a breather. Try again in a moment.", type: 'error' });
    } finally {
      setIsSolvingChaos(false);
    }
  };

  const handleCareerFear = async () => {
    if (!careerFear.trim()) return;
    setIsCareerLoading(true);
    try {
      const result = await generateResumeTasks(careerFear);
      setResumeTasks(result);
      triggerReward();
      setToast({ message: "Resume strategy generated!", type: 'success' });
    } catch (err) {
      setToast({ message: "We couldn't map your path right now. Please try again.", type: 'error' });
    } finally {
      setIsCareerLoading(false);
    }
  };

  if (isResetMode) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] mesh-gradient flex flex-col items-center justify-center p-6 overflow-hidden"
      >
        <div className="grain-texture" />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.1, 0.05],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="w-[100vh] h-[100vh] rounded-full border border-indigo-500/10 bg-gradient-to-tr from-cyan-500/10 via-violet-500/10 to-emerald-500/10 blur-[100px]" />
        </motion.div>

        <div className="relative z-10 flex flex-col items-center max-w-2xl text-center">
          <motion.div 
            animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="mb-12 p-8 bg-white/40 rounded-full backdrop-blur-3xl border border-white/60 shadow-xl"
          >
            <Wind size={64} className="text-indigo-600" />
          </motion.div>
          
          <h1 className="text-6xl font-serif font-bold mb-4 tracking-tight text-[#1B1B3A]">Sanctuary</h1>
          <p className="text-[#1B1B3A] mb-16 uppercase tracking-[0.4em] text-xs font-bold opacity-60">Disconnecting from the digital noise</p>
          
          <div className="text-9xl font-mono font-bold mb-20 tracking-tighter text-[#1B1B3A]">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="bg-white/40 p-12 rounded-[4rem] backdrop-blur-3xl border border-white/60 shadow-2xl max-w-lg"
          >
            <h2 className="text-indigo-600 uppercase tracking-widest text-[10px] font-bold mb-8 opacity-80">Your Offline Solution</h2>
            <p className="text-3xl font-serif italic font-bold leading-relaxed text-[#1B1B3A]">"{currentTask}"</p>
          </motion.div>

          <button 
            onClick={() => setIsResetMode(false)}
            aria-label="Exit Sanctuary"
            className="mt-20 text-[#1B1B3A] opacity-40 hover:opacity-100 transition-all flex items-center gap-3 text-xs uppercase tracking-[0.3em] font-bold group"
          >
            <RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" /> Exit Sanctuary
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen mesh-gradient flex flex-col relative overflow-hidden">
      <div className="grain-texture" />
      <div className="mesh-gradient-extra" />
      <FloatingParticles />
      
      {/* Dynamic Ambient Center Aura */}
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 0.9, 1.05, 1],
          opacity: [0.2, 0.3, 0.2, 0.35, 0.2],
          rotate: [0, 90, 180, 270, 360]
        }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] rounded-full bg-gradient-to-br from-indigo-500/5 via-indigo-500/5 to-cyan-500/5 blur-[120px] pointer-events-none select-none z-0"
      />

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-8 w-full flex flex-col md:flex-row md:items-center justify-between gap-8 z-10">
        <div className="flex items-center gap-5">
          <motion.div 
            whileHover={{ rotate: 15, scale: 1.1 }}
            className="w-14 h-14 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20"
          >
            <Zap size={28} />
          </motion.div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-4">
              <h1 className={`text-2xl title-main hover-title light-glow dark:shadow-none sm:text-3xl lg:text-4xl ${isSuccessAnimating ? 'animate-success' : ''}`}>
                Student Success Studio
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Senior Problem Solver & Logic Engine</span>
              <div className="h-1 w-1 rounded-full bg-slate-300" />
              <div className="flex items-center gap-1 text-[#FFBF00] dark:text-indigo-400">
                <Flame size={12} fill="currentColor" />
                <span className="text-[10px] font-bold">{streak} Day Streak</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-6 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/60 dark:border-white/5">
                    <ZenithIndicator progress={exp / (level * 100)} />
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2">
                        <span 
                          className="text-[10px] font-bold uppercase tracking-widest"
                          style={{ 
                            color: '#1B1B3A',
                            textShadow: '0 0 4px rgba(255, 255, 255, 0.8)'
                          }}
                        >
                          Level {level}
                        </span>
                        <span 
                          className="text-[10px] font-bold"
                          style={{ 
                            color: '#1B1B3A',
                            textShadow: '0 0 4px rgba(255, 255, 255, 0.8)'
                          }}
                        >
                          {Math.round((exp / (level * 100)) * 100)}%
                        </span>
                      </div>
                      <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700/50 rounded-full mt-1 relative overflow-hidden shadow-inner">
                        <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${(exp / (level * 100)) * 100}%` }}
                           transition={{ type: "spring", damping: 15 }}
                           className="h-full rounded-full"
                           style={{ 
                             background: '#FFC107',
                             boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4)'
                           }}
                        />
                        <motion.div
                          initial={{ x: "-100%" }}
                          animate={{ x: `${(exp / (level * 100)) * 100}%` }}
                          transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
                          className="absolute inset-y-0 w-8 bg-white/30 blur-sm -skew-x-12 pointer-events-none"
                        />
                      </div>
                      {/* Trail Effect */}
                      <motion.div
                        animate={{ x: `${(exp / (level * 100)) * 100}%` }}
                        transition={{ type: "spring", bounce: 0.5, duration: 1.2, delay: 0.05 }}
                        className="absolute -top-1.5 -ml-1.5 w-4 h-2.5 bg-amber-400/30 rounded-full blur-md"
                      />
                        <motion.div
                        animate={{ x: `${(exp / (level * 100)) * 100}%`, scale: [1, 1.2, 1] }}
                        transition={{ 
                          x: { type: "spring", bounce: 0.5, duration: 0.8 },
                          scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                        }}
                        className="absolute -top-1.5 -ml-1.5 stone-marker animate-stone-breathe"
                        style={{ filter: 'drop-shadow(0 0 8px rgba(255, 193, 7, 0.6))' }}
                      />
                    </div>
                    <Trophy size={20} className="text-[#FFC107]" />
                  </div>

        </div>
      </header>

      {/* Main Navigation */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] border border-white/60 dark:border-white/5 shadow-2xl md:relative md:bottom-0 md:left-0 md:translate-x-0 md:mx-auto md:mb-12 md:max-w-fit">
        {(['Declutter', 'Career', 'Reset'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            aria-label={`Switch to ${tab} tab`}
            className={`px-8 py-3.5 rounded-3xl text-sm font-bold transition-all flex items-center gap-3 ${
              activeTab === tab 
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl' 
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            {tab === 'Declutter' && <Brain size={18} />}
            {tab === 'Career' && <Compass size={18} />}
            {tab === 'Reset' && <Smartphone size={18} />}
            <span className={activeTab === tab ? 'block' : 'hidden md:block'}>{tab}</span>
          </button>
        ))}
      </nav>

      <main className="max-w-7xl mx-auto px-6 pb-32 w-full flex-1 z-10">
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-12 xl:col-span-9">
            <AnimatePresence mode="wait">
              {activeTab === 'Declutter' && (
                <motion.div 
                  key="declutter"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  className="grid lg:grid-cols-12 gap-10"
                >
                  {/* Left Column: Logic & Input */}
                  <div className="lg:col-span-5 space-y-8">
                    <div className="glass-card p-10 animate-breathe">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                          <Brain size={28} />
                        </div>
                        <h2 className={`text-3xl card-title hover-title light-glow dark:shadow-none dark:text-indigo-600 ${isSuccessAnimating ? 'animate-success' : ''}`}>
                          Solve Chaos
                        </h2>
                      </div>
                      <p className="text-[#1B1B3A] opacity-70 dark:text-slate-400 mb-8 text-base leading-relaxed">
                        Pour your stress into the hub. Our AI coach will generate a strategic action plan to reclaim your peace.
                      </p>
                      <div className="relative group/input">
                        <textarea
                          value={stressInput}
                          onChange={(e) => setStressInput(e.target.value)}
                          aria-label="Your brain dump"
                          placeholder={isListeningChaos ? "Listening..." : "What's overwhelming you right now?"}
                          className="w-full h-56 bg-white/30 dark:bg-slate-900/30 border border-white/60 dark:border-white/5 rounded-[2rem] p-8 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none mb-4 text-slate-700 dark:text-slate-200 text-lg placeholder:text-slate-400"
                        />
                        <button
                          onClick={isListeningChaos ? stopListeningChaos : startListeningChaos}
                          className={`absolute top-6 right-6 p-3 rounded-2xl transition-all duration-300 ${
                            isListeningChaos 
                              ? 'bg-red-500/20 animate-pulse' 
                              : 'hover:bg-white/10'
                          }`}
                          title={isListeningChaos ? "Stop listening" : "Voice input"}
                        >
                          <span style={{ color: 'unset' }} className="text-xl grayscale-0">🎤</span>
                        </button>
                        <AnimatePresence>
                          {micErrorChaos && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute -top-10 right-0 bg-red-500 text-white text-[10px] px-3 py-1 rounded-md font-bold whitespace-nowrap shadow-lg z-20"
                            >
                              {micErrorChaos}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <button 
                        onClick={() => handleSolveChaos()}
                        disabled={isSolvingChaos || !stressInput.trim()}
                        aria-busy={isSolvingChaos}
                        className="w-full py-6 btn-zenith dark:bg-[#1B1B3A] dark:text-[#FFF3E0] rounded-[2rem] font-bold text-lg shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                      >
                        {isSolvingChaos ? <Loader2 className="animate-spin" /> : <Sparkles size={24} />}
                        Solve Chaos
                      </button>
                    </div>
                  </div>

                  {/* Middle Column: Action Plans */}
                  <div className="lg:col-span-7 space-y-8 max-h-[85vh] overflow-y-auto pr-4 custom-scrollbar">
                    {isSolvingChaos ? (
                      <div className="h-full flex items-center justify-center">
                        <LoadingHeart />
                      </div>
                    ) : actionPlans.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 py-32 border-4 border-dashed border-white/40 dark:border-white/5 rounded-[4rem]">
                        <Zap size={64} className="mb-6 opacity-20" />
                        <p className="text-xl font-serif italic">Your Zenith Action Plans will appear here.</p>
                      </div>
                    ) : (
                      actionPlans.map((plan) => (
                        <motion.div 
                          layout
                          key={plan.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="glass-card p-12 relative group animate-breathe"
                        >
                          <button 
                            onClick={() => setActionPlans(prev => prev.filter(p => p.id !== plan.id))}
                            aria-label="Delete action plan"
                            className="absolute top-8 right-8 p-3 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <X size={24} />
                          </button>

                          <div className="space-y-10">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                                  <ShieldAlert size={20} />
                                  <span className="text-xs font-bold uppercase tracking-[0.3em]">{plan.category} Analysis</span>
                                </div>
                                <div className="flex flex-col items-end">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold text-[#1B1B3A] opacity-60 uppercase tracking-widest">Complexity Level</span>
                                    <span 
                                      className="text-[10px] font-bold dark:text-white"
                                      style={{ 
                                        color: '#1B1B3A',
                                        textShadow: '0 0 4px rgba(255, 255, 255, 0.8)'
                                      }}
                                    >
                                      {plan.complexity}%
                                    </span>
                                  </div>
                                      <div className="w-20 h-2 bg-slate-100 dark:bg-slate-800 rounded-full relative overflow-hidden shadow-inner">
                                        <motion.div 
                                          initial={{ width: 0 }}
                                          animate={{ width: `${plan.complexity}%` }}
                                          transition={{ type: "spring", damping: 12, delay: 0.5 }}
                                          className="h-full rounded-full"
                                          style={{ 
                                            background: '#FFC107',
                                            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4)'
                                          }}
                                        />
                                        <motion.div
                                          initial={{ x: "-100%" }}
                                          animate={{ x: `${plan.complexity}%` }}
                                          transition={{ type: "spring", bounce: 0.4, duration: 1, delay: 0.5 }}
                                          className="absolute inset-y-0 w-8 bg-white/30 blur-sm -skew-x-12 pointer-events-none"
                                        />
                                      </div>
                                      {/* Trail Effect */}
                                      <motion.div
                                        initial={{ x: 0 }}
                                        animate={{ x: `${plan.complexity}%` }}
                                        transition={{ type: "spring", bounce: 0.4, duration: 1.4, delay: 0.55 }}
                                        className="absolute -top-1.5 -ml-2 w-4 h-2.5 bg-amber-400/30 rounded-full blur-md"
                                      />
                                      <motion.div
                                        initial={{ x: 0 }}
                                        animate={{ x: `${plan.complexity}%`, y: [0, -5, 0] }}
                                        transition={{ 
                                          x: { type: "spring", bounce: 0.4, duration: 1, delay: 0.5 },
                                          y: { repeat: Infinity, duration: 2, ease: "easeInOut" }
                                        }}
                                        className="absolute -top-1.5 -ml-2 stone-marker animate-stone-breathe"
                                        style={{ 
                                          filter: 'drop-shadow(0 0 8px rgba(255, 193, 7, 0.6))'
                                        }}
                                      />
                                 </div>
                              </div>
                              <div className="flex flex-col gap-4">
                                <h3 className="text-3xl font-serif font-bold text-[#1B1B3A] dark:text-indigo-50 leading-tight">
                                  {plan.decision}
                                </h3>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50/80 dark:bg-indigo-900/40 rounded-full border border-indigo-100/50 w-fit">
                                  <Sparkles size={12} className="text-[#1B1B3A]" />
                                  <span className="text-[10px] font-bold text-[#1B1B3A] dark:text-indigo-300 uppercase tracking-widest leading-none">
                                    {plan.liveInsight}
                                  </span>
                                </div>
                              </div>
                              <div className="p-6 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100/50 dark:border-indigo-800/10">
                                <p className="text-base text-[#1B1B3A]/90 dark:text-indigo-200/90 leading-relaxed italic">
                                  <strong className="text-[#1B1B3A] dark:text-indigo-100 uppercase tracking-widest text-[10px] flex items-center gap-2 mb-2 not-italic">
                                    <Brain size={18} className="text-[#2d0a31]" />
                                    The Why:
                                  </strong> 
                                  "{plan.strategy}"
                                </p>
                              </div>
                            </div>

                            <div className="space-y-6 relative">
                              <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 mb-8">
                                <CheckCircle2 size={24} />
                                <span className="text-sm font-bold uppercase tracking-[0.4em]">Success Timeline</span>
                              </div>
                              
                              {/* Thread of Success Path */}
                              <div className="absolute left-[27px] top-[74px] bottom-[40px] w-0.5 bg-gradient-to-b from-indigo-500/40 via-indigo-500/20 to-transparent pointer-events-none" />
                              
                              <div className="grid gap-6">
                                {plan.keyActions.map((action, idx) => {
                                  const parts = action.split('**');
                                  const isCompleted = plan.completedActions[idx];
                                  
                                  return (
                                    <motion.div 
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ 
                                        opacity: isCompleted ? 0.4 : 1, 
                                        x: 0,
                                        scale: isCompleted ? 0.98 : 1
                                      }}
                                      transition={{ 
                                        delay: idx * 0.1,
                                        opacity: { duration: 0.4 }
                                      }}
                                      key={idx} 
                                      onClick={() => toggleTaskCompletion(plan.id, idx)}
                                      className={`flex items-start gap-6 p-8 rounded-[2.5rem] cursor-pointer transition-all duration-500 relative group
                                        ${isCompleted 
                                          ? 'bg-slate-100/30 dark:bg-slate-900/20 border-transparent saturate-50' 
                                          : 'glass-card border-white/80 dark:border-white/10 hover:shadow-2xl hover:-translate-y-1'
                                        }`}
                                    >
                                      {/* Thread Dot */}
                                      <div className={`w-4 h-4 rounded-full mt-2.5 shrink-0 z-10 transition-all duration-500 flex items-center justify-center
                                        ${isCompleted 
                                          ? 'bg-slate-300 dark:bg-slate-700' 
                                          : 'bg-indigo-600 ring-4 ring-indigo-500/20 shadow-[0_0_12px_rgba(79,70,229,0.6)]'
                                        }`}
                                      >
                                        {isCompleted && <div className="w-1.5 h-1.5 rounded-full bg-white/60" />}
                                      </div>

                                      <div className="flex-1">
                                        <p className={`text-xl text-[#1B1B3A] dark:text-slate-200 leading-relaxed transition-all duration-500 ${isCompleted ? 'line-through decoration-slate-400 opacity-60' : ''}`}>
                                          {parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-bold">{part}</strong> : part)}
                                        </p>
                                        {!isCompleted && idx > 0 && action.toLowerCase().includes('buffer') && (
                                          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-amber-50/80 dark:bg-amber-900/30 rounded-full border border-amber-100/50">
                                            <Clock size={10} className="text-amber-600" />
                                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest">Architectural Buffer</span>
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div className={`transition-opacity duration-300 ${isCompleted ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
                                        <Trophy size={16} className={isCompleted ? "text-[#FFC107]" : "text-slate-400"} />
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="pt-8 border-t border-white/60 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                <div className="px-4 py-1.5 bg-[#1B1B3A] text-white rounded-lg font-bold text-[9px] uppercase tracking-[0.2em] shadow-lg">
                                  Empowered by Student Success Studio Plus for Fatima Zahra Zouhair
                                </div>
                              <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest sm:text-right">
                                {new Date(plan.timestamp).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'Career' && (
                <motion.div 
                  key="career"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  className="max-w-5xl mx-auto space-y-12"
                >
                  <div className="glass-card p-16 text-center space-y-12 animate-breathe">
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="inline-flex p-6 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-[2.5rem] mb-4 shadow-xl shadow-cyan-500/10"
                    >
                      <Compass size={48} />
                    </motion.div>
                    <div className="space-y-4">
                      <h2 className={`text-5xl card-title hover-title light-glow dark:shadow-none dark:text-indigo-600 ${isSuccessAnimating ? 'animate-success' : ''}`}>
                        Career Compass
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed">
                        Map your path through the fog. Enter a career fear to generate 5 specific resume-building tasks.
                      </p>
                    </div>
                    
                    <div className="relative max-w-3xl mx-auto">
                      <div className="relative">
                        <input 
                          value={careerFear}
                          onChange={(e) => setCareerFear(e.target.value)}
                          aria-label="Your career fear"
                          placeholder={isListeningCareer ? "Listening..." : "What career fear is holding you back?"}
                          className="w-full py-8 px-12 bg-white/40 dark:bg-slate-900/40 rounded-[2.5rem] border border-white/80 dark:border-white/5 shadow-inner focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all pr-40 text-xl dark:text-white placeholder:text-slate-400"
                        />
                        <button
                          onClick={isListeningCareer ? stopListeningCareer : startListeningCareer}
                          className={`absolute right-24 top-1/2 -translate-y-1/2 p-4 rounded-[1.5rem] transition-all duration-300 ${
                            isListeningCareer 
                              ? 'bg-red-500/20 animate-pulse' 
                              : 'hover:bg-white/10'
                          }`}
                          title={isListeningCareer ? "Stop listening" : "Voice input"}
                        >
                          <span style={{ color: 'unset' }} className="text-2xl grayscale-0">🎤</span>
                        </button>
                        <button 
                          onClick={handleCareerFear}
                          disabled={isCareerLoading || !careerFear.trim()}
                          aria-busy={isCareerLoading}
                          className="absolute right-4 top-4 bottom-4 px-8 btn-zenith rounded-[1.75rem] hover:scale-[1.05] active:scale-[0.95] transition-all disabled:opacity-50 shadow-2xl"
                        >
                          {isCareerLoading ? <Loader2 className="animate-spin" /> : <ArrowRight size={32} />}
                        </button>
                      </div>
                      <AnimatePresence>
                        {micErrorCareer && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] px-3 py-1 rounded-md font-bold whitespace-nowrap shadow-lg z-20"
                          >
                            {micErrorCareer}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <AnimatePresence>
                    {resumeTasks && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-slate-900 dark:bg-slate-950 text-white p-16 rounded-[4rem] shadow-2xl relative overflow-hidden border border-white/5"
                      >
                        <div className="absolute -top-20 -right-20 p-32 opacity-[0.03]">
                          <ShieldAlert size={300} />
                        </div>
                        
                        <div className="relative z-10 space-y-12">
                          <div className="space-y-4">
                            <span className="text-cyan-400 text-xs font-bold uppercase tracking-[0.5em] neon-glow-cyan">Strategic Response</span>
                            <h3 className="text-4xl font-serif italic leading-tight text-slate-100">"Addressing the fear: {resumeTasks.fear}"</h3>
                          </div>

                          <div className="grid gap-5">
                            {resumeTasks.tasks.map((task, idx) => (
                              <motion.div 
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.15 }}
                                key={idx} 
                                className="flex items-center gap-8 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 hover:bg-white/10 transition-all group cursor-default"
                              >
                                <div className="w-14 h-14 rounded-[1.25rem] bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xl font-bold shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-lg">
                                  {idx + 1}
                                </div>
                                <p className="text-xl font-medium text-slate-200 leading-relaxed">{task}</p>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {activeTab === 'Reset' && (
                <motion.div 
                  key="reset"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  className="max-w-4xl mx-auto text-center space-y-16 py-12"
                >
                  <div className="space-y-6">
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="inline-flex p-8 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-[3rem] shadow-xl shadow-indigo-500/10"
                    >
                      <Smartphone size={64} />
                    </motion.div>
                    <h2 className={`text-6xl card-title hover-title light-glow dark:shadow-none dark:text-indigo-600 ${isSuccessAnimating ? 'animate-success' : ''}`}>
                      Digital Reset
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-2xl max-w-2xl mx-auto leading-relaxed">
                      Step away from the digital noise. Enter the sanctuary for 5 minutes of mindful disconnection.
                    </p>
                  </div>

                  <div className="glass-card p-20 animate-breathe">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-16 mb-20">
                      <div className="text-center">
                        <div className="text-8xl font-serif font-bold text-[#1B1B3A] dark:text-white tracking-tighter">5:00</div>
                        <div className="text-xs font-bold text-[#1B1B3A] dark:text-indigo-200 uppercase tracking-[0.4em] mt-4 opacity-70">Sanctuary Duration</div>
                      </div>
                      <button 
                        onClick={startReset}
                        className="btn-zenith p-10 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all"
                      >
                        <RefreshCcw size={48} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Plus Intelligence Sidebar */}
          <div className="lg:col-span-12 xl:col-span-3 hidden xl:block">
            <SuccessSidebar 
              plans={actionPlans} 
              streak={streak} 
              level={level} 
              bigDream={bigDream}
              setBigDream={setBigDream}
            />
          </div>
        </div>
      </main>

      {/* End of Page Stone */}
      <div className="max-w-7xl mx-auto px-6 mb-8 flex items-center justify-end gap-3 opacity-30 select-none">
        <div className="stone-icon" />
        <span className="text-[10px] uppercase tracking-widest text-[#121212] dark:text-slate-400">FZ Zouhair</span>
      </div>

      <WaveDividerSignature />

      {/* Credits Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 w-full z-10 border-t border-slate-200 dark:border-slate-800 relative">
        <div className="flex flex-col items-center gap-12 mb-12">
          <p className="joyful-signature text-xl md:text-2xl font-serif tracking-widest text-[#1B1B3A] dark:text-indigo-100 italic">
            <motion.span
              animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sun size={24} className="sun-pulse" />
            </motion.span>
            A premium AI experience curated by <span className="font-bold underline decoration-indigo-500 underline-offset-8">Fatima Zahra Zouhair</span>
          </p>
          <div className="mt-8 px-8 py-3 bg-[#1B1B3A] text-white rounded-full font-bold text-xs uppercase tracking-[0.4em] shadow-xl hover:scale-105 transition-transform cursor-default">
            Your partner in success. Every task is a brick in your future empire.
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3 text-[#1B1B3A] opacity-60 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">
            <ShieldAlert size={14} />
            <span>Encrypted Action Plans</span>
          </div>
          
          <button
            onClick={() => setIsAboutModalOpen(true)}
            className="text-xs font-bold text-[#1B1B3A] opacity-60 hover:opacity-100 dark:text-slate-400 hover:text-indigo-500 uppercase tracking-widest transition-colors"
          >
            The Story
          </button>

          <p className="text-[#1B1B3A] opacity-60 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">
            © 2026 | Designed by Fatima Zahra Zouhair
          </p>
        </div>
        
        <div className="flex flex-col items-center gap-4 text-center">
          <Tooltip text="Built with hope by Fatima Zahra Zouhair">
            <Heart size={14} className="text-slate-300 hover:text-red-400 transition-colors cursor-help" />
          </Tooltip>
          <p className="fine-print">A messy beautiful project by Fatima Zahra Zouhair</p>
        </div>
      </footer>

      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />

      {/* Student Success Studio Plus Floating Bar */}
      <FloatingPlusBar 
        onConsult={handleSolveChaos} 
        isLoading={isSolvingChaos} 
      />
    </div>
  );
}
