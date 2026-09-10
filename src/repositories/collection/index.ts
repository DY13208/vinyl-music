import { ALBUMS } from '../../data/mockData';
import { storageService } from '../../platform/platformService';
import { IndexedDBCollectionRepository } from './IndexedDBCollectionRepository';
export const collectionRepository = new IndexedDBCollectionRepository(storageService, ALBUMS);
export { WebCollectionRepository } from './WebCollectionRepository';
export type { CollectionRepository } from './CollectionRepository';
