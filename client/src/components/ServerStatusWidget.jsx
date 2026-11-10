import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  WifiOff, 
  RefreshCw, 
  Server, 
  Clock, 
  Database, 
  X,
  Zap
} from 'lucide-react';
import { api } from '../api';

export default function ServerStatusWidget({ variant = 'pill', onOpenModal }) {
  const [status, setStatus] = useState('turning-on'); // 'running' | 'turning-on' | 'offline'
  const [latency, setLatency] = useState(null);
  const [serverData, setServerData] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Ping Server function
  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const res = await api.checkServerHealth();
      setStatus(res.status);
      setLatency(res.latency);
      setServerData(res);
      setLastChecked(new Date());
    } catch (e) {
      setStatus('offline');
      setLatency(null);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
    // Auto-ping every 12 seconds
    const interval = setInterval(checkHealth, 12000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds) => {
    if (!seconds && seconds !== 0) return 'Just started';
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    if (mins > 0) return `${mins}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  // Helper for status styling
  const getStatusBadge = () => {
    switch (status) {
      case 'running':
        return {
          label: 'Running',
          dotClass: 'bg-emerald-400 animate-pulse',
          bgClass: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          icon: CheckCircle2,
          color: 'text-emerald-400'
        };
      case 'turning-on':
        return {
          label: 'Turning On...',
          dotClass: 'bg-amber-400 animate-ping',
          bgClass: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30',
          icon: Activity,
          color: 'text-amber-400'
        };
      case 'offline':
      default:
        return {
          label: 'Offline',
          dotClass: 'bg-rose-500 animate-pulse',
          bgClass: 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/40',
          icon: WifiOff,
          color: 'text-rose-400'
        };
    }
  };

  const badge = getStatusBadge();

  // 1. DASHBOARD CARD SECTION VARIANT
  if (variant === 'card') {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className={`absolute top-0 right-0 w-52 h-52 rounded-full blur-3xl pointer-events-none opacity-20 ${
          status === 'running' ? 'bg-emerald-500' : status === 'turning-on' ? 'bg-amber-500' : 'bg-rose-500'
        }`} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className={`p-3 rounded-2xl border shrink-0 ${badge.bgClass}`}>
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Backend Server Health</span>
                <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wide ${badge.bgClass}`}>
                  <span className={`w-2 h-2 rounded-full ${badge.dotClass}`} />
                  <span>{badge.label}</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {status === 'running' && 'Backend API & AI Engine are active and serving live requests.'}
                {status === 'turning-on' && 'Server is waking up or establishing database connection...'}
                {status === 'offline' && 'Backend server is unreachable. Check network or restart host.'}
              </p>
            </div>
          </div>

          {/* Quick Metrics & Ping Button */}
          <div className="flex items-center space-x-3 self-end sm:self-center">
            {status === 'running' && latency !== null && (
              <div className="text-right hidden sm:block">
                <div className="text-[11px] font-bold text-slate-200">{latency} ms</div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider">Ping Latency</div>
              </div>
            )}

            <button
              onClick={checkHealth}
              disabled={isChecking}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer disabled:opacity-50"
              title="Ping Backend Server Now"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isChecking ? 'Pinging...' : 'Ping Server'}</span>
            </button>
          </div>
        </div>

        {/* Diagnostic Detail Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Status State</span>
            <span className={`text-xs font-black capitalize ${badge.color}`}>{status}</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Response Time</span>
            <span className="text-xs font-black text-white">{latency !== null ? `${latency} ms` : '—'}</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Server Uptime</span>
            <span className="text-xs font-black text-white">{formatUptime(serverData?.uptimeSeconds)}</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Database Sync</span>
            <span className="text-xs font-black text-emerald-400">{serverData?.database || (status === 'running' ? 'Connected' : 'Offline')}</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. NAVBAR COMPACT PILL VARIANT (DEFAULT)
  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer shadow-sm ${badge.bgClass}`}
        title={`Backend Server: ${badge.label} (Click for Server Health Details)`}
      >
        <span className={`w-2 h-2 rounded-full ${badge.dotClass}`} />
        <span className="hidden sm:inline">Server:</span>
        <span className="capitalize">{badge.label}</span>
        {status === 'running' && latency !== null && (
          <span className="text-[9px] opacity-75 font-normal hidden md:inline">({latency}ms)</span>
        )}
      </button>

      {/* Interactive Server Health Modal */}
      {isModalOpen && (
        <div 
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-150"
        >
          <div 
            className="relative w-full max-w-md my-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Highly Visible Close Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-all cursor-pointer shadow-md z-20 border border-slate-700"
              title="Close Server Status"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center space-x-3 pr-8">
              <div className={`p-3 rounded-2xl border ${badge.bgClass}`}>
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Backend Server Status</h3>
                <p className="text-xs text-slate-400">Live API connectivity & heartbeat monitoring</p>
              </div>
            </div>

            {/* Live State Banner */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${badge.bgClass}`}>
              <div className="flex items-center space-x-2.5">
                <span className={`w-3 h-3 rounded-full ${badge.dotClass}`} />
                <div>
                  <div className="text-xs font-black uppercase tracking-wider">{badge.label}</div>
                  <div className="text-[11px] opacity-80 mt-0.5">
                    {status === 'running' && 'API is healthy and handling requests'}
                    {status === 'turning-on' && 'Starting up or spinning from sleep'}
                    {status === 'offline' && 'Cannot reach server endpoint'}
                  </div>
                </div>
              </div>
              {latency !== null && (
                <div className="text-right">
                  <div className="text-sm font-black">{latency} ms</div>
                  <div className="text-[9px] opacity-70 uppercase">Latency</div>
                </div>
              )}
            </div>

            {/* Diagnostics Stats */}
            <div className="space-y-2 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex justify-between py-1 border-b border-slate-800/80 text-slate-400">
                <span>Database Connection</span>
                <span className="font-bold text-white">{serverData?.database || (status === 'running' ? 'Connected' : 'Offline')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80 text-slate-400">
                <span>Server Uptime</span>
                <span className="font-bold text-white">{formatUptime(serverData?.uptimeSeconds)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80 text-slate-400">
                <span>Last Heartbeat Check</span>
                <span className="font-bold text-white">
                  {lastChecked ? lastChecked.toLocaleTimeString() : 'Just now'}
                </span>
              </div>
              <div className="flex justify-between py-1 text-slate-400">
                <span>API Version</span>
                <span className="font-bold text-emerald-400">v1.0.0 (Capacitor + Node)</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer border border-slate-700"
              >
                Close
              </button>
              <button
                type="button"
                onClick={checkHealth}
                disabled={isChecking}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                <span>{isChecking ? 'Testing Connection...' : 'Ping / Re-test Server'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
