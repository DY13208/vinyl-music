import React, { useState } from 'react';
import { Artist, Album } from '../types';
import { ChevronLeft, Disc, Check, Plus, Share2 } from 'lucide-react';
import { hapticsService } from '../platform/platformService';

interface ArtistViewProps {
  artist: Artist;
  onBack: () => void;
  onOpenAlbumDetail: (album: Album) => void;
}

export const ArtistView: React.FC<ArtistViewProps> = ({
  artist,
  onBack,
  onOpenAlbumDetail,
}) => {
  const [isFollowed, setIsFollowed] = useState(false);

  return (
    <div
      id="artist-view"
      className="w-full min-h-screen bg-[#000000] text-white flex flex-col select-none pb-24 overflow-y-auto no-scrollbar"
    >
      {/* Top Banner Image with gradient */}
      <div className="relative w-full h-[230px] overflow-hidden">
        <img
          src={artist.bannerUrl}
          alt={artist.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/60 to-black/30" />

        {/* Back and share buttons */}
        <div className="absolute top-3 inset-x-4 flex items-center justify-between z-20">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-[4px] bg-black/60 backdrop-blur-xs border border-white/10 text-white flex items-center justify-center transition-colors"
            title="返回"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="w-8 h-8 rounded-[4px] bg-black/60 backdrop-blur-xs border border-white/10 text-white flex items-center justify-center transition-colors"
            title="分享"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Artist Title on banner */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <div>
            <span className="text-[10.5px] font-mono tracking-widest text-[#2FE92B] uppercase">
              VINYL ARTIST
            </span>
            <h1 className="text-[24px] font-black text-white tracking-tight">
              {artist.name}
            </h1>
            <p className="text-[11.5px] text-[#BBCBB2] opacity-80 mt-0.5">
              {artist.followers} · {artist.albumCount} 部黑胶作品
            </p>
          </div>

          {/* Follow CTA: #2FE92B */}
          <button
            type="button"
            onClick={() => {
              setIsFollowed(!isFollowed);
              hapticsService.triggerHaptic('medium');
            }}
            className={`px-4 py-1.5 rounded-[4px] text-[13px] font-bold tracking-wide flex items-center gap-1.5 transition-all ${
              isFollowed
                ? 'bg-[#1B1B1D] text-[#2FE92B] border border-[#2FE92B]/50'
                : 'bg-[#2FE92B] text-[#0F0F0F] hover:bg-[#28d124]'
            }`}
          >
            {isFollowed ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>已关注</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>关注</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* 艺术家简介 (Biography) */}
        <section className="p-3.5 rounded-[6px] bg-[#0F0F0F] border border-[#26272D]">
          <h3 className="text-[12px] font-bold text-[#BBCBB2] tracking-wider uppercase mb-1.5">
            艺术家档案
          </h3>
          <p className="text-[12.5px] text-white/80 leading-relaxed">
            {artist.bio}
          </p>
        </section>

        {/* 热门专辑 (Popular Albums) */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-white tracking-tight flex items-center gap-1.5">
              <Disc className="w-3.5 h-3.5 text-[#2FE92B]" />
              热门黑胶专辑
            </h3>
          </div>

          <div className="space-y-2">
            {artist.albums.map((album) => (
              <div
                key={album.id}
                onClick={() => onOpenAlbumDetail(album)}
                className="p-3 rounded-[6px] bg-[#0F0F0F] border border-[#26272D] hover:border-[#3A3B42] cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="w-12 h-12 rounded-[4px] object-cover"
                  />
                  <div>
                    <h4 className="text-[13.5px] font-bold text-white leading-tight">
                      {album.title}
                    </h4>
                    <p className="text-[11px] text-[#BBCBB2] opacity-75 mt-0.5">
                      {album.year} · {album.trackCount} 首
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#2FE92B] px-1.5 py-0.5 rounded-[2px] bg-[#1B1B1D] border border-[#26272D]">
                  {album.rpm}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 我收藏的唱片 (My Collected Vinyl from this Artist) */}
        <section className="space-y-2.5">
          <h3 className="text-[14px] font-bold text-white tracking-tight">
            我的收藏柜中的对应版本
          </h3>
          <div className="p-3 rounded-[6px] bg-[#0F0F0F] border border-[#26272D] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black border border-[#2FE92B]/50 flex items-center justify-center">
                <Disc className="w-5 h-5 text-[#2FE92B]" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-white">已拥有 1 部母带刻录版</p>
                <p className="text-[11px] text-[#BBCBB2] opacity-75">180g 重磅半速母带限量黑胶</p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-[#2FE92B]">已在柜</span>
          </div>
        </section>
      </div>
    </div>
  );
};
