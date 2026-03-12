import React, { useEffect, useState } from 'react';
import api from '../services/apiService';

const AdminBotToggle: React.FC = () => {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    api.get('/admin/settings/ai-bots')
      .then((res) => setEnabled(res.data.enabled))
      .catch(() => setEnabled(false));
  }, []);

  const handleToggle = async () => {
    const newValue = !enabled;
    setLoading(true);
    try {
      const res = await api.post('/admin/settings/ai-bots', { enabled: newValue });
      setEnabled(res.data.enabled);
      setToast(res.data.message);
      setTimeout(() => setToast(null), 3000);
    } catch {
      setToast('Failed to update setting');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (enabled === null) {
    return (
      <div style={cardStyle}>
        <div style={{ opacity: 0.6, fontSize: '0.95rem' }}>Loading bot settings...</div>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#2a1f21' }}>
            🤖 AI Bot System
          </div>
          <div style={{ fontSize: '0.85rem', color: '#5b3a40', marginTop: 4 }}>
            {enabled
              ? 'Bots are active — fallback matchmaking and AI chat enabled'
              : 'Bots are off — only real players can match and chat'}
          </div>
        </div>

        {/* Toggle switch */}
        <button
          id="ai-bot-toggle"
          onClick={handleToggle}
          disabled={loading}
          style={{
            position: 'relative',
            width: 56,
            height: 30,
            borderRadius: 30,
            border: 'none',
            cursor: loading ? 'wait' : 'pointer',
            background: enabled
              ? 'linear-gradient(135deg, #34d399, #10b981)'
              : 'linear-gradient(135deg, #f87171, #ef4444)',
            transition: 'background 0.3s ease',
            flexShrink: 0,
            boxShadow: enabled
              ? '0 0 12px rgba(52, 211, 153, 0.4)'
              : '0 0 12px rgba(248, 113, 113, 0.4)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 3,
              left: enabled ? 29 : 3,
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              transition: 'left 0.3s ease',
            }}
          />
        </button>
      </div>

      {/* Status badge */}
      <div style={{ marginTop: 12 }}>
        <span
          style={{
            display: 'inline-block',
            padding: '4px 14px',
            borderRadius: 20,
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#fff',
            background: enabled
              ? 'linear-gradient(135deg, #34d399, #10b981)'
              : 'linear-gradient(135deg, #f87171, #ef4444)',
            letterSpacing: '0.5px',
          }}
        >
          {enabled ? '● ENABLED' : '● DISABLED'}
        </span>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            marginTop: 10,
            padding: '8px 14px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid #ffdae2',
            fontSize: '0.85rem',
            color: '#2a1f21',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          ✅ {toast}
        </div>
      )}
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.55)',
  backdropFilter: 'blur(12px)',
  borderRadius: 20,
  padding: '18px 22px',
  border: '1px solid rgba(255, 218, 226, 0.6)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
};

export default AdminBotToggle;
