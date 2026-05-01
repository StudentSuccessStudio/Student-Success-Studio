import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, Book, Footprints, Palette, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ACTIVITIES = [
  { text: "Go for a 10-minute mindful walk", icon: Footprints },
  { text: "Read 5 pages of a physical book", icon: Book },
  { text: "Make a cup of herbal tea and just sit", icon: Coffee },
  { text: "Sketch something in your environment", icon: Palette },
  { text: "Listen to one album without distractions", icon: Music },
  { text: "Practice 5 minutes of deep breathing", icon: Footprints },
  { text: "Write a physical letter to a friend", icon: Book },
];

export default function Timer() {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [activity, setActivity] = useState<typeof ACTIVITIES[0] | null>(null);

  useEffect(() => {
    let interval: any = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((s) => s - 1);
      }, 1000);
    } else if (seconds === 0 && isActive) {
      setIsActive(false);
      setActivity(ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)]);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = (duration: number) => {
    setSeconds(duration);
    setIsActive(true);
    setActivity(null);
  };

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      <div className="text-8xl font-serif text-sage tabular-nums">
        {formatTime(seconds)}
      </div>

      <div className="flex gap-4">
        {!isActive && seconds === 0 ? (
          <div className="grid grid-cols-3 gap-4">
            {[5, 10, 15].map((m) => (
              <button
                key={m}
                onClick={() => startTimer(m * 60)}
                className="px-6 py-3 border border-sage/30 rounded-xl hover:bg-sage/10 text-slate transition-colors"
              >
                {m}m
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-4">
            <button
              onClick={() => setIsActive(!isActive)}
              className="p-4 bg-sage text-cream rounded-full shadow-lg"
            >
              {isActive ? <Pause /> : <Play />}
            </button>
            <button
              onClick={() => {
                setIsActive(false);
                setSeconds(0);
                setActivity(null);
              }}
              className="p-4 border border-sage/30 text-slate rounded-full"
            >
              <RotateCcw />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {activity && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 p-8 bg-sage/10 rounded-3xl border border-sage/20 text-center max-w-md"
          >
            <div className="flex justify-center mb-4 text-sage">
              <activity.icon size={48} strokeWidth={1} />
            </div>
            <h3 className="text-xl font-serif text-zen-dark mb-2">Your Offline Activity</h3>
            <p className="text-slate">{activity.text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
