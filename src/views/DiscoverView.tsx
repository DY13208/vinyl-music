import React, { useEffect, useRef, useState } from 'react';
import { Search, Music2, UserRound, Disc3, Barcode, Play, Pause, Plus, Check, ChevronRight, X } from 'lucide-react';
import type { Album, Track } from '../types';
import { ArtworkImage } from '../components/ArtworkImage';
import { CatalogueError, getPublicAlbum, searchVinyl, type VinylSearchResponse } from '../services/collectionApi';
import { isInCollection } from '../utils/catalogue';
import { catalogueCache } from '../services/catalogueCache';
import './DiscoverView.css';

type Match = VinylSearchResponse['results'][number];
interface DiscoverViewProps {
  albums: Album[];
  onAddAlbum: (album: Album) => Promise<void>;
  onPreview: (album: Album, track: Track) => void;
  playingAlbumId?: string;
  playingTrackId?: string;
  isPlaying: boolean;
  isLoading: boolean;
  playbackMessage: string;
  onOpenPlayer?: () => void;
  onOpenAlbumDetail?: (album: Album) => void;
  onOpenArtist?: (artist: string, albums: Album[]) => void;
  onOpenTrack?: (album: Album, track: Track) => void;
}

const startingArtists = ['周杰伦', '陈奕迅', '宇多田ヒカル', 'The Beatles', 'Miles Davis'];
const preferredAlbum = (match: Match) => match.vinylRelease ?? match.album;
const albumsFromMatches = (matches: Match[]) => matches.map(match => preferredAlbum(match));

