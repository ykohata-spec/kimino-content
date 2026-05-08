import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { C, S, CONTENT_TYPES, GENRES, ITEM_STATUS, typeColor, typeLabel, creatorLabel, uid, now } from './constants.js';
import { saveImage, resizeImage } from './storage.js';
import { searchContent, SEARCHABLE_TYPES } from './api.js';

export default function AddBookModal({ onSave, onClose, items, initial }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [creator, setCreator] = useState(initial?.creator || '');
  const [type, setType] = useState(initial?.type || 'novel');
  const [genre, setGenre] = useState(initial?.genre || '');
  const [rating, setRating] = useState(initial?.rating || 0);
  const [status, setStatus] = useState(initial?.status || 'want');
  const [tags, setTags] = useState(initial?.tags?.join(', ') || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [volumes, setVolumes] = useState(initial?.volumeCount || '');
  const [coverPreview, setCoverPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const fileRef = useRef(null);

  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimer = useRef(null);

  const canSearch = SEARCHABLE_TYPES.has(type);

  const handleTitleChange = useCallback((val) => {
    setTitle(val);
    if (canSearch) {
      setShowSuggestions(true);
      if (searchTimer.current) clearTimeout(searchTimer.current);
      if (val.trim().length >= 2 && !initial) {
        setSearching(true);
        searchTimer.current = setTimeout(async () => {
          const results = await searchContent(type, val.trim());
          setSuggestions(results);
          setSearching(false);
        }, 400);
      } else {
        setSuggestions([]);
        setSearching(false);
      }
    }
  }, [initial, type, canSearch]);

  const selectSuggestion = useCallback(async (s) => {
    setTitle(s.title + (s.subtitle ? ` ${s.subtitle}` : ''));
    if (s.creator) setCreator(s.creator);
    if (s.type) setType(s.type);
    if (s.genre) setGenre(s.genre);
    if (s.thumbnail) {
      setCoverPreview(s.thumbnail);
      try {
        const resp = await fetch(s.thumbnail);
        const blob = await resp.blob();
        const dataUrl = await resizeImage(blob, 600, 800);
        if (dataUrl) setCoverFile(dataUrl);
        else setCoverFile(s.thumbnail);
      } catch {
        setCoverFile(s.thumbnail);
      }
    }
    setSuggestions([]);
    setShowSuggestions(false);
  }, []);

  useEffect(() => {
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, []);

  useEffect(() => {
    setSuggestions([]);
    setShowSuggestions(false);
    const validGenres = GENRES[type] || [];
    if (genre && !validGenres.includes(genre)) setGenre('');
  }, [type]);

  const existingCreators = useMemo(() =>
    [...new Set((items || []).map(b => b.creator).filter(Boolean))],
    [items]
  );
  const [creatorFocused, setCreatorFocused] = useState(false);
  const filteredCreators = existingCreators.filter(a =>
    a && (!creator || a.toLowerCase().includes(creator.toLowerCase())) && a !== creator
  );

  const genreList = GENRES[type] || [];

  const handleCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await resizeImage(file, 600, 800);
    if (dataUrl) {
      setCoverPreview(dataUrl);
      setCoverFile(dataUrl);
    }
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    let coverImageId = initial?.coverImageId || null;
    let coverUrl = initial?.coverUrl || null;
    if (coverFile) {
      if (coverFile.startsWith('data:')) {
        coverImageId = uid();
        await saveImage(coverImageId, coverFile);
        coverUrl = null;
      } else {
        coverUrl = coverFile;
        coverImageId = null;
      }
    }
    onSave({
      id: initial?.id || uid(),
      title: title.trim(),
      creator: creator.trim(),
      type,
      genre,
      rating: rating || null,
      status,
      tags: tags.split(/[,、]/).map(t => t.trim()).filter(Boolean),
      notes: notes.trim(),
      coverImageId,
      coverUrl,
      volumeCount: type === 'manga' && volumes ? parseInt(volumes) : null,
      completedAt: status === 'done' ? (initial?.completedAt || now()) : null,
      createdAt: initial?.createdAt || now(),
    });
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, margin: '0 auto 16px' }} />
        <h3 style={{ ...S.sec, marginBottom: 16 }}>{initial ? 'コンテンツを編集' : 'コンテンツを追加'}</h3>

        {/* Type selector */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 10, paddingBottom: 2 }}>
          {CONTENT_TYPES.map(t => (
            <button
              key={t.id}
              style={{
                ...S.chip,
                borderColor: type === t.id ? t.color : C.border,
                color: type === t.id ? t.color : C.sub,
                background: type === t.id ? `${t.color}15` : '#fff',
                flexShrink: 0,
              }}
              onClick={() => setType(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Title with search suggestions */}
        <div style={{ position: 'relative' }}>
          <input
            style={S.inp}
            placeholder={canSearch ? 'タイトルを入力して検索 *' : 'タイトル *'}
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
          />
          {searching && <span style={{ position: 'absolute', right: 12, top: 10, fontSize: 11, color: C.sub }}>検索中...</span>}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 60,
              background: '#fff', border: `1px solid ${C.border}`, borderRadius: '0 0 10px 10px',
              boxShadow: '0 6px 20px rgba(0,0,0,0.12)', maxHeight: 280, overflowY: 'auto', marginTop: -8,
            }}>
              {suggestions.map((s, i) => (
                <div
                  key={s.id || i}
                  style={{
                    display: 'flex', gap: 10, padding: '8px 12px', cursor: 'pointer',
                    borderBottom: `1px solid ${C.border}20`, background: '#fff',
                  }}
                  onMouseDown={() => selectSuggestion(s)}
                  onMouseEnter={e => e.currentTarget.style.background = C.bg2}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  {s.thumbnail ? (
                    <img src={s.thumbnail} alt="" style={{ width: 36, height: 52, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 36, height: 52, borderRadius: 4, background: `${typeColor(s.type)}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 8, fontWeight: 700, color: typeColor(s.type) }}>{typeLabel(s.type)?.slice(0, 2)}</span>
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.title}{s.subtitle ? ` ${s.subtitle}` : ''}
                    </div>
                    <div style={{ fontSize: 11, color: C.textLight }}>{s.creator || '不明'}</div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                      <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, color: '#fff', background: typeColor(s.type) }}>
                        {typeLabel(s.type)}
                      </span>
                      {s.genre && <span style={{ fontSize: 9, color: C.sub }}>{s.genre}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Creator with autocomplete */}
        <div style={{ position: 'relative' }}>
          <input
            style={S.inp}
            placeholder={creatorLabel(type)}
            value={creator}
            onChange={e => setCreator(e.target.value)}
            onFocus={() => setCreatorFocused(true)}
            onBlur={() => setTimeout(() => setCreatorFocused(false), 200)}
          />
          {creatorFocused && filteredCreators.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#fff', border: `1px solid ${C.border}`, borderRadius: '0 0 8px 8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', maxHeight: 120, overflowY: 'auto', marginTop: -8 }}>
              {filteredCreators.slice(0, 6).map((a, i) => (
                <div key={i} style={{ padding: '6px 12px', fontSize: 12, color: C.text, cursor: 'pointer' }} onMouseDown={() => setCreator(a)}>{a}</div>
              ))}
            </div>
          )}
        </div>

        {/* Genre */}
        {genreList.length > 0 && (
          <select
            style={{ ...S.inp, appearance: 'auto' }}
            value={genre}
            onChange={e => setGenre(e.target.value)}
          >
            <option value="">ジャンルを選択</option>
            {genreList.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        )}

        {/* Volume count for manga */}
        {type === 'manga' && (
          <input
            style={S.inp}
            type="number"
            placeholder="巻数（任意）"
            value={volumes}
            onChange={e => setVolumes(e.target.value)}
            min="1"
          />
        )}

        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: C.textLight }}>評価:</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <div
                key={n}
                style={{
                  width: 28, height: 28, borderRadius: 6, cursor: 'pointer',
                  background: n <= rating ? C.star : C.bg2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  color: n <= rating ? '#fff' : C.sub,
                  transition: 'all 0.15s',
                }}
                onClick={() => setRating(n === rating ? 0 : n)}
              >
                {n}
              </div>
            ))}
          </div>
          {rating > 0 && <span style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{rating}.0</span>}
        </div>

        {/* Status */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          {ITEM_STATUS.map(s => (
            <button
              key={s.id}
              style={{
                ...S.chip,
                flex: 1,
                textAlign: 'center',
                borderColor: status === s.id ? C.accent : C.border,
                color: status === s.id ? C.accent : C.sub,
                background: status === s.id ? '#F0F7F3' : '#fff',
              }}
              onClick={() => setStatus(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Tags */}
        <input style={S.inp} placeholder="タグ（カンマ区切り）" value={tags} onChange={e => setTags(e.target.value)} />

        {/* Notes */}
        <textarea style={{ ...S.inp, minHeight: 60 }} placeholder="感想メモ（好きな理由・刺さらなかった理由など、書くほどAI分析の精度UP）" value={notes} onChange={e => setNotes(e.target.value)} />

        {/* Cover image */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button style={{ ...S.chip, borderColor: C.border, color: C.textLight }} onClick={() => fileRef.current?.click()}>
            カバー画像を選択
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCover} />
          {coverPreview && <img src={coverPreview} alt="" style={{ width: 40, height: 56, objectFit: 'cover', borderRadius: 4 }} />}
        </div>

        <button style={{ ...S.pri, opacity: title.trim() ? 1 : 0.5 }} onClick={handleSave} disabled={!title.trim()}>
          {initial ? '更新する' : '追加する'}
        </button>

        <div style={{ height: 'env(safe-area-inset-bottom, 8px)' }} />
      </div>
    </div>
  );
}
