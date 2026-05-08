import { useState, useRef, useCallback } from 'react';
import { C, S, TABS } from './constants.js';
import { loadData, saveData, emptyData, clearAllData, getApiKey, setApiKey, exportAllData, importAllData } from './storage.js';
import BookshelfTab from './BookshelfTab.jsx';
import ChatTab from './ChatTab.jsx';
import ProfileTab from './ProfileTab.jsx';

function useData() {
  const [data, setData] = useState(() => loadData());
  const save = useCallback((next) => { setData(next); saveData(next); }, []);
  return { data, save };
}

function Settings({ onClose, onImport }) {
  const [key, setKey] = useState(getApiKey());
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const impRef = useRef(null);
  const save = () => { setApiKey(key); onClose(); };

  const doExport = async () => {
    const json = await exportAllData();
    const b = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = `kimino-content-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setMsg('エクスポート完了');
  };

  const doImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true); setMsg(null);
    try {
      const text = await file.text();
      const restored = await importAllData(text);
      onImport(restored);
      setMsg(`インポート完了（${restored.items?.length || 0}件）`);
    } catch (err) {
      setMsg('エラー: ' + err.message);
    }
    setImporting(false);
    e.target.value = '';
  };

  const doReset = () => {
    clearAllData();
    onImport(emptyData());
    onClose();
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, margin: '0 auto 16px' }} />
        <h3 style={{ ...S.sec, marginBottom: 16 }}>設定</h3>

        <p style={{ fontSize: 13, color: C.textLight, lineHeight: 1.7, marginBottom: 12 }}>
          Gemini APIキーを設定してください。<br />
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: C.link }}>Google AI Studio</a> で無料取得できます。
        </p>

        <input
          type="password"
          style={S.inp}
          placeholder="AIza..."
          value={key}
          onChange={e => setKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()}
        />
        {key && (
          <p style={{ fontSize: 11, color: C.sub, marginBottom: 8 }}>
            ※ このキーはあなたのブラウザにのみ保存されます。
          </p>
        )}
        <button style={S.pri} onClick={save}>保存する</button>

        <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 20, paddingTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>データ移行</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ ...S.pri, flex: 1, background: C.accent2 }} onClick={doExport}>エクスポート</button>
            <button style={{ ...S.pri, flex: 1, background: C.bg2, color: C.text }} onClick={() => impRef.current?.click()} disabled={importing}>
              {importing ? '読込中...' : 'インポート'}
            </button>
            <input ref={impRef} type="file" accept=".json" style={{ display: 'none' }} onChange={doImport} />
          </div>
          {msg && <p style={{ fontSize: 12, color: msg.startsWith('エラー') ? '#D07070' : '#22C55E', marginTop: 8 }}>{msg}</p>}
        </div>

        <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 20, paddingTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#D07070', marginBottom: 8 }}>データリセット</div>
          {!confirmReset ? (
            <button style={{ ...S.pri, background: '#FEE2E2', color: '#D07070' }} onClick={() => setConfirmReset(true)}>
              全データを削除する
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ ...S.pri, flex: 1, background: '#DC2626' }} onClick={doReset}>本当に削除</button>
              <button style={{ ...S.pri, flex: 1, background: C.bg2, color: C.text }} onClick={() => setConfirmReset(false)}>キャンセル</button>
            </div>
          )}
        </div>

        <div style={{ height: 'env(safe-area-inset-bottom, 8px)' }} />
      </div>
    </div>
  );
}

const TAB_ITEMS = [
  { id: TABS.SHELF,   label: 'シェルフ' },
  { id: TABS.CHAT,    label: 'おすすめ' },
  { id: TABS.PROFILE, label: 'プロフィール' },
];

export default function App() {
  const { data, save } = useData();
  const [tab, setTab] = useState(TABS.SHELF);
  const [showSettings, setShowSettings] = useState(false);

  const handleImport = (restored) => save({ ...emptyData(), ...restored });

  return (
    <div style={S.app}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: `1px solid ${C.border}`, background: '#FAFCFB', flexShrink: 0 }}>
        <div style={{ flex: 1, fontSize: 16, fontWeight: 900, color: C.accent }}>きみのコンテンツ</div>
        <button style={{ ...S.txtBtn, fontSize: 13, color: C.textLight }} onClick={() => setShowSettings(true)}>設定</button>
      </div>

      <div style={S.nav}>
        {TAB_ITEMS.map(t => (
          <button
            key={t.id}
            style={{
              ...S.navBtn,
              color: tab === t.id ? C.accent : C.sub,
              borderBottomColor: tab === t.id ? C.accent : 'transparent',
            }}
            onClick={() => setTab(t.id)}
          >
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === TABS.SHELF && <BookshelfTab data={data} save={save} />}
      {tab === TABS.CHAT && <ChatTab data={data} save={save} />}
      {tab === TABS.PROFILE && <ProfileTab data={data} save={save} />}

      {showSettings && <Settings onClose={() => setShowSettings(false)} onImport={handleImport} />}
    </div>
  );
}
