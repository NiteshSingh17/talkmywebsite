import { useCallback, useEffect, useState } from 'react';
import { MSG } from '@src/shared/protocol';

export default function Popup() {
  const [connected, setConnected] = useState(false);
  const [opening, setOpening] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const res = await chrome.runtime.sendMessage({ type: MSG.GET_STATUS });
      setConnected(!!res?.connected);
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 4000);
    return () => clearInterval(id);
  }, [refresh]);

  const openSidebar = async () => {
    if (opening) return;
    setOpening(true);
    setSuccess('');
    setError('');
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id || !tab.url?.startsWith('http')) {
        throw new Error('No active web page tab found');
      }

      // Register the active tab as a scrapeable page over WS before opening
      const res = await chrome.runtime.sendMessage({
        type: MSG.PREPARE_SIDEPANEL,
        tabId: tab.id,
      });
      if (res?.error) {
        throw new Error(res.error);
      }

      // must run in user-gesture context (popup button click)
      await chrome.sidePanel.open({ tabId: tab.id });

      setSuccess('✓ Sidebar opened');
      setTimeout(() => window.close(), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setOpening(false);
    }
  };

  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>W</div>
          <span style={styles.logoText}>Webchat</span>
        </div>
        <div style={styles.statusBadge}>
          <span style={{ ...styles.dot, background: connected ? '#22c55e' : '#ef4444' }} />
          <span style={styles.statusLabel}>{connected ? 'API connected' : 'API offline'}</span>
        </div>
      </div>

      {/* Main CTA */}
      <div style={styles.body}>
        <p style={styles.desc}>
          Opens the chat in a <strong>sidebar panel</strong> alongside your current page.
        </p>

        <button
          id="open-sidebar-btn"
          type="button"
          disabled={opening}
          onClick={() => void openSidebar()}
          style={{ ...styles.btn, ...(opening ? styles.btnDisabled : {}) }}
        >
          {opening ? (
            <span style={styles.spinner} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          )}
          {opening ? 'Opening sidebar…' : 'Open Sidebar'}
          <kbd id="btn-shortcut" style={styles.kbd}>Alt+Shift+W</kbd>
        </button>

        {success && (
          <p id="success-msg" style={styles.successMsg}>{success}</p>
        )}
        {error && (
          <p id="error-msg" style={styles.errorMsg}>{error}</p>
        )}
      </div>

      {/* Footer hint */}
      <div style={styles.footer}>
        Sidebar will open beside your current page — no tab switching needed.
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    width: 320,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: 13,
    background: '#0f1117',
    color: '#e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px 12px',
    borderBottom: '1px solid #1e2330',
    background: '#0d1020',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 14,
    color: '#fff',
  },
  logoText: {
    fontWeight: 600,
    fontSize: 15,
    color: '#f1f5f9',
    letterSpacing: '-0.3px',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: '#1a1f2e',
    borderRadius: 20,
    padding: '4px 10px',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    display: 'inline-block',
    flexShrink: 0,
  },
  statusLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: 500,
  },
  body: {
    padding: '18px 16px 14px',
  },
  desc: {
    color: '#94a3b8',
    lineHeight: 1.55,
    marginBottom: 16,
    marginTop: 0,
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '11px 0',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    border: 'none',
    borderRadius: 9,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
    letterSpacing: '-0.1px',
  },
  btnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  kbd: {
    marginLeft: 8,
    padding: '2px 5px',
    borderRadius: 4,
    background: 'rgba(255,255,255,0.15)',
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 400,
  },
  spinner: {
    width: 16,
    height: 16,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.7s linear infinite',
    marginRight: 8,
  },
  successMsg: {
    color: '#4ade80',
    marginTop: 10,
    marginBottom: 0,
    fontSize: 12,
    fontWeight: 500,
  },
  errorMsg: {
    color: '#f87171',
    marginTop: 10,
    marginBottom: 0,
    fontSize: 12,
  },
  footer: {
    padding: '10px 16px 14px',
    borderTop: '1px solid #1e2330',
    color: '#64748b',
    fontSize: 11,
    lineHeight: 1.5,
  },
};
