import React, { useState, useMemo } from 'react';
import './TradeLog.css';

const fmt = (n) => {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n < 0 ? `-$${formatted}` : `$${formatted}`;
};

export default function TradeLog({ trades, onDelete }) {
  const [filter, setFilter] = useState({ pair: '', direction: '', setup: '', dateFrom: '', dateTo: '' });
  const [sortCol, setSortCol] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => {
    let t = [...trades];
    if (filter.pair) t = t.filter(x => x.pair.toLowerCase().includes(filter.pair.toLowerCase()));
    if (filter.direction) t = t.filter(x => x.direction === filter.direction);
    if (filter.setup) t = t.filter(x => (x.setup || '').toLowerCase().includes(filter.setup.toLowerCase()));
    if (filter.dateFrom) t = t.filter(x => x.date >= filter.dateFrom);
    if (filter.dateTo) t = t.filter(x => x.date <= filter.dateTo);
    t.sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (sortCol === 'pnl') { va = parseFloat(va) || 0; vb = parseFloat(vb) || 0; }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return t;
  }, [trades, filter, sortCol, sortDir]);

  const totals = useMemo(() => {
    const pnl = filtered.reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0);
    const wins = filtered.filter(t => parseFloat(t.pnl) > 0).length;
    const losses = filtered.filter(t => parseFloat(t.pnl) < 0).length;
    return { pnl, wins, losses, total: filtered.length };
  }, [filtered]);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  const SortBtn = ({ col, label }) => (
    <th onClick={() => handleSort(col)} className={`sortable ${sortCol === col ? 'active' : ''}`}>
      {label} {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div className="trade-log fade-in">
      <div className="section-title">TRADE LOG</div>

      {/* Filters */}
      <div className="filter-bar card mb-1">
        <input className="form-input filter-input" placeholder="Pair..." value={filter.pair} onChange={e => setFilter(f => ({ ...f, pair: e.target.value }))} />
        <select className="form-select filter-input" value={filter.direction} onChange={e => setFilter(f => ({ ...f, direction: e.target.value }))}>
          <option value="">All Directions</option>
          <option value="LONG">LONG</option>
          <option value="SHORT">SHORT</option>
        </select>
        <input className="form-input filter-input" placeholder="Setup..." value={filter.setup} onChange={e => setFilter(f => ({ ...f, setup: e.target.value }))} />
        <input className="form-input filter-input" type="date" value={filter.dateFrom} onChange={e => setFilter(f => ({ ...f, dateFrom: e.target.value }))} />
        <input className="form-input filter-input" type="date" value={filter.dateTo} onChange={e => setFilter(f => ({ ...f, dateTo: e.target.value }))} />
        <button className="btn btn-ghost" onClick={() => setFilter({ pair: '', direction: '', setup: '', dateFrom: '', dateTo: '' })}>CLEAR</button>
      </div>

      {/* Summary row */}
      <div className="log-summary card mb-1">
        <div className="sum-item"><span className="text-dim">Showing</span> <span className="mono">{totals.total}</span></div>
        <div className="sum-item"><span className="text-dim">P&L</span> <span className={`mono ${totals.pnl >= 0 ? 'text-green' : 'text-red'}`}>{fmt(totals.pnl)}</span></div>
        <div className="sum-item"><span className="text-dim">Wins</span> <span className="mono text-green">{totals.wins}</span></div>
        <div className="sum-item"><span className="text-dim">Losses</span> <span className="mono text-red">{totals.losses}</span></div>
        <div className="sum-item"><span className="text-dim">Win Rate</span> <span className="mono">{totals.total > 0 ? ((totals.wins / totals.total) * 100).toFixed(1) : 0}%</span></div>
      </div>

      {/* Table */}
      <div className="table-wrap card">
        {trades.length === 0 ? (
          <div className="empty-state">No trades yet. Add your first trade or import a CSV.</div>
        ) : (
          <table className="trade-table">
            <thead>
              <tr>
                <SortBtn col="date" label="DATE" />
                <SortBtn col="pair" label="PAIR" />
                <th>DIR</th>
                <SortBtn col="pnl" label="P&L" />
                <th>LOTS</th>
                <th>ENTRY</th>
                <th>EXIT</th>
                <th>SETUP</th>
                <th>SESSION</th>
                <th>NOTES</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td className="mono text-dim">{t.date}</td>
                  <td className="mono">{t.pair}</td>
                  <td className={`mono dir-cell ${t.direction === 'LONG' ? 'text-green' : 'text-red'}`}>{t.direction}</td>
                  <td className={`mono ${parseFloat(t.pnl) >= 0 ? 'text-green' : 'text-red'}`}>{fmt(parseFloat(t.pnl) || 0)}</td>
                  <td className="mono text-dim">{t.lots || '—'}</td>
                  <td className="mono text-dim">{t.entry || '—'}</td>
                  <td className="mono text-dim">{t.exit || '—'}</td>
                  <td className="mono text-dim">{t.setup || '—'}</td>
                  <td className="mono text-dim">{t.session || '—'}</td>
                  <td className="notes-cell">{t.notes || '—'}</td>
                  <td>
                    {confirmDelete === t.id ? (
                      <span className="confirm-del">
                        <button className="btn btn-danger tiny-btn" onClick={() => { onDelete(t.id); setConfirmDelete(null); }}>DEL</button>
                        <button className="btn btn-ghost tiny-btn" onClick={() => setConfirmDelete(null)}>NO</button>
                      </span>
                    ) : (
                      <button className="del-btn" onClick={() => setConfirmDelete(t.id)} title="Delete trade">✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)} />
      )}
    </div>
  );
}
