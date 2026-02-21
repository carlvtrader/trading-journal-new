import React, { useState } from 'react';
import './AddTrade.css';

const PAIRS = [
  'EURUSD','GBPUSD','USDJPY','AUDUSD','USDCAD','USDCHF','NZDUSD',
  'GBPJPY','EURJPY','EURGBP','XAUUSD','XAGUSD','US30','NAS100','SPX500',
  'BTCUSD','ETHUSD','USOIL','UKOIL','GER40','UK100',
];

const SETUPS = ['ICT BOS','FVG','OB','Liquidity Grab','SMC Entry','Supply/Demand','Trendline Break','Range Breakout','News Play','Other'];
const SESSIONS = ['London','New York','Asian','London/NY Overlap','Pre-Market','Custom'];

const defaultForm = {
  date: new Date().toISOString().split('T')[0],
  pair: '',
  direction: 'LONG',
  pnl: '',
  lots: '',
  entry: '',
  exit: '',
  sl: '',
  tp: '',
  setup: '',
  session: '',
  duration: '',
  emotion: '',
  notes: '',
  grade: '',
};

export default function AddTrade({ onAdd, onDone }) {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.date) e.date = 'Required';
    if (!form.pair) e.pair = 'Required';
    if (form.pnl === '' || isNaN(parseFloat(form.pnl))) e.pnl = 'Enter a valid P&L number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onAdd({ ...form, pnl: parseFloat(form.pnl) });
    setForm(defaultForm);
    onDone();
  };

  return (
    <div className="add-trade fade-in">
      <div className="section-title">LOG A TRADE</div>

      <div className="trade-form card">
        {/* Row 1 - Core */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">DATE *</label>
            <input type="date" className={`form-input ${errors.date ? 'error' : ''}`} value={form.date} onChange={e => set('date', e.target.value)} />
            {errors.date && <span className="form-error">{errors.date}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">INSTRUMENT *</label>
            <input
              list="pairs-list"
              className={`form-input ${errors.pair ? 'error' : ''}`}
              placeholder="e.g. EURUSD"
              value={form.pair}
              onChange={e => set('pair', e.target.value.toUpperCase())}
            />
            <datalist id="pairs-list">
              {PAIRS.map(p => <option key={p} value={p} />)}
            </datalist>
            {errors.pair && <span className="form-error">{errors.pair}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">DIRECTION *</label>
            <div className="dir-toggle">
              <button
                className={`dir-btn ${form.direction === 'LONG' ? 'active-long' : ''}`}
                onClick={() => set('direction', 'LONG')}
              >▲ LONG</button>
              <button
                className={`dir-btn ${form.direction === 'SHORT' ? 'active-short' : ''}`}
                onClick={() => set('direction', 'SHORT')}
              >▼ SHORT</button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">P&L ($) *</label>
            <input
              type="number"
              step="0.01"
              className={`form-input ${errors.pnl ? 'error' : ''}`}
              placeholder="-250.00"
              value={form.pnl}
              onChange={e => set('pnl', e.target.value)}
            />
            {errors.pnl && <span className="form-error">{errors.pnl}</span>}
          </div>
        </div>

        {/* Row 2 - Price levels */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">LOT SIZE</label>
            <input type="number" step="0.01" className="form-input" placeholder="0.10" value={form.lots} onChange={e => set('lots', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">ENTRY PRICE</label>
            <input type="number" step="0.00001" className="form-input" placeholder="1.08500" value={form.entry} onChange={e => set('entry', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">EXIT PRICE</label>
            <input type="number" step="0.00001" className="form-input" placeholder="1.08200" value={form.exit} onChange={e => set('exit', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">STOP LOSS</label>
            <input type="number" step="0.00001" className="form-input" placeholder="1.09000" value={form.sl} onChange={e => set('sl', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">TAKE PROFIT</label>
            <input type="number" step="0.00001" className="form-input" placeholder="1.07500" value={form.tp} onChange={e => set('tp', e.target.value)} />
          </div>
        </div>

        {/* Row 3 - Context */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">SETUP</label>
            <input list="setup-list" className="form-input" placeholder="e.g. ICT BOS" value={form.setup} onChange={e => set('setup', e.target.value)} />
            <datalist id="setup-list">
              {SETUPS.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>
          <div className="form-group">
            <label className="form-label">SESSION</label>
            <select className="form-select" value={form.session} onChange={e => set('session', e.target.value)}>
              <option value="">Select...</option>
              {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">TRADE GRADE</label>
            <select className="form-select" value={form.grade} onChange={e => set('grade', e.target.value)}>
              <option value="">—</option>
              <option value="A">A — Perfect execution</option>
              <option value="B">B — Good trade</option>
              <option value="C">C — Average</option>
              <option value="D">D — Rule break</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">EMOTION / STATE</label>
            <select className="form-select" value={form.emotion} onChange={e => set('emotion', e.target.value)}>
              <option value="">—</option>
              <option value="Calm">Calm</option>
              <option value="Confident">Confident</option>
              <option value="Anxious">Anxious</option>
              <option value="FOMO">FOMO</option>
              <option value="Revenge">Revenge Trading</option>
              <option value="Distracted">Distracted</option>
              <option value="Overconfident">Overconfident</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div className="form-group">
          <label className="form-label">NOTES / REVIEW</label>
          <textarea
            className="form-input"
            rows={3}
            placeholder="What did you see? What did you do well? What would you do differently?"
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" onClick={handleSubmit}>LOG TRADE</button>
          <button className="btn btn-ghost" onClick={onDone}>CANCEL</button>
        </div>
      </div>
    </div>
  );
}
