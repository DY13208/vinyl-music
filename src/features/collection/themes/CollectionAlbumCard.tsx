import React from 'react';
import { Heart, MoreHorizontal } from 'lucide-react';
import { Album } from '../../../types';
import { AlbumArtwork } from '../../../components/AlbumArtwork';
import { VinylDisc } from '../../../components/VinylDisc';
import { getVinylAppearance } from '../../../utils/vinylAppearance';
import { CollectionCardVariant, CollectionPresentationProps } from './CollectionTheme';

function PhysicalArtwork({ album }: { album: Album }) {
  const appearance = getVinylAppearance(album);
  return <div className="ct-artwork"><div className="ct-artwork__disc" aria-hidden="true"><VinylDisc size="100%" coverUrl={album.coverUrl} albumTitle={album.title} artistName={album.artist} type={appearance.variant} texture={appearance.texture} labelColor={appearance.label?.color} labelImage={appearance.label?.image} labelText={appearance.label?.text} rpm={album.rpm} /></div><div className="ct-artwork__cover"><AlbumArtwork src={album.coverUrl} /></div></div>;
}
function CoverArtwork({ album }: { album: Album }) { return <div className="ct-artwork ct-artwork--cover"><AlbumArtwork src={album.coverUrl} /></div>; }
const artworkComponents = { sleeve: PhysicalArtwork, cover: CoverArtwork };
export function CollectionArtwork({ album, variant }: { album: Album; variant: CollectionCardVariant }) {
  const Artwork = artworkComponents[variant];
  return <Artwork album={album} />;
}

export const CollectionAlbumCard: React.FC<Omit<CollectionPresentationProps, 'albums'> & { album: Album; featured?: boolean }> = ({ album, selectedAlbumId, favoriteIds, onOpenAlbumDetail, onToggleFavorite, cardVariant, featured = false }) => {
  const favorite = favoriteIds.includes(album.id);
  return <article className={`ct-card${featured ? ' ct-card--featured' : ''}`} data-album-id={album.id} data-selected={selectedAlbumId === album.id || undefined}>
    <button type="button" className="ct-card__open" aria-label={`打开专辑：${album.title}`} onClick={() => onOpenAlbumDetail(album)}><CollectionArtwork album={album} variant={cardVariant} /></button>
    <div className="ct-card__info"><div><h2 title={album.title}>{album.title}</h2><p>{album.artist}</p></div><button type="button" className="ct-card__favorite" aria-label={`${favorite ? '取消收藏' : '收藏'}：${album.title}`} aria-pressed={favorite} onClick={() => onToggleFavorite(album.id)}><Heart size={16} fill={favorite ? 'currentColor' : 'none'} /></button></div>
    <button type="button" className="ct-card__more" aria-label={`查看专辑详情：${album.title}`} onClick={() => onOpenAlbumDetail(album)}><MoreHorizontal size={17} /></button>
  </article>;
}
