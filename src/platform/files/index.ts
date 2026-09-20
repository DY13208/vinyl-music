import { WebFileAdapter } from './WebFileAdapter';
import { WebIndexedDbAudioStore } from './WebIndexedDbAudioStore';

/** File capability entry point, kept separate so file tooling follows the lazy import modal chunk. */
export const fileService = new WebFileAdapter();
export const localAudioStore = new WebIndexedDbAudioStore();
