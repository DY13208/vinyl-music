import { test, expect, type Page } from '@playwright/test';

async function login(page: Page, username = 'user_a', password = 'test-password-123') {
  await page.getByLabel('用户名', { exact: true }).fill(username);
  await page.locator('#auth-password').fill(password);
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await expect(page.locator('#bottom-navigation-bar')).toBeVisible();
}
async function profile(page: Page) { await page.locator('#nav-tab-profile').click(); }

test('profile editor saves a local avatar and nickname, supports cancel/removal and isolates accounts', async ({ page }) => {
  const transfers: string[] = [];
  page.on('request', request => { if (request.url().includes('/api/artwork') || (request.method() !== 'GET' && !request.url().includes('/api/v1/auth'))) transfers.push(request.url()); });
  await page.goto('/'); await login(page); await profile(page);
  await page.getByRole('button', { name: '编辑资料', exact: true }).click();
  const editor = page.getByRole('dialog', { name: '编辑资料', exact: true });
  await expect(editor).toBeVisible();
  await expect(editor.getByRole('button', { name: '选择新头像' })).toBeFocused();
  await editor.getByRole('button', { name: '保存资料' }).focus();
  await page.keyboard.press('Tab');
  // Native dialogs may let Tab visit browser chrome before cycling back;
  // background page controls must never receive focus.
  expect(await editor.evaluate(element => document.activeElement === document.body || element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Tab');
  expect(await editor.evaluate(element => element.contains(document.activeElement))).toBe(true);
  await page.getByLabel('昵称', { exact: true }).fill('我的黑胶小屋');
  await page.getByLabel('头像图片', { exact: true }).setInputFiles('public/assets/vinyl-textures/black.webp');
  await expect(page.getByRole('img', { name: '我的头像' })).toHaveAttribute('src', /^data:image\/webp/);
  await page.screenshot({ path: 'test-results/profile-edit-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: '保存资料', exact: true }).click();
  await expect(page.getByRole('heading', { name: '我的黑胶小屋' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('资料已保存到本机');
  await page.reload(); await profile(page);
  await expect(page.getByRole('heading', { name: '我的黑胶小屋' })).toBeVisible();
  await expect(page.getByRole('img', { name: '我的头像' })).toHaveAttribute('src', /^data:image\/webp/);
  await page.getByRole('button', { name: '编辑资料', exact: true }).click();
  await page.getByLabel('昵称', { exact: true }).fill('不应该保存');
  await page.getByRole('button', { name: '移除头像', exact: true }).click();
  await page.getByRole('button', { name: '取消', exact: true }).click();
  await expect(editor).not.toBeVisible();
  await expect(page.getByRole('button', { name: '编辑资料', exact: true })).toBeFocused();
  await expect(page.getByRole('heading', { name: '我的黑胶小屋' })).toBeVisible();
  await expect(page.getByRole('img', { name: '我的头像' })).toBeVisible();
  await page.getByRole('button', { name: '退出登录', exact: true }).click();
  await login(page, 'user_b'); await profile(page);
  await expect(page.getByRole('heading', { name: 'b', exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: '我的头像' })).toHaveCount(0);
  await page.getByRole('button', { name: '退出登录', exact: true }).click();
  await login(page); await profile(page);
  await expect(page.getByRole('heading', { name: '我的黑胶小屋' })).toBeVisible();
  await page.getByRole('button', { name: '编辑资料', exact: true }).click();
  await page.getByRole('button', { name: '移除头像', exact: true }).click();
  await page.getByRole('button', { name: '保存资料', exact: true }).click();
  await page.reload(); await profile(page);
  await expect(page.getByRole('img', { name: '我的头像' })).toHaveCount(0);
  expect(transfers).toEqual([]);
});

test('profile modal closes with Escape, close button and backdrop; short screens keep actions accessible', async ({ page }) => {
  await page.goto('/'); await login(page); await profile(page);
  const trigger = page.getByRole('button', { name: '编辑资料', exact: true });
  const editor = page.getByRole('dialog', { name: '编辑资料', exact: true });
  await trigger.click();
  await page.getByLabel('昵称', { exact: true }).fill('取消的改动');
  await page.keyboard.press('Escape');
  await expect(editor).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(page.getByLabel('昵称', { exact: true })).toHaveValue('a');
  await page.getByRole('button', { name: '关闭编辑资料' }).click();
  await expect(editor).not.toBeVisible();
  await page.getByRole('button', { name: '修改头像', exact: true }).click();
  await expect(editor).toBeVisible();
  await page.mouse.click(3, 3);
  await expect(editor).not.toBeVisible();
  await page.setViewportSize({ width: 390, height: 400 });
  await trigger.click();
  const bounds = await editor.boundingBox();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(400);
  await expect(editor.getByRole('button', { name: '保存资料' })).toBeInViewport();
  await page.screenshot({ path: 'test-results/profile-modal-short.png', fullPage: true });
});

test('login layout, validation and account lifecycle work at mobile width', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '回到你的唱片架' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/login-mobile.png', fullPage: true });
  await page.getByLabel('用户名', { exact: true }).fill('user_a');
  await page.locator('#auth-password').fill('wrong-password');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('无效');
  await login(page);
  await profile(page);
  await expect(page.getByText('user_a', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator('#bottom-navigation-bar')).toBeVisible();
  await profile(page);
  await page.getByRole('button', { name: '退出登录', exact: true }).click();
  await expect(page.getByRole('heading', { name: '回到你的唱片架' })).toBeVisible();
});

test('registration and password recovery use the backend contract', async ({ page, request }) => {
  const username = `new_${Date.now().toString(36)}`;
  await page.goto('/'); await page.getByRole('button', { name: '注册' }).click();
  await page.getByLabel('用户名').fill(username); await page.getByLabel('邮箱').fill(`${username}@example.test`); await page.getByLabel('显示名称').fill('New User');
  await page.locator('#auth-password').fill('new-password-123'); await page.getByLabel('确认密码').fill('new-password-123'); await page.getByRole('button', { name: '创建账户' }).click(); await expect(page.getByRole('status')).toContainText('账户已创建');
  await login(page, username, 'new-password-123'); await page.getByRole('button', { name: '我的' }).click(); await page.getByRole('button', { name: '退出登录' }).click();
  await page.getByRole('button', { name: '忘记密码？' }).click(); await page.getByLabel('注册邮箱').fill(`${username}@example.test`); await page.getByRole('button', { name: '发送重置邮件' }).click();
  const link = (await (await request.get('/api/test/recovery-link')).json()).link; await page.goto(link); await page.getByLabel('新密码').fill('changed-password-123'); await page.getByLabel('确认密码').fill('changed-password-123'); await page.getByRole('button', { name: '保存新密码' }).click();
  await login(page, username, 'changed-password-123');
});


test('uploaded artwork is compressed locally and never sent to the public relay', async ({ page }) => {
  const transfers: string[] = [];
  page.on('request', request => { if (request.url().includes('/api/artwork') || (request.method() !== 'GET' && !request.url().includes('/api/v1/auth'))) transfers.push(request.url()); });
  await page.goto('/'); await login(page);
  await page.getByRole('button', { name: '添加唱片', exact: true }).click();
  await page.getByLabel('专辑名称').fill('私人上传的封面');
  await page.getByLabel('艺术家 / 乐团').fill('收藏者');
  await page.locator('input[type=file][accept="image/*"]').first().setInputFiles('public/assets/vinyl-textures/black.webp');
  await expect(page.locator('.album-artwork img').first()).toHaveAttribute('src', /^data:image\//);
  await page.getByRole('button', { name: '保存唱片', exact: true }).click();
  await page.reload();
  await expect(page.locator('.album-artwork img').first()).toHaveAttribute('src', /^data:image\//);
  expect(transfers).toEqual([]);
});

test('private collection and cached cover survive reload, remain local and are isolated on account switch', async ({ page, context }) => {
  const uploads: string[] = [];
  page.on('request', request => { if (request.method() !== 'GET' && !request.url().includes('/api/v1/auth')) uploads.push(request.url()); });
  await page.goto('/'); await login(page);
  await page.getByRole('button', { name: '添加唱片', exact: true }).click();
  await page.getByLabel('专辑名称').fill('我的私密唱片 QA');
  await page.getByLabel('艺术家 / 乐团').fill('私人收藏者');
  await page.getByRole('button', { name: '图片链接（可选）' }).click();
  await page.getByLabel('封面图片链接').fill('https://y.gtimg.cn/music/photo_new/qa.webp');
  await page.getByRole('button', { name: '保存唱片', exact: true }).click();
  await expect(page.locator('.album-artwork img').first()).toBeVisible();
  await expect(page.locator('.album-artwork img').first()).toHaveAttribute('src', /^blob:/);
  await page.route('**/api/artwork?*', route => route.abort());
  await page.route('https://y.gtimg.cn/**', route => route.abort());
  await page.reload();
  await expect(page.locator('.album-artwork img').first()).toHaveAttribute('src', /^blob:/);
  expect(await page.locator('.album-artwork img').first().evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await profile(page);
  await page.getByRole('button', { name: '系统设置' }).click();
  await page.getByRole('button', { name: /清理浏览封面缓存/ }).click();
  await expect(page.getByText('唱片架封面已保存在本机。')).toBeVisible();
  await page.reload();
  await expect(page.locator('.album-artwork img').first()).toHaveAttribute('src', /^blob:/);
  await profile(page);
  const otherTab = await context.newPage();
  await otherTab.goto('/');
  await expect(otherTab.locator('#bottom-navigation-bar')).toBeVisible();
  await page.getByRole('button', { name: '退出登录', exact: true }).click();
  await expect(otherTab.getByRole('heading', { name: '回到你的唱片架' })).toBeVisible();
  await login(page, 'user_b');
  await expect(page.getByRole('heading', { name: '你的第一张唱片' })).toBeVisible();
  await profile(page); await page.getByRole('button', { name: '退出登录', exact: true }).click();
  await login(page);
  await expect(page.locator('.album-artwork img').first()).toHaveAttribute('src', /^blob:/);
  expect(uploads).toEqual([]);
  const retired = await context.request.get('/api/collection');
  expect(retired.status()).toBe(410);
});
