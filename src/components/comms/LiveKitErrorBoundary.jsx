import React from 'react';
import { AlertTriangle, WifiOff } from 'lucide-react';

class LiveKitErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("LiveKit Error Boundary Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-red-950/80 border-2 border-red-900/50 p-8 text-red-300">
          <div className="flex items-center gap-4">
            <WifiOff className="w-16 h-16" />
            <div>
              <h1 className="text-3xl font-black font-mono uppercase tracking-widest text-red-400">Signal Lost</h1>
              <p className="text-red-400/70 font-mono mt-1">LiveKit connection failed or was interrupted.</p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-black/30 border border-red-800/50 w-full max-w-lg">
            <p className="text-xs font-mono uppercase text-red-500/80 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Error Details:
            </p>
            <pre className="text-xs font-mono mt-2 whitespace-pre-wrap break-words text-red-400/60">
              {this.state.error?.message || 'An unknown error occurred.'}
            </pre>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-8 px-6 py-2 bg-red-800/50 border border-red-700 text-red-200 font-bold uppercase tracking-widest text-sm hover:bg-red-700/50 transition-colors"
          >
            Attempt Re-Link
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LiveKitErrorBoundary;
