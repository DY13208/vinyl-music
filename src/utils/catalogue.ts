import type { Album } from '../types';

const normalize = (value: string) => value.normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}]+/gu, '');

/** Keep different physical editions distinct, while recognizing the same album across metadata providers. */
export function isInCollection(album: Album, collection: readonly Album[]): boolean {
  return collection.some(item => {
    if (item.id === album.id) return true;
    if (normalize(item.artist) !== normalize(album.artist) || normalize(item.title) !== normalize(album.title)) return false;
    if (item.barcode || album.barcode) return Boolean(item.barcode && album.barcode && normalize(item.barcode) === normalize(album.barcode));
    if (item.catalogNumber || album.catalogNumber) return Boolean(item.catalogNumber && album.catalogNumber && normalize(item.catalogNumber) === normalize(album.catalogNumber));
    return normalize(item.edition) === normalize(album.edition);
  });
}
