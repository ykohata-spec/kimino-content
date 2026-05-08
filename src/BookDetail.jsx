import { useState, useEffect } from 'react';
import { C, S, ITEM_STATUS, typeLabel, typeColor, fmtD } from './constants.js';
import { getImage } from './storage.js';
import AddBookModal from './AddBookModal.jsx';

export default function BookDetail({ item, items, onSave, onDelete, onClose }) {
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [coverSrc, setCoverSrc] = useState(item.coverUrl || null);

  useEffect(() => {
    let cancelled = false;
    if (item.coverImageId) {
      getImage(item.coverImageId).then(url => { if (!cancelled && url) setCoverSrc(url); });
    } else if (item.coverUrl) {
      setCoverSrc(item.coverUrl);
    }
    return () => { cancelled = true; };
  }, [item.coverImageId, item.coverUrl]);

  if (editing) {
    return (
      <AddBookModal
        initial={item}
        items={items}
        onSave={(updated) => { onSave(updated); setEditing(false); }}
        onClose={() => setEditing(false)}
      />
    );
  }

  const statusObj = ITEM_STATUS.find(s => s.id === item.status);
  const statusLbl = statusObj?.label || item.status;

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, margin: '0 auto 16px' }} />

        {coverSrc && (
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <img src={coverSrc} alt="" style={{ maxHeight: 200, borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }} />
          </div>
        )}

        <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>{item.title}</h3>
        {item.creator && <p style={{ fontSize: 14, color: C.textLight, marginBottom: 12 }}>{item.creator}</p>}

        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ ...S.badge, background: typeColor(item.type) }}>
            {typeLabel(item.type)}
          </span>
          {item.genre && <span style={{ ...S.badge, background: C.accent2 }}>{item.genre}</span>}
          <span style={{
            ...S.badge,
            background: item.status === 'done' ? '#22C55E' : item.status === 'in_progress' ? C.accent : C.sub,
          }}>
            {statusLbl}
          </span>
          {item.type === 'manga' && item.volumeCount && (
            <span style={{ ...S.badge, background: C.textLight }}>全{item.volumeCount}巻</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          {item.rating ? (
            <>
              <div style={{ display: 'flex', gap: 3 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <div key={n} style={{ width: 12, height: 12, borderRadius: 2, background: n <= item.rating ? C.star : C.bg2 }} />
                ))}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.rating}.0 / 5.0</span>
            </>
          ) : (
            <span style={{ fontSize: 13, color: C.sub }}>未評価</span>
          )}
        </div>

        {item.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {item.tags.map((t, i) => (
              <span key={i} style={{ fontSize: 11, color: C.textLight, background: C.bg2, padding: '2px 8px', borderRadius: 4 }}>{t}</span>
            ))}
          </div>
        )}

        {item.notes && (
          <div style={{ ...S.card, marginBottom: 12 }}>
            <p style={{ fontSize: 13, color: C.text, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{item.notes}</p>
          </div>
        )}

        <div style={{ fontSize: 11, color: C.sub, marginBottom: 16 }}>
          追加日: {fmtD(item.createdAt)}
          {item.completedAt && ` ｜ 完了日: ${fmtD(item.completedAt)}`}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ ...S.pri, flex: 1 }} onClick={() => setEditing(true)}>編集する</button>
          {!confirmDel ? (
            <button style={{ ...S.pri, flex: 1, background: '#FEE2E2', color: '#D07070' }} onClick={() => setConfirmDel(true)}>削除</button>
          ) : (
            <button style={{ ...S.pri, flex: 1, background: '#DC2626' }} onClick={() => onDelete(item.id)}>本当に削除</button>
          )}
        </div>

        <div style={{ height: 'env(safe-area-inset-bottom, 8px)' }} />
      </div>
    </div>
  );
}
