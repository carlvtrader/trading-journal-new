import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './Evolution.css';

const EMOTION_COLORS = {
  'Calm': '#00d68f',
  'Confident': '#4da6ff',
  'Anxious': '#f5a623',
  'FOMO': '#ff4d4d',
  'Greedy': '#ff8c00',
  'Fearful': '#cc44ff',
  'Frustrated': '#ff4d4d',
  'Revenge Mode': '#ff0000',
  'Overconfident': '#ffdd00',
  'Bored': '#666666',
};

function groupByMonth(entries) {
  const groups = {};
  entries.forEach(e => {
    const month = e.date.slice(0, 7); // YYYY-MM
    if (!groups[month]) groups[month] = [];
    groups[month].push(e);
  });
  return groups;
}

function monthLabel(ym) {
  const [y, m] = ym.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m) - 1]} ${y.slice(2)}`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-bright)', borderRadius: '2px', padding: '0.6rem 0.85rem' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-2)', marginBottom: '0.4rem' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: p.color, display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}>
          <span>{p.name}</span><span>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function Evolution({ entries }) {
  const [activeTab, setActiveTab] = useState('scores');

  const monthlyData = useMemo(() => {
    const groups = groupByMonth(entries);
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([month, es]) => {
      const avg = (key) => es.reduce((s, e) => s + (parseFloat(e[key]) || 0), 0) / es.length;
      const totalPnl = es.reduce((s, e) => s + (parseFloat(e.pnl) || 0), 0);

      // Emotion frequency
      const emotionCounts = {};
      es.forEach(e => (e.emotions || []).forEach(em => { emotionCounts[em] = (emotionCounts[em] || 0) + 1; }));
      const topEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

      return {
        month: monthLabel(month),
        raw: month,
        days: es.length,
        energy: parseFloat(avg('energyScore').toFixed(1)),
        discipline: parseFloat(avg('disciplineScore').toFixed(1)),
        process: parseFloat(avg('overallScore').toFixed(1)),
        pnl: parseFloat(totalPnl.toFixed(2)),
        topEmotion,
        emotionCounts,
        entries: es,
      };
    });
  }, [entries]);

  // All-time emotion frequency
  const allEmotions = useMemo(() => {
    const counts = {};
    entries.forEach(e => (e.emotions || []).forEach(em => { counts[em] = (counts[em] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [entries]);

  // Discipline vs P&L correlation insight
  const correlationInsight = useMemo(() => {
    const scored = entries.filter(e => e.disciplineScore && e.pnl !== '' && e.pnl !== undefined);
    if (scored.length < 3) return null;
    const highDisc = scored.filter(e => e.disciplineScore >= 7);
    const lowDisc = scored.filter(e => e.disciplineScore < 7);
    const avgPnl = arr => arr.length > 0 ? arr.reduce((s, e) => s + parseFloat(e.pnl), 0) / arr.length : 0;
    return { highAvg: avgPnl(highDisc), lowAvg: avgPnl(lowDisc), highCount: highDisc.length, lowCount: lowDisc.length };
  }, [entries]);

  // Best & worst day patterns
  const dayPatterns = useMemo(() => {
    if (entries.length < 5) return null;
    const byDay = {};
    entries.forEach(e => {
      const d = new Date(e.date).getDay();
      const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d];
      if (!byDay[dayName]) byDay[dayName] = [];
      byDay[dayName].push(e);
    });
    return Object.entries(byDay).map(([day, es]) => ({
      day,
      avgDisc: (es.reduce((s, e) => s + (parseFloat(e.disciplineScore) || 0), 0) / es.length).toFixed(1),
      count: es.length,
    })).sort((a, b) => parseFloat(b.avgDisc) - parseFloat(a.avgDisc));
  }, [entries]);

  if (entries.length < 2) {
    return (
      <div className="evolution-empty fade-in">
        <div className="ee-icon">✦</div>
        <div className="ee-title">EVOLUTION TRACKER</div>
        <div className="ee-sub">Add at least 2 journal entries to start seeing your patterns and growth over time.</div>
      </div>
    );
  }

  const tabs = [
    { id: 'scores', label: 'SCORES' },
    { id: 'emotions', label: 'EMOTIONS' },
    { id: 'patterns', label: 'PATTERNS' },
  ];

  return (
    <div className="evolution fade-in">
      <div className="section-title">MY EVOLUTION AS A TRADER</div>

      {/* Tab bar */}
      <div className="evo-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`evo-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >{t.label}</button>
        ))}
      </div>

      {/* ── SCORES TAB ── */}
      {activeTab === 'scores' && (
        <div className="evo-section">
          <div className="card">
            <div className="section-title">ENERGY · DISCIPLINE · PROCESS (monthly avg)</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#5a5a5a', fontFamily: 'IBM Plex Mono' }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#5a5a5a', fontFamily: 'IBM Plex Mono' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontFamily: 'IBM Plex Mono', fontSize: '0.6rem', letterSpacing: '0.1em' }} />
                <Line type="monotone" dataKey="energy" name="ENERGY" stroke="#4da6ff" strokeWidth={2} dot={{ r: 3, fill: '#4da6ff', strokeWidth: 0 }} />
                <Line type="monotone" dataKey="discipline" name="DISCIPLINE" stroke="#f5a623" strokeWidth={2} dot={{ r: 3, fill: '#f5a623', strokeWidth: 0 }} />
                <Line type="monotone" dataKey="process" name="PROCESS" stroke="#00d68f" strokeWidth={2} dot={{ r: 3, fill: '#00d68f', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly breakdown cards */}
          <div className="month-cards">
            {[...monthlyData].reverse().map(m => (
              <div key={m.raw} className="month-card card">
                <div className="mc-header">
                  <span className="mc-month mono">{m.month}</span>
                  <span className="mc-days mono text-dim">{m.days} {m.days === 1 ? 'day' : 'days'}</span>
                  {m.pnl !== 0 && (
                    <span className={`mc-pnl mono ${m.pnl >= 0 ? 'text-green' : 'text-red'}`}>
                      {m.pnl >= 0 ? '+' : ''}${m.pnl.toFixed(0)}
                    </span>
                  )}
                </div>
                <div className="mc-scores">
                  <MiniScore label="ENERGY" value={m.energy} />
                  <MiniScore label="DISCIPLINE" value={m.discipline} />
                  <MiniScore label="PROCESS" value={m.process} />
                </div>
                <div className="mc-emotion">Top emotion: <strong>{m.topEmotion}</strong></div>
              </div>
            ))}
          </div>

          {/* Discipline ↔ P&L insight */}
          {correlationInsight && (
            <div className="insight-card card">
              <div className="ic-label">INSIGHT — DISCIPLINE vs P&L</div>
              <div className="ic-body">
                On days where your discipline score was <strong>7+</strong>, your average P&L was{' '}
                <span className={correlationInsight.highAvg >= 0 ? 'text-green' : 'text-red'}>
                  ${correlationInsight.highAvg.toFixed(0)}
                </span>
                {' '}({correlationInsight.highCount} sessions).
                On lower discipline days, it was{' '}
                <span className={correlationInsight.lowAvg >= 0 ? 'text-green' : 'text-red'}>
                  ${correlationInsight.lowAvg.toFixed(0)}
                </span>
                {' '}({correlationInsight.lowCount} sessions).
                {correlationInsight.highAvg > correlationInsight.lowAvg
                  ? ' Your discipline directly impacts your results. Keep following the process.'
                  : ' Interesting — your results don\'t yet closely follow discipline. This is worth reflecting on.'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── EMOTIONS TAB ── */}
      {activeTab === 'emotions' && (
        <div className="evo-section">
          <div className="card">
            <div className="section-title">ALL-TIME EMOTION FREQUENCY</div>
            <div className="emotion-bars">
              {allEmotions.map(([em, count]) => (
                <div key={em} className="emotion-bar-row">
                  <span className="ebr-label">{em}</span>
                  <div className="ebr-track">
                    <div
                      className="ebr-fill"
                      style={{
                        width: `${(count / allEmotions[0][1]) * 100}%`,
                        background: EMOTION_COLORS[em] || 'var(--text-2)',
                      }}
                    />
                  </div>
                  <span className="ebr-count mono">{count}×</span>
                </div>
              ))}
            </div>
          </div>

          {/* Emotion over time */}
          <div className="card">
            <div className="section-title">EMOTION TRENDS (by month)</div>
            <div className="emotion-month-grid">
              {monthlyData.map(m => (
                <div key={m.raw} className="emg-col">
                  <div className="emg-month mono">{m.month}</div>
                  <div className="emg-tags">
                    {Object.entries(m.emotionCounts)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 4)
                      .map(([em, count]) => (
                        <div key={em} className="emg-tag" style={{ borderColor: EMOTION_COLORS[em] || 'var(--border)', color: EMOTION_COLORS[em] || 'var(--text-2)' }}>
                          {em} <span className="emg-count">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Negative emotion insights */}
          {allEmotions.filter(([em]) => ['FOMO', 'Revenge Mode', 'Frustrated', 'Fearful', 'Anxious'].includes(em)).length > 0 && (
            <div className="insight-card card">
              <div className="ic-label">INSIGHT — NEGATIVE EMOTION WATCH</div>
              <div className="ic-body">
                Your most frequent challenging emotion is <strong>{allEmotions.filter(([em]) => ['FOMO','Revenge Mode','Frustrated','Fearful','Anxious','Greedy'].includes(em))[0]?.[0] || '—'}</strong>.
                {' '}Notice which market conditions or times of day tend to trigger it. That awareness is the first step to managing it.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PATTERNS TAB ── */}
      {activeTab === 'patterns' && (
        <div className="evo-section">
          {/* Day of week patterns */}
          {dayPatterns && (
            <div className="card">
              <div className="section-title">DISCIPLINE BY DAY OF WEEK</div>
              <div className="day-pattern-grid">
                {dayPatterns.filter(d => d.count > 0).map(d => {
                  const score = parseFloat(d.avgDisc);
                  const color = score >= 7 ? 'var(--green)' : score >= 5 ? 'var(--amber)' : 'var(--red)';
                  return (
                    <div key={d.day} className="day-card">
                      <div className="day-name mono">{d.day}</div>
                      <div className="day-score mono" style={{ color }}>{d.avgDisc}</div>
                      <div className="day-bar-track">
                        <div className="day-bar-fill" style={{ height: `${score * 10}%`, background: color }} />
                      </div>
                      <div className="day-count mono text-dim">{d.count}d</div>
                    </div>
                  );
                })}
              </div>
              {dayPatterns.length > 0 && (
                <div className="pattern-note">
                  Best day: <strong>{dayPatterns[0].day}</strong> (avg {dayPatterns[0].avgDisc}/10) ·
                  Hardest day: <strong>{dayPatterns[dayPatterns.length - 1].day}</strong> (avg {dayPatterns[dayPatterns.length - 1].avgDisc}/10)
                </div>
              )}
            </div>
          )}

          {/* Wins over time */}
          <div className="card">
            <div className="section-title">YOUR WINS — WHAT YOU DID WELL</div>
            <div className="wins-list">
              {[...entries]
                .filter(e => e.win)
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 10)
                .map(e => (
                  <div key={e.id} className="win-item">
                    <span className="win-date mono text-dim">{e.date}</span>
                    <span className="win-text">{e.win}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Lessons over time */}
          <div className="card">
            <div className="section-title">YOUR LESSONS — WHAT YOU'D DO DIFFERENTLY</div>
            <div className="wins-list">
              {[...entries]
                .filter(e => e.lesson)
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 10)
                .map(e => (
                  <div key={e.id} className="win-item">
                    <span className="win-date mono text-dim">{e.date}</span>
                    <span className="win-text">{e.lesson}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniScore({ label, value }) {
  const color = value >= 7 ? 'var(--green)' : value >= 5 ? 'var(--amber)' : 'var(--red)';
  return (
    <div className="mini-score">
      <span className="ms-label">{label}</span>
      <span className="ms-value mono" style={{ color }}>{value}</span>
    </div>
  );
}
