import React from "react";

export class CommsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Optionally log error to external service
    if (window && window.console) {
      window.console.error("CommsErrorBoundary caught:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-black text-red-400 border-4 border-red-800 font-mono text-lg uppercase tracking-widest p-8">
          <div className="mb-4 text-3xl font-black animate-pulse">SIGNAL LOST</div>
          <div className="text-xs text-red-300">A critical error occurred in the comms panel.<br />Please refresh or check your connection.</div>
          <div className="mt-4 text-xs text-zinc-500">{String(this.state.error)}</div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default CommsErrorBoundary;
