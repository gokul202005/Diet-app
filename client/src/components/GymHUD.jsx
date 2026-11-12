import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Check, 
  Plus, 
  Minus, 
  ArrowRight, 
  X, 
  Flame, 
  Dumbbell, 
  Zap, 
  Sparkles,
  ChevronRight,
  Maximize2,
  Clock
} from 'lucide-react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const POPULAR_EXERCISES = [
  { name: 'Barbell Flat Bench Press', targetMuscle: 'Chest', defaultWeight: 70, defaultReps: 10, defaultSets: 4 },
  { name: 'Incline Dumbbell Press', targetMuscle: 'Upper Chest', defaultWeight: 26, defaultReps: 10, defaultSets: 4 },
  { name: 'Barbell Back Squat', targetMuscle: 'Quads & Glutes', defaultWeight: 90, defaultReps: 8, defaultSets: 4 },
  { name: 'Conventional Deadlift', targetMuscle: 'Posterior Chain', defaultWeight: 110, defaultReps: 6, defaultSets: 3 },
  { name: 'Standing Overhead Press', targetMuscle: 'Shoulders', defaultWeight: 45, defaultReps: 8, defaultSets: 4 },
  { name: 'Dumbbell Lateral Raises', targetMuscle: 'Lateral Deltoids', defaultWeight: 12, defaultReps: 15, defaultSets: 4 },
  { name: 'Wide-Grip Lat Pulldown', targetMuscle: 'Lats & Upper Back', defaultWeight: 60, defaultReps: 12, defaultSets: 4 },
  { name: 'Barbell Bicep Curls', targetMuscle: 'Biceps', defaultWeight: 35, defaultReps: 12, defaultSets: 3 },
  { name: 'Tricep Cable Pushdown', targetMuscle: 'Triceps', defaultWeight: 30, defaultReps: 12, defaultSets: 3 },
  { name: 'Bulgarian Split Squats', targetMuscle: 'Legs & Balance', defaultWeight: 18, defaultReps: 10, defaultSets: 3 }
];

