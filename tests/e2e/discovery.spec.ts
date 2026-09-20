import { test, expect, type Page } from '@playwright/test';
import { providerAlbumToAlbum } from '../../src/server/vinylSearch/utils';

test.use({ hasTouch: true });

const track = { id: 'catalogue-track', number: 1, title: '七里香', duration: '4:59', durationSec: 299 };
const identity = providerAlbumToAlbum({ provider: 'chinese-music', providerId: 'qa', role: 'identity', title: '七里香', artist: '周杰伦', year: 2004, tracks: [track], coverUrl: 'https://y.gtimg.cn/music/photo_new/qa.webp' });
const physical = { ...identity, id: 'discogs-101', edition: 'Vinyl · LP', catalogNumber: 'LP-101', country: 'Taiwan', tracks: [] };
const alternate = { ...physical, id: 'discogs-102', catalogNumber: 'LP-102', edition: 'Vinyl · Reissue' };
const identityMatch = { album: identity, vinylRelease: null, vinylReleaseFound: false, alternatives: [], sources: ['chinese-music'], sourceIds: { 'chinese-music': ['qa'] } };
const physicalMatch = { ...identityMatch, album: { ...identity, id: 'public-physical', title: '公开唱片' }, vinylRelease: { ...physical, title: '公开唱片' }, vinylReleaseFound: true, alternatives: [{ ...physical, title: '公开唱片' }, { ...alternate, title: '公开唱片' }] };

async function login(page: Page) {
  await page.goto('/');
  // Keep UI checks separate from the account lifecycle suite's sign-in rate budget.
  await page.getByLabel('邮箱', { exact: true }).fill('b@example.test');
  await page.getByLabel('密码', { exact: true }).fill('test-password-123');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await expect(page.locator('#bottom-navigation-bar')).toBeVisible();
}
async function mockCatalogue(page: Page) {
  await page.route('https://y.gtimg.cn/**', route => route.abort());
  await page.route('**/api/releases/search?*', route => route.fulfill({ json: { results: [identityMatch, physicalMatch], providers: [], cached: false } }));
  await page.route('**/api/releases/detail?*', route => {
    const id = new URL(route.request().url()).searchParams.get('id');
    return route.fulfill({ json: { album: { ...(id === '102' ? alternate : physical), title: '公开唱片', tracks: [track] } } });
  });
}
function audioFixture() {
  const rate = 22050, samples = rate * 10, buffer = Buffer.alloc(44 + samples * 2);
  buffer.write('RIFF'); buffer.writeUInt32LE(buffer.length - 8, 4); buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(rate, 24); buffer.writeUInt32LE(rate * 2, 28); buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36); buffer.writeUInt32LE(samples * 2, 40);
  for (let index = 0; index < samples; index++) buffer.writeInt16LE(Math.round(Math.sin(index * 440 * 2 * Math.PI / rate) * 1000), 44 + index * 2);
  return buffer;
}

