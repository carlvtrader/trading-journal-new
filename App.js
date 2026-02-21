import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import TradeLog from './components/TradeLog';
import AddTrade from './components/AddTrade';
import Payouts from './components/Payouts';
import Settings from './components/Settings';
import ImportCSV from './components/ImportCSV';
import DailyJournal from './components/DailyJournal';
import Evolution from './components/Evolution';
import './App.css';

const STORAGE_KEY = 'hivelog_data';

const defaultAccount = {
  phase: 'challenge1',
  riskProfile: 'low',
  accountSize: 10000,
  startingBalance: 10000,
  currentBalance: 10000,
  startDate: new Date().toISOString().split('T')[0],
  firmName: 'Funded Hive',
};

const defaultData = {
  account: defaultAccount,
  trades: [],
  payouts: [],
  journalEntries: [],
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultData, ...JSON.parse(raw) };
  } catch (e) {}
  return defaultData;
}

function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
}

function phaseLabel(phase) {
  const map = { challenge1: 'PHASE 1', challenge2: 'PHASE 2', funded: 'FUNDED' };
  return map[phase] || phase;
}

export default function App() {
  const [data, setData] = useState(loadData);
  const [view, setView] = useState('journal');
  const [showImport, setShowImport] = useState(false);

  useEffect(() => { saveData(data); }, [data]);

  const updateData = (updates) => setData(prev => ({ ...prev, ...updates }));

  const addTrade = (trade) => {
    const newTrade = { ...trade, id: Date.now().toString() };
    const pnlChange = parseFloat(trade.pnl) || 0;
    setData(prev => ({
      ...prev,
      trades: [...prev.trades, newTrade],
      account: { ...prev.account, currentBalance: prev.account.currentBalance + pnlChange }
    }));
  };

  const deleteTrade = (id) => {
    const trade = data.trades.find(t => t.id === id);
    if (!trade) return;
    const pnlChange = parseFloat(trade.pnl) || 0;
    setData(prev => ({
      ...prev,
      trades: prev.trades.filter(t => t.id !== id),
      account: { ...prev.account, currentBalance: prev.account.currentBalance - pnlChange }
    }));
  };

  const addPayout = (payout) => {
    const newPayout = { ...payout, id: Date.now().toString() };
    setData(prev => ({
      ...prev,
      payouts: [...prev.payouts, newPayout],
      account: { ...prev.account, currentBalance: prev.account.currentBalance - parseFloat(payout.amount) }
    }));
  };

  const importTrades = (trades) => {
    let balance = data.account.startingBalance;
    trades.forEach(t => { balance += parseFloat(t.pnl) || 0; });
    setData(prev => ({
      ...prev,
      trades: [...prev.trades, ...trades],
      account: { ...prev.account, currentBalance: balance }
    }));
    setShowImport(false);
  };

  const updateAccount = (account) => updateData({ account });

  const saveJournalEntry = (entry, isUpdate = false) => {
    setData(prev => {
      const entries = prev.journalEntries || [];
      if (isUpdate) {
        return { ...prev, journalEntries: entries.map(e => e.id === entry.id ? entry : e) };
      }
      const existing = entries.find(e => e.id === entry.id);
      if (existing) {
        return { ...prev, journalEntries: entries.map(e => e.id === entry.id ? entry : e) };
      }
      return { ...prev, journalEntries: [...entries, entry] };
    });
  };

  const navItems = [
    { id: 'journal', label: 'JOURNAL', primary: true },
    { id: 'evolution', label: 'EVOLUTION', primary: true },
    { id: 'dashboard', label: 'DASHBOARD' },
    { id: 'trades', label: 'TRADE LOG' },
    { id: 'add', label: '+ TRADE' },
    { id: 'payouts', label: 'PAYOUTS' },
    { id: 'settings', label: 'SETTINGS' },
  ];

  const journalEntries = data.journalEntries || [];

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-brand">
          <span className="brand-icon">&#x2B21;</span>
          <span className="brand-name">HIVELOG</span>
          <span className="brand-sub">/ Funded Hive Journal</span>
        </div>
        <nav className="app-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-btn ${view === item.id ? 'active' : ''} ${item.primary ? 'nav-primary' : ''}`}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
          <button className="nav-btn import-btn" onClick={() => setShowImport(true)}>
            IMPORT CSV
          </button>
        </nav>
        <div className="header-phase">
          <span className="phase-label">PHASE</span>
          <span className="phase-value">{phaseLabel(data.account.phase)}</span>
        </div>
      </header>

      <main className="app-main">
        {view === 'journal' && (
          <DailyJournal
            entries={journalEntries}
            onSave={saveJournalEntry}
            previousEntries={journalEntries}
          />
        )}
        {view === 'evolution' && <Evolution entries={journalEntries} />}
        {view === 'dashboard' && <Dashboard data={data} />}
        {view === 'trades' && <TradeLog trades={data.trades} onDelete={deleteTrade} />}
        {view === 'add' && <AddTrade onAdd={addTrade} onDone={() => setView('trades')} />}
        {view === 'payouts' && <Payouts payouts={data.payouts} onAdd={addPayout} />}
        {view === 'settings' && <Settings account={data.account} onUpdate={updateAccount} />}
      </main>

      {showImport && (
        <ImportCSV onImport={importTrades} onClose={() => setShowImport(false)} />
      )}
    </div>
  );
}
