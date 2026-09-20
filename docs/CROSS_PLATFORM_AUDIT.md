# 当前跨端审计

审计日期：2026-09-10。范围为当前 `src/`、Vite 配置与 Express 服务。本文记录当前事实和渐进式处理建议，不代表已完成 Capacitor 或真机验证。

## 结论

当前项目已具备 mobile-first 视觉、部分 safe-area、`dvh`、Pointer 手势和相对 API 路径等良好基础，无需推倒重写。最高迁移风险是播放核心仍直接封装浏览器音频、收藏的权威/缓存边界不清，以及扫码、文件、触觉等平台能力直接存在组件或音频服务中。

## 第一轮 P0 整改状态（2026-09-10）

已完成最小边界建设，未接入 Capacitor、未改变 UI：

- 建立 `AudioEngine` 契约与 `WebAudioEngine`；HTMLAudioElement、AudioContext 仅存在于 Web audio adapter。
- 建立 Storage、Files、Scanner、Haptics 契约及 Web adapter。全局能力由 `platformService` 装配；files/scanner 使用独立能力入口，以保留弹窗与 ZXing 的懒加载。
- `App.tsx` 不再直接访问 localStorage；扫码组件不再直接依赖 ZXing、FileReader、下载锚点或 vibration。
- 全部触觉调用已改用 `hapticsService`；Web vibration 和原有机械点击声行为保留在适配器组合内。

仍未完成且有意留待后续：PlaybackService/音频事件模型、Media Session、Native adapter、生命周期、权限状态模型，以及收藏权威模型统一。

第二阶段已增加 MusicProvider、TrackMatcher、PlaybackResolver 与可持久化 LocalMusicProvider。Apple Music 和 Audius 的候选都必须达到可靠阈值，不再由音频引擎搜索或直接取最高搜索结果。本地文件在 Web 端存入 IndexedDB，来源绑定/拒绝记录走 StorageService；浏览器配额、清站点数据或隐私模式仍可能使文件缺失，此时返回 `LOCAL_SOURCE_MISSING`，不得宣称云端永久保存。

## P0：接入移动端前必须形成稳定边界

### 音频与系统媒体能力（边界已建立，系统媒体仍待处理）

**现状与浏览器耦合**

- `src/platform/audio/WebAudioEngine.ts` 现在独占 `HTMLAudioElement` 与 Web Audio API，并实现通用 AudioEngine 契约。
- `src/App.tsx` 仍按兼容方法 `playTrackPreview`、`resumePreview`、`seekPreview` 编排当前试听流程；这避免本轮重写播放器，但尚无 PlaybackService 和统一事件模型。
- 当前没有独立 `mediaSessionService`，也没有后台播放、锁屏/Control Center、Android Media Notification、蓝牙/耳机控制的实现边界。

**风险**

这是 Capacitor 迁移风险最高的区域。iOS/Android 后台播放与系统媒体会话不能靠 WebView 中的 `HTMLAudioElement` 行为推断；若继续让页面依赖当前方法，替换原生引擎会波及整个播放器。

**近期动作**

下一步是在真实播放需求触达时补统一事件和 PlaybackService，再建立独立 `mediaSessionService`。不要现在就选定或接入未经真机验证的原生音频插件。

### 收藏持久化与 storage

**现状与浏览器耦合**

- `src/App.tsx` 已通过 `storageService` 读写同一个历史 key；localStorage 只存在于 Web adapter，因此现有数据不会因本轮换 key 或搬迁而丢失。
- 同一份收藏还会从 Express `/api/collection` 合并，当前 local cache、服务端权威源及冲突规则没有清晰契约。

**风险**

未来更换 Capacitor Preferences/SQLite 或引入离线同步时，组件状态、浏览器缓存和服务端数据容易互相覆盖；这比简单替换 API 更可能造成数据丢失。

**近期动作**

StorageService 已完成。当前模型是混合权威：同 ID 启动合并时服务端优先，本地独有项被保留；新增/导入先写服务端，删除则本地先行且服务端尽力删除。统一 collection repository/source of truth 会改变离线与失败语义，本轮未强行处理。后续必须先明确产品规则，再增加 schema version 与迁移。

## P1：近期按功能触达时抽象

### 扫码、相机与权限

- ZXing 和浏览器 media constraints 已移入 Web scanner adapter；组件仍提供 HTML video 预览节点，权限错误仍是通用文案。
- 真正接入 Capacitor 时再决定原生扫码/相机插件、预览承载方式和 iOS/Android 权限声明。

