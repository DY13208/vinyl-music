import assert from 'node:assert/strict';
import test from 'node:test';
import { readCollectionTheme, readCollectionViewMode } from './collectionThemePreference';
import type { StorageService } from '../../../platform/storage/StorageService';

const storage = (values: Record<string, string>): StorageService => ({ getItem: key => values[key] ?? null, setItem: (key, value) => { values[key] = value; }, removeItem: key => { delete values[key]; } });

test('an existing installation defaults to shelf without borrowing the homepage theme', () => {
  const source = storage({ vinyl_home_theme_v1: 'future', vinyl_landscape_browse_v1: 'spine' });
  assert.equal(readCollectionTheme(source), 'shelf');
  assert.equal(readCollectionViewMode(source), 'default');
});
test('all five collection themes round-trip independently from all three view modes', () => {
  for (const theme of ['shelf', 'editorial', 'cinematic', 'glass', 'cover-wall']) {
    for (const mode of ['default', 'gallery-grid', 'spine-carousel']) {
      const source = storage({ collection_theme: theme, collection_view_mode: mode });
      assert.equal(readCollectionTheme(source), theme);
      assert.equal(readCollectionViewMode(source), mode);
    }
  }
});
test('changing one preference leaves the other preference and homepage keys untouched', () => {
  const values = { collection_theme: 'shelf', collection_view_mode: 'spine-carousel', vinyl_home_theme_v1: 'dark' };
  const source = storage(values);
  source.setItem('collection_theme', 'glass');
  assert.equal(readCollectionViewMode(source), 'spine-carousel');
  source.setItem('collection_view_mode', 'gallery-grid');
  assert.equal(readCollectionTheme(source), 'glass');
  assert.equal(values.vinyl_home_theme_v1, 'dark');
});
test('corrupt or obsolete values fall back instead of becoming invalid registry keys', () => {
  for (const value of ['', 'null', '{}', 'future', 'SHELF', '__proto__']) {
    const source = storage({ collection_theme: value, collection_view_mode: value });
    assert.equal(readCollectionTheme(source), 'shelf');
    assert.equal(readCollectionViewMode(source), 'default');
  }
});
test('denied device storage leaves both features available with safe defaults', () => {
  const source = storage({});
  source.getItem = () => { throw new Error('Storage denied'); };
  assert.equal(readCollectionTheme(source), 'shelf');
  assert.equal(readCollectionViewMode(source), 'default');
});