export function DiscoverView(props: DiscoverViewProps) {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState({ query: startingArtists[0], retry: 0 });
  const [results, setResults] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cacheMessage, setCacheMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const savingRef = useRef(false);
  const [selection, setSelection] = useState<{ match: Match; album: Album } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const backdropPressed = useRef(false);
  const details = useRef(new Map<string, Album>());
  const [vinylOnly, setVinylOnly] = useState(false);
  const [allArtists, setAllArtists] = useState(false);
  const [allAlbums, setAllAlbums] = useState(false);
  const [allTracks, setAllTracks] = useState(false);
  const pendingArtist = useRef<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setError(''); setNotice(''); setCacheMessage(''); setRefreshing(false);
    setLoading(true); setResults([]);
    void (async () => {
      const cached = await catalogueCache.get('search', search.query);
      if (controller.signal.aborted) return;
      if (cached) {
        setResults(cached.data); setLoading(false);
        if (pendingArtist.current === search.query) {
          pendingArtist.current = null;
          props.onOpenArtist?.(search.query, albumsFromMatches(cached.data));
          return;
        }
        if (!cached.stale && !search.retry) return;
        setCacheMessage('已显示本机保存的资料，正在更新…');
        setRefreshing(true);
      }
      try {
        const response = await searchVinyl({ query: search.query, artist: startingArtists.includes(search.query) ? search.query : undefined }, controller.signal);
        if (controller.signal.aborted) return;
        setResults(response.results); setCacheMessage('');
        void catalogueCache.put('search', search.query, response.results);
        if (pendingArtist.current === search.query) {
          pendingArtist.current = null;
          props.onOpenArtist?.(search.query, albumsFromMatches(response.results));
        }
      } catch (reason) {
        if (controller.signal.aborted) return;
        if (reason instanceof CatalogueError && reason.status === 404) {
          setResults([]); setCacheMessage('');
          void catalogueCache.put('search', search.query, []);
        } else if (cached) setCacheMessage('暂时无法更新，正在显示本机保存的资料。');
        else setError('暂时无法获取公开唱片资料，请稍后重试。');
      } finally {
        if (!controller.signal.aborted) { setLoading(false); setRefreshing(false); }
      }
    })();
    return () => controller.abort();
  }, [search]);

  const selectionId = selection?.album.id;
  useEffect(() => {
    const modal = dialog.current;
    if (selectionId && modal && !modal.open) {
      modal.showModal(); closeButton.current?.focus();
    } else if (!selectionId && modal?.open) modal.close();
  }, [selectionId]);

  useEffect(() => {
    setDetailError(''); setDetailLoading(false);
    if (!selectionId) return;
    const provider = ['apple-music', 'discogs', 'musicbrainz', 'deezer'].find(source => selectionId.startsWith(`${source}-`));
    if (!provider || details.current.has(selectionId)) return;
    const controller = new AbortController();
    setDetailLoading(true);
    void (async () => {
      const cached = await catalogueCache.get('album', selectionId);
      if (controller.signal.aborted) return;
      if (cached) {
        setSelection(current => current?.album.id === selectionId ? { ...current, album: cached.data } : current);
        setDetailLoading(false);
        if (!cached.stale) { details.current.set(selectionId, cached.data); return; }
      }
      try {
        const album = await getPublicAlbum(provider, selectionId.slice(provider.length + 1), controller.signal);
        if (controller.signal.aborted) return;
        details.current.set(selectionId, album);
        setSelection(current => current?.album.id === selectionId ? { ...current, album } : current);
        void catalogueCache.put('album', selectionId, album);
      } catch {
        if (!controller.signal.aborted) setDetailError('暂时无法补全曲目，仍可查看已获取的资料。');
      } finally { if (!controller.signal.aborted) setDetailLoading(false); }
    })();
    return () => controller.abort();
  }, [selectionId]);

  const runSearch = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setQuery(trimmed); setSearch({ query: trimmed, retry: 0 });
  };
  const openArtist = (artist: string) => {
    const albums = search.query === artist ? displayAlbums.map(item => item.album) : [];
    if (albums.length || search.query === artist) {
      props.onOpenArtist?.(artist, albums);
      return;
    }
    pendingArtist.current = artist;
    runSearch(artist);
  };
  const open = (match: Match) => {
    const album = preferredAlbum(match);
    setNotice(''); setSelection({ match, album: details.current.get(album.id) ?? album });
  };
  const close = () => { if (!savingRef.current) setSelection(null); };
  const add = async (album: Album) => {
    if (savingRef.current || isInCollection(album, props.albums)) return;
    savingRef.current = true; setSaving(album.id); setNotice('');
    try {
      await props.onAddAlbum({ ...album, isCollected: true, addedAt: new Date().toISOString() });
      setNotice(`《${album.title}》已加入我的唱片架`);
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : '本机保存失败，请重试。');
    } finally { savingRef.current = false; setSaving(null); }
  };
  const addButton = (album: Album) => {
    const collected = isInCollection(album, props.albums);
    return <button type="button" className="discover-add" disabled={collected || saving !== null} onClick={() => void add(album)} aria-label={`${collected ? '已在唱片架' : '加入唱片架'}：${album.title}`}>
      {collected ? <Check size={15} /> : <Plus size={15} />}{collected ? '已在唱片架' : saving === album.id ? '正在保存…' : '加入唱片架'}
    </button>;
  };
  const previewButton = (album: Album, track: Track, label = '试听', compact = false) => {
    const current = props.playingAlbumId === album.id && props.playingTrackId === track.id;
    return <button type="button" className={`discover-preview${compact ? ' discover-preview--icon' : ''}`} disabled={current && props.isLoading} aria-busy={current && props.isLoading} onClick={() => props.onPreview(album, track)} aria-label={`${current && props.isPlaying ? '暂停试听' : '试听'}：${track.title}`}>
      {current && props.isPlaying ? <Pause size={compact ? 20 : 17} fill="currentColor" /> : <Play size={compact ? 20 : 17} fill="currentColor" />}{!compact && <span>{current && props.isLoading ? '查找音源…' : current && props.isPlaying ? '暂停' : label}</span>}
    </button>;
  };
  const visibleResults = results.filter(match => !vinylOnly || match.vinylReleaseFound);
  const selected = selection?.album;
  const displayAlbums = visibleResults.map(match => {
    const album = preferredAlbum(match);
    return { match, album: details.current.get(album.id) ?? album };
  });
  const tracks = [...new Map(displayAlbums.flatMap(({ album }) => album.tracks.map(track => ({ album, track })))
    .map(item => [`${item.album.artist}|${item.album.title}|${item.track.title}`, item] as const)).values()];
  const leadAlbum = results[0] ? preferredAlbum(results[0]) : undefined;
  const leadTrack = tracks[0];

  const openAlbum = (match: Match) => {
    const album = details.current.get(preferredAlbum(match).id) ?? preferredAlbum(match);
    if (props.onOpenAlbumDetail) props.onOpenAlbumDetail(album);
    else open(match);
  };

  return <main id="discover-view" className="discover-page">
    <div className="discover-atmosphere" aria-hidden="true">{leadAlbum && <ArtworkImage src={leadAlbum.coverUrl} alt="" />}</div>
    <header className="discover-header"><h1>发现音乐</h1><p>先听听，再选一张放进唱片架。</p></header>
    <form className="discover-search" role="search" onSubmit={event => { event.preventDefault(); runSearch(query); }}>
      <Search size={19} aria-hidden="true" /><input aria-label="搜索公开唱片" placeholder="搜索音乐人、专辑或条码" value={query} maxLength={160} onChange={event => setQuery(event.target.value)} />
      <button type="submit" disabled={!query.trim()} aria-label="搜索"><ChevronRight size={21} /></button>
    </form>
    <div className="discover-search-hints" aria-hidden="true"><span><UserRound size={13} />音乐人</span><span><Disc3 size={13} />专辑</span><span><Barcode size={13} />条码</span></div>
    <section className="discover-artists" aria-labelledby="discover-artists-title"><div className="discover-section-heading"><h2 id="discover-artists-title">热门音乐人</h2><button type="button" aria-expanded={allArtists} aria-controls="discover-artist-list" onClick={() => setAllArtists(value => !value)}>{allArtists ? '收起' : '查看全部'}<ChevronRight size={15} /></button></div>
      <div id="discover-artist-list" className={`discover-artist-list${allArtists ? ' is-expanded' : ''}`}>{startingArtists.map(artist => <button type="button" key={artist} aria-pressed={search.query === artist} onClick={() => openArtist(artist)}><span className="discover-artist__portrait" aria-hidden="true"><Disc3 size={29} strokeWidth={1} /></span><span>{artist}</span></button>)}</div>
    </section>
    {!loading && !error && visibleResults.length > 0 && <section className="discover-hero" aria-label="当前搜索结果">
      <div className="discover-hero__art" aria-hidden="true">{leadAlbum && <ArtworkImage src={leadAlbum.coverUrl} alt="" />}</div>
      <div className="discover-hero__copy"><p><Disc3 size={13} />公开发行资料</p><h2>{search.query}</h2><span>已找到 {visibleResults.length} 张相关唱片</span>{leadTrack && previewButton(leadTrack.album, leadTrack.track, '播放热门歌曲')}</div>
    </section>}
    <div className="discover-results-heading"><p>探索声音，遇见下一张</p><label><input type="checkbox" checked={vinylOnly} onChange={event => setVinylOnly(event.target.checked)} />仅看已确认黑胶</label></div>
    {!loading && !error && <button type="button" className="discover-refresh" disabled={refreshing} onClick={() => setSearch(value => ({ ...value, retry: value.retry + 1 }))}>{refreshing ? '正在更新资料…' : '更新唱片资料'}</button>}
    {cacheMessage && <p className="discover-notice" role="status">{cacheMessage}</p>}
    {notice && !selection && <p className="discover-notice" role="status">{notice}</p>}
    {props.playingAlbumId && !selection && props.playbackMessage && <p className="discover-playback" role="status">{props.playbackMessage}</p>}
    {loading ? <div className="discover-loading" role="status"><span>正在查找公开唱片资料…</span><div aria-hidden="true">{[0, 1, 2, 3].map(index => <div key={index} />)}</div></div>
      : error ? <div className="discover-empty" role="alert"><p>{error}</p><button type="button" onClick={() => setSearch(value => ({ ...value, retry: value.retry + 1 }))}>重新加载</button></div>
      : !visibleResults.length ? <div className="discover-empty"><Disc3 size={36} /><h3>{vinylOnly && results.length ? '暂未查到明确的黑胶发行记录' : '没有找到相关唱片'}</h3><p>{vinylOnly && results.length ? '可以先浏览专辑资料，再核对具体版本。' : '换一个音乐人、专辑名称或条码试试。'}</p>{vinylOnly && results.length > 0 && <button type="button" onClick={() => setVinylOnly(false)}>查看专辑资料</button>}</div>
      : <><section className="discover-albums" aria-labelledby="discover-albums-title"><div className="discover-section-heading"><h2 id="discover-albums-title">{startingArtists.includes(search.query) ? `${search.query}的专辑` : '相关专辑'}</h2><button type="button" aria-expanded={allAlbums} aria-controls="discover-album-list" onClick={() => setAllAlbums(value => !value)}>{allAlbums ? '收起' : '查看全部'}<ChevronRight size={15} /></button></div>
      <div id="discover-album-list" className={`discover-album-list${allAlbums ? ' is-expanded' : ''}`}>{displayAlbums.map(({ match, album }) => {
        return <article className="discover-record" key={album.id} aria-label={`${album.title} · ${album.artist}`}>
          <div className="discover-record__visual"><button type="button" className="discover-record__open" onClick={() => openAlbum(match)} aria-label={`打开专辑：${album.title}`}><span className="discover-record__cover"><ArtworkImage src={album.coverUrl} alt={album.title} loading="lazy" /></span></button>{album.tracks[0] && previewButton(album, album.tracks[0], '试听', true)}</div>
          <div className="discover-record__copy"><h3><button type="button" className="discover-record__title" onClick={() => openAlbum(match)}>{album.title}</button></h3><button type="button" className="discover-record__artist" onClick={() => openArtist(album.artist)}>{album.artist}{album.year ? ` · ${album.year}` : ''}</button><p className="discover-record__edition">{match.vinylReleaseFound ? '已查到黑胶版本' : '黑胶版本待核实'}</p></div>
          <div className="discover-record__actions">{!album.tracks[0] && <button type="button" onClick={() => open(match)}><Music2 size={15} />查看曲目</button>}{match.alternatives.length > 1 ? <button type="button" className="discover-add" aria-label={`选择黑胶版本：${album.title}`} onClick={() => open(match)}><Plus size={15} />选择黑胶版本</button> : addButton(album)}</div>
        </article>;
      })}</div></section>
      {tracks.length > 0 && <section className="discover-songs" aria-labelledby="discover-songs-title"><div className="discover-section-heading"><h2 id="discover-songs-title">热门歌曲</h2>{tracks.length > 5 && <button type="button" aria-expanded={allTracks} aria-controls="discover-song-list" onClick={() => setAllTracks(value => !value)}>{allTracks ? '收起' : '查看全部'}<ChevronRight size={15} /></button>}</div><p className="discover-caption">来自当前唱片的可用曲目</p>
        <ol id="discover-song-list" className="discover-song-list">{(allTracks ? tracks : tracks.slice(0, 5)).map(({ album, track }) => <li key={`${album.id}-${track.id}`}><button type="button" className="discover-song__main" onClick={() => props.onOpenTrack ? props.onOpenTrack(album, track) : props.onPreview(album, track)}><span className="discover-song__cover"><ArtworkImage src={album.coverUrl} alt="" loading="lazy" /></span><span><strong>{track.title}</strong><small>{album.artist} · {album.title}</small></span></button>{previewButton(album, track, '试听', true)}</li>)}</ol>
      </section>}</>}
    <dialog ref={dialog} className="discover-dialog" aria-labelledby="discover-detail-title" onCancel={event => { event.preventDefault(); close(); }} onPointerDown={event => { backdropPressed.current = event.target === event.currentTarget; }} onClick={event => {
      if (backdropPressed.current && event.target === event.currentTarget) close();
      backdropPressed.current = false;
    }}>
      {selection && selected && <div className="discover-detail">
        <header><h2 id="discover-detail-title">唱片与试听</h2><button ref={closeButton} type="button" disabled={saving !== null} aria-label="关闭唱片详情" onClick={close}><X size={20} /></button></header>
        <div className="discover-detail__body">
          <div className="discover-detail__identity"><ArtworkImage src={selected.coverUrl} alt={selected.title} /><div><h3>{selected.title}</h3><p>{selected.artist}</p><p>{[selected.year || '', selected.label === '未知厂牌' ? '' : selected.label].filter(Boolean).join(' · ')}</p></div></div>
          {selection.match.alternatives.length > 1 && <label className="discover-version">选择黑胶版本<select aria-label="选择黑胶版本" value={selected.id} disabled={saving !== null} onChange={event => {
            const album = selection.match.alternatives.find(item => item.id === event.target.value);
            if (album) { setNotice(''); setSelection({ match: selection.match, album: details.current.get(album.id) ?? album }); }
          }}>{selection.match.alternatives.map(album => <option key={album.id} value={album.id}>{[album.year || '', album.country, album.catalogNumber, album.edition].filter(Boolean).join(' · ')}</option>)}</select></label>}
          <p className="discover-detail__edition">{selection.match.vinylReleaseFound ? [selected.edition, selected.catalogNumber].filter(Boolean).join(' · ') : '尚未查证实体黑胶版本，可先将专辑资料加入唱片架。'}</p>
          <div className="discover-track-heading"><h3>可用曲目</h3><span>试听以音源平台提供的片段为准</span></div>
          {detailLoading && <p role="status">正在获取曲目…</p>}
          {detailError && <p role="status">{detailError}</p>}
          {!detailLoading && !selected.tracks.length && <p>暂无曲目资料，暂时无法试听。</p>}
          <ol className="discover-tracks">{selected.tracks.map((track, index) => <li key={track.id}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{track.title}</strong><small>{track.durationSec ? track.duration : '时长待补充'}</small></div>{previewButton(selected, track, '试听', true)}</li>)}</ol>
          {props.playingAlbumId === selected.id && props.playbackMessage && <p className="discover-playback" role="status">{props.playbackMessage}</p>}
          {props.playingAlbumId === selected.id && props.playingTrackId && props.onOpenPlayer && <button type="button" className="discover-preview" disabled={saving !== null} onClick={() => { close(); props.onOpenPlayer?.(); }}>播放详情<ChevronRight size={17} /></button>}
          {notice && <p className="discover-notice" role="status">{notice}</p>}
        </div>
        <footer><span>唱片架仅保存在本机</span>{addButton(selected)}</footer>
      </div>}
    </dialog>
  </main>;
}
