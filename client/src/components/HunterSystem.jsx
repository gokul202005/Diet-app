import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import ConfirmModal from './ConfirmModal';
import { 
  Shield, 
  Zap, 
  Flame, 
  Award, 
  Crosshair, 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  Skull, 
  RefreshCw,
  TrendingUp,
  Dumbbell,
  Footprints,
  HeartPulse,
  Brain,
  RotateCcw,
  Lock
} from 'lucide-react';
import { api } from '../api';

// Web Audio API Synthesizer for 100% reliable in-browser sound effects
function playSound(type) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'claim') {
      // High-pitched crystal level chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.3); // C6
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'levelup') {
      // Epic dual-tone power-up fanfare
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.08 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.4);
      });
    }
  } catch (e) {}
}

export default function HunterSystem({ selectedDate, currentUser }) {
  const getInitialHunter = () => {
    try {
      const cached = localStorage.getItem('agy_hunter_profile');
      if (cached) return JSON.parse(cached);
    } catch {}
    return {
      userId: currentUser?.id || '',
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      rank: 'E-Rank Hunter',
      title: 'Awakened Novice',
      totalQuestsCompleted: 0,
      claimedQuests: [],
      stats: { str: 40, agi: 45, vit: 35, int: 50, per: 40 },
      quests: [
        {
          id: 'quest_agi_steps',
          stat: 'AGI',
          title: 'Agility Trial: 10,000 Steps',
          description: 'Traverse the dungeon realm with 10k physical steps',
          target: 10000,
          current: 0,
          isCompleted: false,
          xp: 40
        },
        {
          id: 'quest_vit_protein',
          stat: 'VIT',
          title: 'Vitality Trial: Hit Protein Target',
          description: 'Consume daily target protein to regenerate muscle tissue',
          target: 130,
          current: 0,
          isCompleted: false,
          xp: 40
        },
        {
          id: 'quest_str_gym',
          stat: 'STR',
          title: 'Strength Trial: Slay the Iron',
          description: 'Complete at least 1 gym workout session today',
          target: 1,
          current: 0,
          isCompleted: false,
          xp: 40
        },
        {
          id: 'quest_per_log',
          stat: 'PER',
          title: 'Perception Trial: Full Meal Logging',
          description: 'Log all 3 daily South Indian meals with awareness',
          target: 3,
          current: 0,
          isCompleted: false,
          xp: 30
        }
      ],
      isPenaltyActive: false,
      penaltyDescription: '50 Push-Ups or 15-Minute Night Walk to evade the penalty zone!'
    };
  };

  const [hunter, setHunter] = useState(getInitialHunter);
  const [loading, setLoading] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [claimingId, setClaimingId] = useState(null);
  const [levelUpAlert, setLevelUpAlert] = useState(false);
  const [isAwakening, setIsAwakening] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [awakeningMessage, setAwakeningMessage] = useState('');

  const handleActivateAwakening = async () => {
    try {
      setIsAwakening(true);
      const res = await api.awakenHunter();
      if (res.success) {
        playSound('levelup');
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
        setAwakeningMessage(res.message || 'System: Hunter Awakening Initialized! Welcome to Awakened Hunter Status.');
        setLevelUpAlert(true);
        setTimeout(() => setLevelUpAlert(false), 6000);
        await fetchHunterData();
      }
    } catch (e) {
      console.warn('Awakening error:', e);
    } finally {
      setIsAwakening(false);
    }
  };

  const handleResetHunter = async () => {
    try {
      const res = await api.resetHunter();
      if (res.success) {
        setShowResetConfirm(false);
        await fetchHunterData();
        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast('Hunter System progression reset to Level 1.', 'info', 'Progression Reset');
        }
      }
    } catch (e) {
      console.warn('Reset error:', e);
    }
  };

  const fetchHunterData = async () => {
    try {
      setLoading(true);
      setSyncError('');
      const res = await api.getHunterStats(selectedDate);
      if (res && res.success && res.hunter) {
        setHunter(res.hunter);
        try { localStorage.setItem('agy_hunter_profile', JSON.stringify(res.hunter)); } catch {}
      } else if (res && res.error) {
        setSyncError(res.error);
      }
    } catch (e) {
      console.warn('Hunter stats sync notice:', e);
      setSyncError('Could not sync live Hunter stats from cloud.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHunterData();
  }, [selectedDate, currentUser?.id]);

  const handleClaimQuest = async (questId) => {
    if (claimingId) return;
    setClaimingId(questId);
    playSound('claim');
    try {
      const res = await api.claimHunterQuest(questId, selectedDate);
      if (res.success) {
        if (res.leveledUp) {
          playSound('levelup');
          setLevelUpAlert(true);
          setTimeout(() => setLevelUpAlert(false), 5000);
        }
        await fetchHunterData();
      }
    } catch (e) {
      console.error('Claim error:', e);
    } finally {
      setClaimingId(null);
    }
  };

  const stats = hunter?.stats || { str: 45, agi: 50, vit: 40, int: 55, per: 45 };

  // Generate 5-Point Pentagon Radar Chart Coordinates
  const size = 260;
  const center = size / 2;
  const radius = 95;

  // Angles: Top (STR), Top-Right (AGI), Bottom-Right (VIT), Bottom-Left (INT), Top-Left (PER)
  const statKeys = [
    { key: 'str', label: 'STR', full: 'Strength', icon: Dumbbell, color: '#ef4444' },
    { key: 'agi', label: 'AGI', full: 'Agility', icon: Footprints, color: '#3b82f6' },
    { key: 'vit', label: 'VIT', full: 'Vitality', icon: HeartPulse, color: '#10b981' },
    { key: 'int', label: 'INT', full: 'Discipline', icon: Brain, color: '#8b5cf6' },
    { key: 'per', label: 'PER', full: 'Perception', icon: Crosshair, color: '#f59e0b' }
  ];

  const getCoordinates = (value, index, total = 5) => {
    const angle = (Math.PI * 2 / total) * index - (Math.PI / 2);
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  // Outer web polygon points
  const outerWebPoints = statKeys.map((_, i) => {
    const coord = getCoordinates(100, i);
    return `${coord.x},${coord.y}`;
  }).join(' ');

  const midWebPoints = statKeys.map((_, i) => {
    const coord = getCoordinates(50, i);
    return `${coord.x},${coord.y}`;
  }).join(' ');

  // Current Hunter stat points
  const currentStatPoints = statKeys.map((s, i) => {
    const val = stats[s.key] || 30;
    const coord = getCoordinates(val, i);
    return `${coord.x},${coord.y}`;
  }).join(' ');

  // Rank Badge Styles
  const getRankBadgeColor = (rank) => {
    if (rank.includes('S-Rank')) return 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-500/20';
    if (rank.includes('A-Rank')) return 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-purple-500/20';
    if (rank.includes('B-Rank')) return 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-blue-500/20';
    if (rank.includes('C-Rank')) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20';
    return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-cyan-500/20';
  };

  const currentLevel = hunter?.level || 1;
  const currentXP = hunter?.xp || 0;
  const xpNeeded = hunter?.xpToNextLevel || (currentLevel * 100);
  const xpPercent = Math.min(100, Math.round((currentXP / xpNeeded) * 100));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* LEVEL UP CELEBRATION OVERLAY */}
      {levelUpAlert && (
        <div className="p-4 bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 rounded-2xl text-white shadow-2xl flex items-center justify-between animate-bounce">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-8 h-8 text-yellow-300 animate-spin" />
            <div>
              <div className="text-xs uppercase tracking-widest font-black text-cyan-200">System Notification</div>
              <div className="text-xl font-black">HUNTER LEVEL UP! You reached Level {currentLevel}!</div>
            </div>
          </div>
          <span className="px-3 py-1 bg-white/20 rounded-xl text-xs font-bold uppercase tracking-wider">
            All Attributes Increased!
          </span>
        </div>
      )}

      {/* HUNTER IDENTITY HERO CARD */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/70 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border shadow-lg ${getRankBadgeColor(hunter?.rank || 'E-Rank')}`}>
                ⚔️ {hunter?.rank || 'E-Rank Hunter'}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                Title: <strong className="text-cyan-300">{hunter?.title || 'Awakened Novice'}</strong>
              </span>

              {/* ACTIVATE AWAKENING BUTTON / STATUS BADGE / LOCKED BADGE */}
              {hunter?.canAwaken ? (
                <button
                  onClick={handleActivateAwakening}
                  disabled={isAwakening}
                  className="px-3.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 via-purple-600 to-cyan-500 text-white font-black text-xs tracking-wider uppercase shadow-lg shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center space-x-1.5 animate-pulse border border-amber-300/40"
                  title="Level breakthrough ready! Click to activate Hunter Awakening"
                >
                  <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                  <span>{isAwakening ? 'Awakening...' : '⚡ Activate Awakening'}</span>
                </button>
              ) : hunter?.isAwakened ? (
                <span className="px-2.5 py-1 rounded-xl bg-purple-950/80 text-purple-300 border border-purple-500/50 text-[11px] font-black tracking-wider uppercase flex items-center space-x-1 shadow-md shadow-purple-500/30">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
                  <span>Awakened (Next at Lv. {(hunter?.level || 1) + 1})</span>
                </span>
              ) : (
                <div 
                  className="px-2.5 py-1 rounded-xl bg-slate-900/90 text-slate-500 border border-slate-800 text-[11px] font-bold uppercase tracking-wider flex items-center space-x-1.5 cursor-not-allowed select-none"
                  title="Complete daily trials and reach Level 2 to unlock your Awakening Breakthrough"
                >
                  <Lock className="w-3 h-3 text-slate-600" />
                  <span>Awakening Locked (Reach Lv. 2)</span>
                </div>
              )}

              {/* SYNC & RESET PROGRESS BUTTONS */}
              <div className="flex items-center space-x-1.5 ml-auto">
                <button
                  onClick={fetchHunterData}
                  disabled={loading}
                  className="p-1 rounded-lg text-slate-500 hover:text-cyan-400 transition-colors flex items-center space-x-1 text-xs cursor-pointer"
                  title="Sync Hunter Stats"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
                  <span className="text-[10px] hidden sm:inline">{loading ? 'Syncing...' : 'Sync'}</span>
                </button>

                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-colors flex items-center space-x-1 text-xs cursor-pointer"
                  title="Reset Hunter Progression back to Level 1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="text-[10px] hidden sm:inline">Reset</span>
                </button>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400 tracking-tight">
              {currentUser?.name || 'Hunter Gokul'}
            </h1>

            <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
              Your real-world biological training, South Indian nutrition, and Fastrack watch steps fuel your Awakening Stats in real-time.
            </p>
          </div>

          {/* Level & XP Progress Circle */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl min-w-[240px] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Awakening Level</span>
              <span className="text-2xl font-black text-cyan-400">Lv. {currentLevel}</span>
            </div>

            {/* XP Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-slate-400">Experience Points (XP)</span>
                <span className="text-cyan-300">{currentXP} / {xpNeeded} XP</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-700 shadow-md shadow-cyan-500/50"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>

            <div className="text-[10px] text-slate-500 flex justify-between pt-1 border-t border-slate-800/60">
              <span>Completed Quests: <strong>{hunter?.totalQuestsCompleted || 0}</strong></span>
              <span className="text-emerald-400 font-semibold">Active Awakening</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-COLUMN GRID: 5-AXIS RADAR CHART & DAILY HUNTER QUESTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: 5-AXIS PENTAGON RADAR CHART (5 COLS) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-between space-y-4">
          <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-black text-slate-200 tracking-wider uppercase">
                5-Stat Radar Profile
              </h2>
            </div>
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-800/40">
              Live Biometrics
            </span>
          </div>

          {/* SVG PENTAGON RADAR */}
          <div className="relative py-2">
            <svg width={size} height={size} className="overflow-visible">
              {/* Outer Boundary Web */}
              <polygon
                points={outerWebPoints}
                fill="none"
                stroke="#334155"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* Mid-tier Boundary Web (50%) */}
              <polygon
                points={midWebPoints}
                fill="none"
                stroke="#1e293b"
                strokeWidth="1"
              />

              {/* Axis Spoke Lines */}
              {statKeys.map((_, i) => {
                const coord = getCoordinates(100, i);
                return (
                  <line
                    key={i}
                    x1={center}
                    y1={center}
                    x2={coord.x}
                    y2={coord.y}
                    stroke="#1e293b"
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* Current Hunter Polygon */}
              <polygon
                points={currentStatPoints}
                fill="url(#radarGradient)"
                stroke="#06b6d4"
                strokeWidth="2.5"
                className="transition-all duration-700 filter drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]"
              />

              {/* Vertex Glow Dots */}
              {statKeys.map((s, i) => {
                const val = stats[s.key] || 30;
                const coord = getCoordinates(val, i);
                return (
                  <circle
                    key={i}
                    cx={coord.x}
                    cy={coord.y}
                    r="4"
                    fill="#38bdf8"
                    stroke="#0f172a"
                    strokeWidth="2"
                    className="transition-all duration-700"
                  />
                );
              })}

              {/* Vertex Labels */}
              {statKeys.map((s, i) => {
                const coord = getCoordinates(120, i);
                return (
                  <text
                    key={i}
                    x={coord.x}
                    y={coord.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={s.color}
                    fontSize="11"
                    fontWeight="800"
                    className="font-mono tracking-wider"
                  >
                    {s.label}
                  </text>
                );
              })}

              {/* Gradients */}
              <defs>
                <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.35" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Stat Breakdown Pills */}
          <div className="grid grid-cols-5 gap-1.5 w-full pt-3 border-t border-slate-800/80">
            {statKeys.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.key} className="p-2 bg-slate-950/70 border border-slate-800/80 rounded-xl text-center flex flex-col items-center">
                  <Icon className="w-3.5 h-3.5 mb-1" style={{ color: s.color }} />
                  <span className="text-[10px] font-bold text-slate-400">{s.label}</span>
                  <span className="text-xs font-black text-white">{stats[s.key] || 0}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: DAILY QUESTS & PENALTY SYSTEM (7 COLS) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <h2 className="text-sm font-black text-slate-200 tracking-wider uppercase">
                Daily Hunter Quests
              </h2>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              Resets at 00:00 IST
            </span>
          </div>

          {/* PENALTY WARNING BANNER */}
          {hunter?.isPenaltyActive ? (
            <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-2xl flex items-center space-x-3 text-red-200 text-xs">
              <Skull className="w-5 h-5 text-red-400 shrink-0 animate-pulse" />
              <div className="space-y-0.5">
                <strong className="text-red-300 font-bold uppercase tracking-wider">Penalty Zone Active!</strong>
                <p className="text-[11px] text-red-300/80">{hunter.penaltyDescription}</p>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-slate-950/50 border border-slate-800/60 rounded-xl flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Midnight Penalty Rules:</span>
              </span>
              <span className="text-[11px] text-amber-300/90 font-medium">Complete daily trials to evade penalty push-ups</span>
            </div>
          )}

          {/* QUEST CARDS LIST */}
          <div className="space-y-3">
            {hunter?.quests?.map(quest => {
              const isClaimed = hunter.claimedQuests?.includes(quest.id);
              const progressPct = Math.min(100, Math.round((quest.current / quest.target) * 100));

              return (
                <div 
                  key={quest.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isClaimed 
                      ? 'bg-slate-950/50 border-slate-800/40 opacity-75' 
                      : quest.isCompleted 
                        ? 'bg-gradient-to-r from-cyan-950/30 to-indigo-950/30 border-cyan-500/40 shadow-lg shadow-cyan-950/20' 
                        : 'bg-slate-950/80 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-800 text-cyan-300 border border-slate-700">
                          {quest.stat}
                        </span>
                        <h3 className="text-xs font-bold text-slate-200">{quest.title}</h3>
                      </div>
                      <p className="text-[11px] text-slate-400">{quest.description}</p>
                    </div>

                    {/* Claim Button / Status */}
                    {isClaimed ? (
                      <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Claimed</span>
                      </span>
                    ) : quest.isCompleted ? (
                      <button
                        onClick={() => handleClaimQuest(quest.id)}
                        disabled={claimingId === quest.id}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-black text-xs rounded-xl shadow-md shadow-cyan-500/30 flex items-center space-x-1.5 cursor-pointer transform hover:scale-105 active:scale-95 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" />
                        <span>{claimingId === quest.id ? 'Absorbing...' : `Claim +${quest.xp} XP`}</span>
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 bg-slate-800/60 border border-slate-700/60 text-slate-400 text-xs font-semibold rounded-xl">
                        In Progress
                      </span>
                    )}
                  </div>

                  {/* Progress Indicator */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-500">Trial Progress</span>
                      <span className={quest.isCompleted ? 'text-emerald-400' : 'text-slate-400'}>
                        {quest.current.toLocaleString()} / {quest.target.toLocaleString()} ({progressPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          quest.isCompleted 
                            ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' 
                            : 'bg-cyan-600'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* RESET CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetHunter}
        title="Reset Hunter Progression?"
        message="Are you sure you want to reset your Hunter level back to Level 1 and clear your claimed quests? This allows you to start your awakening journey completely fresh."
        confirmText="Yes, Reset to Level 1"
        cancelText="Keep My Level"
        danger={true}
      />
    </div>
  );
}
