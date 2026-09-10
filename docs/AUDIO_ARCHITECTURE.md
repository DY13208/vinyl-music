# 音频架构

## 原则

播放器的业务状态与音频执行实现分离。React 页面和 store 不得持有或直接操作 `HTMLAudioElement`、`AudioContext`、`navigator.mediaSession` 或未来的原生播放器对象。

```text
Player UI → playback hooks/store → PlaybackService
                                  ├─ AudioEngine
                                  └─ mediaSessionService
```

`PlaybackService` 负责队列、上一首/下一首、播放意图和状态协调；`AudioEngine` 负责真实播放；`mediaSessionService` 负责系统媒体入口。音频引擎事件更新 store，UI 只订阅状态。

## AudioEngine 契约

基础能力至少包括：

```ts
interface AudioEngine {
  load(source: AudioSource, options?: LoadOptions): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  seek(seconds: number): Promise<void>;
  setVolume(volume: number): Promise<void>;
  setPlaybackRate(rate: number): Promise<void>;
  getCurrentTime(): Promise<number>;
  getDuration(): Promise<number>;
  subscribe(listener: AudioEngineListener): () => void;
  destroy(): Promise<void>;
}
```

事件至少覆盖 state、time、duration、buffering、ended、error。实现可以暴露额外能力描述，但业务层不能依赖某个实现的私有对象。

- `WebAudioEngine`：封装 `HTMLAudioElement` / Web Audio API、浏览器自动播放与 CORS 行为。
- `CapacitorAudioEngine` 或 `NativeAudioEngine`：未来封装 iOS AVAudioSession/播放器与 Android Media3/前台播放服务，可由成熟 Capacitor 插件承载。
- 测试实现：无 DOM 的可控 fake engine，用于队列和状态机测试。

第一轮 P0 已建立 `src/platform/audio/AudioEngine.ts` 契约，并将所有 `HTMLAudioElement` / Web Audio API 实现移入 `src/platform/audio/WebAudioEngine.ts`。`src/services/audioEngine.ts` 只暴露由 `platformService` 选择的引擎。第二阶段已把 Provider 搜索与匹配移出 AudioEngine，由 PlaybackResolver 解析可靠 TrackSource 后调用标准 `load/play/pause/seek`；后续继续补齐独立 PlaybackService 与完整事件模型，避免播放器大改。

## Media Session

`mediaSessionService` 独立于 AudioEngine。React 页面不得直接使用 `navigator.mediaSession`。

它负责：

- 发布 title、artist、album、artwork metadata；
- 注册 play、pause、previous、next、seek backward/forward、seek to；
- 同步 playback state、position state；
- 映射锁屏控制、iOS Control Center、Android Media Notification；
- 接收蓝牙与有线耳机控制并转换为统一播放命令。

Web adapter 使用 Media Session API，并对不支持的浏览器无害降级；原生 adapter 对接系统媒体会话。UI 不根据平台复制上一首/下一首逻辑。

## 音源解析（第二阶段）

播放来源通过 `src/music/` 管理：MusicProviderRegistry 聚合 AppleMusicProvider、AudiusProvider 与 LocalMusicProvider；所有在线候选必须经过同一个 TrackMatcher，PlaybackResolver 只把评分至少 70 或经用户明确确认的来源交给 AudioEngine。50–69 分只作为 `POSSIBLE_MATCH`，不会自动播放；更低评分返回 `NO_RELIABLE_SOURCE`/`NO_SOURCE`。

本地文件由用户针对当前 Track 选择后先用同一个 TrackMatcher 展示评分，只有再次点击确认才成为 `verificationMethod: user` 的首选来源。Web 文件内容保存在 IndexedDB，绑定、首选与拒绝 identity 通过 StorageService 保存；持久化内容中不保存临时 blob URL。未来原生端替换文件存储与 URI 解析，不改变 LocalMusicProvider/PlaybackResolver 规则。

### Provider 的部署方式

音源解析的稳定依赖链是：

```text
Track → PlaybackResolver → MusicProvider → TrackMatcher → AudioEngine
```

- **Client Provider** 可直接调用无需 Secret、允许客户端使用且 CORS 合法的公开 API。
- **Serverless Provider** 通过同源 `/api/*` Vercel Function 访问需要 Secret、CORS 代理、请求规范化或简单聚合的第三方服务。
- Provider 不能因为位于 Serverless 就绕过 TrackMatcher；Functions 返回的仍是候选 TrackSource，是否可靠由统一规则决定。
- 敏感 Provider 凭证只放在 Vercel Environment Variables，禁止通过 `VITE_*` 暴露。
- 不为 Provider 引入 Express/Node 常驻服务器。Functions 也不负责音频转码、长时间分析、音乐 CDN、数据库或永久文件托管。

### 本地音乐边界

- 本地音乐绝不为了播放上传到 Vercel，也不经过 Serverless Provider。
- Web：Browser Local File / IndexedDB → Web file adapter → LocalMusicProvider。
- App：Capacitor Filesystem → Native file adapter → 同一个 LocalMusicProvider。
- 音源绑定、preferred/rejected 状态保存在客户端；Web 的结构化绑定逐渐统一至 IndexedDB，App 对应 SQLite/Native Storage Adapter。
- 浏览器站点数据可能被用户或系统清理，不能把 Web 本地文件描述为云端备份；缺失时返回 `LOCAL_SOURCE_MISSING`。

## 后台与生命周期

- App 进入后台时，播放策略由用户意图和平台能力决定，不能因为 React 组件卸载而意外停止。
- 原生实现需配置后台音频、音频焦点/duck、耳机拔出、电话/其他 App 打断以及 Android 前台媒体服务。
- resume 时从引擎读取真实 position/state 重新校准 store，不能依赖暂停前的 UI 定时器。
- 锁屏、Control Center、通知、蓝牙和耳机命令必须走同一个 PlaybackService 命令路径。
- 切歌竞态使用请求标识或取消机制；过期 load/事件不得覆盖当前曲目。

## 资源、错误与测试

- 音源 URL、鉴权、缓存与下载策略属于 service/platform 层，不放在页面。
- 区分 autoplay denied、network、decode、unsupported、permission、interruption 等错误，向 UI 返回可展示状态。
- artwork 提供适合系统媒体面的稳定 URL/本地 URI及多尺寸版本。
- `destroy()` 必须解绑事件、释放音频节点和原生资源。
- 至少测试播放状态机、切歌竞态、seek 边界、ended 自动下一首、错误恢复和 lifecycle 恢复；真机验证后台播放、锁屏、通知、蓝牙/耳机控制。