test('empty collection leads to a public catalogue; preview does not collect, explicit add persists locally', async ({ page }) => {
  const writes: string[] = [];
  page.on('request', request => { if (request.method() !== 'GET' && !request.url().includes('/api/auth')) writes.push(request.url()); });
  await mockCatalogue(page);
  await page.route('https://api.audius.co/**', route => route.fulfill({ json: { data: [] } }));
  await page.route('https://itunes.apple.com/**', route => route.fulfill({ json: { results: [{ trackId: 1, trackName: track.title, artistName: identity.artist, collectionName: identity.title, trackTimeMillis: 299000, previewUrl: 'http://127.0.0.1:43180/api/test-preview.wav' }] } }));
  await page.route('**/api/test-preview.wav', route => route.fulfill({ contentType: 'audio/wav', body: audioFixture() }));
  await login(page);
  const dock = page.locator('#app-bottom-dock');
  await expect(dock.getByRole('button', { name: '尚未选择歌曲', exact: true })).toBeDisabled();
  await expect(page.locator('.bottom-nav__label')).toHaveText(['首页', '发现', '唱片架', '我的']);
  await page.locator('#nav-tab-collection').click();
  await expect(page.getByText('你的唱片架还是空的', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '查看全部收藏' })).toHaveCount(0);
  await page.getByRole('button', { name: '去发现唱片' }).click();
  await expect(page.getByRole('heading', { name: '七里香', exact: true })).toBeVisible();
  await expect(page.getByRole('article', { name: '七里香 · 周杰伦', exact: true }).getByRole('img')).toBeVisible();
  await page.screenshot({ path: 'test-results/discover-mobile.png', fullPage: true });
  const record = page.getByRole('article', { name: '七里香 · 周杰伦', exact: true });
  await record.getByRole('button', { name: '试听：七里香', exact: true }).click();
  await expect(record.getByRole('button', { name: '暂停试听：七里香' })).toBeVisible();
  await expect.poll(() => page.evaluate(async () => {
    const path = '/src/services/audioEngine.ts';
    const { audioEngine } = await import(path);
    return audioEngine.getCurrentTime();
  })).toBeGreaterThan(0);
  await dock.getByRole('button', { name: '打开全屏播放器：七里香', exact: true }).tap();
  await expect(page.locator('#player-view-container')).toBeInViewport();
  await expect(page.locator('#player-view-container')).toHaveAttribute('data-playing', 'true');
  await page.screenshot({ path: 'test-results/dock-player-details-mobile.png' });
  await page.locator('#player-close-btn').tap();
  await dock.getByRole('button', { name: '暂停：七里香', exact: true }).click();
  await expect(page.locator('#discover-view')).toBeVisible();
  await expect(record.getByRole('button', { name: '试听：七里香', exact: true })).toBeVisible();
  await dock.getByRole('button', { name: '打开全屏播放器：七里香', exact: true }).click();
  await expect(page.locator('#player-view-container')).toBeVisible();
  await expect(page.locator('#discover-view')).toHaveCount(0);
  await page.locator('#player-close-btn').click();
  await expect(page.locator('#discover-view')).toBeVisible();
  await expect(page.locator('#floating-player')).toHaveCount(1);
  await expect(page.locator('.floating-player__expanded')).toHaveCount(0);
  const lastSong = page.locator('.discover-song-list li').last();
  await lastSong.evaluate(row => row.scrollIntoView({ block: 'center' }));
  const songBounds = await lastSong.boundingBox();
  const dockBounds = await dock.boundingBox();
  expect(songBounds!.y + songBounds!.height).toBeLessThan(dockBounds!.y - 18);
  await page.screenshot({ path: 'test-results/discover-songs-mobile.png', fullPage: true });
  await page.locator('.discover-song__main').first().tap();
  await expect(page.locator('#player-view-container')).toBeInViewport();
  await page.locator('#player-close-btn').tap();
  for (const tab of ['home', 'collection', 'discover']) {
    await page.locator(`#nav-tab-${tab}`).tap();
    await dock.getByRole('button', { name: '打开全屏播放器：七里香', exact: true }).tap();
    await expect(page.locator('#player-close-btn')).toBeInViewport();
    await page.locator('#player-close-btn').tap();
    await expect(page.locator(`#nav-tab-${tab}`)).toHaveAttribute('aria-current', 'page');
  }
  for (const [width, height] of [[375, 812], [390, 844], [430, 932], [844, 390]]) {
    await page.setViewportSize({ width, height });
    const center = await dock.locator('.floating-player__disc').boundingBox();
    const discover = await page.locator('#nav-tab-discover').boundingBox();
    const collection = await page.locator('#nav-tab-collection').boundingBox();
    expect(center!.x).toBeGreaterThanOrEqual(discover!.x + discover!.width);
    expect(center!.x + center!.width).toBeLessThanOrEqual(collection!.x);
    await expect(dock.locator('.floating-player__disc')).toBeInViewport();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const centerBefore = await dock.locator('.floating-player__disc').boundingBox();
  await page.mouse.move(centerBefore!.x + 34, centerBefore!.y + 34);
  await page.mouse.down(); await page.mouse.move(20, 100, { steps: 6 }); await page.mouse.up();
  expect(await dock.locator('.floating-player__disc').boundingBox()).toEqual(centerBefore);
  await page.locator('#nav-tab-collection').click();
  await expect(page.getByText('你的唱片架还是空的', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '去发现唱片' }).click();
  await record.getByRole('button', { name: '加入唱片架：七里香' }).click();
  await expect(record.getByRole('button', { name: '已在唱片架：七里香' })).toBeDisabled();
  await page.reload();
  await expect(page.getByRole('heading', { name: '七里香', exact: true })).toBeVisible();
  await page.locator('#nav-tab-collection').click();
  await page.getByRole('button', { name: '搜索唱片架' }).click();
  await page.getByRole('textbox', { name: '搜索专辑或艺术家' }).fill('找不到的唱片');
  await page.getByRole('button', { name: '清除筛选', exact: true }).click();
  await expect(page.getByText('没有找到匹配的唱片')).toHaveCount(0);
  expect(writes).toEqual([]);
});

