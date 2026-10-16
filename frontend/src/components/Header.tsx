import React from 'react';
import { ShieldCheck, ShieldAlert, RefreshCw } from 'lucide-react';

interface HeaderProps {
  backendConnected: boolean | null;
  onRefreshHealth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ backendConnected, onRefreshHealth }) => {
  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10 w-[calc(100%-16rem)] ml-64">
      {/* Branding / Header Title */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400">PathPilot Operations</h2>
      </div>

      {/* Backend Status Panel */}
      <div className="flex items-center space-x-4">
        {/* Health status indicator pill */}
        <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700/60 rounded-full px-4 py-1.5 text-xs font-medium">
          {backendConnected === null ? (
            <>
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
              <span className="text-slate-300">Checking API Connection...</span>
            </>
          ) : backendConnected ? (
            <>
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-slate-200">Backend: <span className="text-emerald-400 font-bold">Online</span></span>
            </>
          ) : (
            <>
              <ShieldAlert className="h-4 w-4 text-rose-400 animate-bounce" />
              <span className="text-slate-200">Backend: <span className="text-rose-400 font-bold">Offline</span></span>
            </>
          )}
        </div>

        {/* Refresh connection status */}
        <button
          onClick={onRefreshHealth}
          title="Refresh Backend Connection"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors duration-150 border border-slate-700/40"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
