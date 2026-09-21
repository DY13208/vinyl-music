import { test, expect } from '@playwright/test';

test('register, login, refresh, change password and logout', async ({ page }) => {
  const username = `qa_${Date.now().toString(36)}`;
  await page.goto('/');
  await page.getByRole('button', { name: '注册', exact: true }).click();
  await page.getByLabel('用户名').fill(username);
  await page.getByLabel('邮箱').fill(`${username}@example.test`);
  await page.getByLabel('显示名称').fill('QA User');
  await page.locator('#auth-password').fill('initial-password-123');
  await page.getByLabel('确认密码').fill('initial-password-123');
  await page.getByRole('button', { name: '创建账户' }).click();
  await expect(page.getByRole('heading', { name: '回到你的唱片架' })).toBeVisible();
  await page.getByLabel('用户名').fill(username);
  await page.locator('#auth-password').fill('initial-password-123');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await expect(page.locator('#bottom-navigation-bar')).toBeVisible();
  await page.reload();
  await expect(page.locator('#bottom-navigation-bar')).toBeVisible();
  await page.getByRole('button', { name: '我的' }).click();
  await page.getByRole('button', { name: '系统设置' }).click();
  await page.getByLabel('当前密码').fill('initial-password-123');
  await page.getByRole('textbox', { name: '新密码', exact: true }).fill('changed-password-123');
  await page.getByLabel('确认新密码').fill('changed-password-123');
  await page.getByRole('button', { name: '保存密码' }).click();
  await expect(page.getByRole('heading', { name: '回到你的唱片架' })).toBeVisible();
  await page.getByLabel('用户名').fill(username);
  await page.locator('#auth-password').fill('changed-password-123');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await expect(page.locator('#bottom-navigation-bar')).toBeVisible();
  await page.getByRole('button', { name: '我的' }).click();
  await page.getByRole('button', { name: '退出登录' }).click();
  await expect(page.getByRole('heading', { name: '回到你的唱片架' })).toBeVisible();
});

test('request recovery and confirm a password from the fake mail link', async ({ page, request }) => {
  const username = `recover_${Date.now().toString(36)}`;
  await page.goto('/'); await page.getByRole('button', { name: '注册' }).click();
  await page.getByLabel('用户名').fill(username); await page.getByLabel('邮箱').fill(`${username}@example.test`); await page.getByLabel('显示名称').fill('Recover QA'); await page.locator('#auth-password').fill('initial-password-123'); await page.getByLabel('确认密码').fill('initial-password-123'); await page.getByRole('button', { name: '创建账户' }).click(); await expect(page.getByRole('heading', { name: '回到你的唱片架' })).toBeVisible();
  await page.getByLabel('用户名').fill(username); await page.locator('#auth-password').fill('initial-password-123'); await page.getByRole('button', { name: '登录' }).click(); await expect(page.locator('#bottom-navigation-bar')).toBeVisible(); await page.getByRole('button', { name: '我的' }).click(); await page.getByRole('button', { name: '退出登录' }).click();
  await page.getByRole('button', { name: '忘记密码？' }).click(); await page.getByLabel('注册邮箱').fill(`${username}@example.test`); await page.getByRole('button', { name: '发送重置邮件' }).click(); await expect(page.getByRole('status')).toContainText('如果该邮箱已注册');
  const link = (await (await request.get('/api/test/recovery-link')).json()).link as string; expect(link).toContain('#reset-password='); await page.goto(`/#reset-password=${link.split('#reset-password=')[1]}`); await page.reload(); await expect(page.getByRole('heading', { name: '设置新密码' })).toBeVisible();
  await page.locator('#auth-password').fill('recovered-password-123'); await page.getByLabel('确认密码').fill('recovered-password-123'); await page.getByRole('button', { name: '保存新密码' }).click(); await expect(page.getByRole('heading', { name: '回到你的唱片架' })).toBeVisible();
  await page.getByLabel('用户名').fill(username); await page.locator('#auth-password').fill('recovered-password-123'); await page.getByRole('button', { name: '登录' }).click(); await expect(page.locator('#bottom-navigation-bar')).toBeVisible();
});
