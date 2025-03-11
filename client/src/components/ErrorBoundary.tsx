import { Component, ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // TODO: capture the error and log it to the server
    console.error(error, errorInfo);
  }

  render() {
    if (this.state.error) {
      const error = this.state.error as Error;
      // You can render any custom fallback UI
      return (
        <div
          style={{
            padding: "2rem",
            margin: "2rem",
            border: "1px solid red",
            borderRadius: "8px",
            backgroundColor: "#61413d",
          }}
        >
          <h2>Something went wrong.</h2>
          <p
            style={{
              paddingTop: "0.5rem",
              paddingBottom: "0.5rem",
            }}
          >
            {error.message}
          </p>

          <details style={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
            {error.stack}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
