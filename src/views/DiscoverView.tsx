import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  AudioLines as Equalizer,
  Check,
  ChevronRight,
  Disc3,
  Music2,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import type { Album, Track } from "../types";
import { ArtworkImage } from "../components/ArtworkImage";
import {
  CatalogueError,
  getPublicAlbum,
  searchVinyl,
  type VinylSearchResponse,
} from "../services/collectionApi";
import { isInCollection } from "../utils/catalogue";
import { catalogueCache } from "../services/catalogueCache";
import "./DiscoverView.css";

type Match = VinylSearchResponse["results"][number];
type SearchState = { query: string; retry: number; artist?: string };
interface Props {
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

const HOME_SEED = "Jazz";
const artistDiscoverySeeds = [
  "华语经典",
  "City Pop",
  "Jazz",
  "Classic Rock",
  "Electronic",
  "Soul",
  "Hip Hop",
  "Indie",
  "Classical",
  "Soundtrack",
];
const quickSeeds = [
  ["华语", "华语经典"],
  ["摇滚", "Rock"],
  ["爵士", "Jazz"],
  ["City Pop", "City Pop"],
  ["电子", "Electronic"],
  ["古典", "Classical"],
  ["原声", "Soundtrack"],
  ["90s", "90s hits"],
] as const;
const genreSeeds = [
  ["Jazz", "Jazz"],
  ["Rock", "Rock"],
  ["City Pop", "City Pop"],
  ["Electronic", "Electronic"],
] as const;
const preferredAlbum = (match: Match) => match.vinylRelease ?? match.album;

export function DiscoverView(props: Props) {
  const [mode, setMode] = useState<"home" | "artists" | "results">("home");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<SearchState>({
    query: HOME_SEED,
    retry: 0,
  });
  const [results, setResults] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cacheMessage, setCacheMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const savingRef = useRef(false);
  const [selection, setSelection] = useState<{
    match: Match;
    album: Album;
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const backdropPressed = useRef(false);
  const details = useRef(new Map<string, Album>());
  const [vinylOnly, setVinylOnly] = useState(false);
  const [allAlbums, setAllAlbums] = useState(false);
  const [allTracks, setAllTracks] = useState(false);
  const [artistDirectory, setArtistDirectory] = useState<
    Array<{ name: string; album: Album }>
  >([]);
  const [artistSeedLimit, setArtistSeedLimit] = useState(2);
  const [artistLoading, setArtistLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setError("");
    setNotice("");
    setCacheMessage("");
    setRefreshing(false);
    setLoading(true);
    setResults([]);
    void (async () => {
      const cached = await catalogueCache.get("search", search.query);
      if (controller.signal.aborted) return;
      if (cached) {
        setResults(cached.data);
        setLoading(false);
        if (!cached.stale && !search.retry) return;
        setCacheMessage("已显示本机保存资料，正在更新…");
        setRefreshing(true);
      }
      try {
        const response = await searchVinyl(
          {
            query: search.query,
            artist: search.artist,
          },
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setResults(response.results);
        setCacheMessage("");
        void catalogueCache.put("search", search.query, response.results);
      } catch (reason) {
        if (controller.signal.aborted) return;
        if (reason instanceof CatalogueError && reason.status === 404) {
          setResults([]);
          setCacheMessage("");
          void catalogueCache.put("search", search.query, []);
        } else if (cached)
          setCacheMessage("暂时无法更新，正在显示本机保存的资料。");
        else setError("暂时无法获取公开唱片资料，请稍后重试。");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    })();
    return () => controller.abort();
  }, [search]);

  useEffect(() => {
    if (mode === "results") return;
    const controller = new AbortController();
    const wanted = artistDiscoverySeeds.slice(
      0,
      mode === "artists" ? artistSeedLimit : 2,
    );
    setArtistLoading(true);
    void (async () => {
      for (const seed of wanted) {
        if (controller.signal.aborted) return;
        const cached = await catalogueCache.get("search", seed);
        if (controller.signal.aborted) return;
        let matches = cached?.data;
        try {
          if (!matches || cached?.stale) {
            const response = await searchVinyl({ query: seed }, controller.signal);
            if (controller.signal.aborted) return;
            matches = response.results;
            void catalogueCache.put("search", seed, response.results);
          }
        } catch {
          // Cached discovery data remains usable when a provider is temporarily offline.
        }
        if (matches?.length) {
          const discovered = matches
            .map(preferredAlbum)
            .filter((album) => album.artist.trim())
            .map((album) => ({ name: album.artist.trim(), album }));
          setArtistDirectory((current) => {
            const merged = new Map(
              current.map((item) => [item.name.toLocaleLowerCase(), item]),
            );
            for (const item of discovered) {
              const key = item.name.toLocaleLowerCase();
              const previous = merged.get(key);
              if (!previous || (!previous.album.coverUrl && item.album.coverUrl))
                merged.set(key, item);
            }
            return [...merged.values()];
          });
        }
      }
    })().finally(() => {
      if (!controller.signal.aborted) setArtistLoading(false);
    });
    return () => controller.abort();
  }, [artistSeedLimit, mode]);

  const selectionId = selection?.album.id;
  useEffect(() => {
    const modal = dialog.current;
    if (selectionId && modal && !modal.open) {
      modal.showModal();
      closeButton.current?.focus();
    } else if (!selectionId && modal?.open) modal.close();
  }, [selectionId]);
  useEffect(() => {
    setDetailError("");
    setDetailLoading(false);
    if (!selectionId) return;
    const provider = ["apple-music", "discogs", "musicbrainz", "deezer"].find(
      (source) => selectionId.startsWith(`${source}-`),
    );
    if (!provider || details.current.has(selectionId)) return;
    const controller = new AbortController();
    setDetailLoading(true);
    void (async () => {
      const cached = await catalogueCache.get("album", selectionId);
      if (controller.signal.aborted) return;
      if (cached) {
        setSelection((current) =>
          current?.album.id === selectionId
            ? { ...current, album: cached.data }
            : current,
        );
        setDetailLoading(false);
        if (!cached.stale) {
          details.current.set(selectionId, cached.data);
          return;
        }
      }
      try {
        const album = await getPublicAlbum(
          provider,
          selectionId.slice(provider.length + 1),
          controller.signal,
        );
        if (controller.signal.aborted) return;
        details.current.set(selectionId, album);
        setSelection((current) =>
          current?.album.id === selectionId ? { ...current, album } : current,
        );
        void catalogueCache.put("album", selectionId, album);
      } catch {
        if (!controller.signal.aborted)
          setDetailError("暂时无法补全曲目，仍可查看已获取的资料。");
      } finally {
        if (!controller.signal.aborted) setDetailLoading(false);
      }
    })();
    return () => controller.abort();
  }, [selectionId]);

  const runSearch = (value: string, asArtist = false) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setMode("results");
    setQuery(trimmed);
    setVinylOnly(false);
    setAllAlbums(false);
    setAllTracks(false);
    setSearch({
      query: trimmed,
      retry: 0,
      artist: asArtist ? trimmed : undefined,
    });
  };
  const returnHome = () => {
    setMode("home");
    setQuery("");
    setVinylOnly(false);
    setAllAlbums(false);
    setAllTracks(false);
    if (search.query !== HOME_SEED) setSearch({ query: HOME_SEED, retry: 0 });
  };
  const close = () => {
    if (!savingRef.current) setSelection(null);
  };
  const open = (match: Match) => {
    const album = preferredAlbum(match);
    setNotice("");
    setSelection({ match, album: details.current.get(album.id) ?? album });
  };
  const add = async (album: Album) => {
    if (savingRef.current || isInCollection(album, props.albums)) return;
    savingRef.current = true;
    setSaving(album.id);
    setNotice("");
    try {
      await props.onAddAlbum({
        ...album,
        isCollected: true,
        addedAt: new Date().toISOString(),
      });
      setNotice(`《${album.title}》已加入我的唱片架`);
    } catch (reason) {
      setNotice(
        reason instanceof Error ? reason.message : "本机保存失败，请重试。",
      );
    } finally {
      savingRef.current = false;
      setSaving(null);
    }
  };
  const addButton = (album: Album, compact = false) => {
    const collected = isInCollection(album, props.albums);
    return (
      <button
        type="button"
        className={`discover-add${compact ? " discover-add--compact" : ""}`}
        disabled={collected || saving !== null}
        onClick={() => void add(album)}
        aria-label={`${collected ? "已在唱片架" : "加入唱片架"}：${album.title}`}
      >
        {collected ? <Check size={15} /> : <Plus size={15} />}
        {collected
          ? "已在唱片架"
          : saving === album.id
            ? "正在保存…"
            : "加入唱片架"}
      </button>
    );
  };
  const previewButton = (
    album: Album,
    track: Track,
    label = "试听",
    compact = false,
  ) => {
    const current =
      props.playingAlbumId === album.id && props.playingTrackId === track.id;
    return (
      <button
        type="button"
        className={`discover-preview${compact ? " discover-preview--icon" : ""}`}
        disabled={current && props.isLoading}
        aria-busy={current && props.isLoading}
        onClick={() => props.onPreview(album, track)}
        aria-label={`${current && props.isPlaying ? "暂停试听" : "试听"}：${track.title}`}
      >
        {current && props.isPlaying ? (
          <Pause size={compact ? 20 : 17} fill="currentColor" />
        ) : (
          <Play size={compact ? 20 : 17} fill="currentColor" />
        )}
        {!compact && (
          <span>
            {current && props.isLoading
              ? "查找音源…"
              : current && props.isPlaying
                ? "暂停"
                : label}
          </span>
        )}
      </button>
    );
  };

  const visibleResults = results.filter(
    (match) => !vinylOnly || match.vinylReleaseFound,
  );
  const unsortedAlbums = visibleResults.map((match) => {
    const album = preferredAlbum(match);
    return { match, album: details.current.get(album.id) ?? album };
  });
  // A discovery home is cover-led. Preserve every result in explicit searches,
  // while keeping incomplete catalogue entries behind artwork-rich records here.
  const displayAlbums = mode === "home"
    ? [...unsortedAlbums].sort((left, right) => Number(Boolean(right.album.coverUrl)) - Number(Boolean(left.album.coverUrl)))
    : unsortedAlbums;
  const tracks = [
    ...new Map(
      displayAlbums
        .flatMap(({ album }) => album.tracks.map((track) => ({ album, track })))
        .map(
          (item) =>
            [
              `${item.album.artist}|${item.album.title}|${item.track.title}`,
              item,
            ] as const,
        ),
    ).values(),
  ];
  const vinylPicks = displayAlbums.filter(
    ({ match }) => match.vinylReleaseFound,
  );
  const lead = displayAlbums[0];
  const selected = selection?.album;
  const openAlbum = (match: Match) => {
    const album =
      details.current.get(preferredAlbum(match).id) ?? preferredAlbum(match);
    props.onOpenAlbumDetail ? props.onOpenAlbumDetail(album) : open(match);
  };
  const openArtist = (artist: string) =>
    props.onOpenArtist?.(
      artist,
      displayAlbums
        .filter((item) => item.album.artist === artist)
        .map((item) => item.album),
    );
  const artistButton = (item: { name: string; album: Album }) => {
    const { name: artist, album } = item;
    const cover = album.coverUrl;
    return (
      <button
        type="button"
        key={artist}
        onClick={() => runSearch(artist, true)}
        aria-label={`查看音乐人：${artist}`}
      >
        <span className="discover-artist__portrait">
          <Disc3 size={65} strokeWidth={0.5} />
          <b>{artist.slice(0, 1).toUpperCase()}</b>
          {cover && (
            <ArtworkImage
              src={cover}
              alt={`${artist}头像`}
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          )}
        </span>
        <span>{artist}</span>
      </button>
    );
  };
  const heading = (id: string, title: string, action?: React.ReactNode) => (
    <div className="discover-section-heading">
      <h2 id={id}>{title}</h2>
      {action}
    </div>
  );
  const searchForm = (
    <form
      className="discover-search"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        runSearch(query);
      }}
    >
      <Search size={19} />
      <input
        aria-label="搜索公开唱片"
        placeholder="搜索音乐人、专辑或条码"
        value={query}
        maxLength={160}
        onChange={(event) => setQuery(event.target.value)}
      />
      <button type="submit" disabled={!query.trim()} aria-label="搜索">
        <ChevronRight size={21} />
      </button>
    </form>
  );

