import React, { useState } from 'react';
import './DailyJournal.css';

// ─── Guided prompts ───────────────────────────────────────────────────────────
const STEPS = [
  {
    id: 'energy',
    section: 'BEFORE THE SESSION',
    question: 'How was your energy and mindset going into today?',
    type: 'slider_plus_text',
    sliderLabel: ['Drained / Off', 'Neutral', 'Sharp / Locked in'],
    sliderKey: 'energyScore',
    textKey: 'energyNote',
    placeholder: 'e.g. Slept badly, felt distracted from the start...',
  },
  {
    id: 'bias',
    section: 'BEFORE THE SESSION',
    question: 'What was your market bias and plan going in?',
    type: 'text',
    textKey: 'bias',
    placeholder: 'e.g. Bearish on GU, watching the 1.2680 supply zone for a short...',
  },
  {
    id: 'emotion',
    section: 'DURING THE SESSION',
    question: 'What emotions showed up during the session?',
    type: 'tag_plus_text',
    tags: ['Calm', 'Confident', 'Anxious', 'FOMO', 'Greedy', 'Fearful', 'Frustrated', 'Revenge Mode', 'Overconfident', 'Bored'],
    tagKey: 'emotions',
    textKey: 'emotionNote',
    placeholder: 'Describe what triggered those feelings...',
  },
  {
    id: 'discipline',
    section: 'DURING THE SESSION',
    question: 'How well did you follow your trading rules today?',
    type: 'slider_plus_text',
    sliderLabel: ['Broke every rule', 'Mostly disciplined', 'Perfect execution'],
    sliderKey: 'disciplineScore',
    textKey: 'disciplineNote',
    placeholder: 'Which rules did you break or bend? What made you do it?',
  },
  {
    id: 'setups',
    section: 'TRADES & SETUPS',
    question: 'Which setups did you feel most confident in today?',
    type: 'text',
    textKey: 'confidentSetups',
    placeholder: 'e.g. The FVG long on NAS100 at 10:30 — felt clean, I trusted it fully...',
  },
  {
    id: 'regrets',
    section: 'TRADES & SETUPS',
    question: 'Any missed trades or moments you wish you had handled differently?',
    type: 'text',
    textKey: 'regrets',
    placeholder: 'e.g. Moved my SL out of fear on the EURUSD trade and it cost me R...',
  },
  {
    id: 'market',
    section: 'MARKET CONDITIONS',
    question: 'How would you describe today\'s market conditions?',
    type: 'tag_plus_text',
    tags: ['Trending', 'Ranging', 'Choppy', 'High volatility', 'Low volatility', 'News-driven', 'Clean structure', 'Manipulated / stop hunts'],
    tagKey: 'marketConditions',
    textKey: 'marketNote',
    placeholder: 'How did the conditions affect your trading decisions?',
  },
  {
    id: 'reflection',
    section: 'END OF DAY',
    question: 'One win from today — something you did well or learned.',
    type: 'text',
    textKey: 'win',
    placeholder: 'Be specific. Even a losing day has a win in it...',
  },
  {
    id: 'lesson',
    section: 'END OF DAY',
    question: 'One thing you\'d do differently tomorrow.',
    type: 'text',
    textKey: 'lesson',
    placeholder: 'One clear, actionable change...',
  },
  {
    id: 'overall',
    section: 'END OF DAY',
    question: 'Overall, how do you rate today as a trader — not by P&L, but by process?',
    type: 'slider_plus_text',
    sliderLabel: ['Poor process', 'Average', 'Excellent process'],
    sliderKey: 'overallScore',
    textKey: 'overallNote',
    placeholder: 'Anything else you want to remember about today...',
  },
];

const emptyEntry = () => ({
  date: new Date().toISOString().split('T')[0],
  pnl: '',
  energyScore: 5,
  energyNote: '',
  bias: '',
  emotions: [],
  emotionNote: '',
  disciplineScore: 5,
  disciplineNote: '',
  confidentSetups: '',
  regrets: '',
  marketConditions: [],
  marketNote: '',
  win: '',
  lesson: '',
  overallScore: 5,
  overallNote: '',
  aiCoachResponse: '',
  aiLoading: false,
});