export default function GymHUD({ onExit, onLogCompletedSet, initialExercise }) {
  const [selectedExercise, setSelectedExercise] = useState(
    initialExercise || POPULAR_EXERCISES[0]
  );
  const [currentSet, setCurrentSet] = useState(1);
  const [totalSets, setTotalSets] = useState(selectedExercise.defaultSets || 4);
  const [weightKg, setWeightKg] = useState(selectedExercise.defaultWeight || 60);
  const [repsCount, setRepsCount] = useState(selectedExercise.defaultReps || 10);
  
  // Rest Timer State
  const [restSeconds, setRestSeconds] = useState(null);
  const [restDuration, setRestDuration] = useState(90); // default 90s
  const [isResting, setIsResting] = useState(false);
  const [audioCuesEnabled, setAudioCuesEnabled] = useState(true);
  const [loggedSets, setLoggedSets] = useState([]);
  
  const timerIntervalRef = useRef(null);

  // Synthesized Chime Alert (880Hz -> 1760Hz double harmonic)
  const playChimeSound = () => {
    if (!audioCuesEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {}
  };

  // Jarvis Spoken Voice Cues
  const speakCue = (text) => {
    if (!audioCuesEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      
      const voices = window.speechSynthesis.getVoices();
      const britishVoice = voices.find(v => 
        v.name.includes('George') || 
        v.name.includes('Oliver') || 
        (v.lang === 'en-GB' && v.name.toLowerCase().includes('male'))
      ) || voices.find(v => v.lang.startsWith('en'));
      
      if (britishVoice) utterance.voice = britishVoice;
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  };

  // Trigger Tactile Haptic Vibration
  const triggerHaptic = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      await Haptics.vibrate({ duration: 300 });
    } catch (e) {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
  };

  // Handle Rest Countdown Timer
  useEffect(() => {
    if (isResting && restSeconds !== null && restSeconds > 0) {
      timerIntervalRef.current = setInterval(() => {
        setRestSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setIsResting(false);
            playChimeSound();
            triggerHaptic();
            speakCue(`Rest time elapsed, sir. Commencing set ${currentSet}.`);
            return null;
          }
          if (prev === 4) {
            // Pre-alert countdown beep at 3s
            playChimeSound();
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isResting, restSeconds, currentSet, audioCuesEnabled]);

  // Complete & Log Set
  const handleCompleteSet = () => {
    triggerHaptic();
    playChimeSound();

    const setRecord = {
      setNumber: currentSet,
      exercise: selectedExercise.name,
      weight: weightKg,
      reps: repsCount,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setLoggedSets(prev => [setRecord, ...prev]);
    if (onLogCompletedSet) {
      onLogCompletedSet(setRecord);
    }

    speakCue(`Set ${currentSet} confirmed at ${weightKg} kilos for ${repsCount} reps. ${restDuration} seconds rest initiated.`);

    // Start rest timer
    setRestSeconds(restDuration);
    setIsResting(true);

    // Increment set
    if (currentSet < totalSets) {
      setCurrentSet(prev => prev + 1);
    }
  };

  const skipRest = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setIsResting(false);
    setRestSeconds(null);
    speakCue("Rest timer skipped. Ready for your next set.");
  };

  const adjustRest = (delta) => {
    setRestSeconds(prev => Math.max(10, (prev || restDuration) + delta));
  };

  return (
    <div className="bg-slate-950 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-white font-sans">
      {/* Background Hologram Mesh Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-5 mb-6 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Stark Gym Cockpit
              </span>
              <span className="text-xs text-emerald-400 font-bold flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>Hands-Free Active</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
              Hands-Free Gym HUD & Audio Tracker
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Audio Cues Toggle */}
          <button
            onClick={() => setAudioCuesEnabled(prev => !prev)}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
              audioCuesEnabled 
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm' 
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title={audioCuesEnabled ? 'Vocal Cues & Chime ON' : 'Audio Cues Muted'}
          >
            {audioCuesEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Exit HUD */}
          {onExit && (
            <button
              onClick={onExit}
              className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Return to standard view"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Exercise Picker Quick Chips */}
      <div className="mb-6 relative z-10">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
          <span>Active Movement</span>
          <span className="text-cyan-400">{selectedExercise.targetMuscle}</span>
        </div>
        <div className="flex overflow-x-auto space-x-2 pb-2 scrollbar-none">
          {POPULAR_EXERCISES.map((ex) => (
            <button
              key={ex.name}
              onClick={() => {
                setSelectedExercise(ex);
                setWeightKg(ex.defaultWeight);
                setRepsCount(ex.defaultReps);
                setTotalSets(ex.defaultSets);
                setCurrentSet(1);
                speakCue(`${ex.name} selected. Target ${ex.defaultWeight} kilos for ${ex.defaultReps} reps.`);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all cursor-pointer ${
                selectedExercise.name === ex.name
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 border-cyan-400 shadow-md font-black scale-102'
                  : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              {ex.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main HUD Display Cockpit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Column: Big Telemetry Gauges */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-inner">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-400 tracking-wider">
                Current Set Progression
              </span>
              <span className="text-xs font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-800/60">
                {selectedExercise.name}
              </span>
            </div>

            {/* Giant Set Counter */}
            <div className="my-6 text-center">
              <div className="text-7xl sm:text-8xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400">
                {currentSet}
                <span className="text-3xl sm:text-4xl text-slate-600 font-normal"> / {totalSets}</span>
              </div>
              <div className="text-xs font-mono uppercase tracking-widest text-emerald-400 mt-2">
                Set in progress • Focus on tempo
              </div>
            </div>
          </div>

          {/* Steppers for Weight & Reps */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
            {/* Weight Stepper */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                Working Weight
              </div>
              <div className="text-3xl font-black text-white font-mono mb-3">
                {weightKg} <span className="text-base text-cyan-400 font-normal">kg</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setWeightKg(w => Math.max(1, w - 2.5))}
                  className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold border border-slate-800 cursor-pointer active:scale-95"
                >
                  -2.5
                </button>
                <button
                  onClick={() => setWeightKg(w => w + 2.5)}
                  className="flex-1 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-xl text-xs font-bold border border-cyan-500/40 cursor-pointer active:scale-95"
                >
                  +2.5
                </button>
              </div>
            </div>

            {/* Reps Stepper */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                Target Reps
              </div>
              <div className="text-3xl font-black text-white font-mono mb-3">
                {repsCount} <span className="text-base text-emerald-400 font-normal">reps</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setRepsCount(r => Math.max(1, r - 1))}
                  className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold border border-slate-800 cursor-pointer active:scale-95"
                >
                  -1
                </button>
                <button
                  onClick={() => setRepsCount(r => r + 1)}
                  className="flex-1 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold border border-emerald-500/40 cursor-pointer active:scale-95"
                >
                  +1
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Rest Timer & ARC REACTOR Action Button */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          
          {/* Rest Period Hologram Display */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-inner relative overflow-hidden flex-1 flex flex-col justify-center items-center text-center">
            {isResting && restSeconds !== null ? (
              <div className="space-y-3 w-full">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono uppercase tracking-wider animate-pulse">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Resting Between Sets</span>
                </div>
                
                <div className="text-6xl sm:text-7xl font-black font-mono tracking-tighter text-cyan-300 drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                  {Math.floor(restSeconds / 60)}:{String(restSeconds % 60).padStart(2, '0')}
                </div>

                {/* Rest Adjusters */}
                <div className="flex items-center justify-center space-x-2 pt-2">
                  <button
                    onClick={() => adjustRest(-15)}
                    className="px-3 py-1 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer"
                  >
                    -15s
                  </button>
                  <button
                    onClick={skipRest}
                    className="px-4 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold hover:bg-rose-500/30 cursor-pointer"
                  >
                    Skip Rest
                  </button>
                  <button
                    onClick={() => adjustRest(30)}
                    className="px-3 py-1 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer"
                  >
                    +30s
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                  <Flame className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Ready for Active Set</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Complete your repetitions, then tap the Arc Reactor or say <span className="text-cyan-300 font-bold">"Jarvis, set done"</span>.
                  </p>
                </div>
                {/* Default Rest Preset Chips */}
                <div className="flex items-center justify-center space-x-2 pt-1">
                  {[60, 90, 120].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setRestDuration(sec)}
                      className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                        restDuration === sec
                          ? 'bg-cyan-500 text-slate-950 font-black'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {sec}s rest
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* GIANT ARC REACTOR COMPLETE BUTTON */}
          <button
            onClick={handleCompleteSet}
            className="w-full py-6 rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-slate-950 font-black text-xl tracking-tight shadow-xl shadow-emerald-500/25 hover:shadow-cyan-500/40 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center space-x-3 group relative overflow-hidden"
          >
            <div className="w-8 h-8 rounded-full bg-slate-950/20 flex items-center justify-center group-hover:rotate-90 transition-transform">
              <Check className="w-5 h-5 text-slate-950 stroke-[3]" />
            </div>
            <span>LOG SET {currentSet} & START REST</span>
          </button>
        </div>
      </div>

      {/* Spoken Voice Commands Helper Bar */}
      <div className="mt-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 relative z-10">
        <div className="flex items-center space-x-2 text-cyan-400 font-bold">
          <Zap className="w-4 h-4" />
          <span>Hands-Free Voice Command Reference:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300">
            "Jarvis, set done"
          </span>
          <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300">
            "Jarvis, 90 second rest timer"
          </span>
          <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300">
            "Jarvis, switch to workout logger"
          </span>
        </div>
      </div>

      {/* Completed Sets History Drawer */}
      {loggedSets.length > 0 && (
        <div className="mt-6 pt-5 border-t border-slate-800/80 relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase text-slate-400 tracking-wider">
              Sets Completed This Live Session ({loggedSets.length})
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {loggedSets.map((s, idx) => (
              <div 
                key={idx}
                className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white">Set {s.setNumber}: {s.exercise.slice(0, 18)}</div>
                  <div className="text-[11px] font-mono text-cyan-400 mt-0.5">
                    {s.weight} kg × {s.reps} reps
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500">{s.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
