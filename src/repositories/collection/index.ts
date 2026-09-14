import { storageService } from '../../platform/platformService';
import { IndexedDBCollectionRepository } from './IndexedDBCollectionRepository';
export const collectionRepository = new IndexedDBCollectionRepository(storageService, []);
export { WebCollectionRepository } from './WebCollectionRepository';
export type { CollectionRepository } from './CollectionRepository';