### 文件导入、导出与图片选择

- FileReader 与下载锚点已移入 Web file adapter；组件仍保留 React DOM 的 file input 作为当前 Web 选择入口。
- 真正接入 Capacitor 时根据产品需求替换文件选择/保存/分享实现，不需要重构整个 Modal。

### Haptics 职责错位

- 页面已统一调用 `hapticsService`；navigator.vibrate 仅存在于 Web adapter。现有机械点击声通过组合回调继续复用 Web audio adapter。
- Capacitor adapter 以后映射系统触觉；届时再决定机械点击声是否作为独立 UI sound capability。

### 平台全局对象与 reduced motion

- `useVinylSideTransition.ts` 直接调用 `window.matchMedia`；轮播组件直接注册 window keydown/timeout；`main.tsx` 的 DOM 挂载属于合理 Web bootstrap。
- 不需要为每个 DOM 事件创建重量级接口。建议先提供 `platformService` 的 capability、reduced-motion 与 lifecycle 入口；纯 React DOM 交互可留在 UI，但业务/设备能力必须迁出。

### API 运行地址

- 客户端 `collectionApi.ts` 使用相对 `/api`，对同源 Web 部署是正确且无需立即修改的。
- `vite.config.ts` 中的 `http://127.0.0.1:3001` 只属于开发代理，不是生产客户端地址，因此当前不是违规生产硬编码。
- Capacitor 真机不能通过相对 `/api` 自动找到 Windows 开发机。接入移动端前应让 API client 从环境/运行时/platform 配置取得 base URL，并处理 HTTPS、CORS、iOS ATS 与 Android network security。

### 触屏排序

- 曲目编辑使用 HTML `draggable`/drag events，移动 WebView 支持不稳定。
- 若排序成为真实移动端流程，改为 Pointer 手势或提供上移/下移按钮；当前可保留，不必为了尚未验证的需求重写。

## P2：可在 Capacitor 接入期处理

- **Lifecycle/后台恢复**：当前没有 App 壳层。建立原生工程时再接 Capacitor lifecycle，并让播放引擎、相机和高成本渲染响应 active/background/resume。
- **通知与状态栏**：设置页目前只是 UI 状态，尚无真实通知能力。等产品确定本地/推送通知需求后再选插件；状态栏主题也应在原生壳层接入时实现。
- **Deep links / external links / sharing**：当前没有形成核心流程。出现真实用例时通过平台服务接入，不预建空实现。
- **软键盘细节**：现有录入表单需在 WKWebView/Android WebView 真机检查遮挡和 resize 策略；没有原生壳层前不猜测插件配置。
- **原生文件缓存与离线音频**：在确定版权、下载和离线播放产品需求后再设计，不能由当前 30 秒网络试听直接外推。

## 现在无需修改

- `src/index.css` 已使用 `100dvh` 与 bottom safe-area，播放器和导入页也使用 top/bottom safe-area；这些方向应保留并统一扩展。
- `ThreeUIVinylShelf.tsx` 使用 Pointer Events，部分手势区域已有 `touch-action: pan-y`；Motion 轮播也支持拖拽与 reduced motion。
- `VinylCollectionShelf.css` 将 hover 增强限制在 `@media (hover: hover)`，属于跨输入设备友好做法。
- `collectionApi.ts` 已把服务调用集中在 service 文件并使用相对路径；只需在移动端接入前增加可配置 transport/base URL，不必现在重写 Express API。
- Three.js/黑胶视觉可以继续保留。当前扫描未发现以 Three.js 场景对象作为收藏或播放权威状态的证据；后续只需补可见性、资源释放和移动 GPU 验证。
- `main.tsx` 直接访问 `document` 是 Web 入口的正常职责；不应为了抽象而抽象。未来 Capacitor 仍会加载同一 Web bootstrap。

## 建议实施顺序

1. 音频功能下次实质变更时，先建立 AudioEngine 契约、事件和 Web 实现边界。
2. 收藏/离线功能下次变更时，提取 storage/repository 并明确权威数据与冲突策略。
3. 扫码、导入导出、触觉任一功能继续开发时，各自移入 `src/platform/` adapter。
4. 创建 Capacitor 原生工程时，再完成 API base URL、permissions、lifecycle、Media Session、状态栏和真机兼容配置。
5. 每一步保持现有 Web UI 与行为，并分别记录 Web、iOS、Android 的实际验证证据。
