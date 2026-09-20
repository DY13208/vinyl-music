# Vinyl Music — Agent Development Guide

项目目标技术基线：TypeScript 后端、React 19 前端、PostgreSQL 18 数据库。本文档是项目级 AI 开发规则入口，只描述 Vinyl Music 的架构、数据、前后端、AI 功能与验证约束；用户级 AGENTS 已覆盖的任务流程、最小改动、代码复用、文件行数、浏览器使用和通用交付规则在此不重复。

这里描述的是目标架构和实施约束，不代表相应模块已经实现。任何完成状态仍以当前源码、迁移、测试和运行证据为准。

## 目标架构边界

| 层 | 目标职责 | 禁止越界 |
| --- | --- | --- |
| React 19 前端 | 页面、交互、客户端状态、API 适配、音频与可视反馈 | 不持有服务端密钥，不直连 PostgreSQL，不复制后端业务规则 |
| TypeScript 后端 | HTTP 协议、用例编排、领域规则、鉴权、外部服务适配和后台任务 | Handler 不直接堆业务与 SQL，领域层不依赖 HTTP、ORM 或供应商 SDK |
| PostgreSQL 18 | 持久事实、关系约束、事务、并发控制、索引和可审计迁移 | 不以 JSONB 代替稳定模型，不靠应用层先查后写保证唯一性 |
| AI 服务 | 模型调用、结构化输出和生成内容来源管理 | 模型输出不直接触发写库或业务副作用，不把生成内容伪装成目录事实 |

## 核心事实来源

- PostgreSQL 18 是账户收藏、愿望清单、目录扩展、生成任务等持久业务状态的权威来源。
- 后端领域模型和数据库约束共同定义业务不变量；API DTO 是对外契约，不直接暴露数据库行或 ORM Entity。
- React 应用中的服务端数据只是缓存投影；写入成功后按后端返回或重新查询收敛，不能长期维持客户端假状态。
- `localStorage` 只用于可丢失的界面偏好和离线草稿，不是登录用户业务数据的权威来源。
- 外部音乐目录、歌词、封面和模型生成内容必须保留来源与授权状态；缺少来源的内容不能升级为已审核事实。

## 按场景查规则

| 场景 | 直接看 |
| --- | --- |
| 不确定本项目某项开发应进入哪个规则域 | [`rules/index.md`](./rules/index.md) |
| 新增模块、调整前后端职责或判断依赖方向 | [`rules/architecture/index.md`](./rules/architecture/index.md) → [`rules/architecture/layering-and-contracts.md`](./rules/architecture/layering-and-contracts.md) |
| 写前端公用组件，或判断新组件是否应入库 | [`frontend/src/components/common/README.md`](./frontend/src/components/common/README.md) → [`rules/frontend/react-ui.md`](./rules/frontend/react-ui.md) |
| 写后端公用组件，或判断通用能力是否应入库 | [`backend/src/components/common/README.md`](./backend/src/components/common/README.md) → [`rules/backend/architecture.md`](./rules/backend/architecture.md) |
| 编写 TypeScript Route/Handler、Use Case、Domain Service、Repository 或 Worker | [`rules/backend/index.md`](./rules/backend/index.md) |
| 设计 HTTP API、DTO、错误码、分页、幂等或外部服务适配 | [`rules/backend/api-and-service.md`](./rules/backend/api-and-service.md) |
| 新增 React 19 页面、组件、路由、表单、音频或交互状态 | [`rules/frontend/index.md`](./rules/frontend/index.md) → [`rules/frontend/react-ui.md`](./rules/frontend/react-ui.md) |
| 前端接入 API、管理服务端缓存、处理请求竞态或乐观更新 | [`rules/frontend/data-access-and-state.md`](./rules/frontend/data-access-and-state.md) |
| 设计 PostgreSQL 18 表、列、关系、约束、索引、查询、事务或锁 | [`rules/data/index.md`](./rules/data/index.md) → [`rules/data/postgresql-18.md`](./rules/data/postgresql-18.md) |
| 新增或修改数据库 Migration、种子、历史数据前滚或兼容策略 | [`rules/data/migrations-and-compatibility.md`](./rules/data/migrations-and-compatibility.md) |
| 修改前后端共享字段、领域数据、序列化或时间/金额语义 | [`rules/data/contracts-and-ownership.md`](./rules/data/contracts-and-ownership.md) |
| 接入模型、设计提示词、处理流式/结构化输出或模型密钥 | [`rules/ai/index.md`](./rules/ai/index.md) → [`rules/ai/model-integration.md`](./rules/ai/model-integration.md) |
| 生成专辑资料、推荐、标签、摘要或歌词相关内容 | [`rules/ai/content-and-provenance.md`](./rules/ai/content-and-provenance.md) |
| 新增鉴权、会话、权限、CORS、限流、日志或错误脱敏 | [`rules/security/index.md`](./rules/security/index.md) |
| 选择本项目的前端、后端、数据库或 AI 验证范围 | [`rules/project/verification.md`](./rules/project/verification.md) |

## 高频项目提醒

- 浏览器端环境变量均视为公开信息；数据库连接串、模型密钥、签名密钥和服务凭据只能由后端运行环境读取。
- 接口统一使用具名、强类型 DTO 和运行时 schema；数据库、外部 API 与模型响应都必须先校验再转换，禁止任意 JSON 穿透前后端边界。
- PostgreSQL 结构变化只通过新的前滚 Migration 交付，不修改已执行的迁移历史；唯一性、外键、检查约束和关键并发不变量必须由数据库兜底。
- 多个必须同时成功的业务写入放在同一事务中；调用外部服务不占用长事务，跨系统一致性使用幂等任务或 Outbox 类机制。
- React 组件不直接调用数据库或模型供应商 SDK；页面通过统一 API client/feature service 调用后端，并显式呈现加载、空、错误、禁用、成功和待确认状态。
- AI 输出默认是不可信候选。写入前执行 schema 校验、来源记录、字段白名单和权限检查；模型不得决定鉴权结果或直接执行删除、付款、发布等副作用。

## 目录速览

```text
rules/
├── index.md
├── architecture/
│   ├── index.md
│   └── layering-and-contracts.md
├── ai/
│   ├── index.md
│   ├── model-integration.md
│   └── content-and-provenance.md
├── data/
│   ├── index.md
│   ├── contracts-and-ownership.md
│   ├── local-state-and-contracts.md
│   ├── migrations-and-compatibility.md
│   └── postgresql-18.md
├── frontend/
│   ├── index.md
│   ├── data-access-and-state.md
│   └── react-ui.md
├── backend/
│   ├── index.md
│   ├── api-and-service.md
│   └── architecture.md
├── security/
│   ├── index.md
│   └── auth-and-runtime.md
└── project/
    └── verification.md
```

各目录的 `index.md` 继续按真实开发动作路由到叶子规则；叶子文件是实施依据，索引页不重复正文。

公用组件固定入口：前端为 [`frontend/src/components/common/`](./frontend/src/components/common/)，后端为 [`backend/src/components/common/`](./backend/src/components/common/)。
# 当前仓库运行与跨端约束

### Vinyl Music Codex 开发入口

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
