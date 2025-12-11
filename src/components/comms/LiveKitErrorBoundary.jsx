import React from 'react';
import { AlertTriangle, WifiOff, RotateCw, Home } from 'lucide-react';
import { motion } from 'framer-motion';

class LiveKitErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorCount: 0 };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("LiveKit Error Boundary Caught:", error, errorInfo);
    this.setState(prev => ({ errorCount: prev.errorCount + 1 }));
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleNavigateHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isCritical = this.state.errorCount > 2;
      
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-red-950/80 to-red-900/60 border-2 border-red-900/50 p-8 text-red-300">
          {/* Phase 5.2: SIGNAL LOST Tactical Alert */}
          <div className="flex items-center gap-4 mb-8">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <WifiOff className="w-16 h-16 text-red-500" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-black font-mono uppercase tracking-widest text-red-400">Signal Lost</h1>
              <p className="text-red-400/70 font-mono mt-1">LiveKit connection failed or was interrupted.</p>
              {isCritical && (
                <p className="text-xs font-mono text-red-500 mt-2 uppercase">MULTIPLE FAILURES DETECTED - RECOMMEND RESTART</p>
              )}
            </div>
          </div>

          {/* Error Details Panel */}
          <div className="mt-6 p-4 bg-black/40 border border-red-800/50 w-full max-w-lg rounded-sm">
            <p className="text-xs font-mono uppercase text-red-500/80 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4" />
              Error Details:
            </p>
            <pre className="text-[10px] font-mono whitespace-pre-wrap break-words text-red-400/60 max-h-32 overflow-y-auto">
              {this.state.error?.message || 'An unknown error occurred.'}
            </pre>
            <p className="text-[10px] text-red-500/50 mt-2">
              {this.state.errorCount > 1 && `Attempts: ${this.state.errorCount}`}
            </p>
          </div>

          {/* Recovery Actions */}
          <div className="mt-8 flex gap-4">
            <button 
              onClick={this.handleRetry}
              className="px-6 py-2 bg-amber-800/50 border border-amber-700 text-amber-200 font-bold uppercase tracking-widest text-sm hover:bg-amber-700/50 transition-colors flex items-center gap-2"
            >
              <RotateCw className="w-4 h-4" />
              Attempt Re-Link
            </button>
            <button 
              onClick={this.handleNavigateHome}
              className="px-6 py-2 bg-red-800/50 border border-red-700 text-red-200 font-bold uppercase tracking-widest text-sm hover:bg-red-700/50 transition-colors flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Return to Lobby
            </button>
          </div>

          {/* Status Instructions */}
          <div className="mt-8 text-center max-w-lg">
            <p className="text-xs text-red-400/70 font-mono">
              If problem persists:
            </p>
            <ul className="text-[10px] text-red-400/60 font-mono mt-2 space-y-1">
              <li>• Check your network connection</li>
              <li>• Verify LiveKit server is accessible</li>
              <li>• Clear browser cache and reload</li>
              <li>• Contact system administrator if issue continues</li>
            </ul>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LiveKitErrorBoundary;
