import { useState, useMemo } from 'react';
import { C, S, CONTENT_TYPES, typeLabel, typeColor } from './constants.js';
import { getApiKey } from './storage.js';
import { callGemini, PROFILE_SYS } from './api.js';

export default function ProfileTab({ data }) {
  const [aiSummary, setAiSummary] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const items = data.items || [];
  const done = useMemo(() => items.filter(b => b.status === 'done'), [items]);

  const typeCounts = useMemo(() => {
    const counts = {};
    done.forEach(b => { counts[b.type] = (counts[b.type] || 0) + 1; });
    return CONTENT_TYPES.filter(t => counts[t.id]).map(t => ({ ...t, count: counts[t.id] }));
  }, [done]);

  const stats = useMemo(() => {
    const genres = {};
    const creators = {};
    const ratings = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const monthly = {};

    done.forEach(b => {
      if (b.genre) genres[b.genre] = (genres[b.genre] || 0) + 1;
      if (b.creator) creators[b.creator] = (creators[b.creator] || 0) + 1;
      if (b.rating) ratings[b.rating]++;
      if (b.completedAt) {
        const m = b.completedAt.slice(0, 7);
        monthly[m] = (monthly[m] || 0) + 1;
      }
    });

    const topGenres = Object.entries(genres).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const topCreators = Object.entries(creators).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxGenre = topGenres.length > 0 ? topGenres[0][1] : 1;
    const avgRating = done.length > 0 && done.some(b => b.rating)
      ? (done.reduce((s, b) => s + (b.rating || 0), 0) / done.filter(b => b.rating).length).toFixed(1)
      : '-';

    const months = Object.entries(monthly).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
    const maxMonth = months.length > 0 ? Math.max(...months.map(m => m[1])) : 1;

    return { topGenres, topCreators, ratings, avgRating, maxGenre, months, maxMonth };
  }, [done]);

  const analyzeProfile = async () => {
    const apiKey = getApiKey();
    if (!apiKey || done.length === 0) return;
    setAnalyzing(true);
    const loved = done.filter(b => b.rating >= 4);
    const disliked = done.filter(b => b.rating && b.rating <= 2);
    const mid = done.filter(b => !b.rating || b.rating === 3);
    const fmt = b => {
      let s = `${typeLabel(b.type)}「${b.title}」${b.creator || ''} / ${b.genre || ''} / ★${b.rating || '?'}`;
      if (b.notes) s += ` / メモ: ${b.notes.slice(0, 150)}`;
      return s;
    };
    let prompt = '';
    if (loved.length > 0) prompt += '【高評価 ★4-5】\n' + loved.map(fmt).join('\n') + '\n\n';
    if (disliked.length > 0) prompt += '【低評価 ★1-2】\n' + disliked.map(fmt).join('\n') + '\n\n';
    if (mid.length > 0) prompt += '【その他】\n' + mid.map(fmt).join('\n') + '\n\n';
    prompt += `体験済み合計: ${done.length}件`;
    const reply = await callGemini(apiKey, PROFILE_SYS, [{ role: 'user', text: prompt }]);
    setAiSummary(reply);
    setAnalyzing(false);
  };

  if (items.length === 0) {
    return (
      <div style={{ ...S.content, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: C.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.textLight, letterSpacing: '0.05em' }}>Profile</span>
        </div>
        <p style={{ fontSize: 14, color: C.text, fontWeight: 600, marginBottom: 4 }}>コンテンツプロフィール</p>
        <p style={{ fontSize: 13, color: C.sub }}>シェルフにコンテンツを追加すると、ここに統計が表示されます</p>
      </div>
    );
  }

  return (
    <div style={S.content}>
      {/* Total + type breakdown */}
      <div style={{ ...S.card, marginBottom: 16, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 32, fontWeight: 900, color: C.accent }}>{done.length}</span>
          <span style={{ fontSize: 13, color: C.sub }}>コンテンツ体験済み</span>
        </div>
        {typeCounts.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {typeCounts.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: t.color }} />
                <span style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{t.count}</span>
                <span style={{ fontSize: 11, color: C.sub }}>{t.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Average rating */}
      {stats.avgRating !== '-' && (
        <div style={{ ...S.card, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: `${C.star}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: C.star }}>{stats.avgRating}</span>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>平均評価</div>
            <div style={{ fontSize: 12, color: C.sub }}>5段階中 {stats.avgRating}</div>
          </div>
        </div>
      )}

      {/* Genre distribution */}
      {stats.topGenres.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={S.sec}>ジャンル分布</h3>
          {stats.topGenres.map(([genre, count]) => (
            <div key={genre} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: C.text, width: 80, textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{genre}</span>
              <div style={{ flex: 1, height: 16, background: C.bg2, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${(count / stats.maxGenre) * 100}%`, height: '100%', background: C.accent, borderRadius: 4, transition: 'width 0.3s' }} />
              </div>
              <span style={{ fontSize: 11, color: C.sub, width: 24, textAlign: 'right' }}>{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Favorite creators */}
      {stats.topCreators.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={S.sec}>お気に入りクリエイター</h3>
          {stats.topCreators.map(([creator, count], i) => (
            <div key={creator} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: `1px solid ${C.border}30` }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.accent, width: 20 }}>{i + 1}</span>
              <span style={{ fontSize: 13, color: C.text, flex: 1 }}>{creator}</span>
              <span style={{ fontSize: 12, color: C.sub }}>{count}件</span>
            </div>
          ))}
        </div>
      )}

      {/* Rating distribution */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={S.sec}>評価分布</h3>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 80 }}>
          {[1, 2, 3, 4, 5].map(r => {
            const count = stats.ratings[r];
            const maxR = Math.max(...Object.values(stats.ratings), 1);
            return (
              <div key={r} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, color: C.sub }}>{count}</span>
                <div style={{ width: '100%', background: C.bg2, borderRadius: 4, overflow: 'hidden', height: 50 }}>
                  <div style={{
                    width: '100%',
                    height: `${(count / maxR) * 100}%`,
                    background: C.star,
                    borderRadius: 4,
                    marginTop: 'auto',
                    position: 'relative',
                    top: `${100 - (count / maxR) * 100}%`,
                  }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.star }}>{r}.0</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly timeline */}
      {stats.months.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={S.sec}>タイムライン</h3>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 80 }}>
            {stats.months.map(([month, count]) => (
              <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, color: C.sub }}>{count}</span>
                <div style={{ width: '100%', background: C.bg2, borderRadius: 4, overflow: 'hidden', height: 50 }}>
                  <div style={{
                    width: '100%',
                    height: `${(count / stats.maxMonth) * 100}%`,
                    background: C.accent2,
                    borderRadius: 4,
                    position: 'relative',
                    top: `${100 - (count / stats.maxMonth) * 100}%`,
                  }} />
                </div>
                <span style={{ fontSize: 9, color: C.sub }}>{month.slice(5)}月</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI analysis */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={S.sec}>AI傾向分析</h3>
        {aiSummary ? (
          <div style={{ ...S.card, marginBottom: 8 }}>
            <p style={{ fontSize: 13, color: C.text, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{aiSummary}</p>
          </div>
        ) : null}
        <button
          style={{ ...S.pri, background: done.length > 0 ? C.accent2 : C.sub, opacity: analyzing ? 0.5 : 1 }}
          onClick={analyzeProfile}
          disabled={analyzing || done.length === 0}
        >
          {analyzing ? '分析中...' : aiSummary ? '再分析する' : 'AIにコンテンツ傾向を分析してもらう'}
        </button>
        {done.length === 0 && (
          <p style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>体験済みのコンテンツが必要です</p>
        )}
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}
