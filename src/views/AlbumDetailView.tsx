import React from 'react';
import { Album, Track } from '../types';
import { VinylDisc } from '../components/VinylDisc';
import { ChevronLeft, Play, Pause, Heart, BookmarkPlus, Share2, Disc } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface AlbumDetailViewProps {
  album: Album;
  currentTrackId?: string;
  isPlayingAlbum?: boolean;
  isPlaying?: boolean;
  onBack: () => void;
  onPlayAlbum: (album: Album) => void;
  onSelectTrack: (album: Album, track: Track) => void;
  onToggleFavorite: (albumId: string) => void;
  isFavorite: boolean;
  onToggleWishlist?: (album: Album) => void;
}

export const AlbumDetailView: React.FC<AlbumDetailViewProps> = ({
  album,
  currentTrackId,
  isPlayingAlbum = false,
  isPlaying = false,
  onBack,
  onPlayAlbum,
  onSelectTrack,
  onToggleFavorite,
  isFavorite,
  onToggleWishlist,
}) => {
  return (
    <div
      id="album-detail-view"
      className="w-full min-h-screen bg-[#000000] text-white flex flex-col select-none pb-20 overflow-y-auto no-scrollbar"
    >
      {/* Subtle Ambient Glow Background */}
      <div
        className="absolute top-10 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full filter blur-[80px] pointer-events-none"
        style={{ backgroundColor: album.color, opacity: 0.2 }}
      />

      {/* Top Navigation */}
      <header className="px-4 pt-3 pb-2 flex items-center justify-between z-20">
        <button
          id="album-detail-back"
          type="button"
          onClick={onBack}
          className="w-8 h-8 rounded-[6px] bg-[#0F0F0F] border border-[#26272D] text-white/80 hover:text-white flex items-center justify-center transition-colors"
          title="返回"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="text-[12px] font-mono tracking-widest text-white/40 uppercase">
          ALBUM ARCHIVE
        </span>

        <button
          type="button"
          className="w-8 h-8 rounded-[6px] bg-[#0F0F0F] border border-[#26272D] text-white/80 hover:text-white flex items-center justify-center transition-colors"
          title="分享黑胶"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </header>

      {/* Album Header Visual: Cover + Exposed Vinyl Disc */}
      <div className="w-full flex flex-col items-center pt-2 pb-5 px-6 z-20">
        <div className="relative w-[280px] h-[220px] flex items-center justify-center">
          {/* Vinyl Disc sliding out backwards */}
          <div className="absolute right-2 z-10">
            <VinylDisc
              coverUrl={album.coverUrl}
              albumTitle={album.title}
              artistName={album.artist}
              isPlaying={isPlayingAlbum && isPlaying}
              size={180}
              rpm={album.rpm}
              showAmbientGlow={false}
            />
          </div>

          {/* Front Sleeve Jacket */}
          <div
            className="absolute left-2 z-20 w-[180px] h-[180px] rounded-[4px] overflow-hidden bg-[#0F0F0F]"
            style={{
              border: '1px solid #26272D',
              boxShadow: '-6px 10px 24px rgba(0,0,0,0.85)',
            }}
          >
            <img
              src={album.coverUrl}
              alt={album.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-[2px] bg-black/80 border border-white/10 text-[8px] font-mono text-white/90">
              {album.rpm}
            </div>
          </div>
        </div>

        {/* Album Metadata Typography */}
        <div className="text-center mt-3 max-w-sm">
          <h1 className="text-[21px] font-bold text-white tracking-tight leading-snug">
            {album.title}
          </h1>
          <p className="text-[14px] font-medium text-[#BBCBB2] mt-0.5">
            {album.artist}
          </p>
          <p className="text-[11.5px] text-white/45 mt-1 font-mono tracking-wide">
            {album.year} · {album.genre} · {album.trackCount} 首 · {album.totalDuration}
          </p>

          {/* Pressing and weight badge */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-[10px] px-2 py-0.5 rounded-[3px] bg-[#1B1B1D] border border-[#26272D] text-[#BBCBB2]">
              {album.weight}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-[3px] bg-[#1B1B1D] border border-[#26272D] text-white/50">
              厂牌: {album.label}
            </span>
          </div>

          {album.description && (
            <p className="text-[11px] text-white/50 text-left mt-3 leading-relaxed line-clamp-3 bg-[#0F0F0F] p-2.5 rounded-[4px] border border-[#26272D]">
              {album.description}
            </p>
          )}
        </div>

        {/* Action Buttons: Primary Play (#2FE92B) + Favorite + Wishlist */}
        <div className="flex items-center gap-2.5 w-full max-w-sm mt-4">
          <button
            id="album-detail-play-btn"
            type="button"
            onClick={() => {
              onPlayAlbum(album);
              audioEngine.triggerHaptic('medium');
            }}
            className="flex-1 h-10 px-4 rounded-[6px] bg-[#2FE92B] hover:bg-[#28d124] text-[#0F0F0F] font-bold text-[14px] tracking-wide flex items-center justify-center gap-2 shadow-[0_2px_12px_rgba(47,233,43,0.3)] active:scale-98 transition-all"
          >
            {isPlayingAlbum && isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-[#0F0F0F]" />
                <span>暂停播放</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-[#0F0F0F]" />
                <span>播放整张</span>
              </>
            )}
          </button>

          <button
            id="album-detail-fav-btn"
            type="button"
            onClick={() => {
              onToggleFavorite(album.id);
              audioEngine.triggerHaptic('light');
            }}
            className={`h-10 px-3 rounded-[6px] border flex items-center justify-center transition-colors ${
              isFavorite
                ? 'bg-[#1B1B1D] border-[#2FE92B]/50 text-[#2FE92B]'
                : 'bg-[#0F0F0F] border-[#26272D] text-white/70 hover:text-white'
            }`}
            title="收藏"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-[#2FE92B]' : ''}`} />
          </button>

          <button
            id="album-detail-wishlist-btn"
            type="button"
            onClick={() => {
              if (onToggleWishlist) onToggleWishlist(album);
              audioEngine.triggerHaptic('light');
            }}
            className="h-10 px-3 rounded-[6px] bg-[#0F0F0F] border border-[#26272D] text-white/70 hover:text-white flex items-center justify-center transition-colors"
            title="加入愿望单"
          >
            <BookmarkPlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tracklist Header */}
      <div className="w-full px-5 mt-2 z-20">
        <div className="flex items-center justify-between pb-2 border-b border-[#26272D]">
          <span className="text-[12px] font-bold text-white tracking-wide">
            曲目列表 ({album.tracks.length})
          </span>
          <span className="text-[10px] font-mono text-white/40 flex items-center gap-1">
            <Disc className="w-3 h-3 text-[#2FE92B]" />
            Side A / B
          </span>
        </div>

        {/* Tracks List */}
        <div className="mt-2 space-y-1">
          {album.tracks.map((track) => {
            const isCurrent = isPlayingAlbum && currentTrackId === track.id;
            return (
              <div
                key={track.id}
                id={`track-item-${track.id}`}
                onClick={() => {
                  onSelectTrack(album, track);
                  audioEngine.triggerHaptic('light');
                }}
                className={`flex items-center justify-between p-3 rounded-[4px] cursor-pointer transition-colors ${
                  isCurrent
                    ? 'bg-[#1B1B1D] border-l-3 border-[#2FE92B]'
                    : 'hover:bg-[#0F0F0F] text-white/90'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span
                    className={`text-[12px] font-mono w-5 text-center ${
                      isCurrent ? 'text-[#2FE92B] font-bold' : 'text-white/40'
                    }`}
                  >
                    {String(track.number).padStart(2, '0')}
                  </span>

                  <div className="overflow-hidden">
                    <p
                      className={`text-[13.5px] truncate font-medium ${
                        isCurrent ? 'text-[#2FE92B]' : 'text-white'
                      }`}
                    >
                      {track.title}
                    </p>
                    <p className="text-[10.5px] text-[#BBCBB2] opacity-70 truncate">
                      {album.artist}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-2">
                  {isCurrent && isPlaying && (
                    <div className="flex items-end gap-[2px] h-3">
                      <span className="w-0.5 h-2 bg-[#2FE92B] animate-pulse" />
                      <span className="w-0.5 h-3 bg-[#2FE92B] animate-bounce" />
                      <span className="w-0.5 h-1.5 bg-[#2FE92B] animate-pulse" />
                    </div>
                  )}
                  <span className="text-[11px] font-mono text-white/40">
                    {track.duration}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
