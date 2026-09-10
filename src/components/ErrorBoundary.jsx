import React from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("AuraFit Chamber Error caught by boundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div className="glass-card" style={{
            maxWidth: '520px',
            width: '100%',
            padding: '32px',
            textAlign: 'center',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            background: '#ffffff'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(244, 63, 94, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f43f5e',
              marginBottom: '16px'
            }}>
              <ShieldAlert size={32} />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Chamber System Protection Active
            </h3>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px' }}>
              AuraFit's resilient error boundary caught an unexpected state deviation. Your progress, points, and biometrics have been safely retained in local cache.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                className="btn btn-primary"
                style={{ padding: '10px 20px', fontSize: '13px' }}
              >
                <RefreshCw size={15} /> Reload Chamber
              </button>

              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  if (this.props.onReset) this.props.onReset();
                }}
                className="btn btn-secondary"
                style={{ padding: '10px 18px', fontSize: '13px' }}
              >
                <Home size={15} /> Return to Hub
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
