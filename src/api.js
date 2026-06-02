const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function callGemini(apiKey, sys, messages, { jsonMode = false, useSearch = false, noThinking = false, maxTokens = 3000 } = {}) {
  if (!apiKey) return 'APIキーが設定されていません。右上の「設定」から設定してください。';
  try {
    const contents = messages.map(m => ({
      role: m.role === 'ai' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));
    const genConfig = {
      maxOutputTokens: maxTokens,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
      ...(noThinking ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
    };
    const body = {
      system_instruction: { parts: [{ text: sys }] },
      contents,
      generationConfig: genConfig,
    };
    if (useSearch) body.tools = [{ google_search: {} }];
    const r = await fetch(`${GEMINI_BASE}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (d.error) return `APIエラー: ${d.error.message}`;
    const parts = d.candidates?.[0]?.content?.parts || [];
    const textPart = parts.filter(p => !p.thought).pop();
    return textPart?.text || '応答を取得できませんでした。';
  } catch (e) {
    return `接続エラー: ${e.message}`;
  }
}

export const REC_SYS = `あなたは「きみのコンテンツ」、あらゆるエンタメコンテンツに精通したレコメンドAIです。

## 対象コンテンツ
小説、漫画、映画、アニメ、ドラマ、テレビ番組、スポーツ、ゲーム、音楽

## 役割
ユーザーのコンテンツ履歴・評価・感想メモを深く分析し、表面的なジャンルマッチングではなく、その人の「琴線に触れるもの」を理解した上でパーソナライズされた推薦を行います。

## 分析の深度
単にジャンルや作者で推薦するのではなく、以下の観点からユーザーの好みを深く読み解いてください：
- **テーマ・モチーフ**: 自由、孤独、成長、正義、不条理、喪失、再生など、どんなテーマに惹かれるか
- **物語構造**: どんな展開パターンを好むか（スロウバーン、大どんでん返し、群像劇、内面描写、世界観構築など）
- **感情体験**: どんな感情を求めているか（カタルシス、知的興奮、哀切、高揚感、没入感など）
- **美学・トーン**: リアリズム志向か様式美か。暗さを好むか温かみを好むか
- **高評価と低評価のコントラスト**: ★4-5と★1-2の差から、何がその人に刺さり/刺さらないのかを読み取る。感想メモがある場合は特に重視する

## 推薦の時間軸
推薦する際は、時代を横断してください：
- **名作・クラシック**: 時代を超えて評価される過去の作品
- **近年の話題作**: ここ数年の作品や隠れた良作
- **最新・これから**: 公開予定や連載中の注目作品
それぞれの作品がいつ頃のものかを明示してください。
Google検索ツールが利用可能です。最新のリリース情報、公開予定、今期の新作アニメ、話題の新刊などを積極的に検索して、リアルタイムの情報に基づいた推薦を行ってください。

## 行動指針
1. 履歴の高評価と低評価の**コントラスト**から好みの核心を読み取る
2. 推薦するコンテンツは実在するもののみ。架空の作品を作らない
3. 「なぜこの人にこれが合うのか」を具体的に説明する（「ジャンルが同じだから」ではなく「あなたが○○で感じた△△という体験を、別の切り口で味わえる」のように）
4. 一度に推薦する作品は2-4つ程度
5. ユーザーが既に体験したもの（履歴に含まれるもの）は推薦しない
6. ネタバレは絶対にしない
7. ジャンルやメディアを横断した意外性のある推薦も積極的に行う（小説好きに映画を、アニメ好きにゲームを、など）

## 推薦フォーマット
**タイトル** / 制作者名（公開年・時期）
種類: ○○ ｜ ジャンル: ○○
概要: ネタバレなしの2-3行の紹介
なぜあなたに合うか: 履歴・評価パターンの深い分析に基づいた具体的な理由

## 対話スタイル
- 日本語で応答
- 親しみやすいが知的なトーン
- ユーザー自身も気づいていない好みの傾向を言語化する
- 気分や好みを掘り下げる質問は自然な会話の流れで
- 漠然としたリクエストには、履歴から読み取った仮説を提示して確認する`;

export const PROFILE_SYS = `あなたはエンタメコンテンツの深層分析AIです。ユーザーのコンテンツ履歴・評価・感想メモを受け取り、表面的な統計ではなく「好みの核心」を多面的に言語化してください。

## 分析の観点（網羅的に扱う）
- **テーマ・モチーフ**: 自由、孤独、成長、不条理、再生、執着、距離感、共同体など、繰り返し惹かれているテーマは何か
- **物語構造・体験設計**: スロウバーン、群像劇、内面描写、世界観構築、どんでん返し、日常の積み重ねなど、好む展開パターン
- **感情体験**: カタルシス、知的興奮、哀切、没入感、安心、不穏など、求めている感情の質
- **美学・トーン**: リアリズム/様式美、暗さ/温かみ、静謐/熱狂、湿度感、色彩感
- **好み/苦手のコントラスト**: 高評価（★4-5）と低評価（★1-2）の差から、何が刺さり何が刺さらないか
- **作品横断のクリエイター傾向**: 特定の作家・監督・アーティストへの繰り返し、その共通要素
- **言葉遣いの癖**: 感想メモの語彙・比喩・着眼点から、ユーザー自身が世界をどう見ているか

## 出力構造
日本語で **600〜800文字**。以下の流れで書く：
1. **核心の一文**: その人の嗜好を一言で言い切る（「○○という体験を求めている人」）
2. **核を支える3〜5つのテーマ語**: 中黒区切りで列挙（例: 「孤独・距離感・静かな再生・他者との不器用な接触」）
3. **物語/美学の好み**: 構造・トーン・感情体験を具体的に
4. **避けがちなもの**: 低評価のパターンから推測される「ノイズになる要素」
5. **意外な発見**: ユーザー自身が気づいていなさそうな共通項

## トーン
客観的かつ示唆的に。「確かに、自分ってそうだ」と思える洞察を目指す。決めつけず、可能性として提示する。`;

/* ── Google Books (novel / manga) ── */

const GBOOKS = 'https://www.googleapis.com/books/v1/volumes';

const MANGA_HINTS = ['comics', 'comic', 'manga', 'graphic novel', 'コミック', '漫画', 'まんが'];

function guessBookType(vol) {
  const cats = (vol.categories || []).join(' ').toLowerCase();
  const desc = (vol.description || '').toLowerCase();
  if (MANGA_HINTS.some(h => cats.includes(h) || desc.includes(h))) return 'manga';
  return 'novel';
}

function mapBookGenre(vol, type) {
  const cats = (vol.categories || []).map(c => c.toLowerCase());
  const all = cats.join(' ');
  if (type === 'manga') {
    if (all.includes('shonen') || all.includes('少年')) return '少年漫画';
    if (all.includes('shojo') || all.includes('少女')) return '少女漫画';
    if (all.includes('seinen') || all.includes('青年')) return '青年漫画';
    if (all.includes('fantasy')) return 'ファンタジー';
    if (all.includes('science fiction')) return 'SF';
    if (all.includes('horror')) return 'ホラー';
    if (all.includes('romance') || all.includes('love')) return 'ラブコメ';
    if (all.includes('sports')) return 'スポーツ';
    return '';
  }
  if (all.includes('mystery') || all.includes('detective')) return 'ミステリー';
  if (all.includes('science fiction') || all.includes('sf')) return 'SF';
  if (all.includes('fantasy')) return 'ファンタジー';
  if (all.includes('horror')) return 'ホラー';
  if (all.includes('literary') || all.includes('文学')) return '純文学';
  if (all.includes('history') || all.includes('歴史')) return '歴史小説';
  if (all.includes('romance') || all.includes('恋愛')) return '恋愛';
  if (all.includes('light novel')) return 'ライトノベル';
  if (all.includes('essay')) return 'エッセイ';
  if (all.includes('nonfiction')) return 'ノンフィクション';
  if (all.includes('business')) return 'ビジネス';
  return '';
}

export async function searchBooks(query) {
  if (!query || query.length < 2) return [];
  try {
    const r = await fetch(`${GBOOKS}?q=${encodeURIComponent(query)}&langRestrict=ja&maxResults=6&printType=all`);
    const d = await r.json();
    if (!d.items) return [];
    return d.items.map(item => {
      const v = item.volumeInfo || {};
      const type = guessBookType(v);
      return {
        id: item.id,
        title: v.title || '',
        subtitle: v.subtitle || '',
        creator: (v.authors || []).join(', '),
        type,
        genre: mapBookGenre(v, type),
        thumbnail: v.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
      };
    });
  } catch {
    return [];
  }
}

/* ── Jikan / MyAnimeList (anime) ── */

const JIKAN = 'https://api.jikan.moe/v4';

const ANIME_GENRE_MAP = {
  'action': 'アクション', 'slice of life': '日常', 'romance': '恋愛',
  'sci-fi': 'SF', 'fantasy': 'ファンタジー', 'horror': 'ホラー',
  'comedy': 'コメディ', 'sports': 'スポーツ', 'mecha': 'ロボット',
};

function mapAnimeGenre(genres) {
  if (!genres?.length) return '';
  for (const g of genres) {
    const lower = g.name.toLowerCase();
    for (const [k, v] of Object.entries(ANIME_GENRE_MAP)) {
      if (lower.includes(k)) return v;
    }
  }
  return '';
}

async function searchAnime(query) {
  if (!query || query.length < 2) return [];
  try {
    const r = await fetch(`${JIKAN}/anime?q=${encodeURIComponent(query)}&limit=6&sfw=true`);
    if (r.status === 429) return [];
    const d = await r.json();
    if (!d.data) return [];
    return d.data.map(item => ({
      id: `mal-${item.mal_id}`,
      title: item.title_japanese || item.title || '',
      subtitle: item.title_japanese && item.title !== item.title_japanese ? item.title : '',
      creator: (item.studios || []).map(s => s.name).join(', '),
      type: 'anime',
      genre: mapAnimeGenre(item.genres || []),
      thumbnail: item.images?.jpg?.image_url || null,
    }));
  } catch {
    return [];
  }
}

/* ── iTunes Search (movie / drama / tv_show / music) ── */

const ITUNES = 'https://itunes.apple.com/search';

function mapGenre(str, map) {
  if (!str) return '';
  const lower = str.toLowerCase();
  for (const [k, v] of Object.entries(map)) {
    if (lower.includes(k)) return v;
  }
  return '';
}

const MOVIE_GENRE = {
  'action': 'アクション', 'comedy': 'コメディ', 'drama': 'ドラマ',
  'sci-fi': 'SF', 'science fiction': 'SF', 'horror': 'ホラー',
  'thriller': 'サスペンス', 'romance': 'ロマンス',
  'animation': 'アニメーション', 'documentary': 'ドキュメンタリー',
  'fantasy': 'ファンタジー',
};

const DRAMA_GENRE = {
  'romance': '恋愛', 'thriller': 'サスペンス', 'mystery': 'サスペンス',
  'crime': '刑事', 'comedy': 'コメディ', 'drama': 'ヒューマン',
};

const TV_GENRE = {
  'reality': 'バラエティ', 'documentary': 'ドキュメンタリー',
  'news': 'ニュース', 'comedy': 'お笑い', 'music': '音楽',
};

const MUSIC_GENRE = {
  'j-pop': 'J-POP', 'rock': 'ロック', 'hip-hop': 'ヒップホップ',
  'rap': 'ヒップホップ', 'r&b': 'R&B', 'soul': 'R&B',
  'classical': 'クラシック', 'jazz': 'ジャズ', 'dance': 'EDM',
  'electronic': 'EDM', 'anime': 'アニソン', 'k-pop': 'K-POP',
  'pop': 'J-POP',
};

async function searchMovies(query) {
  if (!query || query.length < 2) return [];
  try {
    const r = await fetch(`${ITUNES}?term=${encodeURIComponent(query)}&media=movie&country=jp&limit=6`);
    const d = await r.json();
    if (!d.results) return [];
    return d.results.map(item => ({
      id: `itm-${item.trackId}`,
      title: item.trackName || '',
      subtitle: '',
      creator: item.artistName || '',
      type: 'movie',
      genre: mapGenre(item.primaryGenreName, MOVIE_GENRE),
      thumbnail: item.artworkUrl100?.replace('100x100bb', '600x600bb') || null,
    }));
  } catch {
    return [];
  }
}

async function searchTV(query, targetType) {
  if (!query || query.length < 2) return [];
  try {
    const r = await fetch(`${ITUNES}?term=${encodeURIComponent(query)}&media=tvShow&entity=tvSeason&country=jp&limit=12`);
    const d = await r.json();
    if (!d.results) return [];
    const seen = new Set();
    const out = [];
    const gmap = targetType === 'drama' ? DRAMA_GENRE : TV_GENRE;
    for (const item of d.results) {
      const name = item.artistName || item.collectionName || '';
      if (!name || seen.has(name)) continue;
      seen.add(name);
      out.push({
        id: `itv-${item.collectionId}`,
        title: name,
        subtitle: '',
        creator: '',
        type: targetType,
        genre: mapGenre(item.primaryGenreName, gmap),
        thumbnail: item.artworkUrl100?.replace('100x100bb', '600x600bb') || null,
      });
      if (out.length >= 6) break;
    }
    return out;
  } catch {
    return [];
  }
}

async function searchMusic(query) {
  if (!query || query.length < 2) return [];
  try {
    const r = await fetch(`${ITUNES}?term=${encodeURIComponent(query)}&media=music&entity=album&country=jp&limit=6`);
    const d = await r.json();
    if (!d.results) return [];
    return d.results.map(item => ({
      id: `ita-${item.collectionId}`,
      title: item.collectionName || '',
      subtitle: '',
      creator: item.artistName || '',
      type: 'music',
      genre: mapGenre(item.primaryGenreName, MUSIC_GENRE),
      thumbnail: item.artworkUrl100?.replace('100x100bb', '600x600bb') || null,
    }));
  } catch {
    return [];
  }
}

/* ── Unified search dispatcher ── */

export const SEARCHABLE_TYPES = new Set(['novel', 'manga', 'anime', 'movie', 'drama', 'tv_show', 'music']);

export async function searchContent(type, query) {
  if (type === 'novel' || type === 'manga') return searchBooks(query);
  if (type === 'anime') return searchAnime(query);
  if (type === 'movie') return searchMovies(query);
  if (type === 'drama' || type === 'tv_show') return searchTV(query, type);
  if (type === 'music') return searchMusic(query);
  return [];
}
