# 跨端开发规范

## Capacitor 接入路线

当前继续使用 React + Vite Web 应用。真正开始移动端交付时，按以下顺序接入 Capacitor：

1. 固定 Web 构建产物目录，并建立 iOS/Android 原生工程。
2. 先接入 `platformService` 与必要插件，不先重写页面。
3. 分能力替换 Web adapter：音频、文件、分享、权限、生命周期等。
4. 在 iOS WKWebView 与 Android WebView 真机验证；Web 回归仍必须保留。

不要迁移到 Flutter 或 React Native，除非后续明确决策。

当前 Web 生产部署固定为 GitHub → Vercel Hobby 自动部署：静态资源由 Vercel Hosting 提供，只有必要的轻量可信服务端逻辑使用 `/api/*` Functions。移动端接入不得以新增传统常驻服务器为前提。

## 唯一平台入口

平台判断统一通过 `platformService`。页面、组件、hooks 和 domain 中不得散落 `window`、`navigator`、`document`、`isIOS`、`isAndroid`。

```ts
interface PlatformService {
  readonly kind: 'web' | 'ios' | 'android';
  readonly capabilities: PlatformCapabilities;
  lifecycle: LifecycleService;
  storage: StorageService;
  files: FileService;
  sharing: SharingService;
  haptics: HapticsService;
  externalLinks: ExternalLinksService;
}
```

只有 Web adapter 可直接使用浏览器全局对象；只有 Capacitor adapter 可直接使用 Capacitor 插件。优先询问“能力是否可用”，仅在适配器内部处理系统差异。

## Web / iOS / Android 差异

### Viewport 与 safe-area

- HTML viewport 应包含 `viewport-fit=cover`，移动端容器使用 `100dvh`，并为旧 WebView 提供 `100vh`/`100svh` 回退。
- 顶部、底部固定区域使用 `env(safe-area-inset-*)`；Bottom Navigation、Mini Player、Bottom Sheet 和全屏播放器必须为 Home Indicator 留出空间。
- 不使用某台设备的高度、刘海或状态栏常量；375、390、393、430px 是验证宽度，不是硬编码模板。
- 处理横竖屏变化，避免只在首次加载时读取尺寸。

### 输入与交互

- 统一优先使用 Pointer Events；需要手势时设置正确的 `touch-action` 并处理 pointer cancel。
- 核心行为必须通过点击/触摸完成，hover 仅作增强。目标点击区域建议至少 44×44 CSS px。
- HTML Drag and Drop 在触屏与 WebView 上不可靠；重要排序需要提供 Pointer 手势或按钮式替代。
- 软键盘可能改变 visual viewport；输入表单、Bottom Sheet 和固定底栏应在 iOS/Android 真机检查遮挡与滚动。

### WebView 与 CSS

- iOS 以 WKWebView 为基准，关注自动播放限制、内联媒体、滚动回弹、文件选择、CORS/ATS 和后台挂起。
- Android 以当前受支持的 System WebView 为基准，关注返回键、文件选择、权限、媒体通知和进程回收。
- CSS 使用渐进增强；采用 `dvh`、container queries、backdrop filter 等能力时提供合理降级。
- 动画尊重 `prefers-reduced-motion`，并在页面不可见或 App 进入后台时暂停高成本工作。

## 平台能力规范

- **文件系统**：导入、导出、图片选择和缓存通过 `FileService`；Web 可用 input/download，App 使用 Capacitor 文件与选择器能力。
- **Storage**：通过 `StorageService`；轻量偏好、缓存、敏感信息和结构化收藏应选择不同后端，业务组件不得直接用 `localStorage`。
- **Permissions**：通过统一权限服务请求相机、通知、媒体/文件访问；解释用途，并处理 denied、restricted、永久拒绝。
- **Sharing**：通过 `SharingService`；Web Share API、剪贴板或下载只是 Web adapter 的实现。
- **Notifications**：区分本地通知、远程推送和 Android 媒体通知；权限与 token 生命周期不得由页面直接管理。
- **Haptics**：通过 `HapticsService`；Web vibration 是可选降级，不能代表 iOS 触觉反馈。
- **Lifecycle**：统一暴露 active/background/resume；恢复时重新校准播放进度、权限和易失资源。
- **Deep links**：集中解析为应用内部导航意图，验证 scheme/host/参数，不在组件内解析 URL。
- **External links**：由服务决定系统浏览器、应用内 WebView 或禁止打开，并校验协议。
- **Keyboard**：统一处理软键盘显隐、焦点、滚动和底部安全区，不依赖固定 viewport 高度。
- **Status bar**：颜色、明暗和 overlay 策略由壳层适配器控制，页面仅声明期望主题。

## API 与配置

- Web 开发代理可以指向本地模拟函数或遗留 Express，但生产代码不得写死 `localhost` 或 `127.0.0.1`，也不得假设常驻 Node 进程。
- Web 访问 Vercel Functions 优先使用同源 `/api/*`；未来 Capacitor 通过环境配置、运行时配置或 platform adapter 解析已部署 HTTPS origin。
- iOS/Android 无法把设备自身的 localhost 当作开发电脑；真机调试地址、HTTPS、ATS/network security、CORS 必须在接入期明确配置。
- 任何敏感 API Key 都不得使用 `VITE_*`。`VITE_*` 会进入客户端包，只能保存明确可公开的配置；Secret 使用 Vercel Environment Variables，并只在 Functions 内读取。

## Provider 与 Serverless 边界

- Client Provider 仅限无需 Secret、允许安全直连且 CORS 合法的公开 API。
- 需要 Secret、CORS 代理、统一请求格式、轻量匹配或简单聚合时，实现为 Serverless Provider，通过 `/api/*` Vercel Function 调用。
- Functions 必须短时、无状态、可重试，不能用来永久保存用户音频、转码大型音频、执行长任务、充当音乐 CDN 或数据库。
- 本地音频永不上传 Vercel：Web adapter 访问 Browser Local File，未来 Capacitor adapter 访问设备 Filesystem，LocalMusicProvider 保持统一。

## 跨端数据映射

- 当前正式采用 Local-first；用户收藏、曲目、播放历史、音源绑定、rejected/preferred source 与设置以用户设备为 source of truth，任何远端请求失败都不得阻止本地写入。
- Web 轻量设置使用 localStorage-backed Preferences abstraction；结构化数据逐渐迁往 IndexedDB。
- iOS/Android 以 SQLite/Native Storage Adapter 替换 IndexedDB，以 Capacitor Filesystem 替换 Web 本地文件实现。
- 数据服务依赖抽象，不在业务组件中按 Web/iOS/Android 分叉；迁移时需保留 schema version 与显式迁移策略。
- App 收藏操作统一依赖 CollectionRepository。当前 WebCollectionRepository 保留原 storage key；未来更换 IndexedDB/SQLite adapter 时不允许把 Vercel Functions 变成同步必需条件。

## 验证矩阵

日常变更至少保持 Web lint/build/test。涉及平台能力时补充对应 Web 降级验证；接入 Capacitor 后增加 iOS WKWebView 与 Android WebView 真机矩阵，包括权限拒绝、后台/恢复、横竖屏、软键盘、弱网及系统返回行为。
