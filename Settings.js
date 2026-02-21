import React, { useState } from 'react';

const RISK_PROFILES = {
  low: {
    label: 'Low Risk',
    profitTargetPct: 0.08,
    dailyDrawdownPct: 0.05,
    maxDrawdownPct: 0.10,
    maxLossPerTradePct: 0.01,
  },
  moderate: {
    label: 'Moderate Risk',
    profitTargetPct: 0.08,
    dailyDrawdownPct: 0.05,
    maxDrawdownPct: 0.06,
    maxLossPerTradePct: 0.015,
  },
};

export default function Settings({ account, onUpdate }) {
  const [form, setForm] = useState({ riskProfile: 'low', ...account });
  const [saved, setSaved] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    onUpdate({
      ...form,
      accountSize: parseFloat(form.accountSize),
      startingBalance: parseFloat(form.startingBalance),
      currentBalance: parseFloat(form.currentBalance),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const activeProfile = RISK_PROFILES[form.riskProfile] || RISK_PROFILES.low;
  const accountSize = parseFloat(form.accountSize) || 10000;

  return (
    <div className="fade-in" style={{ maxWidth: 580 }}>
      <div className="section-title">ACCOUNT SETTINGS</div>

      <div className="card">
        <div className="section-title" style={{ marginBottom: '1.25rem' }}>FUNDED HIVE ACCOUNT</div>

        {/* Risk Profile Selector */}
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label className="form-label">RISK PROFILE</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.25rem' }}>
            {Object.entries(RISK_PROFILES).map(([key, p]) => (
              <button
                key={key}
                onClick={() => set('riskProfile', key)}
                style={{
                  padding: '0.85rem 1rem',
                  background: form.riskProfile === key ? 'var(--amber-dim)' : 'var(--bg-2)',
                  border: `1px solid ${form.riskProfile === key ? 'var(--amber)' : 'var(--border)'}`,
                  borderRadius: '2px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 600, color: form.riskProfile === key ? 'var(--amber)' : 'var(--text-0)', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                  {form.riskProfile === key ? '● ' : '○ '}{p.label.toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {[
                    ['Max/Trade', `${(p.maxLossPerTradePct * 100).toFixed(1)}%`],
                    ['Daily DD', `${(p.dailyDrawdownPct * 100).toFixed(0)}%`],
                    ['Max DD', `${(p.maxDrawdownPct * 100).toFixed(0)}%`],
                    ['Profit Target', `${(p.profitTargetPct * 100).toFixed(0)}%`],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-2)' }}>{label}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: form.riskProfile === key ? 'var(--text-0)' : 'var(--text-1)' }}>{val}</span>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">CURRENT PHASE</label>
          <select className="form-select" value={form.phase} onChange={e => set('phase', e.target.value)}>
            <option value="challenge1">Phase 1 — Challenge</option>
            <option value="challenge2">Phase 2 — Verification</option>
            <option value="funded">Funded Account</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">ACCOUNT SIZE ($)</label>
            <input type="number" className="form-input" value={form.accountSize} onChange={e => set('accountSize', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">STARTING BALANCE ($)</label>
            <input type="number" className="form-input" value={form.startingBalance} onChange={e => set('startingBalance', e.target.value)} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-2)', marginTop: '0.3rem', display: 'block' }}>Set this when you start a new phase</span>
          </div>
          <div className="form-group">
            <label className="form-label">CURRENT BALANCE ($)</label>
            <input type="number" className="form-input" value={form.currentBalance} onChange={e => set('currentBalance', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">START DATE</label>
            <input type="date" className="form-input" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
          </div>
        </div>

        <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '2px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', color: 'var(--text-2)', marginBottom: '0.75rem', fontWeight: 600 }}>
            ACTIVE LIMITS — {activeProfile.label.toUpperCase()} / ${accountSize.toLocaleString()} ACCOUNT
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            {[
              ['Profit Target', `$${(accountSize * activeProfile.profitTargetPct).toLocaleString()}`],
              ['Max Loss/Trade', `$${(accountSize * activeProfile.maxLossPerTradePct).toLocaleString()}`],
              ['Daily DD Limit', `$${(accountSize * activeProfile.dailyDrawdownPct).toLocaleString()}`],
              ['Max DD Limit', `$${(accountSize * activeProfile.maxDrawdownPct).toLocaleString()}`],
              ['Trailing DD', 'None'],
              ['Consistency', 'None'],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-2)', letterSpacing: '0.1em' }}>{k}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--amber)', marginTop: '0.15rem' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={handleSave}>SAVE SETTINGS</button>
          {saved && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--green)' }}>✓ Saved</span>}
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="section-title">DATA</div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-1)', lineHeight: 1.7, marginBottom: '1rem' }}>
          All your data is stored in your browser's local storage — no servers, no accounts, no subscriptions.<br />
          To back up your data, use your browser's export or take note of your trade CSV.
        </p>
        <button
          className="btn btn-danger"
          onClick={() => {
            if (window.confirm('This will delete ALL your trades, payouts, and settings. Are you absolutely sure?')) {
              localStorage.clear();
              window.location.reload();
            }
          }}
        >
          CLEAR ALL DATA
        </button>
      </div>
    </div>
  );
}
