import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Utensils, 
  Droplets, 
  Dumbbell, 
  Scale, 
  Watch, 
  MessageSquare,
  Volume2
} from 'lucide-react';
import { api } from '../api';

export default function UniversalVoiceAssistant({ selectedDate, onActionCompleted, isOpen: externalIsOpen, onClose: externalOnClose, onOpen: externalOnOpen }) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [manualText, setManualText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const recognitionRef = useRef(null);

  // Allow opening via global window event
  useEffect(() => {
    const handleGlobalTrigger = () => handleOpen();
    window.addEventListener('open-universal-voice', handleGlobalTrigger);
    return () => window.removeEventListener('open-universal-voice', handleGlobalTrigger);
  }, []);

  // Web Audio Beep Cue for recording start/stop
  const playBeep = (freq = 880, duration = 0.1) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio cue error ignored
    }
  };

  // Start Speech Recognition
  const startListening = () => {
    setErrorMsg('');
    setResult(null);
    setTranscript('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMsg('Speech Recognition is not supported by your current browser. You can type what you did below!');
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Indian English: recognizes South Indian dishes and gym phrases accurately

      recognition.onstart = () => {
        setIsListening(true);
        playBeep(700, 0.12);
      };

      recognition.onresult = (event) => {
        let current = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        setTranscript(current);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition warning:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMsg('Microphone access was denied. Please allow microphone permission in browser settings, or type below!');
        } else if (event.error === 'no-speech') {
          setErrorMsg('No speech detected. Tap Speak to try again or click an example below.');
        } else {
          setErrorMsg(`Voice recognition: ${event.error}. You can also type below!`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        playBeep(500, 0.15);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      setIsListening(false);
      setErrorMsg('Could not start microphone. Please type what you did below!');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setIsListening(false);
  };

  // Handle Opening Modal
  const handleOpen = () => {
    if (externalOnOpen) externalOnOpen();
    else setInternalIsOpen(true);
    setResult(null);
    setErrorMsg('');
    setTranscript('');
    setManualText('');
    // Auto-start listening on open
    setTimeout(() => {
      startListening();
    }, 200);
  };

  // Handle Closing Modal
  const handleClose = () => {
    stopListening();
    if (externalOnClose) externalOnClose();
    else setInternalIsOpen(false);
    setResult(null);
  };

  // Execute Voice Command via Backend Universal NLP
  const handleExecute = async (textToRun) => {
    const query = (textToRun || transcript || manualText).trim();
    if (!query) return;

    stopListening();
    setIsProcessing(true);
    setErrorMsg('');
    setResult(null);

    try {
      const res = await api.universalVoiceCommand(query, selectedDate);
      if (res.success) {
        setResult(res);
        playBeep(1040, 0.25);
        if (typeof onActionCompleted === 'function') {
          onActionCompleted(res);
        }
        // Auto-close modal after 3 seconds on success
        setTimeout(() => {
          if (externalOnClose) externalOnClose();
          else setInternalIsOpen(false);
        }, 3200);
      } else {
        setErrorMsg(res.error || 'Failed to process voice command.');
      }
    } catch (err) {
      setErrorMsg('Connection error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Icon corresponding to the executed section
  const getSectionIcon = (section) => {
    switch (section) {
      case 'diet': return <Utensils className="w-5 h-5 text-emerald-400" />;
      case 'water': return <Droplets className="w-5 h-5 text-blue-400" />;
      case 'workouts': return <Dumbbell className="w-5 h-5 text-amber-400" />;
      case 'weight': return <Scale className="w-5 h-5 text-teal-400" />;
      case 'fastrack': return <Watch className="w-5 h-5 text-cyan-400" />;
      case 'coach': return <MessageSquare className="w-5 h-5 text-sky-400" />;
      default: return <Sparkles className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <>
      {/* 1. PERSISTENT FLOATING TRIGGER BUTTON (Present on Every Screen) */}
      <div className="fixed bottom-20 sm:bottom-6 right-5 z-40 flex items-center group">
        <button
          onClick={handleOpen}
          className="relative flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-emerald-300/40"
          title="Universal Voice Assistant: Speak to log meals, water, workouts, or weight"
        >
          {/* Animated pulsing wave ring */}
          <span className="absolute -inset-1 rounded-2xl bg-emerald-400/30 animate-pulse blur-sm -z-10 pointer-events-none" />
          <Mic className="w-5 h-5 shrink-0 animate-bounce" />
          <span className="text-xs font-black tracking-wide hidden sm:inline">Voice Log</span>
        </button>
      </div>

      {/* 2. UNIVERSAL VOICE COMMAND MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
          <div 
            className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Universal AI Voice Engine</h3>
                  <p className="text-[10px] text-slate-400">Tell me what you did — auto-logs to meals, water, workouts, or weight</p>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Central Microphone & Audio Waveform */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
              <div className="relative inline-block my-1">
                {isListening && (
                  <div className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping scale-150 pointer-events-none" />
                )}
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all shadow-2xl cursor-pointer mx-auto ${
                    isListening
                      ? 'bg-rose-500 text-white shadow-rose-500/50 scale-105 animate-pulse'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-8 h-8" />
                      <span className="text-[10px] font-black uppercase mt-1">Listening...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-8 h-8" />
                      <span className="text-[10px] font-black uppercase mt-1">Tap to Speak</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold text-white">
                  {isListening ? '🎙️ Listening to your voice... Speak naturally' : 'Tap the microphone or type below'}
                </div>
                <div className="text-[11px] text-slate-400">
                  Works across all sections: Meals, Water, Gym Workouts, Weight, and Steps
                </div>
              </div>

              {/* Live Transcript Display */}
              {transcript && (
                <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-3.5 text-left space-y-2.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Recognized Speech:</span>
                  <p className="text-xs font-bold text-emerald-300 italic bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    &ldquo;{transcript}&rdquo;
                  </p>
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      disabled={isProcessing}
                      onClick={() => handleExecute(transcript)}
                      className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isProcessing ? 'Processing & Adding...' : 'Add to App Now'}</span>
                    </button>
                    <button
                      onClick={startListening}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs flex items-center space-x-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Success Result Confirmation */}
              {result && (
                <div className="bg-emerald-500/15 border border-emerald-500/40 p-4 rounded-xl text-left space-y-2 animate-in fade-in">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      Successfully Logged!
                    </span>
                  </div>
                  <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 flex items-start space-x-3">
                    <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 shrink-0">
                      {getSectionIcon(result.section)}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-emerald-300">{result.feedback}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 capitalize">Target Section: {result.section}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Manual Typewriter Input (Fail-safe for any browser) */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleExecute(manualText); }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Or type what you did (e.g. 'I drank 500ml water' or '3 idlis 2 boiled eggs')..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!manualText.trim() || isProcessing}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-1 transition-all cursor-pointer shadow-md"
              >
                <span>Add</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Quick 1-Tap Example Utterances for All Sections */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Tap an example to test across sections:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {[
                  { text: '3 idlis with sambar and 2 boiled eggs', section: 'Diet', icon: Utensils, color: 'text-emerald-400' },
                  { text: 'I drank 500 ml water', section: 'Water', icon: Droplets, color: 'text-blue-400' },
                  { text: 'Barbell bench press 3 sets 10 reps 60kg', section: 'Workout', icon: Dumbbell, color: 'text-amber-400' },
                  { text: 'My scale weight is 110.5 kg', section: 'Weight', icon: Scale, color: 'text-teal-400' }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setTranscript(item.text);
                        handleExecute(item.text);
                      }}
                      className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 rounded-xl flex items-center space-x-2 text-xs text-slate-300 transition-all text-left cursor-pointer"
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${item.color}`} />
                      <div className="truncate flex-1">
                        <span className="text-[10px] font-bold text-slate-500 block leading-tight">{item.section}</span>
                        <span className="text-[11px] font-semibold text-slate-200 truncate block">&ldquo;{item.text}&rdquo;</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
