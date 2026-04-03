"use client";
import React, { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      try {
        const parsedError = JSON.parse(this.state.error?.message || "");
        if (parsedError.error) {
          errorMessage = `Firestore Error: ${parsedError.error} (${parsedError.operationType} on ${parsedError.path})`;
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 text-center">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl mx-auto mb-6 flex items-center justify-center text-3xl">
              ⚠️
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-500 mb-8">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 bg-primary text-white font-black rounded-xl shadow-md hover:bg-primary/90 transition-colors"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
