import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import './Dashboard.css';

// Funded Hive risk profiles
export const RISK_PROFILES = {
  low: {
    label: 'Low Risk',
    profitTargetPct: 0.08,
    dailyDrawdownPct: 0.05,
    maxDrawdownPct: 0.10,
    maxLossPerTradePct: 0.01,   // 1% per trade
  },
  moderate: {
    label: 'Moderate Risk',
    profitTargetPct: 0.08,
    dailyDrawdownPct: 0.05,
    maxDrawdownPct: 0.06,
    maxLossPerTradePct: 0.015,  // 1.5% per trade
  },
};

function getRules(riskProfile) {
  return RISK_PROFILES[riskProfile] || RISK_PROFILES.low;
}

function calcStats(account, trades) {
  const { startingBalance, currentBalance, phase, riskProfile } = account;
  const RULES = getRules(riskProfile);
  const profitTarget = startingBalance * RULES.profitTargetPct;
  const maxDrawdownAbs = startingBalance * RULES.maxDrawdownPct;
  const dailyDrawdownAbs = startingBalance * RULES.dailyDrawdownPct;
  const maxLossPerTradeAbs = startingBalance * RULES.maxLossPerTradePct;

  const totalPnL = currentBalance - startingBalance;
  const progressToTarget = Math.min(Math.max(totalPnL / profitTarget, 0), 1);

  // Drawdown remaining
  const lowestAllowed = startingBalance - maxDrawdownAbs;
  const drawdownUsed = startingBalance - Math.min(currentBalance, startingBalance);
  const drawdownRemaining = maxDrawdownAbs - drawdownUsed;
  const drawdownPct = drawdownUsed / maxDrawdownAbs;

  // Today's trades
  const today = new Date().toISOString().split('T')[0];
  const todayTrades = trades.filter(t => t.date === today);
  const todayPnL = todayTrades.reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0);
  const dailyDrawdownUsed = Math.abs(Math.min(todayPnL, 0));
  const dailyDrawdownRemaining = dailyDrawdownAbs - dailyDrawdownUsed;
  const dailyDrawdownPct = dailyDrawdownUsed / dailyDrawdownAbs;

  // Win stats
  const closedTrades = trades.filter(t => t.pnl !== '' && t.pnl !== undefined);
  const winners = closedTrades.filter(t => parseFloat(t.pnl) > 0);
  const losers = closedTrades.filter(t => parseFloat(t.pnl) < 0);
  const winRate = closedTrades.length > 0 ? (winners.length / closedTrades.length) * 100 : 0;

  const avgWin = winners.length > 0 ? winners.reduce((s, t) => s + parseFloat(t.pnl), 0) / winners.length : 0;
  const avgLoss = losers.length > 0 ? losers.reduce((s, t) => s + parseFloat(t.pnl), 0) / losers.length : 0;
  const rrRatio = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;

  // Equity curve
  let runningBalance = startingBalance;
  const equityCurve = [{ date: account.startDate || 'Start', balance: startingBalance }];
  const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  sorted.forEach(t => {
    runningBalance += parseFloat(t.pnl) || 0;
    equityCurve.push({ date: t.date, balance: parseFloat(runningBalance.toFixed(2)) });
  });

  // Days traded
  const tradedDays = new Set(trades.map(t => t.date)).size;

  // Per-trade rule breaches
  const perTradeBreaches = trades.filter(t => parseFloat(t.pnl) < -maxLossPerTradeAbs);

  return {
    totalPnL, progressToTarget, profitTarget,
    drawdownRemaining, drawdownPct, maxDrawdownAbs,
    dailyDrawdownRemaining, dailyDrawdownPct, dailyDrawdownAbs,
    winRate, avgWin, avgLoss, rrRatio,
    equityCurve, tradedDays, closedTrades,
    todayPnL, lowestAllowed, dailyDrawdownUsed,
    maxLossPerTradeAbs, perTradeBreaches,
  };
}

const fmt = (n, decimals = 2) => {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return n < 0 ? `-$${formatted}` : `$${formatted}`;
};

