import { Component } from "react";

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: "3rem 2rem",
          textAlign: "center",
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "rgba(248,113,113,0.5)" }}>
            error_outline
          </span>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text, #fff)" }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--muted, #9ca3af)", maxWidth: "400px" }}>
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: "0.5rem",
              padding: "0.5rem 1.5rem",
              borderRadius: "12px",
              border: "1px solid rgba(0,200,150,0.3)",
              background: "rgba(0,200,150,0.1)",
              color: "#00C896",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
