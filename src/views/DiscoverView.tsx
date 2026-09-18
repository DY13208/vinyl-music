import React, { useEffect, useRef, useState } from 'react';
import { Check, Disc3, Pause, Play, Plus, Search, X } from 'lucide-react';
import type { Album, Track } from '../types';
import { ArtworkImage } from '../components/ArtworkImage';
import { CatalogueError, getPublicAlbum, searchVinyl, type VinylSearchResponse } from '../services/collectionApi';
import { isInCollection } from '../utils/catalogue';
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
}

const startingArtists = ['周杰伦', '陈奕迅', '宇多田ヒカル', 'The Beatles', 'Miles Davis'];
const publicCache = new Map<string, { results: Match[]; time: number }>();
const preferredAlbum = (match: Match) => match.vinylRelease ?? match.album;

export function DiscoverView(props: DiscoverViewProps) {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState({ query: startingArtists[0], retry: 0 });
  const [results, setResults] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  useEffect(() => {
    const controller = new AbortController();
    setError(''); setNotice('');
    const cached = publicCache.get(search.query);
    if (!search.retry && cached && Date.now() - cached.time < 600_000) {
      setResults(cached.results); setLoading(false);
      return;
    }
    setLoading(true); setResults([]);
    void searchVinyl({ query: search.query, artist: startingArtists.includes(search.query) ? search.query : undefined }, controller.signal).then(response => {
      if (controller.signal.aborted) return;
      setResults(response.results);
      publicCache.set(search.query, { results: response.results, time: Date.now() });
      if (publicCache.size > 12) publicCache.delete(publicCache.keys().next().value!);
    }).catch(reason => {
      if (controller.signal.aborted) return;
      if (!(reason instanceof CatalogueError && reason.status === 404)) setError('暂时无法获取公开唱片资料，请稍后重试。');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
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
    void getPublicAlbum(provider, selectionId.slice(provider.length + 1), controller.signal).then(album => {
      if (controller.signal.aborted) return;
      details.current.set(selectionId, album);
      setSelection(current => current?.album.id === selectionId ? { ...current, album } : current);
    }).catch(() => {
      if (!controller.signal.aborted) setDetailError('暂时无法补全曲目，仍可查看已获取的资料。');
    }).finally(() => { if (!controller.signal.aborted) setDetailLoading(false); });
    return () => controller.abort();
  }, [selectionId]);

  const runSearch = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setQuery(trimmed); setSearch({ query: trimmed, retry: 0 });
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
      setNotice(`《${album.title}》已加入我的唱片库`);
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : '本机保存失败，请重试。');
    } finally { savingRef.current = false; setSaving(null); }
  };
  const addButton = (album: Album) => {
    const collected = isInCollection(album, props.albums);
    return <button type="button" className="discover-add" disabled={collected || saving !== null} onClick={() => void add(album)} aria-label={`${collected ? '已在唱片库' : '加入唱片库'}：${album.title}`}>
      {collected ? <Check size={15} /> : <Plus size={15} />}{collected ? '已在唱片库' : saving === album.id ? '正在保存…' : '加入唱片库'}
    </button>;
  };
  const previewButton = (album: Album, track: Track, label = '试听') => {
    const current = props.playingAlbumId === album.id && props.playingTrackId === track.id;
    return <button type="button" className="discover-preview" disabled={current && props.isLoading} onClick={() => props.onPreview(album, track)} aria-label={`${current && props.isPlaying ? '暂停试听' : '试听'}：${track.title}`}>
      {current && props.isPlaying ? <Pause size={15} /> : <Play size={15} />}{current && props.isLoading ? '查找音源…' : current && props.isPlaying ? '暂停' : label}
    </button>;
  };
  const visibleResults = results.filter(match => !vinylOnly || match.vinylReleaseFound);
  const selected = selection?.album;

  return <main id="discover-view" className="discover-page">
    <header className="discover-header"><h1>发现唱片</h1><p>先听听，再选一张放进唱片架。</p></header>
    <form className="discover-search" role="search" onSubmit={event => { event.preventDefault(); runSearch(query); }}>
      <Search size={19} aria-hidden="true" /><input aria-label="搜索公开唱片" placeholder="搜索音乐人、专辑或条码" value={query} maxLength={160} onChange={event => setQuery(event.target.value)} />
      <button type="submit" disabled={!query.trim()}>搜索</button>
    </form>
    <section className="discover-artists" aria-label="从音乐人开始探索"><p>从音乐人开始</p><div>{startingArtists.map(artist => <button type="button" key={artist} aria-pressed={search.query === artist} onClick={() => runSearch(artist)}>{artist}</button>)}</div></section>
    <div className="discover-results-heading"><h2>{search.query}</h2><label><input type="checkbox" checked={vinylOnly} onChange={event => setVinylOnly(event.target.checked)} />仅看已确认黑胶</label></div>
    <p className="discover-caption">公开发行资料 · 黑胶版本以具体发行记录为准</p>
    {notice && !selection && <p className="discover-notice" role="status">{notice}</p>}
    {props.playingAlbumId && !selection && props.playbackMessage && <p className="discover-playback" role="status">{props.playbackMessage}</p>}
    {loading ? <div className="discover-loading" role="status"><span>正在查找公开唱片资料…</span><div aria-hidden="true">{[0, 1, 2, 3].map(index => <div key={index} />)}</div></div>
      : error ? <div className="discover-empty" role="alert"><p>{error}</p><button type="button" onClick={() => setSearch(value => ({ ...value, retry: value.retry + 1 }))}>重新加载</button></div>
      : !visibleResults.length ? <div className="discover-empty"><Disc3 size={36} /><h3>{vinylOnly && results.length ? '暂未查到明确的黑胶发行记录' : '没有找到相关唱片'}</h3><p>{vinylOnly && results.length ? '可以先浏览专辑资料，再核对具体版本。' : '换一个音乐人、专辑名称或条码试试。'}</p>{vinylOnly && results.length > 0 && <button type="button" onClick={() => setVinylOnly(false)}>查看专辑资料</button>}</div>
      : <div className="discover-grid">{visibleResults.map(match => {
        const initial = preferredAlbum(match);
        const album = details.current.get(initial.id) ?? initial;
        return <article className="discover-record" key={album.id} aria-label={`${album.title} · ${album.artist}`}>
          <button type="button" className="discover-record__open" onClick={() => open(match)} aria-label={`查看唱片：${album.title}`}><span className="discover-record__cover"><ArtworkImage src={album.coverUrl} alt={album.title} /></span><h3>{album.title}</h3><p>{album.artist}</p></button>
          <p className="discover-record__edition">{match.vinylReleaseFound ? '已查到黑胶版本' : '黑胶版本待核实'}{album.year ? ` · ${album.year}` : ''}</p>
          <div className="discover-record__actions">{album.tracks[0] ? previewButton(album, album.tracks[0]) : <button type="button" onClick={() => open(match)}><Play size={15} />查看曲目</button>}{match.alternatives.length > 1 ? <button type="button" className="discover-add" onClick={() => open(match)}>选择黑胶版本</button> : addButton(album)}</div>
        </article>;
      })}</div>}
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
          <p className="discover-detail__edition">{selection.match.vinylReleaseFound ? [selected.edition, selected.catalogNumber].filter(Boolean).join(' · ') : '尚未查证实体黑胶版本，可先将专辑资料加入唱片库。'}</p>
          <div className="discover-track-heading"><h3>可用曲目</h3><span>试听以音源平台提供的片段为准</span></div>
          {detailLoading && <p role="status">正在获取曲目…</p>}
          {detailError && <p role="status">{detailError}</p>}
          {!detailLoading && !selected.tracks.length && <p>暂无曲目资料，暂时无法试听。</p>}
          <ol className="discover-tracks">{selected.tracks.map((track, index) => <li key={track.id}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{track.title}</strong><small>{track.durationSec ? track.duration : '时长待补充'}</small></div>{previewButton(selected, track)}</li>)}</ol>
          {props.playingAlbumId === selected.id && props.playbackMessage && <p className="discover-playback" role="status">{props.playbackMessage}</p>}
          {notice && <p className="discover-notice" role="status">{notice}</p>}
        </div>
        <footer><span>收藏仅保存在本机</span>{addButton(selected)}</footer>
      </div>}
    </dialog>
  </main>;
}
