# 音乐平台预留接口

状态：**仅设计**。用户已确认“先把各个平台接口留个接口”。本文件定义自身的扩展边界，不声称任一平台已经支持相应功能或已有授权。

## 统一端口

```typescript
type ProviderId = 'netease' | 'qqmusic' | 'spotify' | 'apple_music' | 'discogs';
type Capability = 'catalogSearch' | 'barcodeLookup' | 'playback' | 'lyrics';
type ProviderContext = { requestId: string; userId: string; signal: AbortSignal };
interface MusicProvider {
  readonly id: ProviderId;
  readonly capabilities: Readonly<Record<Capability, boolean>>;
  search(input: ProviderSearchInput, context: ProviderContext): Promise<ProviderSearchResult>;
  lookupBarcode(input: BarcodeInput, context: ProviderContext): Promise<ProviderReleaseCandidate[]>;
  resolvePlayback(input: PlaybackInput, context: ProviderContext): Promise<PlaybackAvailability>;
  getLyrics(input: LyricsInput, context: ProviderContext): Promise<LyricsAvailability>;
}
```

输入包含项目曲目 ID、已校验的映射 ID 和明确参数，不接受浏览器指定供应商 API URL、Cookie、Access Token 或任意 HTTP headers。每个 DTO 在 contracts 中具名定义；供应商 SDK 原始类型不得进入 Domain/HTTP。

## 首版注册与返回

| providerId | 预留名称 | 首版连接状态 | 能力 |
| --- | --- | --- | --- |
| netease | 网易云音乐 | not_configured | 全部 false |
| qqmusic | QQ音乐 | not_configured | 全部 false |
| spotify | Spotify | not_configured | 全部 false |
| apple_music | Apple Music | not_configured | 全部 false |
| discogs | Discogs 目录 | not_configured | 全部 false |

各项只是服务端 registry entry + 同一个 `UnavailableMusicProvider` 的参数实例，不复制5套空实现。名称不意味着平台有公开全功能 API。一个平台认证实现经过校验后，才将实际支持的 capability 置 true。

`GET /music/providers` 显示名称、连接状态与支持能力；页面不收集任意平台密码。未来如需 OAuth，必须按官方支持路径新增 token 加密存储和授权撤销流程。

`GET /tracks/{trackId}/playback?providerId=spotify` 首版示例：

```json
{
  "availability": "unavailable",
  "reason": "PROVIDER_NOT_CONFIGURED",
  "providerId": "spotify",
  "source": null
}
```

正常业务不可用返回200具名状态；输入错误400、用户无权或资源不存在404、供应商短暂故障503及 `UPSTREAM_UNAVAILABLE`。不得把外部403当作无限重试条件。

## 未来可播放的固定输出

- `availability=available` 时 `reason=null`，`source` 必填 `{url, mimeType, durationMs, expiresAt, seekable, attribution}`。
- `url` 只能来自允许平台的 HTTPS 来源/受控媒体出口；不是浏览器任意 URL 代理。短期 URL 不写长期缓存、不出现在普通日志。
- `expiresAt` 为 UTC 时间或 null（已知不失效）；前端到期重新解析一次来源并恢复进度，失败保留可重试状态。
- 是否整曲、试听片段、地域/账号限制来自真实授权结果。不能用 VIP 标识或本地收藏推断播放权。
- 歌词返回 `available/unavailable`、语言、来源、授权状态、时间行列表；没有授权时 `lines=[]`，不从现有 mock 伪装回填。
- Provider 错误映射为 `NOT_CONFIGURED / UNSUPPORTED_CAPABILITY / NOT_LINKED / NO_RIGHTS / REGION_BLOCKED / NOT_FOUND / RATE_LIMITED / UPSTREAM_UNAVAILABLE`；每种错误的前端文字集中维护。

## 连接治理

连接超时2秒、总超时8秒为初始配置；幂等读取最多1次指数退避重试，遵守 Retry-After，受整体8秒预算限制。没有副作用的解析才可重试。5xx/网络错误计入短期熔断，认证/授权失败不触发重放写操作。

目录搜索只返回候选及来源，不直接写公共目录；用户确认私人录入后，后端白名单 mapper 才可入库。HTTP 请求不在数据库事务中持锁等待平台。

## 接入验收门槛

| 验证 | 通过条件 |
| --- | --- |
| registry | 每个平台 ID 唯一，未配置项的 capabilities 全 false |
| 端口契约 | 成功、未配置、无权、超时、限流、损坏响应均有 fixture |
| 内容边界 | 缺少来源或授权时不能成为可播放来源或已审核歌词 |
| 首版播放器 | 点击无音源曲目显示不可用；不启动模拟计时器或冒充音乐 |
| 未来真实平台 | 官方接入依据、有效凭据、权利条件与真实浏览器播放/暂停/seek 证据齐全才标记已接入 |

现有 `audioEngine` 可继续用于用户主动选择的落针/底噪体验，须标“音效演示”；它不实现 MusicProvider，不产生真实播放历史。
