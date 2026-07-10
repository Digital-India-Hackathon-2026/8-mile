import { useEffect, useRef, useState, useCallback } from 'react';
import './RagChatbot.css';

const RAG_URL = import.meta.env.VITE_RAG_URL || 'http://localhost:5050';

/* ── Markdown-lite renderer ─────────────────────────────────────── */
function renderMarkdown(text) {
  return text.split('\n').map((line, i) => {
    // Bullet points
    if (/^[-•*]\s/.test(line)) {
      const content = line.replace(/^[-•*]\s/, '');
      const html = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      return <li key={i} dangerouslySetInnerHTML={{ __html: html }} />;
    }
    // Bold headings like **Title:**
    if (/^\*\*.*\*\*/.test(line)) {
      const html = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      return <p key={i} className="rc__msg-heading" dangerouslySetInnerHTML={{ __html: html }} />;
    }
    // Empty line → spacing
    if (line.trim() === '') return <div key={i} className="rc__spacer" />;
    // Normal paragraph
    const html = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    return <p key={i} dangerouslySetInnerHTML={{ __html: html }} />;
  });
}

/* ── Typing indicator ───────────────────────────────────────────── */
function TypingDots() {
  return (
    <div className="rc__msg rc__msg--bot">
      <span className="rc__avatar">🪷</span>
      <div className="rc__bubble rc__typing">
        <span /><span /><span />
      </div>
    </div>
  );
}

/* ── Suggested questions ────────────────────────────────────────── */
const SUGGESTIONS = {
  state: (name) => [
    `What crafts is ${name} famous for?`,
    `Tell me about ${name}'s culture`,
    `Which crafts have GI tags in ${name}?`,
    `Where can I visit craft clusters in ${name}?`,
  ],
  artisan: (name) => [
    `What does ${name} specialise in?`,
    `How can I book a workshop with ${name}?`,
    `What is ${name}'s trust score?`,
    `What languages does ${name} speak?`,
  ],
  general: () => [
    'What states have the best crafts?',
    'How does the trust verification work?',
    'How do I book a workshop?',
    'What is a GI tag?',
  ],
};

/* ══════════════════════════════════════════════════════════════════
   Main RagChatbot component
   ══════════════════════════════════════════════════════════════════ */
export default function RagChatbot({ context = '', stateName = '', artisanName = '', compact = false }) {
  const mode         = artisanName ? 'artisan' : stateName ? 'state' : 'general';
  const suggestions  = artisanName
    ? SUGGESTIONS.artisan(artisanName)
    : stateName
    ? SUGGESTIONS.state(stateName)
    : SUGGESTIONS.general();

  const welcomeMsg = artisanName
    ? `Namaste! 🙏 I'm CraftBot — ask me anything about **${artisanName}**'s craft, workshop, availability, and how to book a visit.`
    : stateName
    ? `Namaste! 🙏 I'm CraftBot — I know everything about **${stateName}**'s heritage crafts, culture, GI products, and the best craft clusters to visit!`
    : `Namaste! 🙏 I'm CraftBot, your Indian craft guide. Ask me about any state's crafts, artisan verification, booking workshops, or planning a craft village visit!`;

  const [messages,  setMessages]  = useState([{ role: 'bot', text: welcomeMsg }]);
  const [input,     setInput]     = useState('');
  const [busy,      setBusy]      = useState(false);
  const [ragStatus, setRagStatus] = useState(null);   // null | { ready, indexed }
  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);

  // Build history array for the API (last 6 messages, alternating user/assistant)
  const buildHistory = useCallback((msgs) => {
    return msgs
      .filter(m => m.role !== 'bot' || msgs.indexOf(m) !== 0)  // skip welcome msg
      .slice(-6)
      .map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text }));
  }, []);

  // Check RAG server status on mount
  useEffect(() => {
    fetch(`${RAG_URL}/api/rag/status`)
      .then(r => r.json())
      .then(setRagStatus)
      .catch(() => setRagStatus({ ready: false, indexed: 0, message: 'RAG server offline' }));
  }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const send = useCallback(async (question) => {
    const q = (question || input).trim();
    if (!q || busy) return;

    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setInput('');
    setBusy(true);
    inputRef.current?.focus();

    try {
      const history = buildHistory(messages);
      const res = await fetch(`${RAG_URL}/api/rag/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, context, history }),
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();

      setMessages(prev => [...prev, {
        role: 'bot',
        text: data.answer || 'No answer returned.',
        retrieved: data.retrieved,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: `⚠️ Could not reach the RAG server at ${RAG_URL}. Make sure \`python app.py\` is running in the \`rag/\` folder.`,
        isError: true,
      }]);
    } finally {
      setBusy(false);
    }
  }, [input, busy, messages, context, buildHistory]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className={`rc ${compact ? 'rc--compact' : ''}`}>
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="rc__head">
        <div className="rc__head-left">
          <div className="rc__head-avatar">🤖</div>
          <div>
            <div className="rc__head-name">CraftBot AI</div>
            <div className="rc__head-sub">
              {artisanName ? `Expert on ${artisanName}` :
               stateName   ? `${stateName} heritage guide` :
               'India craft & artisan guide'}
            </div>
          </div>
        </div>
        <div className="rc__head-status">
          {ragStatus === null ? (
            <span className="rc__status rc__status--loading">Connecting…</span>
          ) : ragStatus.ready ? (
            <span className="rc__status rc__status--live">
              <span className="rc__dot" />
              {ragStatus.indexed} docs
            </span>
          ) : (
            <span className="rc__status rc__status--off">Offline</span>
          )}
        </div>
      </div>

      {/* ── RAG offline banner ───────────────────────────────────── */}
      {ragStatus && !ragStatus.ready && (
        <div className="rc__offline-banner">
          <strong>RAG server not running.</strong>{' '}
          Open a terminal in <code>crafttrail/rag/</code> and run:{' '}
          <code>python app.py</code>
        </div>
      )}

      {/* ── Messages ─────────────────────────────────────────────── */}
      <div className="rc__messages">
        {messages.map((m, i) => (
          <div key={i} className={`rc__msg rc__msg--${m.role} ${m.isError ? 'rc__msg--err' : ''}`}>
            {m.role === 'bot' && <span className="rc__avatar">🪷</span>}
            <div className="rc__bubble">
              {renderMarkdown(m.text)}
              {m.retrieved > 0 && (
                <div className="rc__source-note">
                  🔍 {m.retrieved} knowledge chunks retrieved
                </div>
              )}
            </div>
          </div>
        ))}

        {busy && <TypingDots />}
        <div ref={bottomRef} />
      </div>

      {/* ── Suggestions (shown when only welcome msg present) ─────── */}
      {messages.length === 1 && !busy && (
        <div className="rc__suggestions">
          {suggestions.map((s, i) => (
            <button key={i} className="rc__suggestion" onClick={() => send(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Input ────────────────────────────────────────────────── */}
      <div className="rc__input-wrap">
        <input
          ref={inputRef}
          className="rc__input"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={
            artisanName ? `Ask about ${artisanName}…` :
            stateName   ? `Ask about ${stateName}'s crafts…` :
            'Ask about Indian crafts…'
          }
          disabled={busy}
          autoComplete="off"
        />
        <button
          className="rc__send"
          onClick={() => send()}
          disabled={busy || !input.trim()}
          aria-label="Send message"
        >
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M22 2L15 22 11 13 2 9l20-7z" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="rc__footer">
        Powered by CraftTrail RAG · Groq llama-3.1-70b · ChromaDB
      </div>
    </div>
  );
}
