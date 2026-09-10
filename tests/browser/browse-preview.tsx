import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../../src/App';
import { BROWSE_DEMO_ALBUMS } from '../../src/data/browseDemoData';
import { CollectionRepository } from '../../src/repositories/collection';
import '../../src/index.css';

// The same App and components, with an in-memory repository. No collection writes.
const requestedCount = Number(new URLSearchParams(location.search).get('count') ?? BROWSE_DEMO_ALBUMS.length);
let albums = BROWSE_DEMO_ALBUMS.slice(0, Number.isFinite(requestedCount) ? Math.max(0, requestedCount) : BROWSE_DEMO_ALBUMS.length);
const repository: CollectionRepository = {
  getAlbums: () => albums,
  saveAlbum: album => albums = [album, ...albums.filter(item => item.id !== album.id)],
  saveAlbums: items => albums = [...items, ...albums.filter(item => !items.some(next => next.id === item.id))],
  updateAlbum: album => albums = albums.map(item => item.id === album.id ? album : item),
  deleteAlbum: id => albums = albums.filter(item => item.id !== id),
};
createRoot(document.getElementById('root')!).render(<App repository={repository} />);
