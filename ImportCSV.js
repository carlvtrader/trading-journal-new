import React, { useState, useRef } from 'react';
import Papa from 'papaparse';

export default function ImportCSV({ onImport, onClose }) {
  const [step, setStep] = useState('upload'); // upload, map, preview
  const [rawRows, setRawRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [preview, setPreview] = useState([]);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const REQUIRED_FIELDS = ['date', 'pair', 'direction', 'pnl'];
  const ALL_FIELDS = [
    { key: 'date', label: 'Date *' },
    { key: 'pair', label: 'Instrument/Pair *' },
    { key: 'direction', label: 'Direction (Buy/Sell) *' },
    { key: 'pnl', label: 'Net P&L ($) *' },
    { key: 'lots', label: 'Volume/Lots' },
    { key: 'entry', label: 'Entry Price' },
    { key: 'exit', label: 'Exit Price' },
    { key: 'sl', label: 'Stop Loss' },
    { key: 'tp', label: 'Take Profit' },
  ];

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.data.length === 0) { setError('CSV appears to be empty.'); return; }
        setHeaders(Object.keys(result.data[0]));
        setRawRows(result.data);
        // Auto-detect common cTrader column names
        const autoMap = {};
        const h = Object.keys(result.data[0]).map(k => ({ k, lower: k.toLowerCase() }));
        const find = (terms) => h.find(x => terms.some(t => x.lower.includes(t)))?.k || '';
        autoMap.date = find(['time', 'date', 'open time']);
        autoMap.pair = find(['symbol', 'pair', 'instrument']);
        autoMap.direction = find(['type', 'direction', 'side', 'buy/sell']);
        autoMap.pnl = find(['net profit', 'profit', 'pnl', 'p&l', 'net p&l']);
        autoMap.lots = find(['lots', 'volume', 'qty', 'size']);
        autoMap.entry = find(['entry', 'open price', 'open']);
        autoMap.exit = find(['exit', 'close price', 'close']);
        setMapping(autoMap);
        setStep('map');
      },
      error: () => setError('Could not parse CSV. Make sure it\'s a valid CSV file.'),
    });
  };

  const handlePreview = () => {
    for (const f of REQUIRED_FIELDS) {
      if (!mapping[f]) { setError(`Please map the "${f}" field before continuing.`); return; }
    }
    setError('');
    const parsed = rawRows.slice(0, 5).map(row => parseRow(row, mapping));
    setPreview(parsed);
    setStep('preview');
  };

  const parseRow = (row, map) => {
    const dirRaw = (row[map.direction] || '').toLowerCase();
    const direction = dirRaw.includes('buy') || dirRaw === 'long' ? 'LONG' : 'SHORT';
    const pnlRaw = parseFloat((row[map.pnl] || '0').toString().replace(/[^0-9.-]/g, '')) || 0;
    let date = row[map.date] || '';
    // Try to normalize date to YYYY-MM-DD
    try {
      const d = new Date(date);
      if (!isNaN(d)) date = d.toISOString().split('T')[0];
    } catch {}
    return {
      id: Math.random().toString(36).slice(2),
      date,
      pair: (row[map.pair] || '').toUpperCase().replace(/\s/g, ''),
      direction,
      pnl: pnlRaw,
      lots: row[map.lots] || '',
      entry: row[map.entry] || '',
      exit: row[map.exit] || '',
      sl: '',
      tp: '',
      setup: '',
      session: '',
      notes: '',
      grade: '',
      emotion: '',
    };
  };

  const handleImport = () => {
    const trades = rawRows.map(row => parseRow(row, mapping));
    onImport(trades);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">
            {step === 'upload' && 'IMPORT CSV FROM CTRADER'}
            {step === 'map' && 'MAP COLUMNS'}
            {step === 'preview' && 'PREVIEW IMPORT'}
          </span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {step === 'upload' && (
          <div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-1)', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              In cTrader: go to <span style={{ color: 'var(--amber)' }}>History</span> tab → right-click → <span style={{ color: 'var(--amber)' }}>Export</span> → Save as CSV.<br />
              Then upload that file here.
            </p>
            <div
              style={{ border: '2px dashed var(--border-bright)', borderRadius: '3px', padding: '2.5rem', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s' }}
              onClick={() => fileRef.current.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); fileRef.current.files = e.dataTransfer.files; handleFile({ target: e.dataTransfer }); }}
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.4 }}>↑</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-1)' }}>Click to select or drag & drop CSV</div>
              <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFile} />
            </div>
            {error && <div style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', marginTop: '0.75rem' }}>{error}</div>}
          </div>
        )}

        {step === 'map' && (
          <div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-2)', marginBottom: '1.25rem' }}>
              {rawRows.length} rows detected. Map your CSV columns to the journal fields below.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {ALL_FIELDS.map(f => (
                <div key={f.key} style={{ display: 'grid', gridTemplateColumns: '150px 1fr', alignItems: 'center', gap: '1rem' }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: REQUIRED_FIELDS.includes(f.key) ? 'var(--amber)' : 'var(--text-1)' }}>{f.label}</label>
                  <select className="form-select" value={mapping[f.key] || ''} onChange={e => setMapping(m => ({ ...m, [f.key]: e.target.value }))}>
                    <option value="">— Skip —</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
            {error && <div style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', marginTop: '0.75rem' }}>{error}</div>}
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={handlePreview}>PREVIEW →</button>
              <button className="btn btn-ghost" onClick={() => setStep('upload')}>BACK</button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-2)', marginBottom: '1rem' }}>
              Previewing first 5 of {rawRows.length} rows. Looks correct?
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                <thead>
                  <tr>
                    {['DATE', 'PAIR', 'DIR', 'P&L', 'LOTS', 'ENTRY', 'EXIT'].map(h => (
                      <th key={h} style={{ color: 'var(--text-2)', padding: '0.4rem 0.5rem', textAlign: 'left', borderBottom: '1px solid var(--border)', letterSpacing: '0.1em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((t, i) => (
                    <tr key={i}>
                      <td style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border)', color: 'var(--text-2)' }}>{t.date}</td>
                      <td style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border)' }}>{t.pair}</td>
                      <td style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border)', color: t.direction === 'LONG' ? 'var(--green)' : 'var(--red)' }}>{t.direction}</td>
                      <td style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border)', color: t.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>${t.pnl.toFixed(2)}</td>
                      <td style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border)', color: 'var(--text-2)' }}>{t.lots || '—'}</td>
                      <td style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border)', color: 'var(--text-2)' }}>{t.entry || '—'}</td>
                      <td style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border)', color: 'var(--text-2)' }}>{t.exit || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={handleImport}>IMPORT ALL {rawRows.length} TRADES</button>
              <button className="btn btn-ghost" onClick={() => setStep('map')}>BACK</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
