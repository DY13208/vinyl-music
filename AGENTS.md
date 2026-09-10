# Vinyl Music Codex 开发入口

本仓库是面向 Web、iOS、Android 的音乐应用。当前生产部署为 **GitHub → Vercel Hobby**，技术边界是 React + Vite + Vercel Static Hosting，必要时使用少量 Vercel Functions；没有独立传统后端或常驻服务器。移动端既定路线是 Capacitor。除非用户以后明确要求，不迁移到 Flutter 或 React Native。

进行架构性修改、引入平台能力或调整播放器/UI 基础设施前，必须先阅读：

- `docs/ARCHITECTURE.md`
- `docs/CROSS_PLATFORM.md`
- `docs/AUDIO_ARCHITECTURE.md`
- `docs/UI_GUIDELINES.md`

## 长期约束

- 所有新代码都要评估 Capacitor iOS / Android；保持 Web 正常工作的同时，降低未来 App 迁移成本。
- 不得因当前是 Windows + Web 就写死浏览器能力。`window`、`document`、`navigator` 及平台判断应尽量集中在 `src/platform/` 的适配器内，并统一通过 `platformService` 暴露。
- 不散落 `isIOS` / `isAndroid` 判断；优先做能力检测，由平台适配器处理差异。
- UI 必须 mobile-first，覆盖 safe-area（尤其 iPhone Home Indicator），支持 touch / Pointer Events，不能依赖 hover 才能完成操作。
- 音频核心不得直接强耦合 `HTMLAudioElement`；页面不得直接操作 `navigator.mediaSession`。音频由 `AudioEngine` 抽象，系统媒体控制由 `mediaSessionService` 抽象。
- 文件系统与 storage 必须抽象。业务组件不得随意直接使用 `localStorage`、浏览器下载锚点或 File API。
- 生产 API 不得写死 `localhost` / `127.0.0.1`；通过配置、相对 URL 或原生适配器解析服务地址。
- 不为 Music Provider 引入传统 Node/Express 常驻服务器或服务器运维成本。需要隐藏 Secret、解决 CORS、统一请求格式、做简单匹配或聚合时，优先使用轻量 `/api/*` Vercel Functions。
- 敏感 API Key 禁止放入 `VITE_*` 或客户端包；Secret 只通过 Vercel Environment Variables 注入服务端函数。可公开的非敏感配置才可使用 `VITE_*`。
- Provider 分为 Client Provider 与 Serverless Provider。可安全公开直连的 API 才能放客户端；涉及 Secret/CORS/代理的 Provider 必须经 `/api/*`。
- 当前阶段正式采用 Local-first：用户设备本地数据是 albums、tracks、collection、播放历史、音源绑定、rejected/preferred source 和设置的 source of truth。业务层通过 Repository/Storage abstraction 使用它们，不以任何服务端写入成功为前提。
- 偏好设置走 Storage/Preferences abstraction，结构化音乐数据逐渐迁往 IndexedDB；未来 App 对应 SQLite/Native Storage Adapter。
- 本地音乐绝不为了播放上传至 Vercel。Web 使用 Browser Local File，App 使用 Capacitor Filesystem，并统一由 `LocalMusicProvider` 处理。
- Vercel Functions 不承担用户音乐文件持久化、大型转码、长时间音频处理、音乐 CDN 或传统数据库职责。
- 音源依赖链保持 `Track → PlaybackResolver → MusicProvider → TrackMatcher → AudioEngine`；无法可靠匹配时宁可返回无音源，也不播放近似歌曲。
- Three.js 只负责表现与渲染，业务状态以 React/store/domain 为准；不可把场景对象当作权威状态源。
- 跨端设计按实际需求渐进实现，不为“跨端”提前引入空洞层级或一次性重写。
- 架构优化默认不改变现有 UI、交互和视觉效果，除非任务明确要求。
- 若候选方案会导致未来 iOS/Android 大面积重写，优先采用同等复杂度下更跨端友好的方案。

## 修改与交付

- 先识别改动属于 UI、业务、服务还是平台能力，避免三者继续耦合。
- 修改后运行仓库实际存在的 lint、build、test；缺失的脚本或无法执行的验证必须如实说明。
- 新增能力若只支持 Web，必须提供可接受的降级，并在最终说明中明确指出其平台限制。
- 不把浏览器通过、TypeScript 通过或构建通过误称为 iOS/Android 真机验证。
- 涉及 Vercel Functions 时检查 Hobby 方案的执行时长、请求体、带宽与其他当前限制；不要设计依赖长任务或常驻连接的流程。
