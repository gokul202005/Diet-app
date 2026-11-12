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
  Lock,
  Swords,
  Crown,
  Trophy,
  Compass,
  Check,
  ChevronRight,
  Ghost,
  Eye,
  Users
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
    } else if (type === 'boss_defeat') {
      // Deep orchestral victory strike
      [130, 260, 390, 520, 780, 1040].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.09 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.09);
        osc.stop(ctx.currentTime + idx * 0.09 + 0.6);
      });
    } else if (type === 'arise') {
      // Dark Monarch ARISE (일어서라) sub-bass drop & spectral resonance
      [60, 90, 140, 210, 315, 420, 630, 840].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx < 2 ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);
        gain.gain.setValueAtTime(0.35, ctx.currentTime + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + idx * 0.09 + 0.9);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.09);
        osc.stop(ctx.currentTime + idx * 0.09 + 0.9);
      });
    }
  } catch (e) {}
}

// Real Sung Jin-woo "ARISE" (일어서라) Voice Audio Clip (Solo Leveling)
function playRealSungJinWooArise() {
  if (typeof window === 'undefined') return;
  try {
    const audio = new Audio('/sounds/arise.mp3');
    audio.volume = 1.0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn('Real Sung Jin-woo arise audio playback notice:', err);
      });
    }
  } catch (e) {
    console.warn('Real Sung Jin-woo audio exception:', e);
  }
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
      title: 'Novice Hunter',
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

  // Solo Leveling Dungeon Gates & Boss Raids State
  const [activeHunterTab, setActiveHunterTab] = useState('trials'); // 'trials' | 'raids' | 'shadows' | 'trophies'
  const [dungeonData, setDungeonData] = useState(null);
  const [selectedGateId, setSelectedGateId] = useState('gate_e_goblin');
  const [loadingDungeons, setLoadingDungeons] = useState(false);
  const [isEnteringGate, setIsEnteringGate] = useState(false);
  const [isClaimingBoss, setIsClaimingBoss] = useState(false);
  const [extractingGateId, setExtractingGateId] = useState(null);
  const [ariseCinematic, setAriseCinematic] = useState(null);

  const fetchDungeons = async () => {
    try {
      setLoadingDungeons(true);
      const res = await api.getHunterDungeons(selectedDate);
      if (res && res.success) {
        setDungeonData(res);
        if (res.activeGateId) {
          setSelectedGateId(res.activeGateId);
        }
      }
    } catch (e) {
      console.warn('Dungeon fetch error:', e);
    } finally {
      setLoadingDungeons(false);
    }
  };

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
        await Promise.all([fetchHunterData(), fetchDungeons()]);
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
        await Promise.all([fetchHunterData(), fetchDungeons()]);
        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast('Hunter System progression reset to Level 1.', 'info', 'Progression Reset');
        }
      }
    } catch (e) {
      console.warn('Reset error:', e);
    }
  };

  const handleEnterGate = async (gateId) => {
    setIsEnteringGate(true);
    try {
      const res = await api.enterHunterGate(gateId);
      if (res && res.success) {
        setSelectedGateId(gateId);
        playSound('claim');
        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast(res.message, 'info', 'Dungeon Gate');
        }
        await fetchDungeons();
      } else {
        throw new Error(res?.error || 'Failed to enter Gate');
      }
    } catch (e) {
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast(e.message, 'warning', 'Gate Locked');
      }
    } finally {
      setIsEnteringGate(false);
    }
  };

  const handleClaimBoss = async (gateId) => {
    setIsClaimingBoss(true);
    try {
      const res = await api.claimBossRaid(gateId, selectedDate);
      if (res && res.success) {
        playSound('boss_defeat');
        confetti({ particleCount: 160, spread: 100, origin: { y: 0.4 } });
        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast(
            `BOSS SLAIN! Unlocked Title "${res.unlockedTitle}" & Artifact "${res.artifact?.name}" (+${res.xpGained} XP)`,
            'success',
            'Raid Victory'
          );
        }
        if (res.leveledUp) {
          setLevelUpAlert(true);
          setTimeout(() => setLevelUpAlert(false), 5000);
        }
        await Promise.all([fetchHunterData(), fetchDungeons()]);
      } else {
        throw new Error(res?.error || 'Cannot claim boss raid');
      }
    } catch (e) {
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast(e.message, 'error', 'Raid Alert');
      }
    } finally {
      setIsClaimingBoss(false);
    }
  };

  const handleEquipTitle = async (title) => {
    try {
      const res = await api.equipHunterTitle(title);
      if (res && res.success) {
        playSound('claim');
        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast(`Title equipped: ${title}`, 'success', 'Title Changed');
        }
        await Promise.all([fetchHunterData(), fetchDungeons()]);
      }
    } catch (e) {
      console.warn('Equip error:', e);
    }
  };

  const handleExtractShadow = async (gateId) => {
    setExtractingGateId(gateId);
    try {
      playRealSungJinWooArise();
      const res = await api.extractShadow(gateId);
      if (res && res.success) {
        confetti({ 
          particleCount: 220, 
          spread: 120, 
          origin: { y: 0.4 }, 
          colors: ['#a855f7', '#6366f1', '#06b6d4', '#38bdf8'] 
        });
        setAriseCinematic({
          active: true,
          shadow: res.shadow,
          message: res.message
        });
        if (typeof window !== 'undefined' && window.showToast) {
          window.showToast(`ARISE! (일어서라) - ${res.shadow.name} joined your Shadow Legion!`, 'success', 'Shadow Extraction');
        }
        await Promise.all([fetchHunterData(), fetchDungeons()]);
      } else {
        throw new Error(res?.error || 'Extraction failed');
      }
    } catch (e) {
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast(e.message, 'warning', 'Extraction Incomplete');
      }
    } finally {
      setExtractingGateId(null);
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
    fetchDungeons();
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
                Title: <strong className="text-cyan-300">{hunter?.title || 'Novice Hunter'}</strong>
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

      {/* HUNTER SYSTEM TABS */}
      <div className="flex items-center space-x-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl overflow-x-auto">
        <button
          onClick={() => setActiveHunterTab('trials')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeHunterTab === 'trials'
              ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-md shadow-cyan-500/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Daily Trials & Radar</span>
        </button>

        <button
          onClick={() => setActiveHunterTab('raids')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeHunterTab === 'raids'
              ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-md shadow-rose-500/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Swords className="w-3.5 h-3.5 text-rose-400" />
          <span>Dungeon Gates & Boss Raids</span>
          {dungeonData?.gates?.some(g => g.isDefeated && !g.isConquered) && (
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveHunterTab('shadows')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeHunterTab === 'shadows'
              ? 'bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-900 text-white shadow-md shadow-purple-600/30 border border-purple-400/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Ghost className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
          <span>Shadow Army (일어서라)</span>
          {(dungeonData?.shadowArmy?.length || 0) > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-purple-500/30 text-purple-200 border border-purple-400/40 font-mono">
              {dungeonData?.shadowArmy?.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveHunterTab('trophies')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeHunterTab === 'trophies'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Trophy Hall & S-Rank Artifacts</span>
          {(dungeonData?.artifacts?.length || 0) > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-400/20 text-amber-300 font-mono">
              {dungeonData?.artifacts?.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 2: DUNGEON GATES & BOSS RAIDS */}
      {activeHunterTab === 'raids' && (
        <div className="space-y-6">
          
          {/* LIVE DAMAGE POWER BAR BANNER */}
          <div className="bg-gradient-to-r from-slate-900 via-rose-950/40 to-purple-950/40 border border-rose-500/30 rounded-3xl p-5 shadow-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-500/20 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 animate-pulse">
                  <Swords className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Today's Hunter Battle Power
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Real physical effort automatically inflicts damage upon active Dungeon Bosses
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-rose-400 font-mono">
                  {(dungeonData?.damageStats?.totalDamage || 0).toLocaleString()}
                </span>
                <span className="text-xs text-rose-300 font-bold ml-1 uppercase">DMG</span>
              </div>
            </div>

            {/* Damage Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs pt-1">
              <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl text-center">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Push-Ups / Calisthenics</span>
                <span className="text-xs font-black text-cyan-400 font-mono">+{(dungeonData?.damageStats?.pushupDamage || 0)} DMG</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">({(dungeonData?.damageStats?.calisthenicsReps || 0)} Reps)</span>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl text-center">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Step Traversal</span>
                <span className="text-xs font-black text-emerald-400 font-mono">+{(dungeonData?.damageStats?.stepDamage || 0)} DMG</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">({(dungeonData?.damageStats?.steps || 0).toLocaleString()} Steps)</span>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl text-center">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Gym Workouts</span>
                <span className="text-xs font-black text-amber-400 font-mono">+{(dungeonData?.damageStats?.workoutDamage || 0)} DMG</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">(Sessions)</span>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl text-center">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Protein Intake</span>
                <span className="text-xs font-black text-purple-400 font-mono">+{(dungeonData?.damageStats?.proteinDamage || 0)} DMG</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">({(dungeonData?.damageStats?.protein || 0)}g)</span>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Hydration</span>
                <span className="text-xs font-black text-sky-400 font-mono">+{(dungeonData?.damageStats?.waterDamage || 0)} DMG</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">({(dungeonData?.damageStats?.waterMl || 0)}ml)</span>
              </div>
            </div>
          </div>

          {/* GATE SELECTION CARDS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center space-x-2">
                <span>Select Dungeon Gate</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                Level unlocks higher-tier Red Gates
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {dungeonData?.gates?.map(gate => {
                const isSelected = (selectedGateId === gate.id);
                const isRed = gate.gateType === 'red';

                return (
                  <button
                    key={gate.id}
                    onClick={() => handleEnterGate(gate.id)}
                    disabled={!gate.isUnlocked || isEnteringGate}
                    className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      !gate.isUnlocked
                        ? 'opacity-40 bg-slate-950/60 border-slate-900 cursor-not-allowed'
                        : isSelected
                        ? isRed
                          ? 'bg-gradient-to-br from-rose-950/80 to-purple-950/80 border-rose-500 shadow-xl shadow-rose-500/20 scale-[1.02]'
                          : 'bg-gradient-to-br from-cyan-950/80 to-indigo-950/80 border-cyan-400 shadow-xl shadow-cyan-500/20 scale-[1.02]'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          isRed 
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        }`}>
                          {gate.rank} {isRed ? 'RED GATE' : 'BLUE GATE'}
                        </span>
                        {gate.isConquered ? (
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center space-x-1">
                            <Check className="w-3 h-3" />
                            <span>Conquered</span>
                          </span>
                        ) : !gate.isUnlocked ? (
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                        ) : null}
                      </div>

                      <div className="text-2xl mt-2">{gate.avatar}</div>
                      <div className="text-xs font-black text-white mt-1 line-clamp-1">{gate.bossName}</div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">{gate.title}</div>
                    </div>

                    <div className="w-full pt-2 border-t border-slate-800/80">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-slate-400">Boss HP</span>
                        <span className={gate.isDefeated ? 'text-emerald-400' : 'text-rose-400 font-mono'}>
                          {gate.isDefeated ? 'SLAIN (0 HP)' : `${gate.hpRemaining} HP`}
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-1 border border-slate-800">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            gate.isDefeated ? 'bg-emerald-500' : isRed ? 'bg-rose-500' : 'bg-cyan-500'
                          }`}
                          style={{ width: `${gate.damagePercent}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTIVE BOSS RAID ARENA CARD */}
          {(() => {
            const selectedGate = dungeonData?.gates?.find(g => g.id === selectedGateId) || dungeonData?.gates?.[0];
            if (!selectedGate) return null;

            return (
              <div className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 shadow-2xl ${
                selectedGate.gateType === 'red'
                  ? 'bg-gradient-to-br from-slate-950 via-rose-950/40 to-purple-950/50 border-rose-500/50 shadow-rose-950/40'
                  : 'bg-gradient-to-br from-slate-950 via-cyan-950/40 to-indigo-950/50 border-cyan-500/50 shadow-cyan-950/40'
              }`}>
                
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  
                  {/* Boss Details */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        selectedGate.gateType === 'red'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      }`}>
                        ⚔️ {selectedGate.rank} {selectedGate.gateType === 'red' ? 'Extreme Red Gate' : 'Blue Gate Encounter'}
                      </span>
                      <span className="text-xs text-slate-400">
                        Minimum Level: <strong className="text-white">Lv. {selectedGate.minLevel}</strong>
                      </span>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-5xl shrink-0 p-3 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-inner">
                        {selectedGate.avatar}
                      </div>
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                          {selectedGate.bossName}
                        </h2>
                        <p className="text-xs text-slate-300 font-semibold">{selectedGate.bossSubtitle}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Location: {selectedGate.title}</p>
                      </div>
                    </div>

                    {/* Raid Objectives */}
                    <div className="pt-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                        Combat Directives (Real-World Trials)
                      </span>
                      <div className="space-y-1.5">
                        {selectedGate.objectives.map((obj, i) => (
                          <div key={i} className="flex items-center space-x-2 text-xs text-slate-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{obj.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Boss Health Bar & Slay Button */}
                  <div className="lg:max-w-md w-full bg-slate-900/95 border border-slate-800/90 rounded-2xl p-5 space-y-4 shadow-xl">
                    <div>
                      <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                        <span className="text-rose-400 flex items-center space-x-1">
                          <Skull className="w-3.5 h-3.5" />
                          <span>Boss Vitality</span>
                        </span>
                        <span className="font-mono text-white text-sm">
                          {selectedGate.isDefeated ? (
                            <span className="text-emerald-400 font-black">0 / {selectedGate.maxHp} HP (SLAIN!)</span>
                          ) : (
                            `${selectedGate.hpRemaining} / ${selectedGate.maxHp} HP`
                          )}
                        </span>
                      </div>

                      <div className="w-full bg-slate-950 h-4 rounded-full overflow-hidden border border-slate-800 p-0.5">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 shadow-md ${
                            selectedGate.isDefeated 
                              ? 'bg-emerald-500 shadow-emerald-500/50' 
                              : selectedGate.gateType === 'red'
                              ? 'bg-gradient-to-r from-orange-500 to-rose-600 shadow-rose-500/50'
                              : 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-cyan-500/50'
                          }`}
                          style={{ width: `${selectedGate.damagePercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Rewards Preview */}
                    <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5 text-xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Raid Clear Spoils
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="text-cyan-300 font-bold">+{selectedGate.rewards.xp} XP</span>
                        <span className="text-purple-300 font-bold font-mono">Title: {selectedGate.rewards.title}</span>
                      </div>
                      <div className="text-[11px] text-amber-300 flex items-center space-x-1 font-semibold">
                        <span>{selectedGate.rewards.artifact.icon}</span>
                        <span>{selectedGate.rewards.artifact.name}</span>
                        <span className="text-slate-400 font-mono text-[10px]">({selectedGate.rewards.artifact.bonus})</span>
                      </div>
                    </div>

                    {/* Slay & Claim Button or ARISE Shadow Extraction */}
                    {selectedGate.isConquered ? (
                      (() => {
                        const isExtracted = (dungeonData?.shadowArmy || []).some(s => s.gateId === selectedGate.id);
                        return isExtracted ? (
                          <div className="p-3 bg-purple-950/70 border border-purple-500/50 rounded-xl flex items-center justify-between shadow-lg shadow-purple-950/40">
                            <div className="flex items-center space-x-2">
                              <Ghost className="w-4 h-4 text-purple-300 animate-pulse" />
                              <span className="text-xs font-black text-purple-200">Shadow Servant Active</span>
                            </div>
                            <span className="text-[10px] uppercase font-mono font-black text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-lg border border-cyan-500/30">
                              Serving in Legion
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleExtractShadow(selectedGate.id)}
                            disabled={extractingGateId === selectedGate.id}
                            className="w-full py-3 bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-900 hover:from-purple-600 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-purple-600/50 flex items-center justify-center space-x-2 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] transition-all border border-purple-400/50 animate-pulse"
                          >
                            <Ghost className="w-4 h-4 text-purple-300 animate-spin" />
                            <span>{extractingGateId === selectedGate.id ? 'Extracting Shadow...' : '일어서라 (ARISE) — Extract Shadow Soldier'}</span>
                          </button>
                        );
                      })()
                    ) : selectedGate.isDefeated ? (
                      <button
                        onClick={() => handleClaimBoss(selectedGate.id)}
                        disabled={isClaimingBoss}
                        className="w-full py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-emerald-500/30 flex items-center justify-center space-x-2 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] transition-all animate-bounce"
                      >
                        <Sparkles className="w-4 h-4 text-white animate-spin" />
                        <span>{isClaimingBoss ? 'Claiming Victory...' : '⚔️ Slay Boss & Claim Raid Rewards'}</span>
                      </button>
                    ) : (
                      <div className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-xl text-center text-xs text-slate-400 space-y-1">
                        <div className="text-rose-400 font-bold">Boss Vitality Active ({selectedGate.hpRemaining} HP Left)</div>
                        <div className="text-[11px] text-slate-500">
                          Hit push-ups, log meals, or walk steps to inflict the remaining {selectedGate.hpRemaining} damage!
                        </div>
                      </div>
                    )}

                  </div>

                </div>

              </div>
            );
          })()}

        </div>
      )}

      {/* TAB 3: SHADOW ARMY (ARISE / 일어서라) */}
      {activeHunterTab === 'shadows' && (
        <div className="space-y-6">
          
          {/* SHADOW MONARCH LEGION HERO BANNER */}
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-purple-950/80 to-indigo-950/90 border border-purple-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/60">
            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-500/20 flex items-center space-x-1.5">
                    <Ghost className="w-3.5 h-3.5 text-purple-400" />
                    <span>Shadow Monarch Dominion</span>
                  </span>
                  <span className="text-[11px] font-mono text-purple-300/80 bg-slate-950/60 px-2 py-0.5 rounded-lg border border-purple-500/20">
                    그림자 군단 (Shadow Legion)
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-indigo-300 tracking-tight">
                  The Shadow Legion
                </h2>

                <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                  Defeat dungeon bosses and speak the command <strong className="text-purple-300 font-mono">"ARISE" (일어서라)</strong> to resurrect them as immortal shadow soldiers that fight by your side.
                </p>
              </div>

              {/* Legion Stats Card */}
              <div className="bg-slate-900/90 border border-purple-500/30 p-4 rounded-2xl min-w-[220px] space-y-2 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Army Size</span>
                  <span className="text-xl font-black text-purple-300 font-mono">
                    {dungeonData?.shadowArmy?.length || 0} / 5
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-700 shadow-md shadow-purple-500/50"
                    style={{ width: `${Math.min(100, ((dungeonData?.shadowArmy?.length || 0) / 5) * 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-purple-300/80 pt-1 flex justify-between border-t border-slate-800">
                  <span>Monarch Status:</span>
                  <span className="font-bold text-emerald-400">
                    {(dungeonData?.shadowArmy?.length || 0) > 0 ? 'Active Legion Command' : 'No Shadows Extracted Yet'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ACTIVE CUMULATIVE BUFFS BAR */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">
                  Active Shadow Passive Buffs ({dungeonData?.shadowArmy?.length || 0} Active)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Cumulative perks applied automatically
              </span>
            </div>

            {(dungeonData?.shadowArmy?.length || 0) === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 italic">
                Defeat Bosses in the Dungeon Gates tab and extract them to awaken permanent damage & XP multipliers!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {dungeonData.shadowArmy.map(s => (
                  <div 
                    key={s.id} 
                    className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-2xl flex items-center space-x-3"
                  >
                    <span className="text-2xl">{s.avatar}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-white truncate">{s.name}</div>
                      <div className="text-[11px] text-cyan-300 font-semibold truncate">{s.perkText}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5 SHADOW SOLDIERS ROSTER GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(dungeonData?.allShadows || [
              { id: 'shadow_igris', gateId: 'gate_s_igris', name: 'Shadow Commander Igris', koreanName: '그림자 사령관 이그리트', title: 'Knight of the Bloodred Shadow', rank: 'S-Rank Supreme Shadow', avatar: '⚔️', quote: 'My loyalty to the Monarch is absolute. ARISE.', perkText: '+20% Hunter XP & DMG on all Push-Ups / Calisthenics', color: '#c084fc' },
              { id: 'shadow_kaiser', gateId: 'gate_b_kaiser', name: 'Shadow Drake Kaiser', koreanName: '그림자 카이셀', title: 'Sovereign Sky Wyvern', rank: 'B-Rank Shadow', avatar: '🐉', quote: "Roaring through the skies beneath the Monarch's wings.", perkText: '+100 Battle Power DMG when hitting 10,000+ daily steps', color: '#f59e0b' },
              { id: 'shadow_baruka', gateId: 'gate_c_baruka', name: 'Shadow Frostblade Baruka', koreanName: '그림자 바루카', title: 'Glacial Shadow Warlord', rank: 'C-Rank Shadow', avatar: '❄️', quote: 'My frozen dual blades serve your will.', perkText: '+15% Workout DMG multiplier on all gym sessions', color: '#818cf8' },
              { id: 'shadow_kasaka', gateId: 'gate_d_kasaka', name: 'Shadow Venom Fang', koreanName: '그림자 카사카', title: 'Toxic Shadow Serpent', rank: 'D-Rank Shadow', avatar: '🐍', quote: "Venom coats the Monarch's strikes.", perkText: '+35 Passive Poison DMG dealt to all daily Dungeon Gates', color: '#06b6d4' },
              { id: 'shadow_goblin', gateId: 'gate_e_goblin', name: 'Shadow Goblin Scout', koreanName: '그림자 고블린', title: 'Vanguard Shadow', rank: 'E-Rank Shadow', avatar: '👤', quote: 'Scouting the dungeon paths for the Monarch.', perkText: '+15 XP bonus on all completed trials', color: '#38bdf8' }
            ]).map(s => {
              const isExtracted = (dungeonData?.shadowArmy || []).some(army => army.id === s.id);
              const gate = (dungeonData?.gates || []).find(g => g.id === s.gateId);
              const isGateConquered = (dungeonData?.conqueredGates || []).includes(s.gateId);

              return (
                <div 
                  key={s.id}
                  className={`p-5 rounded-3xl border transition-all relative overflow-hidden flex flex-col justify-between space-y-4 ${
                    isExtracted 
                      ? 'bg-gradient-to-br from-slate-950 via-purple-950/50 to-indigo-950/60 border-purple-500/50 shadow-xl shadow-purple-950/40' 
                      : 'bg-slate-900/60 border-slate-800 opacity-75'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-3xl p-2 bg-slate-950/80 rounded-2xl border border-slate-800 shadow-inner">
                          {s.avatar}
                        </span>
                        <div>
                          <span className="text-[10px] font-mono text-purple-300 font-bold block">
                            {s.koreanName}
                          </span>
                          <h4 className="text-sm font-black text-white">{s.name}</h4>
                        </div>
                      </div>

                      <span 
                        className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase font-mono border"
                        style={{ borderColor: s.color, color: s.color }}
                      >
                        {s.rank}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 italic bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                      "{s.quote}"
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Passive Buff
                      </span>
                      <div className="text-xs font-bold text-cyan-300">
                        ⚡ {s.perkText}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isExtracted ? (
                      <div className="w-full py-2 bg-purple-500/20 border border-purple-500/40 text-purple-300 font-black text-xs uppercase tracking-wider rounded-xl text-center flex items-center justify-center space-x-1.5">
                        <Check className="w-3.5 h-3.5 text-purple-400" />
                        <span>Serving in Active Legion</span>
                      </div>
                    ) : isGateConquered ? (
                      <button
                        onClick={() => handleExtractShadow(s.gateId)}
                        disabled={extractingGateId === s.gateId}
                        className="w-full py-2.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-1.5 cursor-pointer animate-pulse"
                      >
                        <Ghost className="w-3.5 h-3.5 text-purple-300" />
                        <span>{extractingGateId === s.gateId ? 'Extracting...' : '일어서라 (ARISE)'}</span>
                      </button>
                    ) : (
                      <div className="w-full py-2 bg-slate-950 border border-slate-800 text-slate-500 font-bold text-xs rounded-xl text-center flex items-center justify-center space-x-1">
                        <Lock className="w-3 h-3 text-slate-600" />
                        <span>Locked (Conquer {gate?.bossName || 'Boss'} to Extract)</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* TAB 4: TROPHY HALL & S-RANK ARTIFACTS */}
      {activeHunterTab === 'trophies' && (
        <div className="space-y-6">
          
          {/* EQUIPPED TITLE BANNER */}
          <div className="bg-gradient-to-r from-slate-900 via-amber-950/30 to-purple-950/30 border border-amber-500/30 rounded-3xl p-6 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-amber-500/20 text-amber-300 rounded-2xl border border-amber-500/40">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                  Active Hunter Title
                </span>
                <h3 className="text-xl font-black text-white">
                  {dungeonData?.equippedTitle || hunter?.title || 'Novice Hunter'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Displayed on your profile hero card and throughout the system.
                </p>
              </div>
            </div>

            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-xl self-start sm:self-center">
              Active Title
            </span>
          </div>

          {/* 2-COLUMN: UNLOCKED TITLES & ARTIFACT INVENTORY */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT: UNLOCKED TITLES (5 COLS) */}
            <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">
                    Unlocked Titles ({dungeonData?.unlockedTitles?.length || 1})
                  </h3>
                </div>
              </div>

              <div className="space-y-2.5">
                {(dungeonData?.unlockedTitles || ['Novice Hunter']).map(t => {
                  const isEquipped = (dungeonData?.equippedTitle === t) || (hunter?.title === t);

                  return (
                    <div 
                      key={t}
                      className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                        isEquipped 
                          ? 'bg-amber-500/10 border-amber-500/40 text-white' 
                          : 'bg-slate-950/70 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Crown className={`w-4 h-4 ${isEquipped ? 'text-amber-400' : 'text-slate-600'}`} />
                        <span className="text-xs font-black">{t}</span>
                      </div>

                      {isEquipped ? (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30">
                          Equipped
                        </span>
                      ) : (
                        <button
                          onClick={() => handleEquipTitle(t)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Equip
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT: S-RANK ARTIFACTS VAULT (7 COLS) */}
            <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">
                    Artifacts Inventory ({dungeonData?.artifacts?.length || 0})
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500">
                  Acquired from Boss Raids
                </span>
              </div>

              {(dungeonData?.artifacts?.length || 0) === 0 ? (
                <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center space-y-2">
                  <div className="text-3xl">🗡️</div>
                  <h4 className="text-xs font-bold text-slate-300">No Boss Artifacts Yet</h4>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Deplete Boss HP in the Dungeon Gates tab by logging your daily push-ups, steps, and workouts to claim rare Hunter gear.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {dungeonData.artifacts.map(art => (
                    <div 
                      key={art.id}
                      className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{art.icon}</span>
                        <span 
                          className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase font-mono border"
                          style={{ borderColor: art.color, color: art.color }}
                        >
                          {art.rank}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-black text-white">{art.name}</div>
                        <div className="text-[11px] font-semibold text-emerald-400 mt-0.5">{art.bonus}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* TAB 1: DAILY TRIALS & RADAR PROFILE */}
      {activeHunterTab === 'trials' && (
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
      )}

      {/* ARISE (일어서라) SHADOW EXTRACTION CINEMATIC MODAL */}
      {ariseCinematic?.active && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="max-w-md w-full bg-gradient-to-b from-slate-950 via-purple-950/95 to-slate-950 border-2 border-purple-500/70 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-600/50 text-center space-y-5 animate-in zoom-in-95 duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-rose-500 animate-pulse" />
            
            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-widest text-purple-300 font-mono">
                Solo Leveling Monarch Extraction
              </span>
              <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-indigo-100 to-cyan-300 tracking-wider">
                일어서라
              </h1>
              <span className="text-xs uppercase tracking-widest font-bold text-purple-400">
                — ARISE —
              </span>
            </div>

            <div className="w-24 h-24 mx-auto rounded-3xl bg-purple-500/20 border-2 border-purple-400/50 flex items-center justify-center text-5xl shadow-2xl shadow-purple-500/50 animate-bounce">
              {ariseCinematic.shadow?.avatar || '⚔️'}
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-mono font-bold text-purple-300">
                {ariseCinematic.shadow?.koreanName}
              </span>
              <h2 className="text-2xl font-black text-white">
                {ariseCinematic.shadow?.name}
              </h2>
              <p className="text-xs text-slate-300 italic max-w-xs mx-auto">
                "{ariseCinematic.shadow?.quote}"
              </p>
            </div>

            <div className="p-3.5 bg-slate-950/80 border border-purple-500/40 rounded-2xl text-left space-y-1">
              <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider block">
                Permanent Passive Perk
              </span>
              <div className="text-xs font-bold text-emerald-300">
                ⚡ {ariseCinematic.shadow?.perkText}
              </div>
              <div className="text-[11px] text-cyan-300 font-mono">
                +150 Monarch Experience Points (XP) Granted!
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                onClick={playRealSungJinWooArise}
                className="w-full sm:w-1/2 py-2.5 bg-slate-900 hover:bg-slate-800 border border-purple-500/40 text-purple-200 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer transition-all"
              >
                <span>🔊</span>
                <span>Replay "ARISE" Voice</span>
              </button>
              <button
                type="button"
                onClick={() => setAriseCinematic(null)}
                className="w-full sm:w-1/2 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-purple-500/30 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Deploy into Legion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetHunter}
        title="Reset Hunter Progression?"
        message="Are you sure you want to completely reset your Hunter progression back to Level 1? This will clear all levels, daily claimed quests, defeated Dungeon Gates, S-Rank Artifacts, and your entire Shadow Army."
        confirmText="Yes, Reset Everything"
        cancelText="Keep My Hunter State"
        danger={true}
      />
    </div>
  );
}