test('public release dialog loads tracks, selects a pressing and survives narrow and short viewports', async ({ page }) => {
  await mockCatalogue(page); await login(page);
  await page.locator('#nav-tab-discover').click();
  await expect(page.getByRole('heading', { name: '七里香', exact: true })).toBeVisible();
  await page.getByLabel('仅看已确认黑胶').check();
  await expect(page.getByRole('heading', { name: '七里香', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '选择黑胶版本：公开唱片', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '唱片与试听' });
  await expect(dialog.getByRole('button', { name: '试听：七里香' })).toBeVisible();
  await dialog.getByLabel('选择黑胶版本').selectOption('discogs-102');
  await expect(dialog.getByText('Vinyl · Reissue · LP-102', { exact: true })).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [width, height] of [[375, 812], [390, 844], [393, 852], [430, 932], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await expect(dialog.getByRole('button', { name: '加入唱片架：公开唱片' })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.screenshot({ path: 'test-results/discover-detail-short.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/discover-detail-mobile.png', fullPage: true });
  await dialog.getByRole('button', { name: '加入唱片架：公开唱片' }).click();
  await expect(dialog.getByRole('button', { name: '已在唱片架：公开唱片' })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: '打开专辑：公开唱片', exact: true }).click();
  await expect(page.getByText('待确认 · Vinyl · Reissue', { exact: true })).toBeVisible();
});

test('catalogue errors can retry, searches are independent, missing preview reports failure', async ({ page }) => {
  let unavailable = true;
  await page.route('**/api/releases/search?*', route => {
    if (unavailable) return route.fulfill({ status: 502, json: { error: 'upstream offline' } });
    const query = new URL(route.request().url()).searchParams.get('query');
    return route.fulfill({ status: query === '无结果' ? 404 : 200, json: query === '无结果' ? { error: '未找到匹配的唱片或专辑' } : { results: [identityMatch], providers: [] } });
  });
  await page.route('https://itunes.apple.com/**', route => route.fulfill({ json: { results: [] } }));
  await page.route('https://api.audius.co/**', route => route.fulfill({ json: { data: [] } }));
  await login(page); await page.locator('#nav-tab-discover').click();
  await expect(page.getByRole('alert')).toContainText('暂时无法获取');
  unavailable = false;
  await page.getByRole('button', { name: '重新加载' }).click();
  await expect(page.getByRole('heading', { name: '七里香', exact: true })).toBeVisible();
  await page.getByRole('article', { name: '七里香 · 周杰伦', exact: true }).getByRole('button', { name: '试听：七里香', exact: true }).click();
  await expect(page.getByText('各音源平台未返回可用结果，请重试或导入本地音源')).toBeVisible();
  await page.getByRole('textbox', { name: '搜索公开唱片' }).fill('无结果');
  await page.getByRole('button', { name: '搜索', exact: true }).click();
  await expect(page.getByRole('heading', { name: '没有找到相关唱片' })).toBeVisible();
  await page.getByRole('button', { name: '陈奕迅', exact: true }).click();
  await expect(page.locator('#artist-view')).toBeVisible();
  await expect(page.getByRole('heading', { name: '陈奕迅', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '七里香', exact: true })).toBeVisible();
});

test('public catalogue and covers survive reload without remote requests; offscreen covers wait', async ({ page }) => {
  await mockCatalogue(page);
  let searches = 0, details = 0;
  const covers: string[] = [];
  await page.route('**/api/releases/search?*', route => {
    searches++;
    return route.fulfill({ json: { results: [identityMatch, physicalMatch, ...Array.from({ length: 20 }, (_, index) => ({
      ...identityMatch, album: { ...identity, id: `offscreen-${index}`, title: `离屏专辑 ${index}`, tracks: [], coverUrl: `https://y.gtimg.cn/music/photo_new/offscreen-${index}.webp` },
    }))], providers: [] } });
  });
  page.on('request', request => {
    if (request.url().includes('/api/artwork?')) covers.push(request.url());
    if (request.url().includes('/api/releases/detail?')) details++;
  });
  await login(page);
  await page.locator('#nav-tab-discover').click();
  await expect(page.getByRole('heading', { name: '七里香', exact: true })).toBeVisible();
  await expect(page.locator('.discover-hero__art img')).toHaveAttribute('src', /^blob:/);
  await page.locator('.discover-albums').scrollIntoViewIfNeeded();
  await expect(page.locator('.discover-record__cover img').first()).toHaveAttribute('src', /^blob:/);
  expect(covers.filter(url => decodeURIComponent(url).includes('/qa.webp'))).toHaveLength(1);
  expect(covers.length).toBeLessThan(10);
  await page.getByRole('button', { name: '选择黑胶版本：公开唱片', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('button', { name: '试听：七里香' })).toBeVisible();
  await expect.poll(() => page.evaluate(async () => {
    const path = '/src/services/catalogueCache.ts';
    const { catalogueCache } = await import(path);
    return !!(await catalogueCache.get('album', 'discogs-101'));
  })).toBe(true);
  const coverCount = covers.length;
  await page.reload();
  await page.locator('#nav-tab-discover').click();
  await expect(page.locator('.discover-hero__art img')).toHaveAttribute('src', /^blob:/);
  await page.getByRole('button', { name: '选择黑胶版本：公开唱片', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('button', { name: '试听：七里香' })).toBeVisible();
  expect(searches).toBe(1);
  expect(details).toBe(1);
  expect(covers.length).toBe(coverCount);
  await page.getByRole('button', { name: '关闭唱片详情' }).click();
  await page.getByRole('button', { name: '更新唱片资料' }).click();
  await expect.poll(() => searches).toBe(2);
  await page.locator('#nav-tab-collection').click();
  await expect(page.getByText('你的唱片架还是空的', { exact: true })).toBeVisible();
});