  const albumRail = (home: boolean) => (
    <section
      className={`discover-albums${home ? " discover-albums--home" : ""}`}
      aria-labelledby="discover-albums-title"
    >
      {heading(
        "discover-albums-title",
        home ? "热门唱片" : "相关唱片",
        displayAlbums.length > 4 && (
          <button
            type="button"
            aria-expanded={allAlbums}
            onClick={() => setAllAlbums((v) => !v)}
          >
            {allAlbums ? "收起" : "查看全部"}
            <ChevronRight size={15} />
          </button>
        ),
      )}
      <div className={`discover-album-list${allAlbums ? " is-expanded" : ""}`}>
        {displayAlbums.map(({ match, album }) => (
          <article className="discover-record" key={album.id}>
            <div className="discover-record__visual">
              <button
                type="button"
                className="discover-record__open"
                onClick={() => openAlbum(match)}
                aria-label={`打开专辑：${album.title}`}
              >
                <span className="discover-record__cover">
                  {album.coverUrl ? (
                    <ArtworkImage src={album.coverUrl} alt={album.title} loading="lazy" />
                  ) : (
                    <span className="discover-cover-fallback" aria-label={`${album.title}暂无封面`}>
                      <Disc3 aria-hidden="true" />
                      <small>封面待补</small>
                    </span>
                  )}
                </span>
              </button>
              {album.tracks[0] &&
                previewButton(album, album.tracks[0], "试听", true)}
            </div>
            <div className="discover-record__copy">
              <div className="discover-record__heading">
                <button
                  type="button"
                  className="discover-record__title"
                  onClick={() => openAlbum(match)}
                >
                  {album.title}
                </button>
              </div>
              <button
                type="button"
                className="discover-record__artist"
                onClick={() => openArtist(album.artist)}
              >
                {album.artist}
                {album.year ? ` · ${album.year}` : ""}
              </button>
              <p>
                {match.vinylReleaseFound ? "已查到黑胶版本" : "黑胶版本待核实"}
              </p>
            </div>
            {!home && (
              <div className="discover-record__actions">
                {!album.tracks[0] && (
                  <button type="button" onClick={() => open(match)}>
                    <Music2 size={15} />
                    查看曲目
                  </button>
                )}
                {match.alternatives.length > 1 ? (
                  <button
                    type="button"
                    className="discover-add"
                    onClick={() => open(match)}
                  >
                    <Plus size={15} />
                    选择黑胶版本
                  </button>
                ) : (
                  addButton(album)
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
  const trackList = (
    <section className="discover-songs" aria-labelledby="discover-songs-title">
      {heading(
        "discover-songs-title",
        "热门歌曲",
        tracks.length > 5 && (
          <button
            type="button"
            aria-expanded={allTracks}
            onClick={() => setAllTracks((v) => !v)}
          >
            {allTracks ? "收起" : "查看全部"}
            <ChevronRight size={15} />
          </button>
        ),
      )}
      <ol className="discover-song-list">
        {(allTracks ? tracks : tracks.slice(0, 5)).map(
          ({ album, track }, index) => {
            const current =
              props.playingAlbumId === album.id &&
              props.playingTrackId === track.id;
            return (
              <li
                key={`${album.id}-${track.id}`}
                className={current ? "is-playing" : ""}
              >
                <span className="discover-song__index">
                  {current && props.isPlaying ? (
                    <Equalizer size={16} />
                  ) : (
                    String(index + 1).padStart(2, "0")
                  )}
                </span>
                <button
                  type="button"
                  className="discover-song__main"
                  onClick={() =>
                    props.onOpenTrack
                      ? props.onOpenTrack(album, track)
                      : props.onPreview(album, track)
                  }
                >
                  <span className="discover-song__cover">
                    {album.coverUrl ? <ArtworkImage src={album.coverUrl} alt="" loading="lazy" /> : <span className="discover-cover-fallback" aria-hidden="true"><Disc3 /><small>封面待补</small></span>}
                  </span>
                  <span>
                    <strong>{track.title}</strong>
                    <small>
                      {album.artist} · {album.title}
                    </small>
                  </span>
                </button>
                {previewButton(album, track, "试听", true)}
              </li>
            );
          },
        )}
      </ol>
    </section>
  );
  const loadingBlock = (
    <div className="discover-loading" role="status">
      <span>正在整理公开唱片资料…</span>
      <div aria-hidden="true">
        <div />
        <div />
      </div>
    </div>
  );
  const errorBlock = (
    <div className="discover-empty" role="alert">
      <p>{error}</p>
      <button
        type="button"
        onClick={() => setSearch((v) => ({ ...v, retry: v.retry + 1 }))}
      >
        重新加载
      </button>
    </div>
  );

  return (
    <main id="discover-view" className={`discover-page discover-page--${mode}`}>
      <div className="discover-atmosphere" aria-hidden="true">
        {lead && <ArtworkImage src={lead.album.coverUrl} alt="" />}
      </div>
      {mode === "home" ? (
        <>
          <header className="discover-header">
            <h1>发现</h1>
            <p>找到下一张想放进唱片架的唱片。</p>
          </header>
          <div className="discover-search-sticky">{searchForm}</div>
          <nav className="discover-chips" aria-label="快速探索">
            {quickSeeds.map(([label, seed]) => (
              <button key={label} type="button" onClick={() => runSearch(seed)}>
                {label}
              </button>
            ))}
          </nav>
          <section
            className="discover-artists"
            aria-labelledby="discover-artists-title"
          >
            {heading(
              "discover-artists-title",
              "热门音乐人",
              <button type="button" onClick={() => setMode("artists")}>
                查看全部
                <ChevronRight size={15} />
              </button>,
            )}
            <div id="discover-artist-list" className="discover-artist-list">
              {artistDirectory.slice(0, 6).map(artistButton)}
              {artistLoading && artistDirectory.length === 0 && (
                <span className="discover-artists-loading" role="status">
                  正在获取音乐人…
                </span>
              )}
            </div>
          </section>
          {loading ? (
            loadingBlock
          ) : error ? (
            errorBlock
          ) : displayAlbums.length ? (
            <>
              {lead && (
                <section
                  className="discover-feature"
                  aria-labelledby="discover-feature-title"
                >
                  <div className="discover-feature__copy">
                    <p>本周值得听</p>
                    <h2 id="discover-feature-title">{lead.album.title}</h2>
                    <span>
                      {lead.album.artist}
                      {lead.album.year ? ` · ${lead.album.year}` : ""}
                    </span>
                    <small>
                      {lead.match.vinylReleaseFound
                        ? "已找到黑胶版本"
                        : "黑胶版本待核实"}
                    </small>
                    <div>
                      {lead.album.tracks[0] &&
                        previewButton(lead.album, lead.album.tracks[0])}
                      {addButton(lead.album, true)}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="discover-feature__art"
                    onClick={() => openAlbum(lead.match)}
                  >
                    <ArtworkImage
                      src={lead.album.coverUrl}
                      alt={lead.album.title}
                    />
                  </button>
                </section>
              )}
              {albumRail(true)}
              {!!vinylPicks.length && (
                <section
                  className="discover-vinyl-picks"
                  aria-labelledby="discover-vinyl-title"
                >
                  {heading("discover-vinyl-title", "值得收藏")}
                  <div>
                    {vinylPicks.slice(0, 5).map(({ match, album }) => (
                      <article key={album.id}>
                        <button type="button" onClick={() => open(match)}>
                          <ArtworkImage
                            src={album.coverUrl}
                            alt={album.title}
                          />
                        </button>
                        <div>
                          <strong>{album.title}</strong>
                          <p>{album.artist}</p>
                          <small>
                            {[
                              album.year || "",
                              album.country,
                              album.edition,
                              album.catalogNumber,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "已确认实体黑胶版本"}
                          </small>
                          {addButton(album, true)}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
              {tracks.length > 0 && trackList}
              <section
                className="discover-genres"
                aria-labelledby="discover-genres-title"
              >
                {heading("discover-genres-title", "按风格探索")}
                <div>
                  {genreSeeds.map(([label, seed], index) => (
                    <button
                      type="button"
                      key={label}
                      style={{ "--genre-index": index } as React.CSSProperties}
                      onClick={() => runSearch(seed)}
                    >
                      <Disc3 size={48} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <div className="discover-empty">
              <Disc3 size={36} />
              <h3>今天的唱片还没准备好</h3>
              <p>你仍然可以从上方搜索或探索风格。</p>
            </div>
          )}
        </>
      ) : mode === "artists" ? (
        <section
          className="discover-artists-page"
          aria-labelledby="discover-all-artists-title"
        >
          <header>
            <button
              type="button"
              onClick={returnHome}
              aria-label="返回发现首页"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <p>探索声音背后的人</p>
              <h1 id="discover-all-artists-title">热门音乐人</h1>
            </div>
          </header>
          <div className="discover-artists-page__intro">
            <span>{artistDirectory.length} 位音乐人</span>
            <p>从华语经典到爵士、摇滚与电子音乐。</p>
          </div>
          <div className="discover-artists-grid">
            {artistDirectory.map(artistButton)}
          </div>
          {artistLoading && (
            <p className="discover-artists-status" role="status">
              正在从公开音乐目录获取更多音乐人…
            </p>
          )}
          {!artistLoading &&
            artistSeedLimit < artistDiscoverySeeds.length && (
            <button
              type="button"
              className="discover-artists-more"
              onClick={() =>
                setArtistSeedLimit((value) =>
                  Math.min(value + 2, artistDiscoverySeeds.length),
                )
              }
            >
              加载更多音乐人
              <span>继续请求公开目录</span>
            </button>
          )}
        </section>
      ) : (
        <>
          <div className="discover-search-sticky">{searchForm}</div>
          <header className="discover-results-header">
            <button
              type="button"
              onClick={returnHome}
              aria-label="返回发现首页"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <p>关于「{search.query}」</p>
              <h1>搜索结果</h1>
              <span>
                {displayAlbums.length} 张唱片 · {tracks.length} 首歌曲
              </span>
            </div>
            <button
              type="button"
              className="discover-refresh"
              disabled={refreshing}
              onClick={() => setSearch((v) => ({ ...v, retry: v.retry + 1 }))}
              aria-label="更新唱片资料"
            >
              <RefreshCw
                size={18}
                className={refreshing ? "is-spinning" : ""}
              />
            </button>
          </header>
          <div className="discover-results-tools">
            <span>公开发行资料</span>
            <label>
              <input
                type="checkbox"
                checked={vinylOnly}
                onChange={(event) => setVinylOnly(event.target.checked)}
              />
              仅看已确认黑胶
            </label>
          </div>
          {cacheMessage && (
            <p className="discover-notice" role="status">
              {cacheMessage}
            </p>
          )}
          {notice && !selection && (
            <p className="discover-notice" role="status">
              {notice}
            </p>
          )}
          {props.playingAlbumId && !selection && props.playbackMessage && (
            <p className="discover-playback" role="status">
              {props.playbackMessage}
            </p>
          )}
          {loading ? (
            loadingBlock
          ) : error ? (
            errorBlock
          ) : !displayAlbums.length ? (
            <div className="discover-empty">
              <Disc3 size={36} />
              <h3>
                {vinylOnly && results.length
                  ? "暂未查到明确的黑胶发行记录"
                  : "没有找到相关唱片"}
              </h3>
              <p>
                {vinylOnly && results.length
                  ? "可以先浏览专辑资料，再核对具体版本。"
                  : "换一个音乐人、专辑名称或条码试试。"}
              </p>
              {vinylOnly && results.length > 0 && (
                <button type="button" onClick={() => setVinylOnly(false)}>
                  查看全部专辑资料
                </button>
              )}
            </div>
          ) : (
            <>
              {albumRail(false)}
              {tracks.length > 0 && trackList}
            </>
          )}
        </>
      )}
      <dialog
        ref={dialog}
        className="discover-dialog"
        aria-labelledby="discover-detail-title"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onPointerDown={(e) => {
          backdropPressed.current = e.target === e.currentTarget;
        }}
        onClick={(e) => {
          if (backdropPressed.current && e.target === e.currentTarget) close();
          backdropPressed.current = false;
        }}
      >
        {selection && selected && (
          <div className="discover-detail">
            <header>
              <h2 id="discover-detail-title">唱片与试听</h2>
              <button
                ref={closeButton}
                type="button"
                disabled={saving !== null}
                aria-label="关闭唱片详情"
                onClick={close}
              >
                <X size={20} />
              </button>
            </header>
            <div className="discover-detail__body">
              <div className="discover-detail__identity">
                <ArtworkImage src={selected.coverUrl} alt={selected.title} />
                <div>
                  <h3>{selected.title}</h3>
                  <p>{selected.artist}</p>
                  <p>
                    {[
                      selected.year || "",
                      selected.label === "未知厂牌" ? "" : selected.label,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>
              {selection.match.alternatives.length > 1 && (
                <label className="discover-version">
                  选择黑胶版本
                  <select
                    value={selected.id}
                    disabled={saving !== null}
                    onChange={(e) => {
                      const album = selection.match.alternatives.find(
                        (item) => item.id === e.target.value,
                      );
                      if (album)
                        setSelection({
                          match: selection.match,
                          album: details.current.get(album.id) ?? album,
                        });
                    }}
                  >
                    {selection.match.alternatives.map((album) => (
                      <option key={album.id} value={album.id}>
                        {[
                          album.year || "",
                          album.country,
                          album.catalogNumber,
                          album.edition,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <p className="discover-detail__edition">
                {selection.match.vinylReleaseFound
                  ? [selected.edition, selected.catalogNumber]
                      .filter(Boolean)
                      .join(" · ")
                  : "尚未查证实体黑胶版本，可先将专辑资料加入唱片架。"}
              </p>
              <div className="discover-track-heading">
                <h3>可用曲目</h3>
                <span>试听以音源平台提供的片段为准</span>
              </div>
              {detailLoading && <p role="status">正在获取曲目…</p>}
              {detailError && <p role="status">{detailError}</p>}
              {!detailLoading && !selected.tracks.length && (
                <p>暂无曲目资料，暂时无法试听。</p>
              )}
              <ol className="discover-tracks">
                {selected.tracks.map((track, i) => (
                  <li key={track.id}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <strong>{track.title}</strong>
                      <small>
                        {track.durationSec ? track.duration : "时长待补充"}
                      </small>
                    </div>
                    {previewButton(selected, track, "试听", true)}
                  </li>
                ))}
              </ol>
              {props.playingAlbumId === selected.id &&
                props.playbackMessage && (
                  <p className="discover-playback">{props.playbackMessage}</p>
                )}
              {props.playingAlbumId === selected.id &&
                props.playingTrackId &&
                props.onOpenPlayer && (
                  <button
                    type="button"
                    className="discover-preview"
                    onClick={() => {
                      close();
                      props.onOpenPlayer?.();
                    }}
                  >
                    播放详情
                    <ChevronRight size={17} />
                  </button>
                )}
              {notice && <p className="discover-notice">{notice}</p>}
            </div>
            <footer>
              <span>唱片架仅保存在本机</span>
              {addButton(selected)}
            </footer>
          </div>
        )}
      </dialog>
    </main>
  );
}
