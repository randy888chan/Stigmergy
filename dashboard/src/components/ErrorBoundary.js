import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error in React component tree:", error, errorInfo);
    this.setState({ error: error, errorInfo: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'white', backgroundColor: '#400000', height: '100vh', fontFamily: 'monospace', overflow: 'auto' }}>
          <h1>Application Error Caught</h1>
          <p>The application failed to render. This is the error that was previously silent.</p>
          <hr />
          <details open style={{ whiteSpace: 'pre-wrap' }}>
            <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>Error Details</summary>
            <h3>{this.state.error && this.state.error.toString()}</h3>
            <div>{this.state.errorInfo && this.state.errorInfo.componentStack}</div>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;