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
