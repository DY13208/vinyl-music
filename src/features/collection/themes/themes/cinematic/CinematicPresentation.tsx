import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { CollectionPresentationProps } from '../../CollectionTheme';
import { CollectionAlbumCard } from '../../CollectionAlbumCard';
export function CinematicPresentation(props: CollectionPresentationProps) {
  const album = props.albums[0];
  return <div className="ct-cinematic"><div className="ct-cinematic__albums">{props.albums.map(item => <CollectionAlbumCard key={item.id} {...props} album={item} />)}</div>{album && <aside className="ct-cinematic__note"><span>留给音乐的时间</span><h2>把今晚交给一张唱片。</h2><button type="button" onClick={() => props.onOpenAlbumDetail(album)}>重访《{album.title}》<ArrowUpRight size={16} /></button></aside>}</div>;
}
