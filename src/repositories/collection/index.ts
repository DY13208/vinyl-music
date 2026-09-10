import { ALBUMS } from '../../data/mockData';
import { storageService } from '../../platform/platformService';
import { WebCollectionRepository } from './WebCollectionRepository';

export const collectionRepository = new WebCollectionRepository(storageService, ALBUMS);
export type { CollectionRepository } from './CollectionRepository';
