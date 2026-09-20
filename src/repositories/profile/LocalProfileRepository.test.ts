import 'fake-indexeddb/auto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LocalProfileRepository } from './LocalProfileRepository';
import { WebIndexedDBAdapter } from '../../platform/db/VinylDatabase';

test('profile survives reopening and another account cannot read it', async () => {
  const repository = new LocalProfileRepository(new WebIndexedDBAdapter('profile-test-a'));
  const avatar = 'data:image/png;base64,YWJj';
  await repository.save({ displayName: '  我的唱片架  ', avatar });
  const reopened = new LocalProfileRepository(new WebIndexedDBAdapter('profile-test-a'));
  assert.deepEqual(await reopened.get(), { displayName: '我的唱片架', avatar });
  const another = new LocalProfileRepository(new WebIndexedDBAdapter('profile-test-b'));
  assert.deepEqual(await another.get(), { displayName: '', avatar: '' });
  await reopened.save({ displayName: '新名字', avatar: '' });
  assert.deepEqual(await repository.get(), { displayName: '新名字', avatar: '' });
});

test('invalid profile cannot overwrite saved values and storage failures reach the caller', async () => {
  const repository = new LocalProfileRepository(new WebIndexedDBAdapter('profile-validation'));
  const original = { displayName: '原名', avatar: '' };
  await repository.save(original);
  for (const displayName of ['   ', '字'.repeat(31)]) await assert.rejects(repository.save({ displayName, avatar: '' }), /昵称/);
  await assert.rejects(repository.save({ displayName: '昵称', avatar: 'https://private.example/avatar.png' }), /头像/);
  assert.deepEqual(await repository.get(), original);
  const failed = new LocalProfileRepository({ version: 2, initialize: async () => {}, transaction: async () => { throw new Error('QuotaExceededError'); } });
  await assert.rejects(failed.save(original), /资料保存失败/);
});
