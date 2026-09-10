# 长期目标架构

## 产品与技术边界

Vinyl Music 是一个最终需要运行于 Web、iOS、Android 的音乐播放器与黑胶收藏应用。当前在 Windows 上以 React + TypeScript + Vite 开发，通过 GitHub 推送触发 Vercel Hobby 自动部署。生产架构没有独立传统后端或常驻服务器；Vercel 提供静态托管，必要时仅使用少量 `/api/*` Functions。未来移动端外壳采用 Capacitor，共用 React UI、领域模型和大部分业务逻辑。

```text
GitHub → Vercel Static Hosting → React + Vite Web
                              └→ /api/* Vercel Functions（仅必要的轻量代理/聚合）

未来：同一 React 应用 → Capacitor → iOS / Android
```

目标依赖方向：

```text
React UI
  ↓
Hooks / Store
  ↓
Domain / Services
  ↓
Platform Abstraction Layer
  ↓
Web Adapter / Capacitor Adapter
  ↓
Browser / iOS / Android
```

依赖只应向下。平台适配器可以依赖浏览器或 Capacitor API，业务层和 UI 不应反向感知具体实现。

## 建议目录

按需求渐进形成以下结构，不要求为整理目录而一次性搬迁：

```text
src/
  components/   # 可复用、尽量无业务状态的 UI
  views/        # 页面组合与路由级视图
  hooks/        # React 生命周期与用例绑定
  domain/       # Album、Track、Playback 等规则和纯逻辑
  services/     # 跨页面用例、网络与应用服务
  music/        # Provider、匹配、音源解析与平台无关音乐模型
  platform/     # 平台契约、Web/Capacitor 适配器
  store/        # 可序列化的共享应用状态
  utils/        # 无平台副作用的通用函数
  types/        # 共享类型；可由现有 types.ts 渐进迁入
api/            # 必要的轻量 Vercel Functions；不是常驻后端或数据库
```

## 分层规则

### UI 层

- 负责展示、输入、无障碍语义和调用用例。
- 不直接持有 `HTMLAudioElement`、Media Session、文件系统、通知、权限或持久化实现。
- Three.js/Motion 动画只能消费 React/store 状态并回传用户意图。

### Domain / Services 层

- 负责播放队列、曲目切换、收藏规则、数据校验和服务编排。
- 核心规则应可在无 DOM 环境测试。
- 网络服务接受可配置的客户端或 base URL；不要让组件拼接部署地址。

### Platform 层

- 定义稳定、小型的能力契约，并分别提供 Web 与 Capacitor 实现。
- `platformService` 是平台识别与能力访问入口；其下可包含 audio、storage、files、media session、haptics、sharing、lifecycle 等适配器。
- 未支持能力应返回明确的 capability 状态或可控错误，不伪装成功。

### Hosting / Serverless 层

- 默认是 Vercel Static Hosting，不假设存在可写磁盘、常驻进程或长期连接。
- `/api/*` Vercel Functions 只解决必须位于可信服务端的轻量问题：隐藏 Secret、处理第三方 CORS、统一请求、简单音源匹配或小规模聚合。
- Functions 不承担永久保存用户音乐文件、大型音频转码、长时间处理、音乐 CDN、队列 worker 或传统数据库职责。
- 不为了 Music Provider 新建或维护传统 Node/Express 常驻服务器。仓库内现有 Express 代码只能视为本地/遗留开发实现，不能被当作 Vercel 生产持久化后端。
- Serverless 代码必须适配无状态和临时执行环境；任何本地文件写入都不能视为跨请求持久化。

## Provider 部署分类

- **Client Provider**：不需要 Secret、允许浏览器/移动端安全直连且 CORS 合法的公开 API。客户端仍必须通过 Provider 接口和 TrackMatcher，不能直接从页面调用。
- **Serverless Provider**：需要 Secret、存在 CORS、需要规范化请求或简单聚合的 Provider。客户端只调用同源 `/api/*`，函数再访问第三方。
- Provider 类型是部署方式，不改变播放规则。依赖链保持 `Track → PlaybackResolver → MusicProvider → TrackMatcher → AudioEngine`。
- 敏感 API Key 只存放于 Vercel Environment Variables；禁止通过 `VITE_*`、静态 JSON、源码或返回 payload 暴露。

## 状态归属

- React/store 是播放状态、当前曲目、收藏和 UI 导航的权威来源。
- 音频引擎是播放执行者，通过事件回报 position、duration、ended、error 等状态。
- Three.js 是可丢弃的渲染投影；重建场景不得影响业务状态。
- 持久化数据需有 schema/version 及迁移策略；缓存与权威数据应明确区分。当前用户收藏、播放历史、音源绑定和设置以客户端为主要持久化来源。

## 客户端数据策略

- 当前阶段正式为 **Local-first**：用户设备本地数据是 albums、tracks、collection、播放历史、TrackSource binding、rejected/preferred source 与用户设置的 source of truth。Vercel 或遗留 Express 都不是这些数据的必须写入目标。
- Web 设置与轻量偏好使用 Storage/Preferences abstraction，当前 adapter 可以落到 localStorage。
- 收藏、播放历史、音源绑定、拒绝记录等结构化音乐数据逐渐迁移至 IndexedDB，不把不断增长的数据塞入 localStorage。
- Web 本地音频保存在浏览器本地文件能力/IndexedDB；绝不为了播放上传到 Vercel。清理站点数据、隐私模式或浏览器配额仍可能导致文件失效，必须如实提示。
- 未来 App 以 SQLite/Native Storage Adapter 承接结构化数据，以 Capacitor Filesystem 承接本地音频；domain 与 LocalMusicProvider 不感知具体存储实现。
- 当前不引入传统数据库。未来若产品需求发生变化，需要新的明确决策，不能把 Vercel Functions 临时文件系统当数据库。

## 当前实现边界（P0.5）

`src/platform/platformService.ts` 现在是 Web 平台判断及全局能力的组合入口，提供 audio、storage、haptics，以及统一的 `isWeb()` / `isNative()` / `isIOS()` / `isAndroid()`。files 与 scanner 通过各自目录中的稳定入口提供，以保持“新增唱片”弹窗和 ZXing 的懒加载边界。具体浏览器对象被限制在相应 Web adapter 中；尚未创建任何 Native adapter。

收藏主链路已通过 `CollectionRepository` 改为 Local-first：

- App 启动只通过 `collectionRepository.getAlbums()` 恢复本地收藏，不再请求或合并 `/api/collection`。
- 新增、批量导入、更新和删除只依赖 Repository 成功，不再以服务端 POST/DELETE 为前提。
- WebCollectionRepository 继续读写原有 `vinyl_user_collection` key，保留已有用户数据和去重行为。
- `server.ts` 与 `services/collectionApi.ts` 中的收藏端点暂为遗留/本地工具保留，但已没有 App 收藏调用者；不得重新接回权威主链路。

当前 WebCollectionRepository 仍使用 StorageService/localStorage adapter，这是兼容阶段而非最终结构化存储。后续 IndexedDBCollectionRepository 必须迁移同一份数据并提供 schema version/回滚策略；未来 App 使用 SQLiteCollectionRepository。替换 adapter 不得改变 UI 或业务调用。

## 演进原则

优先围绕真实变更建立抽象：当现有浏览器能力需要复用、测试或替换时抽出接口；不要预先创建没有调用者的通用框架。每次演进应保持现有 Web 行为和视觉回归可验证，并给未来 Capacitor 适配留下单一替换点。
