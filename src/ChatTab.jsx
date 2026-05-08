import { useState, useRef, useEffect } from 'react';
import { C, S, MOODS, typeLabel, now } from './constants.js';
import { getApiKey } from './storage.js';
import { callGemini, REC_SYS } from './api.js';

const STARTERS = [
  { label: '今の気分でおすすめを探す' },
  { label: '映画のおすすめを聞く' },
  { label: '小説・漫画のおすすめを聞く' },
  { label: 'アニメのおすすめを聞く' },
];

function fmtItem(b) {
  let s = `- ${typeLabel(b.type)}「${b.title}」${b.creator || ''} / ${b.genre || '未分類'} / ★${b.rating || '?'}`;
  if (b.tags?.length) s += ` (${b.tags.join(', ')})`;
  if (b.notes) s += `\n  メモ: ${b.notes.slice(0, 150)}`;
  return s;
}

function buildContext(items, prefs) {
  const done = items.filter(b => b.status === 'done');
  const want = items.filter(b => b.status === 'want');

  let ctx = '';
  if (done.length > 0 && prefs?.includeProfileInChat !== false) {
    const loved = done.filter(b => b.rating >= 4).slice(-20);
    const disliked = done.filter(b => b.rating && b.rating <= 2).slice(-10);
    const mid = done.filter(b => !b.rating || b.rating === 3).slice(-10);

    if (loved.length > 0) {
      ctx += '\n\n【高評価 ★4-5】\n' + loved.map(fmtItem).join('\n');
    }
    if (disliked.length > 0) {
      ctx += '\n\n【低評価 ★1-2】\n' + disliked.map(fmtItem).join('\n');
    }
    if (mid.length > 0) {
      ctx += '\n\n【その他】\n' + mid.map(fmtItem).join('\n');
    }

    const genres = {};
    const creators = {};
    done.forEach(b => {
      if (b.genre) genres[b.genre] = (genres[b.genre] || 0) + 1;
      if (b.creator) creators[b.creator] = (creators[b.creator] || 0) + 1;
    });
    const topGenres = Object.entries(genres).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);
    const topCreators = Object.entries(creators).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);
    ctx += `\n\n【プロフィール概要】好きなジャンル: ${topGenres.join(', ') || 'なし'} / お気に入り: ${topCreators.join(', ') || 'なし'} / 体験数: ${done.length}件`;
  }

  if (want.length > 0) {
    ctx += '\n\n【気になるリスト】\n' + want.slice(0, 10).map(b => `- ${typeLabel(b.type)}「${b.title}」${b.creator || ''}`).join('\n');
  }

  return ctx;
}

export default function ChatTab({ data, save }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  const history = data.chatHistory || [];
  const items = data.items || [];
  const rally = data.rallyCount || 0;

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [history.length, loading]);

  const send = async (text) => {
    if (!text.trim() || loading) return;
    const apiKey = getApiKey();
    const userMsg = { role: 'user', text: text.trim(), time: now() };
    const newHistory = [...history, userMsg];
    const newRally = rally + 1;
    save({ ...data, chatHistory: newHistory, rallyCount: newRally });
    setInput('');
    setLoading(true);

    const ctx = buildContext(items, data.prefs);
    const messagesForApi = newHistory.map(m => ({
      role: m.role,
      text: m.role === 'user' && m === userMsg ? m.text + ctx : m.text,
    }));

    const reply = await callGemini(apiKey, REC_SYS, messagesForApi, { useSearch: true });
    const aiMsg = { role: 'ai', text: reply, time: now() };
    save({ ...data, chatHistory: [...newHistory, aiMsg], rallyCount: newRally });
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const resetChat = () => {
    save({ ...data, chatHistory: [], rallyCount: 0 });
  };

  const handleStarter = (label) => {
    if (label === '今の気分でおすすめを探す') send('今の気分にぴったりのコンテンツを選んでください');
    else if (label === '映画のおすすめを聞く') send('おすすめの映画を教えてください');
    else if (label === '小説・漫画のおすすめを聞く') send('おすすめの小説や漫画を教えてください');
    else if (label === 'アニメのおすすめを聞く') send('おすすめのアニメを教えてください');
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {history.length > 0 && (
        <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ flex: 1, height: 4, background: C.bg2, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(rally / 10, 1) * 100}%`, height: '100%', background: C.accent, borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontSize: 10, color: C.sub }}>{rally}/10</span>
          <button style={{ ...S.txtBtn, fontSize: 11 }} onClick={resetChat}>リセット</button>
        </div>
      )}

      <div ref={chatRef} style={S.chatBox}>
        {history.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
            <div style={{ width: 72, height: 72, borderRadius: 16, background: C.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.accent, letterSpacing: '0.03em' }}>Rec</span>
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>あなたにぴったりのコンテンツを探しましょう</p>
            <p style={{ fontSize: 13, color: C.sub, textAlign: 'center', lineHeight: 1.7 }}>
              気分やジャンルを伝えると、あなたの履歴に基づいた<br />おすすめを提案します
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 320, marginTop: 8 }}>
              {STARTERS.map((s, i) => (
                <button
                  key={i}
                  style={{
                    ...S.card,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    padding: '14px 16px',
                    border: `1px solid ${C.border}`,
                    background: '#fff',
                    fontFamily: 'inherit',
                    fontSize: 13,
                    color: C.text,
                    textAlign: 'left',
                  }}
                  onClick={() => handleStarter(s.label)}
                >
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: C.accent, flexShrink: 0 }} />
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {history.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  ...S.bub,
                  background: m.role === 'user' ? '#F0F7F3' : '#fff',
                  borderColor: m.role === 'user' ? `${C.accent}40` : C.border,
                  color: C.text,
                }}>
                  <div style={{ fontSize: 10, color: C.sub, marginBottom: 4 }}>
                    {m.role === 'user' ? 'あなた' : 'きみのコンテンツ'}
                  </div>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ ...S.bub, background: '#fff', borderColor: C.border, color: C.sub, fontSize: 13 }}>
                  考え中...
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {history.length > 0 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '4px 16px', flexShrink: 0 }}>
          {MOODS.map((m, i) => (
            <button
              key={i}
              style={{ ...S.chip, borderColor: C.border, color: C.textLight, fontSize: 11 }}
              onClick={() => send(m.prompt)}
              disabled={loading}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: '8px 16px', display: 'flex', gap: 8, borderTop: `1px solid ${C.border}`, flexShrink: 0, background: '#FAFCFB' }}>
        <textarea
          ref={inputRef}
          style={{ ...S.inp, flex: 1, marginBottom: 0, minHeight: 40, maxHeight: 100, resize: 'none' }}
          placeholder="どんなコンテンツが見たい？"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
        />
        <button
          style={{
            ...S.pri,
            width: 56,
            padding: 0,
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: input.trim() && !loading ? 1 : 0.4,
          }}
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
        >
          送信
        </button>
      </div>
      <div style={{ height: 'env(safe-area-inset-bottom, 0px)', flexShrink: 0 }} />
    </div>
  );
}
