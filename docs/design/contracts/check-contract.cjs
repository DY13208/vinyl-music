// 验证设计契约，不调用业务HTTP、不创建数据库数据。
const fs = require('node:fs');
const assert = require('node:assert/strict');
const Ajv2020 = require('ajv/dist/2020').default;
const addFormats = require('ajv-formats');

const bundlePath = process.argv[2];
assert(bundlePath, 'Usage: node check-contract.cjs <bundled-openapi.json>');
const spec = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
const ajv = new Ajv2020({ strict: false, allErrors: true, coerceTypes: false });
addFormats(ajv);
ajv.addSchema(spec, 'urn:vinyl:contract');
const validators = Object.fromEntries(Object.keys(spec.components.schemas).map(name => [
  name, ajv.compile({ $ref: `urn:vinyl:contract#/components/schemas/${name}` }),
]));
const deref = value => {
  if (!value?.$ref) return value;
  assert(value.$ref.startsWith('#/'), `Unbundled ref: ${value.$ref}`);
  return deref(value.$ref.slice(2).split('/').reduce((v, k) => v[k.replaceAll('~1', '/').replaceAll('~0', '~')], spec));
};
const ids = new Set();
const absoluteRefs = value => {
  if (Array.isArray(value)) return value.map(absoluteRefs);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, child]) => [
    key, key === '$ref' && child.startsWith('#/') ? 'urn:vinyl:contract' + child : absoluteRefs(child),
  ]));
  return value;
};
const compileBoundary = schema => ajv.compile(absoluteRefs(schema));
let operations = 0;
let boundaries = 0;
for (const [path, item] of Object.entries(spec.paths)) {
  for (const [method, operation] of Object.entries(deref(item))) {
    if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue;
    operations++;
    assert(!ids.has(operation.operationId), 'Duplicate operationId');
    ids.add(operation.operationId);
    const params = operation.parameters.map(deref);
    for (const [, name] of path.matchAll(/\{(\w+)\}/g)) {
      assert(params.some(p => p.name === name && p.in === 'path' && p.required));
    }
    if (method !== 'get') {
      assert(params.some(p => p.name === 'Origin' && p.required));
      if (operation.security.length) assert(params.some(p => p.name === 'X-CSRF-Token' && p.required));
    }
    for (const p of params) { compileBoundary(p.schema); boundaries++; }
    const body = deref(operation.requestBody);
    if (body) { compileBoundary(body.content['application/json'].schema); boundaries++; }
    for (const [code, raw] of Object.entries(operation.responses)) {
      const response = deref(raw);
      assert(response.headers['X-Request-Id']);
      if (code === '204') assert(!response.content, '204 must not have a body');
      for (const media of Object.values(response.content ?? {})) { compileBoundary(media.schema); boundaries++; }
    }
  }
}

const id = '019f0000-0000-7000-8000-000000000001';
const other = '019f0000-0000-7000-8000-000000000002';
const timestamp = '2026-09-10T06:00:00Z';
const source = { kind: 'fixture', providerId: null, sourceUrl: null, licenseStatus: 'unknown', reviewStatus: 'unverified' };
const release = { id, albumId: other, title: 'Abbey Road', artistName: 'The Beatles', artistIds: [id], releaseYear: 1969, coverUrl: null, edition: null, source };
const recordFields = { title: '测试唱片', artistName: '测试艺术家' };
const entry = { id, releaseId: other, recordId: null, title: '测试唱片', artistName: '艺术家', coverUrl: null,
  condition: 'UNKNOWN', purchasePrice: null, notes: '', acquiredOn: null, version: 1, createdAt: timestamp, updatedAt: timestamp };
