import React, { useState, useMemo } from 'react';
import { Album, Artist, Track } from '../types';
import { Search as SearchIcon, X, ArrowLeft, Disc, User, Music } from 'lucide-react';
import { ARTISTS } from '../data/mockData';
import { audioEngine } from '../services/audioEngine';

interface SearchViewProps {
  albums: Album[];
  onBack: () => void;
  onOpenAlbumDetail: (album: Album) => void;
  onOpenArtist: (artistId: string) => void;
  onPlayTrack: (album: Album, track: Track) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  albums,
  onBack,
  onOpenAlbumDetail,
  onOpenArtist,
  onPlayTrack,
}) => {
  const [query, setQuery] = useState('');

  const hotSearches = [
    'Pink Floyd',
    'Radiohead',
    'Miles Davis',
    '周杰伦',
    'Daft Punk',
    '180g 重磅',
    '爵士',
    '黑胶精选',
  ];

  // ALBUM FIRST search sorting
  const { matchedAlbums, matchedArtists, matchedTracks } = useMemo(() => {
    if (!query.trim()) {
      return { matchedAlbums: [], matchedArtists: [], matchedTracks: [] };
    }
    const q = query.toLowerCase().trim();

    // 1. Albums first
    const albumsRes = albums.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.artist.toLowerCase().includes(q) ||
        a.genre.toLowerCase().includes(q) ||
        a.label.toLowerCase().includes(q) ||
        a.weight.toLowerCase().includes(q)
    );

    // 2. Artists second
    const artistsRes = ARTISTS.filter((art) => art.name.toLowerCase().includes(q));

    // 3. Tracks third
    const tracksRes: { album: Album; track: Track }[] = [];
    albums.forEach((alb) => {
      alb.tracks.forEach((trk) => {
        if (trk.title.toLowerCase().includes(q)) {
          tracksRes.push({ album: alb, track: trk });
        }
      });
    });

    return {
      matchedAlbums: albumsRes,
      matchedArtists: artistsRes,
      matchedTracks: tracksRes,
    };
  }, [query, albums]);

  const hasResults =
    matchedAlbums.length > 0 || matchedArtists.length > 0 || matchedTracks.length > 0;

  return (
    <div
      id="search-view"
      className="w-full min-h-screen bg-[#000000] text-white flex flex-col select-none pb-24 overflow-y-auto no-scrollbar"
    >
      {/* Top Search Input Bar */}
      <header className="px-4 pt-3 pb-2 sticky top-0 bg-[#000000]/95 backdrop-blur-md z-30 border-b border-[#26272D]/50">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-[4px] bg-[#0F0F0F] border border-[#26272D] text-white/80 hover:text-white flex items-center justify-center transition-colors flex-shrink-0"
            title="返回"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 relative flex items-center">
            <SearchIcon className="absolute left-3 w-4 h-4 text-white/40 pointer-events-none" />
            <input
              id="search-input-field"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索专辑、艺术家、歌曲、风格、厂牌..."
              autoFocus
              className="w-full h-10 pl-9 pr-9 rounded-[6px] bg-[#1B1B1D] border border-[#26272D] focus:border-[#2FE92B] focus:ring-1 focus:ring-[#2FE92B] text-[13px] text-white placeholder-white/40 outline-none transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 w-5 h-5 rounded-full bg-[#2A2A2C] text-white/70 flex items-center justify-center hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* If empty query, show Hot Searches and History */}
      {!query.trim() ? (
        <div className="px-4 py-4 space-y-6">
          <section className="space-y-2.5">
            <h3 className="text-[13px] font-bold text-white tracking-wide">热门搜索</h3>
            <div className="flex flex-wrap gap-2">
              {hotSearches.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setQuery(item);
                    audioEngine.triggerHaptic('light');
                  }}
                  className="px-3 py-1.5 rounded-[4px] bg-[#0F0F0F] border border-[#26272D] hover:border-[#2FE92B]/40 text-[12px] text-white/80 hover:text-white transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2.5">
            <h3 className="text-[13px] font-bold text-white tracking-wide">分类浏览 (Album First)</h3>
            <div className="grid grid-cols-2 gap-2">
              {['摇滚与先锋迷幻', '调式爵士名盘', '现代电子与舞曲', '华语经典胶片'].map(
                (cat, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setQuery(cat.slice(0, 2));
                      audioEngine.triggerHaptic('light');
                    }}
                    className="p-3 rounded-[4px] bg-[#0F0F0F] border border-[#26272D] hover:border-[#3A3B42] cursor-pointer"
                  >
                    <p className="text-[12.5px] font-medium text-white">{cat}</p>
                    <p className="text-[10px] text-[#BBCBB2] opacity-60 mt-0.5 font-mono">
                      ALBUM FIRST
                    </p>
                  </div>
                )
              )}
            </div>
          </section>
        </div>
      ) : (
        /* Search Results: ALBUM FIRST SORTING */
        <div className="px-4 py-3 space-y-6">
          {!hasResults && (
            <div className="text-center py-12 text-white/40 text-[13px]">
              未检索到与 "{query}" 相关的实体黑胶或艺人
            </div>
          )}

          {/* 1. ALBUMS FIRST (Crucial for Vinyl app positioning) */}
          {matchedAlbums.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-[#26272D]">
                <div className="flex items-center gap-1.5">
                  <Disc className="w-3.5 h-3.5 text-[#2FE92B]" />
                  <h3 className="text-[13px] font-bold text-white tracking-wide">
                    专辑 ({matchedAlbums.length})
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#2FE92B]">优先展示</span>
              </div>

              <div className="space-y-2">
                {matchedAlbums.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => onOpenAlbumDetail(album)}
                    className="p-2.5 rounded-[4px] bg-[#0F0F0F] border border-[#26272D] hover:border-[#2FE92B]/50 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img
                        src={album.coverUrl}
                        alt={album.title}
                        className="w-12 h-12 rounded-[3px] object-cover flex-shrink-0"
                      />
                      <div className="overflow-hidden">
                        <h4 className="text-[13.5px] font-bold text-white truncate">
                          {album.title}
                        </h4>
                        <p className="text-[11px] text-[#BBCBB2] opacity-80 truncate">
                          {album.artist} · {album.year}
                        </p>
                        <p className="text-[10px] text-[#2FE92B] font-mono">
                          {album.rpm} · {album.weight}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 2. ARTISTS SECOND */}
          {matchedArtists.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-[#26272D]">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#BBCBB2]" />
                  <h3 className="text-[13px] font-bold text-white tracking-wide">
                    艺术家 ({matchedArtists.length})
                  </h3>
                </div>
              </div>

              <div className="space-y-2">
                {matchedArtists.map((artist) => (
                  <div
                    key={artist.id}
                    onClick={() => onOpenArtist(artist.id)}
                    className="p-2.5 rounded-[4px] bg-[#0F0F0F] border border-[#26272D] hover:border-[#3A3B42] cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={artist.avatarUrl}
                        alt={artist.name}
                        className="w-11 h-11 rounded-full object-cover border border-[#26272D]"
                      />
                      <div>
                        <h4 className="text-[13.5px] font-bold text-white">{artist.name}</h4>
                        <p className="text-[11px] text-[#BBCBB2] opacity-70">
                          {artist.followers} · {artist.albumCount} 张黑胶发行
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 3. TRACKS THIRD */}
          {matchedTracks.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-[#26272D]">
                <div className="flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-white/50" />
                  <h3 className="text-[13px] font-bold text-white tracking-wide">
                    歌曲 ({matchedTracks.length})
                  </h3>
                </div>
              </div>

              <div className="space-y-1">
                {matchedTracks.map(({ album, track }) => (
                  <div
                    key={`${album.id}-${track.id}`}
                    onClick={() => onPlayTrack(album, track)}
                    className="p-2.5 rounded-[4px] hover:bg-[#0F0F0F] cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-[11px] font-mono text-white/40 w-4">
                        {track.number}
                      </span>
                      <div className="overflow-hidden">
                        <p className="text-[13px] font-medium text-white truncate">
                          {track.title}
                        </p>
                        <p className="text-[10.5px] text-[#BBCBB2] opacity-70 truncate">
                          {album.artist} · 《{album.title}》
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-white/40">
                      {track.duration}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
