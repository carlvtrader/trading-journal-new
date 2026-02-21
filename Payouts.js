import React, { useState } from 'react';

const fmt = (n) => `$${parseFloat(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Payouts({ payouts, onAdd }) {
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], amount: '', method: 'Crypto', notes: '' });
  const [showForm, setShowForm] = useState(false);

  const total = payouts.reduce((s, p) => s + parseFloat(p.amount || 0), 0);

  const handleSubmit = () => {
    if (!form.amount || isNaN(parseFloat(form.amount))) return;
    onAdd(form);
    setForm({ date: new Date().toISOString().split('T')[0], amount: '', method: 'Crypto', notes: '' });
    setShowForm(false);
  };

  return (
    <div className="fade-in" style={{ maxWidth: 700 }}>
      <div className="section-title">PAYOUT HISTORY</div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="card-label">TOTAL EXTRACTED</div>
            <div className="card-value mono text-green">{fmt(total)}</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
            {showForm ? 'CANCEL' : '+ LOG PAYOUT'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="section-title">NEW PAYOUT</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">DATE</label>
              <input type="date" className="form-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">AMOUNT ($)</label>
              <input type="number" step="0.01" className="form-input" placeholder="1000.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">METHOD</label>
              <select className="form-select" value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
                <option>Crypto</option>
                <option>Bank Transfer</option>
                <option>Wise</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">NOTES</label>
            <input className="form-input" placeholder="Optional..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <button className="btn btn-primary" onClick={handleSubmit}>SAVE PAYOUT</button>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {payouts.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-2)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
            No payouts logged yet.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['DATE', 'AMOUNT', 'METHOD', 'NOTES'].map(h => (
                  <th key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.12em', color: 'var(--text-2)', textAlign: 'left', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...payouts].reverse().map(p => (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)', color: 'var(--text-2)' }}>{p.date}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)', color: 'var(--green)', fontWeight: 600 }}>{fmt(p.amount)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)', color: 'var(--text-1)' }}>{p.method}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)', color: 'var(--text-2)' }}>{p.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