const pct = (n) => `${(n * 100).toFixed(2)}%`;

function GaugeBar({ value, max, color, label, sublabel, warning = 0.7, danger = 0.9 }) {
  const pctUsed = Math.min(value / max, 1);
  const barColor = pctUsed >= danger ? 'var(--red)' : pctUsed >= warning ? 'var(--amber)' : color;
  return (
    <div className="gauge-bar">
      <div className="gauge-header">
        <span className="gauge-label">{label}</span>
        <span className="gauge-value" style={{ color: barColor }}>{sublabel}</span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pctUsed * 100}%`, background: barColor }} />
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <div className="ct-date">{label}</div>
        <div className="ct-val">{fmt(payload[0].value)}</div>
      </div>
    );
  }
  return null;
};

export default function Dashboard({ data }) {
  const { account, trades, payouts } = data;
  const stats = useMemo(() => calcStats(account, trades), [account, trades]);

  const totalPayouts = payouts.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const isPhase1or2 = account.phase === 'challenge1' || account.phase === 'challenge2';

  const profile = RISK_PROFILES[account.riskProfile] || RISK_PROFILES.low;

  const dangerAlerts = [];
  if (stats.dailyDrawdownPct >= 0.9) dangerAlerts.push('⚠ DAILY DRAWDOWN CRITICAL');
  if (stats.drawdownPct >= 0.9) dangerAlerts.push('⚠ OVERALL DRAWDOWN CRITICAL');
  if (stats.perTradeBreaches.length > 0) dangerAlerts.push(`⚠ ${stats.perTradeBreaches.length} TRADE(S) EXCEED MAX LOSS PER TRADE`);

  return (
    <div className="dashboard fade-in">
      {dangerAlerts.map(a => (
        <div key={a} className="alert-banner">{a}</div>
      ))}
      <div className="risk-profile-bar">
        <span className="rpb-label">RISK PROFILE</span>
        <span className="rpb-value">{profile.label.toUpperCase()}</span>
        <span className="rpb-sep">·</span>
        <span className="rpb-rule">Max/Trade: <strong>{fmt(stats.maxLossPerTradeAbs)}</strong></span>
        <span className="rpb-sep">·</span>
        <span className="rpb-rule">Daily DD: <strong>5%</strong></span>
        <span className="rpb-sep">·</span>
        <span className="rpb-rule">Max DD: <strong>{(profile.maxDrawdownPct * 100).toFixed(0)}%</strong></span>
      </div>

      {/* Top KPI Row */}
      <div className="grid-4 mb-1">
        <div className="card">
          <div className="card-label">CURRENT BALANCE</div>
          <div className="card-value mono">{fmt(account.currentBalance)}</div>
          <div className="card-sub mono">Started: {fmt(account.startingBalance)}</div>
        </div>
        <div className="card">
          <div className="card-label">TOTAL P&L</div>
          <div className={`card-value mono ${stats.totalPnL >= 0 ? 'text-green' : 'text-red'}`}>
            {fmt(stats.totalPnL)}
          </div>
          <div className="card-sub mono">{pct(stats.totalPnL / account.startingBalance)} return</div>
        </div>
        <div className="card">
          <div className="card-label">TODAY'S P&L</div>
          <div className={`card-value mono ${stats.todayPnL >= 0 ? 'text-green' : 'text-red'}`}>
            {fmt(stats.todayPnL)}
          </div>
          <div className="card-sub mono">{stats.tradedDays} days traded</div>
        </div>
        <div className="card">
          <div className="card-label">WIN RATE</div>
          <div className="card-value mono">{stats.winRate.toFixed(1)}%</div>
          <div className="card-sub mono">{stats.closedTrades.length} total trades</div>
        </div>
      </div>

      <div className="dashboard-body">
        {/* Left Column */}
        <div className="dashboard-left">
          {/* Funded Hive Rule Tracker */}
          <div className="card rules-card mb-1">
            <div className="section-title">FUNDED HIVE — RULE COMPLIANCE</div>

            {isPhase1or2 && (
              <div className="rule-block">
                <div className="rule-header">
                  <span className="rule-name">PROFIT TARGET (8%)</span>
                  <span className={`rule-status ${stats.progressToTarget >= 1 ? 'achieved' : 'pending'}`}>
                    {stats.progressToTarget >= 1 ? '✓ ACHIEVED' : 'IN PROGRESS'}
                  </span>
                </div>
                <div className="rule-numbers">
                  <span className="text-green mono">{fmt(stats.totalPnL)}</span>
                  <span className="text-dim mono"> / {fmt(stats.profitTarget)} target</span>
                </div>
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${stats.progressToTarget * 100}%`,
                      background: stats.progressToTarget >= 1 ? 'var(--green)' : 'var(--amber)'
                    }}
                  />
                </div>
                <div className="rule-sub mono">{(stats.progressToTarget * 100).toFixed(1)}% complete</div>
              </div>
            )}

            <div className="rule-block">
              <div className="rule-header">
                <span className="rule-name">OVERALL DRAWDOWN ({(profile.maxDrawdownPct * 100).toFixed(0)}% max)</span>
                <span className={`rule-status ${stats.drawdownPct >= 1 ? 'breached' : stats.drawdownPct >= 0.8 ? 'warning' : 'safe'}`}>
                  {stats.drawdownPct >= 1 ? '✗ BREACHED' : stats.drawdownPct >= 0.8 ? '! WARNING' : '✓ SAFE'}
                </span>
              </div>
              <div className="rule-numbers">
                <span className={`mono ${stats.drawdownPct >= 0.8 ? 'text-red' : 'text-green'}`}>
                  {fmt(stats.drawdownRemaining)} remaining
                </span>
                <span className="text-dim mono"> / {fmt(stats.maxDrawdownAbs)} limit</span>
              </div>
              <GaugeBar
                value={stats.drawdownPct * stats.maxDrawdownAbs}
                max={stats.maxDrawdownAbs}
                color="var(--green)"
                label=""
                sublabel=""
                warning={0.6}
                danger={0.85}
              />
              <div className="rule-sub mono">Floor: {fmt(account.startingBalance - stats.maxDrawdownAbs)}</div>
            </div>

            <div className="rule-block">
              <div className="rule-header">
                <span className="rule-name">DAILY DRAWDOWN (5% max)</span>
                <span className={`rule-status ${stats.dailyDrawdownPct >= 1 ? 'breached' : stats.dailyDrawdownPct >= 0.7 ? 'warning' : 'safe'}`}>
                  {stats.dailyDrawdownPct >= 1 ? '✗ BREACHED' : stats.dailyDrawdownPct >= 0.7 ? '! WARNING' : '✓ SAFE'}
                </span>
              </div>
              <div className="rule-numbers">
                <span className={`mono ${stats.dailyDrawdownPct >= 0.7 ? 'text-red' : 'text-green'}`}>
                  {fmt(stats.dailyDrawdownRemaining)} remaining today
                </span>
                <span className="text-dim mono"> / {fmt(stats.dailyDrawdownAbs)} limit</span>
              </div>
              <GaugeBar
                value={stats.dailyDrawdownUsed}
                max={stats.dailyDrawdownAbs}
                color="var(--green)"
                label=""
                sublabel=""
                warning={0.5}
                danger={0.8}
              />
              <div className="rule-sub mono">Resets at midnight</div>
            </div>

            <div className="rule-block">
              <div className="rule-header">
                <span className="rule-name">MAX LOSS PER TRADE ({(profile.maxLossPerTradePct * 100).toFixed(1)}%)</span>
                <span className={`rule-status ${stats.perTradeBreaches.length > 0 ? 'breached' : 'safe'}`}>
                  {stats.perTradeBreaches.length > 0 ? `✗ ${stats.perTradeBreaches.length} BREACH(ES)` : '✓ CLEAN'}
                </span>
              </div>
              <div className="rule-numbers">
                <span className="text-amber mono">Limit: {fmt(stats.maxLossPerTradeAbs)} per trade</span>
              </div>
              {stats.perTradeBreaches.length > 0 && (
                <div className="breach-list">
                  {stats.perTradeBreaches.map(t => (
                    <div key={t.id} className="breach-item">
                      <span className="text-dim mono">{t.date} {t.pair}</span>
                      <span className="text-red mono">{fmt(parseFloat(t.pnl))}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Performance Stats */}
          <div className="card mb-1">
            <div className="section-title">PERFORMANCE</div>
            <div className="grid-2">
              <StatRow label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} />
              <StatRow label="R:R Ratio" value={stats.rrRatio.toFixed(2)} />
              <StatRow label="Avg Win" value={fmt(stats.avgWin)} color="green" />
              <StatRow label="Avg Loss" value={fmt(stats.avgLoss)} color={stats.avgLoss < 0 ? 'red' : 'default'} />
              <StatRow label="Total Trades" value={stats.closedTrades.length} />
              <StatRow label="Days Traded" value={stats.tradedDays} />
            </div>
          </div>

          {/* Payouts (funded only) */}
          {account.phase === 'funded' && (
            <div className="card">
              <div className="section-title">PAYOUTS</div>
              <div className="payout-total">
                <span className="text-dim mono">Total withdrawn: </span>
                <span className="text-green mono">{fmt(totalPayouts)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Equity Curve */}
        <div className="dashboard-right">
          <div className="card chart-card">
            <div className="section-title">EQUITY CURVE</div>
            {stats.equityCurve.length > 1 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={stats.equityCurve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d68f" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#00d68f" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#5a5a5a', fontFamily: 'IBM Plex Mono' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#5a5a5a', fontFamily: 'IBM Plex Mono' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v.toLocaleString()}`} width={70} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={account.startingBalance} stroke="#2a2a2a" strokeDasharray="4 4" />
                  <ReferenceLine y={account.startingBalance - stats.maxDrawdownAbs} stroke="#ff4d4d33" strokeDasharray="4 4" label={{ value: 'DD FLOOR', position: 'right', fontSize: 9, fill: '#ff4d4d88', fontFamily: 'IBM Plex Mono' }} />
                  {isPhase1or2 && (
                    <ReferenceLine y={account.startingBalance + stats.profitTarget} stroke="#00d68f33" strokeDasharray="4 4" label={{ value: 'TARGET', position: 'right', fontSize: 9, fill: '#00d68f88', fontFamily: 'IBM Plex Mono' }} />
                  )}
                  <Area type="monotone" dataKey="balance" stroke="#00d68f" strokeWidth={1.5} fill="url(#eqGrad)" dot={false} activeDot={{ r: 3, fill: '#00d68f', strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">
                <span>No trades yet — add your first trade to see the equity curve</span>
              </div>
            )}
          </div>

          {/* Recent trades */}
          <div className="card mt-1">
            <div className="section-title">RECENT TRADES</div>
            {data.trades.length === 0 ? (
              <div className="empty-state">No trades logged yet.</div>
            ) : (
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>PAIR</th>
                    <th>DIR</th>
                    <th>P&L</th>
                    <th>SETUP</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.trades].reverse().slice(0, 8).map(t => (
                    <tr key={t.id}>
                      <td className="mono text-dim">{t.date}</td>
                      <td className="mono">{t.pair}</td>
                      <td className={`mono ${t.direction === 'LONG' ? 'text-green' : 'text-red'}`}>{t.direction}</td>
                      <td className={`mono ${parseFloat(t.pnl) >= 0 ? 'text-green' : 'text-red'}`}>{fmt(parseFloat(t.pnl) || 0)}</td>
                      <td className="mono text-dim">{t.setup || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, color }) {
  const cls = color === 'green' ? 'text-green' : color === 'red' ? 'text-red' : 'text-amber';
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <span className={`stat-value mono ${color ? cls : ''}`}>{value}</span>
    </div>
  );
}
