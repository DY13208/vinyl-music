# Vinyl Music 设计方案

本目录把现有 React demo 收敛为前后端可实施方案。技术约束：React 19、TypeScript 6、PostgreSQL 18、Redis 7、RabbitMQ；后三者使用 Docker 容器。方案交付不等于业务系统已开发或联调通过。

## 按场景阅读

| 你现在要做什么 | 直接看 | 负责内容 |
| --- | --- | --- |
| 了解现在真实实现到哪一步 | [现状与差距](./current-state.md) | 源码、可用入口、模拟数据、当前验证 |
| 决定后端模块、技术选型和依赖方向 | [总体与后端设计](./architecture.md) | TS6 工程、分层、认证、媒体边界 |
| 对齐前后端字段、接口与错误处理 | [接口契约](./api-contract.md) | DTO、端点、并发、幂等与客户端收敛 |
| 创建表、约束、索引和 Migration | [数据设计](./data-model.md) | PG18 模型、所有权、来源与迁移 |
| 配置 Redis、RabbitMQ 与故障恢复 | [缓存与异步任务](./async-and-cache.md) | key、TTL、Outbox、租约、重试、死信 |
| 启动本地基础设施并检查版本 | [Docker 方案](./infrastructure.md) | Compose 样例、端口、数据卷、健康检查 |
| 看延续现有风格的页面与组件设计 | [前端设计入口](./frontend/index.md) | Pen 画板、组件、状态、React 接入 |
| 依次开发并进行真实联调 | [实施与验收](./implementation-plan.md) | 依赖顺序、文件、命令、通过标准 |
| 判断本次方案交付实际验证了什么 | [验证记录](./verification.md) | 当前证据、状态、未覆盖事项 |

## 目录职责与变更范围

- `docs/design/` 已存在且原为空：新增总体、后端、契约、数据、基础设施与实施文档。
- `docs/design/frontend/` 已存在且原为空：新增页面、组件、交互、Pen 设计文件与参考图。
- `docs/design/contracts/`：可校验的 OpenAPI 设计契约及其 schema；未来业务实现必须按此对齐。
- `docs/design/examples/`：开发基础设施的可审查配置样例；不自动启动业务系统或修改现有数据。
- `src/`、根依赖、`rules/`、`backend/` 与 `frontend/` 业务代码保持现状；真正实现路径写在实施计划中。

## 状态口径

| 状态 | 含义 |
| --- | --- |
| 已实现 | 当前仓库已有源码或本次已交付文件 |
| 已验证 | 对应命令或可见结果已有证据，只覆盖实际检查范围 |
| 仅设计 | 本文档定义的目标行为、API 和基础设施方案 |
| 待实现 | 已列入实施步骤，尚无业务代码和联调证据 |

账号已确认采用账号密码登录与Argon2id；音源已确认先预留平台适配接口。具体边界见[总体设计](./architecture.md)和[平台预留接口](./platform-adapters.md)。内容来源与授权不得从demo文案推断。
