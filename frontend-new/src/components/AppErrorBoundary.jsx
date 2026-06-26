import { Component } from "react";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="glass-panel-strong w-full rounded-[2rem] p-6 sm:p-8">
            <span className="section-kicker">Runtime error</span>
            <h1 className="font-display mt-2 text-4xl font-bold text-white">The app could not render</h1>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              A component threw an error during startup. Open the browser console for the exact stack trace.
            </p>
            <pre className="mt-4 overflow-auto rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-xs text-rose-100">
              {this.state.error?.message ?? "Unknown error"}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
