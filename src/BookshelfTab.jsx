import { useState, useEffect, useMemo } from 'react';
import { C, S, CONTENT_TYPES, typeLabel, typeColor } from './constants.js';
import { getImage, deleteImage } from './storage.js';
import AddBookModal from './AddBookModal.jsx';
import BookDetail from './BookDetail.jsx';

const FILTERS = [
  { id: 'all', label: 'すべて' },
  ...CONTENT_TYPES.map(t => ({ id: t.id, label: t.label })),
  { id: 'high', label: '高評価' },
  { id: 'want', label: '気になる' },
];

const TYPE_IDS = new Set(CONTENT_TYPES.map(t => t.id));

function CoverThumb({ imageId, coverUrl, type, style }) {
  const [src, setSrc] = useState(coverUrl || null);
  useEffect(() => {
    let c = false;
    if (imageId) getImage(imageId).then(u => { if (!c && u) setSrc(u); });
    else if (coverUrl) setSrc(coverUrl);
    return () => { c = true; };
  }, [imageId, coverUrl]);

  const color = typeColor(type);
  if (src) return <img src={src} alt="" style={{ objectFit: 'cover', borderRadius: 6, ...style }} onError={() => setSrc(null)} />;
  return (
    <div style={{
      ...style,
      borderRadius: 6,
      background: `${color}18`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <span style={{
        fontSize: style.width > 60 ? 11 : 9,
        fontWeight: 700,
        color,
        letterSpacing: '0.05em',
      }}>
        {typeLabel(type)}
      </span>
    </div>
  );
}

export default function BookshelfTab({ data, save }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState('gallery');
  const [showAdd, setShowAdd] = useState(false);
  const [detail, setDetail] = useState(null);

  const items = data.items || [];

  const filtered = useMemo(() => {
    let list = items;
    if (TYPE_IDS.has(filter)) list = list.filter(b => b.type === filter);
    if (filter === 'high') list = list.filter(b => b.rating >= 4);
    if (filter === 'want') list = list.filter(b => b.status === 'want');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b => b.title.toLowerCase().includes(q) || b.creator?.toLowerCase().includes(q));
    }
    return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [items, filter, search]);

  const handleAdd = (item) => {
    const existing = items.findIndex(b => b.id === item.id);
    const next = [...items];
    if (existing >= 0) next[existing] = item;
    else next.unshift(item);
    save({ ...data, items: next });
    setShowAdd(false);
  };

  const handleUpdate = (item) => {
    const next = items.map(b => b.id === item.id ? item : b);
    save({ ...data, items: next });
    setDetail(item);
  };

  const handleDelete = async (id) => {
    const item = items.find(b => b.id === id);
    if (item?.coverImageId) await deleteImage(item.coverImageId);
    save({ ...data, items: items.filter(b => b.id !== id) });
    setDetail(null);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            style={{ ...S.inp, flex: 1, marginBottom: 0 }}
            placeholder="タイトル・制作者で検索"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            style={{ ...S.txtBtn, fontSize: 12, color: C.accent, padding: '8px 4px' }}
            onClick={() => setView(v => v === 'gallery' ? 'list' : 'gallery')}
          >
            {view === 'gallery' ? 'リスト' : 'グリッド'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8 }}>
          {FILTERS.map(f => (
            <button
              key={f.id}
              style={{
                ...S.chip,
                borderColor: filter === f.id ? C.accent : C.border,
                color: filter === f.id ? C.accent : C.sub,
                background: filter === f.id ? '#F0F7F3' : '#fff',
              }}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
          <span style={{ fontSize: 11, color: C.sub, display: 'flex', alignItems: 'center', paddingLeft: 4 }}>
            {filtered.length}件
          </span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: C.sub }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: C.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.textLight, letterSpacing: '0.05em' }}>0件</span>
            </div>
            <p style={{ fontSize: 14, color: C.text, fontWeight: 600, marginBottom: 4 }}>まだコンテンツが登録されていません</p>
            <p style={{ fontSize: 12 }}>右下の＋ボタンからコンテンツを追加しましょう</p>
          </div>
        ) : view === 'gallery' ? (
          <div style={S.galleryGrid}>
            {filtered.map(b => (
              <div key={b.id} style={{ ...S.card, padding: 0, overflow: 'hidden', cursor: 'pointer' }} onClick={() => setDetail(b)}>
                <CoverThumb imageId={b.coverImageId} coverUrl={b.coverUrl} type={b.type} style={{ width: '100%', height: 140 }} />
                <div style={{ padding: '8px 10px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</div>
                  <div style={{ fontSize: 11, color: C.textLight, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.creator}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: C.star, fontWeight: 600 }}>{b.rating ? `${b.rating}.0` : ''}</span>
                    <span style={{ ...S.badge, fontSize: 9, background: typeColor(b.type) }}>
                      {typeLabel(b.type)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {filtered.map(b => (
              <div
                key={b.id}
                style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.border}30`, cursor: 'pointer' }}
                onClick={() => setDetail(b)}
              >
                <CoverThumb imageId={b.coverImageId} coverUrl={b.coverUrl} type={b.type} style={{ width: 44, height: 60, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</div>
                  <div style={{ fontSize: 12, color: C.textLight }}>{b.creator}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 2, alignItems: 'center' }}>
                    <span style={{ ...S.badge, fontSize: 9, background: typeColor(b.type) }}>
                      {typeLabel(b.type)}
                    </span>
                    {b.genre && <span style={{ fontSize: 10, color: C.sub }}>{b.genre}</span>}
                    {b.rating > 0 && <span style={{ fontSize: 10, color: C.star, fontWeight: 600 }}>{b.rating}.0</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button style={S.fab} onClick={() => setShowAdd(true)}>+</button>

      {showAdd && <AddBookModal items={items} onSave={handleAdd} onClose={() => setShowAdd(false)} />}
      {detail && (
        <BookDetail
          item={detail}
          items={items}
          onSave={handleUpdate}
          onDelete={handleDelete}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}
