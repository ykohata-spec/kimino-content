export const TABS = { SHELF: 'shelf', CHAT: 'chat', PROFILE: 'profile' };

export const CONTENT_TYPES = [
  { id: 'novel',   label: '小説',     color: '#7BA7CC' },
  { id: 'manga',   label: '漫画',     color: '#E08B8B' },
  { id: 'movie',   label: '映画',     color: '#C9A84C' },
  { id: 'anime',   label: 'アニメ',   color: '#A78BBA' },
  { id: 'drama',   label: 'ドラマ',   color: '#6BAFA0' },
  { id: 'tv_show', label: '番組',     color: '#D4976A' },
  { id: 'sports',  label: 'スポーツ', color: '#6BAF8D' },
  { id: 'game',    label: 'ゲーム',   color: '#7B8FCC' },
  { id: 'music',   label: '音楽',     color: '#CC7BA7' },
];

export const typeLabel = (id) => CONTENT_TYPES.find(t => t.id === id)?.label || id;
export const typeColor = (id) => CONTENT_TYPES.find(t => t.id === id)?.color || '#9BAAAA';

export const creatorLabel = (type) => {
  const map = {
    novel: '著者', manga: '著者', movie: '監督', anime: '制作',
    drama: '監督', tv_show: '制作', sports: 'チーム / 選手',
    game: '開発元', music: 'アーティスト',
  };
  return map[type] || '制作者';
};

export const GENRES = {
  novel: ['ミステリー','SF','ファンタジー','ホラー','純文学','歴史小説','恋愛','ライトノベル','エッセイ','ノンフィクション','ビジネス','その他'],
  manga: ['少年漫画','少女漫画','青年漫画','女性漫画','バトル','ラブコメ','スポーツ','日常系','ホラー','ファンタジー','SF','ギャグ','その他'],
  movie: ['アクション','コメディ','ドラマ','SF','ホラー','サスペンス','ロマンス','アニメーション','ドキュメンタリー','ファンタジー','その他'],
  anime: ['アクション','日常','恋愛','SF','ファンタジー','ホラー','コメディ','スポーツ','ロボット','異世界','その他'],
  drama: ['恋愛','サスペンス','ヒューマン','医療','刑事','時代劇','コメディ','社会派','その他'],
  tv_show: ['バラエティ','ドキュメンタリー','ニュース','情報','お笑い','音楽','料理','旅','教養','その他'],
  sports: ['サッカー','野球','バスケ','テニス','格闘技','モータースポーツ','陸上','水泳','ゴルフ','eスポーツ','その他'],
  game: ['RPG','アクション','アドベンチャー','シミュレーション','パズル','FPS','オープンワールド','格闘','音ゲー','インディー','その他'],
  music: ['J-POP','ロック','ヒップホップ','R&B','クラシック','ジャズ','EDM','アニソン','K-POP','洋楽','その他'],
};

export const ITEM_STATUS = [
  { id: 'done',        label: '済み' },
  { id: 'in_progress', label: '進行中' },
  { id: 'want',        label: '気になる' },
];

export const MOODS = [
  { label: '重い話が見たい',       prompt: '心にずっしり残るような重厚な作品を紹介してください。ジャンル問わず' },
  { label: 'サクッと楽しめる',     prompt: '短時間でサクッと楽しめる軽めのコンテンツを紹介してください' },
  { label: '泣けるやつ',           prompt: '思わず涙が出るような感動的な作品を紹介してください。映画でもアニメでも本でも' },
  { label: '新ジャンル開拓',       prompt: '私がまだ触れたことがなさそうなジャンルの入門におすすめのコンテンツを紹介してください' },
  { label: '一気に没頭したい',     prompt: '没頭できてやめられなくなるようなシリーズものを紹介してください' },
  { label: '今の気分で選んで',     prompt: '私の履歴を見て、今の私にぴったりのコンテンツを直感で1つ選んでください' },
];

export const uid  = () => Math.random().toString(36).slice(2, 10);
export const now  = () => new Date().toISOString();
export const fmtD = (d) => {
  try { return new Date(d).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }); }
  catch { return ''; }
};

export const C = {
  bg:        '#F5F7F6',
  bg2:       '#EDF0EE',
  text:      '#2C3333',
  textLight: '#5E6B6B',
  sub:       '#9BAAAA',
  accent:    '#6BAF8D',
  accent2:   '#A78BBA',
  link:      '#6B9FCC',
  border:    '#DEE4E2',
  star:      '#D4AA63',
  white:     '#FFFFFF',
};

export const S = {
  app: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: C.bg,
    color: C.text,
    fontFamily: "'Zen Kaku Gothic New','Noto Sans JP',system-ui,sans-serif",
    overflow: 'hidden',
  },
  nav: {
    display: 'flex',
    borderBottom: `1px solid ${C.border}`,
    background: '#FAFCFB',
    flexShrink: 0,
  },
  navBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14px 0',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 600,
    background: 'transparent',
    transition: 'all 0.2s',
    letterSpacing: '0.02em',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: 16,
    background: C.bg,
  },
  card: {
    background: '#fff',
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  inp: {
    width: '100%',
    padding: '10px 12px',
    background: '#FAFAFA',
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    color: C.text,
    fontSize: 13,
    marginBottom: 8,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical',
    display: 'block',
  },
  pri: {
    width: '100%',
    padding: '12px',
    background: C.accent,
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'block',
  },
  txtBtn: {
    background: 'none',
    border: 'none',
    color: C.sub,
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
    padding: 0,
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    color: C.sub,
    fontSize: 16,
    cursor: 'pointer',
    padding: '4px 8px',
    fontFamily: 'inherit',
  },
  fab: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    width: 52,
    height: 52,
    borderRadius: '50%',
    background: C.accent,
    border: 'none',
    fontSize: 22,
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(107,175,141,0.35)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
  },
  chip: {
    padding: '5px 12px',
    border: '1px solid',
    borderRadius: 16,
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
    background: '#fff',
    whiteSpace: 'nowrap',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 200,
  },
  modal: {
    background: '#fff',
    borderRadius: '18px 18px 0 0',
    padding: 20,
    width: '100%',
    maxWidth: 560,
    boxShadow: '0 -4px 32px rgba(0,0,0,0.14)',
    maxHeight: '92vh',
    overflowY: 'auto',
  },
  chatBox: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: 8,
    background: C.bg,
    minHeight: 0,
  },
  bub: {
    maxWidth: '85%',
    padding: '10px 14px',
    borderRadius: 12,
    border: '1px solid',
    fontSize: 14,
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
  },
  stat: {
    background: '#fff',
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: 12,
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  galleryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: 12,
  },
  sec: {
    fontSize: 16,
    fontWeight: 700,
    color: C.text,
    margin: '0 0 12px',
  },
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
    color: '#fff',
  },
};