const unavailable = { availability: 'unavailable', reason: 'PROVIDER_NOT_CONFIGURED', providerId: 'netease', source: null };
const lyrics = { availability: 'unavailable', reason: 'PROVIDER_NOT_CONFIGURED', providerId: 'netease', language: null, attribution: null, lines: [] };
const cases = [];
const test = (name, schema, data, expected = true) => cases.push({ name, schema, data, expected });
test('注册输入', 'RegisterInput', { username: 'vinyl_user', displayName: '唱片收藏者', password: 'long-passphrase-123' });
test('拒绝短密码', 'RegisterInput', { username: 'vinyl_user', displayName: '唱片收藏者', password: '123456' }, false);
test('拒绝客户端指定权限', 'RegisterInput', { username: 'vinyl_user', displayName: '唱片收藏者', password: 'long-passphrase-123', role: 'admin' }, false);
test('发行版入藏', 'CollectionInput', { releaseId: id });
test('私人档案重新入藏', 'CollectionInput', { recordId: id });
test('必须选择入藏目标', 'CollectionInput', {}, false);
test('拒绝两个入藏目标', 'CollectionInput', { releaseId: id, recordId: other }, false);
test('拒绝客户端userId', 'CollectionInput', { releaseId: id, userId: other }, false);
test('收藏响应', 'CollectionEntry', entry);
test('收藏目标互斥', 'CollectionEntry', { ...entry, recordId: id }, false);
test('收藏不能没有目标', 'CollectionEntry', { ...entry, releaseId: null }, false);
test('整数分', 'Money', { amountMinor: 32000, currency: 'CNY' });
test('拒绝小数分', 'Money', { amountMinor: 3.2, currency: 'CNY' }, false);
test('拒绝缺币种', 'Money', { amountMinor: 32000 }, false);
test('清空价格', 'CollectionPatch', { purchasePrice: null });
test('拒绝空PATCH', 'CollectionPatch', {}, false);
test('拒绝不存在的日期', 'CollectionPatch', { acquiredOn: '2026-02-30' }, false);
test('私人档案与收藏输入', 'PrivateRecordInput', { ...recordFields, collection: { condition: 'NM' } });
test('私人档案响应纯字段', 'PrivateRecordFields', recordFields);
test('拒绝响应混入collection', 'PrivateRecordFields', { ...recordFields, collection: { condition: 'NM' } }, false);
test('拒绝私人审核字段', 'PrivateRecordInput', { ...recordFields, reviewStatus: 'reviewed' }, false);
test('私人档案版本响应', 'PrivateRecord', { id, fields: recordFields, version: 1, createdAt: timestamp, updatedAt: timestamp });
test('发行版搜索', 'SearchPage', { type: 'releases', items: [release], nextCursor: null });
test('拒绝搜索类型错配', 'SearchPage', { type: 'artists', items: [release], nextCursor: null }, false);
test('无音源', 'PlaybackAvailability', unavailable);
test('禁止无音源带URL', 'PlaybackAvailability', { ...unavailable, source: { url: 'https://example.com/track.mp3' } }, false);
test('禁止可用状态没有来源', 'PlaybackAvailability', { ...unavailable, availability: 'available', reason: null }, false);
test('无歌词', 'LyricsAvailability', lyrics);
test('禁止无歌词却返回歌词行', 'LyricsAvailability', { ...lyrics, lines: [{ startMs: 0, text: '示例' }] }, false);
test('导入提交', 'ImportCommit', { rowNumbers: [1, 3] });
test('拒绝导入重复选择', 'ImportCommit', { rowNumbers: [1, 1] }, false);
test('拒绝导入超过200行', 'ImportCommit', { rowNumbers: [201] }, false);
test('拒绝提交owner', 'ImportCommit', { rowNumbers: [1], userId: other }, false);
const failed = [];
for (const c of cases) {
  const validate = validators[c.schema];
  const actual = validate(c.data);
  if (actual !== c.expected) failed.push({ name: c.name, expected: c.expected, actual, errors: validate.errors });
}
const report = { schemas: Object.keys(validators).length, paths: Object.keys(spec.paths).length,
  operations, boundariesCompiled: boundaries, cases: cases.length, passed: cases.length - failed.length, failed };
console.log(JSON.stringify(report, null, 2));
assert.equal(failed.length, 0, 'Contract example failures');