// ─── AI Coach call ────────────────────────────────────────────────────────────
async function fetchCoachResponse(entry, previousEntries) {
  const recentSummaries = previousEntries.slice(-5).map(e =>
    `Date: ${e.date} | Discipline: ${e.disciplineScore}/10 | Overall: ${e.overallScore}/10 | Emotions: ${(e.emotions || []).join(', ')} | Win: ${e.win} | Lesson: ${e.lesson}`
  ).join('\n');

  const prompt = `You are an elite trading coach and mentor. A trader has just completed their daily journal entry. Your job is to:
1. Acknowledge what they shared genuinely (not generically)
2. Spot ONE meaningful pattern or insight based on today + their recent history
3. Ask ONE sharp, specific question that will make them think deeper
4. Give ONE concrete thing to focus on tomorrow

Be direct, warm, and specific. No generic motivational fluff. Talk like a mentor who knows them, not a chatbot.
Keep your response to 4 short paragraphs max.

TODAY'S ENTRY:
Date: ${entry.date}
P&L: ${entry.pnl ? '$' + entry.pnl : 'Not recorded'}
Energy going in: ${entry.energyScore}/10 — "${entry.energyNote}"
Market bias: ${entry.bias}
Emotions during session: ${entry.emotions.join(', ')} — "${entry.emotionNote}"
Discipline score: ${entry.disciplineScore}/10 — "${entry.disciplineNote}"
Confident setups: ${entry.confidentSetups}
Regrets / handled differently: ${entry.regrets}
Market conditions: ${entry.marketConditions.join(', ')} — "${entry.marketNote}"
Today's win: ${entry.win}
Tomorrow's change: ${entry.lesson}
Overall process score: ${entry.overallScore}/10 — "${entry.overallNote}"

RECENT JOURNAL HISTORY (last 5 entries):
${recentSummaries || 'No previous entries yet.'}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await response.json();
  return data.content?.[0]?.text || 'Could not get a response. Try again.';
}

// ─── Step renderer ────────────────────────────────────────────────────────────
function StepView({ step, entry, onChange, stepIndex, totalSteps }) {
  const progress = ((stepIndex) / totalSteps) * 100;

  return (
    <div className="step-view">
      <div className="step-progress-track">
        <div className="step-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="step-section-label">{step.section}</div>
      <h2 className="step-question">{step.question}</h2>

      {step.type === 'slider_plus_text' && (
        <div className="step-inputs">
          <div className="slider-block">
            <div className="slider-labels">
              <span>{step.sliderLabel[0]}</span>
              <span>{step.sliderLabel[1]}</span>
              <span>{step.sliderLabel[2]}</span>
            </div>
            <input
              type="range" min="1" max="10" step="1"
              value={entry[step.sliderKey]}
              onChange={e => onChange(step.sliderKey, parseInt(e.target.value))}
              className="score-slider"
            />
            <div className="slider-value">{entry[step.sliderKey]} / 10</div>
          </div>
          <textarea
            className="journal-textarea"
            placeholder={step.placeholder}
            value={entry[step.textKey]}
            onChange={e => onChange(step.textKey, e.target.value)}
            rows={3}
          />
        </div>
      )}

      {step.type === 'text' && (
        <div className="step-inputs">
          <textarea
            className="journal-textarea"
            placeholder={step.placeholder}
            value={entry[step.textKey]}
            onChange={e => onChange(step.textKey, e.target.value)}
            rows={4}
          />
        </div>
      )}

      {step.type === 'tag_plus_text' && (
        <div className="step-inputs">
          <div className="tag-grid">
            {step.tags.map(tag => {
              const selected = (entry[step.tagKey] || []).includes(tag);
              return (
                <button
                  key={tag}
                  className={`tag-btn ${selected ? 'selected' : ''}`}
                  onClick={() => {
                    const current = entry[step.tagKey] || [];
                    onChange(step.tagKey, selected ? current.filter(t => t !== tag) : [...current, tag]);
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
          <textarea
            className="journal-textarea"
            placeholder={step.placeholder}
            value={entry[step.textKey]}
            onChange={e => onChange(step.textKey, e.target.value)}
            rows={3}
          />
        </div>
      )}
    </div>
  );
}

// ─── AI Coach panel ───────────────────────────────────────────────────────────
function CoachPanel({ response, loading }) {
  if (loading) {
    return (
      <div className="coach-panel loading">
        <div className="coach-header">
          <span className="coach-icon">⬡</span>
          <span className="coach-label">COACH IS READING YOUR ENTRY...</span>
        </div>
        <div className="coach-dots">
          <span /><span /><span />
        </div>
      </div>
    );
  }
  if (!response) return null;
  return (
    <div className="coach-panel">
      <div className="coach-header">
        <span className="coach-icon">⬡</span>
        <span className="coach-label">COACH FEEDBACK</span>
      </div>
      <div className="coach-body">
        {response.split('\n').filter(Boolean).map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </div>
  );
}

// ─── Summary view (after completing) ─────────────────────────────────────────
function EntrySummary({ entry, onCoach, previousEntries }) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(entry.aiCoachResponse || '');

  const handleCoach = async () => {
    setLoading(true);
    try {
      const res = await fetchCoachResponse(entry, previousEntries);
      setResponse(res);
      onCoach(res);
    } catch (e) {
      setResponse('Something went wrong. Check your connection and try again.');
    }
    setLoading(false);
  };

  const scoreColor = (s) => s >= 8 ? 'var(--green)' : s >= 5 ? 'var(--amber)' : 'var(--red)';

  return (
    <div className="entry-summary fade-in">
      <div className="summary-header">
        <div className="summary-date mono">{entry.date}</div>
        <div className="summary-scores">
          <ScorePill label="ENERGY" value={entry.energyScore} color={scoreColor(entry.energyScore)} />
          <ScorePill label="DISCIPLINE" value={entry.disciplineScore} color={scoreColor(entry.disciplineScore)} />
          <ScorePill label="PROCESS" value={entry.overallScore} color={scoreColor(entry.overallScore)} />
          {entry.pnl && <ScorePill label="P&L" value={entry.pnl >= 0 ? `+$${entry.pnl}` : `-$${Math.abs(entry.pnl)}`} color={entry.pnl >= 0 ? 'var(--green)' : 'var(--red)'} raw />}
        </div>
      </div>

      <div className="summary-grid">
        <SummaryBlock label="EMOTIONS" value={(entry.emotions || []).join(', ') || '—'} />
        <SummaryBlock label="MARKET" value={(entry.marketConditions || []).join(', ') || '—'} />
        <SummaryBlock label="TODAY'S WIN" value={entry.win || '—'} />
        <SummaryBlock label="TOMORROW'S FOCUS" value={entry.lesson || '—'} />
        {entry.bias && <SummaryBlock label="BIAS / PLAN" value={entry.bias} />}
        {entry.confidentSetups && <SummaryBlock label="CONFIDENT SETUPS" value={entry.confidentSetups} />}
        {entry.regrets && <SummaryBlock label="WOULD DO DIFFERENTLY" value={entry.regrets} />}
        {entry.disciplineNote && <SummaryBlock label="DISCIPLINE NOTES" value={entry.disciplineNote} />}
      </div>

      {!response && !loading && (
        <button className="btn-coach" onClick={handleCoach}>
          <span className="coach-icon-sm">⬡</span>
          GET COACH FEEDBACK
        </button>
      )}

      <CoachPanel response={response} loading={loading} />
    </div>
  );
}

function ScorePill({ label, value, color, raw }) {
  return (
    <div className="score-pill">
      <span className="pill-label">{label}</span>
      <span className="pill-value mono" style={{ color }}>{raw ? value : `${value}/10`}</span>
    </div>
  );
}

function SummaryBlock({ label, value }) {
  return (
    <div className="summary-block">
      <div className="sb-label">{label}</div>
      <div className="sb-value">{value}</div>
    </div>
  );
}

// ─── Main DailyJournal ────────────────────────────────────────────────────────
export default function DailyJournal({ entries, onSave, previousEntries }) {
  const [mode, setMode] = useState('list'); // list | new | view
  const [currentStep, setCurrentStep] = useState(0);
  const [entry, setEntry] = useState(emptyEntry());
  const [viewEntry, setViewEntry] = useState(null);
  const [savedEntry, setSavedEntry] = useState(null);

  const onChange = (key, val) => setEntry(e => ({ ...e, [key]: val }));

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(s => s + 1);
    else finishEntry();
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  const finishEntry = () => {
    const finished = { ...entry, id: Date.now().toString() };
    onSave(finished);
    setSavedEntry(finished);
    setMode('done');
  };

  const startNew = () => {
    setEntry(emptyEntry());
    setCurrentStep(0);
    setSavedEntry(null);
    setMode('new');
  };

  const handleCoachSave = (response) => {
    if (savedEntry) {
      const updated = { ...savedEntry, aiCoachResponse: response };
      setSavedEntry(updated);
      onSave(updated, true); // update existing
    }
  };

  const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));

  // ── LIST mode ──
  if (mode === 'list') {
    return (
      <div className="journal-shell fade-in">
        <div className="journal-list-header">
          <div className="section-title">TRADING JOURNAL</div>
          <button className="btn btn-primary" onClick={startNew}>+ TODAY'S ENTRY</button>
        </div>

        {entries.length === 0 ? (
          <div className="journal-empty">
            <div className="je-icon">✦</div>
            <div className="je-title">Your journal is empty</div>
            <div className="je-sub">Start your first entry after today's session. Five minutes of reflection compounds over months.</div>
            <button className="btn btn-primary" onClick={startNew}>START FIRST ENTRY</button>
          </div>
        ) : (
          <div className="entry-list">
            {sorted.map(e => (
              <button key={e.id} className="entry-card" onClick={() => { setViewEntry(e); setMode('view'); }}>
                <div className="ec-left">
                  <div className="ec-date mono">{e.date}</div>
                  <div className="ec-emotions">{(e.emotions || []).slice(0, 3).map(em => (
                    <span key={em} className="ec-tag">{em}</span>
                  ))}</div>
                  <div className="ec-preview">{e.win || e.lesson || e.bias || '...'}</div>
                </div>
                <div className="ec-right">
                  <ScoreBar label="ENERGY" value={e.energyScore} />
                  <ScoreBar label="DISCIPLINE" value={e.disciplineScore} />
                  <ScoreBar label="PROCESS" value={e.overallScore} />
                  {e.pnl !== '' && e.pnl !== undefined && (
                    <div className={`ec-pnl mono ${parseFloat(e.pnl) >= 0 ? 'pos' : 'neg'}`}>
                      {parseFloat(e.pnl) >= 0 ? '+' : ''}${parseFloat(e.pnl).toFixed(2)}
                    </div>
                  )}
                  {e.aiCoachResponse && <div className="ec-coach-badge">⬡ COACHED</div>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── VIEW mode ──
  if (mode === 'view' && viewEntry) {
    return (
      <div className="journal-shell fade-in">
        <div className="journal-list-header">
          <button className="btn btn-ghost" onClick={() => setMode('list')}>← BACK</button>
          <button className="btn btn-primary" onClick={startNew}>+ NEW ENTRY</button>
        </div>
        <EntrySummary
          entry={viewEntry}
          previousEntries={entries.filter(e => e.id !== viewEntry.id)}
          onCoach={(res) => {
            const updated = { ...viewEntry, aiCoachResponse: res };
            setViewEntry(updated);
            onSave(updated, true);
          }}
        />
      </div>
    );
  }

  // ── DONE mode ──
  if (mode === 'done' && savedEntry) {
    return (
      <div className="journal-shell fade-in">
        <div className="journal-list-header">
          <button className="btn btn-ghost" onClick={() => setMode('list')}>← ALL ENTRIES</button>
        </div>
        <div className="done-banner">
          <span className="done-icon">✦</span>
          <span>Entry saved. Every reflection makes the next session better.</span>
        </div>
        <EntrySummary
          entry={savedEntry}
          previousEntries={previousEntries}
          onCoach={handleCoachSave}
        />
      </div>
    );
  }

  // ── NEW ENTRY mode ──
  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  return (
    <div className="journal-shell fade-in">
      <div className="journal-nav">
        <button className="btn btn-ghost sm" onClick={() => setMode('list')}>✕ CANCEL</button>
        <div className="step-counter mono">{currentStep + 1} / {STEPS.length}</div>
      </div>

      {/* P&L quick input at top of first step */}
      {currentStep === 0 && (
        <div className="pnl-quick">
          <label className="form-label">TODAY'S P&L (optional)</label>
          <div className="pnl-input-row">
            <input
              type="number"
              step="0.01"
              className="form-input pnl-input"
              placeholder="e.g. 320.00 or -85.00"
              value={entry.pnl}
              onChange={e => onChange('pnl', e.target.value)}
            />
            <div className="pnl-date mono">{entry.date}</div>
          </div>
        </div>
      )}

      <StepView
        step={step}
        entry={entry}
        onChange={onChange}
        stepIndex={currentStep}
        totalSteps={STEPS.length}
      />

      <div className="step-actions">
        {currentStep > 0 && (
          <button className="btn btn-ghost" onClick={handleBack}>← BACK</button>
        )}
        <button className="btn btn-primary step-next" onClick={handleNext}>
          {isLast ? 'FINISH & SAVE ✦' : 'NEXT →'}
        </button>
      </div>
    </div>
  );
}

function ScoreBar({ label, value }) {
  const color = value >= 8 ? 'var(--green)' : value >= 5 ? 'var(--amber)' : 'var(--red)';
  return (
    <div className="score-bar-row">
      <span className="sbr-label">{label}</span>
      <div className="sbr-track">
        <div className="sbr-fill" style={{ width: `${value * 10}%`, background: color }} />
      </div>
      <span className="sbr-val mono" style={{ color }}>{value}</span>
    </div>
  );
}
