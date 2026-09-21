# Vinyl Music 自建认证 BC 锚点任务

日期：2026-09-21
状态：**BC-AUTH-00 已完成，其余待实现**。
主计划：[自建认证最小实施计划（含改密与找回）](../plan/2026-09-21-login-logout-minimal-plan.md)

## 1. 任务范围

本文件把主计划拆成可独立验收的 BC 锚点，范围包括：

- 注册、登录、会话恢复、当前会话登出。
- 已登录用户修改密码。
- 未登录用户通过邮箱找回密码。
- React 前端认证状态和表单接入。
- Supabase Auth 旧协议和配置清理。

不包含收藏、目录、播放器、MQ、OAuth、MFA、设备管理、邮箱注册确认、账号迁移或生产部署。

以主计划当前版本为准：本轮用户已追加改密和邮箱找回，旧文档的“首版不做找回”不再适用。这里的 BC 是认证实施分区，不新建服务或要求并行代理。

## 2. 当前事实与状态

| 状态 | 事实 |
| --- | --- |
| 已实现 | 当前源码仍是 Supabase 邮箱认证、加密 access/refresh token Cookie、邮箱链接和 recovery 流程。 |
| 已验证 | 当前仓库既有认证单测、类型检查和构建曾有通过记录；本任务文档不把历史结果当作新实现证据。 |
| 仅设计 | 自建 username/email、Argon2id、PostgreSQL、Redis opaque session、CSRF、SMTP recovery。 |
| 待实现 | BC-AUTH-01 至 BC-AUTH-05。 |

## 3. 依赖顺序

```text
BC-AUTH-00 → BC-AUTH-01 → BC-AUTH-02 → BC-AUTH-03 → BC-AUTH-04 → BC-AUTH-05
```

| 锚点 | 分区 | 主计划参考 | 状态 |
| --- | --- | --- | --- |
| [BC-AUTH-00](#bc-auth-00) | 范围与基线 | [目标与边界](../plan/2026-09-21-login-logout-minimal-plan.md#1-目标与边界) | DONE / PASS / MET |
| [BC-AUTH-01](#bc-auth-01) | 数据与依赖 | [PostgreSQL](../plan/2026-09-21-login-logout-minimal-plan.md#postgresql) | DONE / FAIL / NOT_MET |
| [BC-AUTH-02](#bc-auth-02) | 会话、改密与邮件找回 API | [后端设计](../plan/2026-09-21-login-logout-minimal-plan.md#3-最小后端设计) | DONE / FAIL / NOT_MET |
| [BC-AUTH-03](#bc-auth-03) | 前端认证表单 | [前端接入](../plan/2026-09-21-login-logout-minimal-plan.md#4-最小前端接入) | DONE / PASS / MET |
| [BC-AUTH-04](#bc-auth-04) | 旧认证清理 | [实施步骤](../plan/2026-09-21-login-logout-minimal-plan.md#5-文件级实施步骤与验证) | TODO / NOT_RUN / NOT_MET |
| [BC-AUTH-05](#bc-auth-05) | 闭环验收 | [完成标准](../plan/2026-09-21-login-logout-minimal-plan.md#7-完成标准与风险) | TODO / NOT_RUN / NOT_MET |

共 6 个锚点，已达标 1；实现/验证/验收分别记录为 TODO 或 DONE、NOT_RUN 或 PASS/FAIL、NOT_MET 或 MET。正文状态、总表和末尾证据记录一起更新。

- 每个 BC 完成后记录文件、命令、退出码、实际结果、遗留限制和更新时间。
- 未达到验收标准时保持 `NOT_MET`，不得只因代码已写入就改为完成。
- 不为本任务创建双认证兼容层；旧 Supabase 会话在切换后失效。
- 新代码文件不超过 550 行；只按 hash、PG、Session、邮件和 HTTP 的实际职责拆分，不引入空层级。

<a id="bc-auth-00"></a>
## BC-AUTH-00：认证范围与基线锚点

**依赖**：无
**状态**：`DONE / PASS / MET`

### 目标

锁定本轮认证契约和可复用边界，避免实现阶段重新扩展范围。

### 工作内容

- 对照主计划核对现有入口：`src/server/auth.ts`、`api/auth.ts`、`server.ts`、`src/platform/auth/WebAuthAdapter.ts`、`src/auth/*`。
- 保留 `AuthContext`、`AuthGate`、登录页布局、账户本地隔离和非 Supabase 的跨标签页通知。
- 明确旧 `/api/auth?action=...`、邮箱链接和 recovery action 将被替换。
- 新功能的请求字段、错误码、会话时限及链接格式直接按主计划；不沿用旧四接口计划或扩大旧全项目 BC00–BC08。
- 固定七个目标接口：
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `GET /api/v1/auth/session`
  - `POST /api/v1/auth/logout`
  - `PUT /api/v1/auth/password`
  - `POST /api/v1/auth/password/recovery/request`
  - `POST /api/v1/auth/password/recovery/confirm`

### 通过标准

- 认证模块的实现文件、复用文件和明确不做项已列清。
- 没有把本地馆藏迁移、请求取消中心、认证代次、全局限流或全站路由加入后续 BC。

### 验证

```sh
git status --short
npm run lint
npm test
npm run build
```

以上只建立当前基线；不代表自建认证已经实现。

<a id="bc-auth-01"></a>
## BC-AUTH-01：PostgreSQL 账户、凭据与找回令牌模型

**依赖**：BC-AUTH-00
**状态**：`DONE / FAIL / NOT_MET`

### 目标

建立注册、改密和找回密码所需的最小 PG18 数据模型，不创建无调用者的账户体系。

### 产物与边界

- 一条前滚 Migration，包含：
  - `users(id, username, email, display_name, status, session_version, created_at, updated_at)`。
  - `user_credentials(user_id, password_hash, created_at, updated_at)`。
  - `password_reset_tokens(id, user_id, token_hash, expires_at, used_at, created_at)`。
- username、email 规范化后的唯一约束。
- `user_credentials.user_id` 和 `password_reset_tokens.user_id` 外键约束。
- 找回表的 `user_id`、`token_hash` 各自唯一，每个用户至多保留一条找回记录。
- `status` 默认 `active`；不实现锁定状态机。
- 不写 down migration，不增加设备表、审计表或账户迁移表。
- 增加 PostgreSQL、Redis、Argon2id、SMTP 所需的最小依赖和配置校验。

### 关键规则

- username/email 先 trim，再规范化为小写。
- 注册时用户和密码凭据必须在一个事务中提交。
- 重复 username/email 依赖唯一约束处理，不先查再插入。
- 找回 token 只保存 SHA-256 摘要，15 分钟有效、单次消费；新 token 使同一用户旧 token 失效。
- 密码 hash 在事务外计算；改密/找回时，凭据更新、`session_version + 1` 和旧找回令牌失效在一个事务内完成。
- 改密基于原密码 hash 条件更新；找回基于 token 未用且未过期的条件消费。并发提交只能一个成功，失败事务不留下部分修改。

### 通过标准

- PG18 空库前滚成功。
- 重复 username/email 被数据库约束拒绝。
- 注册事务任一步骤失败时不留下半个用户。
- 找回 token 无法从数据库记录还原；过期和已使用 token 不可再次使用。

### 验证

```sh
npm run db:migrate
npm run test:db
```

以上为实施时新增的目标脚本，当前并不存在；`test:db` 用仓库现有 Node test runner 执行 `tests/integration/auth-db.test.ts`。只在隔离 PG18 上验证，不迁移用户已有业务库。

<a id="bc-auth-02"></a>
## BC-AUTH-02：Argon2id、Redis Session 与认证 HTTP 接口

**依赖**：BC-AUTH-01
**状态**：`DONE / FAIL / NOT_MET`

### 目标

完成后端认证闭环，Cookie 只携带随机 opaque `sid`，认证秘密保存在服务端。

### Session 设计

```text
Redis key: auth:session:<sha256(sid)>
value: userId, csrfToken, sessionVersion, absoluteExpiresAt
```

- `sid` 使用 256 位随机值。
- 空闲过期 24 小时、绝对过期 7 天；Redis TTL 取较短值，只续期仍存在的 key，不恢复已删除的 Session。
- `resolveSession()` 读取用户当前 `session_version`；版本不一致则拒绝旧 Session。
- 生产 Cookie 为 `__Host-vinyl_session; HttpOnly; Secure; SameSite=Lax; Path=/`；开发环境使用对应 local 配置。
- 登出删除当前 Session 并过期 Cookie。

### 接口行为

- `register`：校验 username、email、displayName、password，Argon2id hash 后事务写入，成功返回 `201`，不创建会话。
- `login`：验证 username/password，成功创建 Redis Session 并返回用户、CSRF token、过期时间；失败统一 `INVALID_CREDENTIALS`。
- `session`：有效 Session 返回 `200`；无效或无 Session 返回 `401`。
- `logout`：校验 Origin 和 CSRF，删除当前 Session，返回 `204`。
- `password`：校验当前 Session、Origin、CSRF 和当前密码；事务内更新凭据、递增 `session_version`、使旧找回链接失效，当前 Cookie 过期，返回 `204`。
- `recovery/request`：校验 Origin，按 email 查找用户并生成一次性链接；无论用户是否存在都返回相同 `202`，不泄露账号存在性。
- `recovery/confirm`：校验 Origin、token 和新密码；事务内条件消费有效 token、更新密码、递增 `session_version`，清 Cookie 后返回 `204`。只打开链接不消费 token，成功不自动登录。
- SMTP/PG/Redis 故障遵循主计划的错误规则；失败不能伪造密码修改或登出成功，不建设通用重试框架。

### 邮件边界

- 定义 `PasswordRecoveryMailer` 端口和一个 SMTP 实现。
- 邮件只包含固定站点 origin 下的 `/#reset-password=<token>` 链接，不包含密码；所有邮件 I/O 都在数据库事务外。
- 整体 SMTP 未配置统一返回 503；单次发送失败记录脱敏错误，外部仍为统一 202，不宣称投递成功。超时为 10 秒，不自动重试。
- 测试使用内存 fake 捕获链接；不建设邮件队列、Worker、重试框架或邮件供应商抽象层。

### 通过标准

- 七个接口状态码、Cookie 行为和错误码符合主计划。
- Cookie、Redis value、日志和响应中不出现密码原文或 access/refresh token。
- 改密和找回成功后，所有旧 `session_version` 的 Session 均被拒绝。
- 找回请求对存在和不存在邮箱返回相同状态码与正文；不以 fake SMTP 证明真实收信。
- Origin/CSRF 错误在进入数据库写操作前被拒绝。

### 验证

```sh
npm run test:auth
```

该脚本在此 BC 新增，使用现有 Node test runner 执行 `tests/integration/auth-http.test.ts`，连接隔离 PG18/Redis7，注入内存邮件 fake；无依赖时明确失败，不以跳过替代通过。

至少覆盖：七接口成功/失败、空闲/绝对过期、当前登出不影响另一独立会话、错误当前密码不改数据、改密后旧密码/旧 Session/旧找回链接失效、找回 token 过期/重放/并发消费/新链接替换、SMTP 失败提示和 Origin/CSRF 拒绝。

<a id="bc-auth-03"></a>
## BC-AUTH-03：React 登录、注册、改密与找回接入

**依赖**：BC-AUTH-02
**状态**：`DONE / PASS / MET`

### 目标

在不重写现有视觉和应用门禁的前提下，接入七个认证接口。

### 工作内容

- `WebAuthAdapter` 只负责同源 fetch、`credentials: include`、Session DTO、错误解析和内存 CSRF token；不读写 HttpOnly Cookie。
- `AuthContext`/`AuthGate` 使用四态：`loading`、`authenticated`、`anonymous`、`error`。
- `LoginView`：username/password 登录，username/email/displayName 注册，保留现有布局和样式。
- “忘记密码”提交 email，成功后显示统一提示；不显示邮箱是否存在。
- Web adapter 在 Session 恢复前读取找回 token 并清理地址栏，优先展示重置表单，账户以 token 绑定用户为准；成功后不自动登录，刷新丢失 token 提示重新打开邮件。
- 设置页增加最小改密表单：当前密码、新密码、确认密码；成功后回到登录页。
- 登出复用现有跨标签页通知和页面刷新，不新增请求取消中心、认证代次或私有草稿清理。
- 改密/找回成功同样通知并整页返回登录入口；失败保留表单和原 Session。资料页只把登录身份展示从 email 适配为 username，不重写本地个人资料。

### 通过标准

- `200` 会话进入 authenticated；`401` 进入 anonymous；网络错误/5xx 进入 error 并提供重试。
- 刷新页面能恢复登录状态。
- 注册、登录、改密、找回新密码后重新登录均能完成。
- 找回 token 不进入 localStorage、sessionStorage 或 IndexedDB。
- 现有账户本地隔离和登录页主要视觉不被无关改动破坏。

### 验证

```sh
npm run lint
npm test
npm run build
```

浏览器只保留两个主流程：

1. 注册 → 登录 → 刷新恢复 → 改密 → 重新登录 → 登出。
2. 找回请求 → fake 邮件链接 → 设置新密码 → 重新登录。

此 BC 完成前端针对性验证；完整浏览器主流程在 BC-AUTH-05 统一运行，不在每个 BC 重复执行。

<a id="bc-auth-04"></a>
## BC-AUTH-04：Supabase 认证切换与文档清理

**依赖**：BC-AUTH-03
**状态**：`TODO / NOT_RUN / NOT_MET`

### 目标

完成单一认证来源切换，避免旧 Supabase 协议继续被误调用。

### 工作内容

- 停用或删除旧 `/api/auth?action=...` 路由。
- 移除 Supabase 配置读取、旧邮箱确认、旧 recovery action 和 access/refresh token Cookie 逻辑；将旧测试 fixture 与受影响的 E2E 登录 helper 改接新认证，保留无关业务断言。
- 更新 `docs/ACCOUNT_SETUP.md`、`docs/ARCHITECTURE.md`、README 环境变量说明，使自建 PG/Redis/SMTP 配置成为唯一说明。
- 对齐认证 OpenAPI 和 DTO：增加注册 email、两个找回接口及主计划错误结构，删除本次未实现的强制 request id 约束；不启动整套新契约工具工程。
- 不删除与认证无关的收藏、播放器和平台代码。

### 影响确认

- 旧 Supabase Session 不再兼容。
- 本轮不导入旧 Supabase 账户及凭据，旧用户需重新注册。
- 旧本地馆藏不自动迁移、不自动删除。

### 通过标准

- 前端认证请求只调用 `/api/v1/auth/*`，音乐等非认证 API 保持原有范围。
- 活动认证路径和接入说明不再依赖 Supabase Auth；历史说明允许保留对比文字。
- 删除/停用旧路由的影响已记录，未删除无关文件。

### 验证

```sh
rg -n 'SUPABASE|/api/auth\?action=|refresh_token|access_token' \
  src api tests server.ts README.md docs/ACCOUNT_SETUP.md docs/ARCHITECTURE.md
```

逐项判断是否仍是活动认证依赖，不能以所有文件“零字符串命中”为门槛；新找回表的 `token_hash` 是合法字段。只复跑被修改的测试，最终完整检查统一留给 BC-AUTH-05。

<a id="bc-auth-05"></a>
## BC-AUTH-05：认证闭环验收锚点

**依赖**：BC-AUTH-04
**状态**：`TODO / NOT_RUN / NOT_MET`

### 主流程

1. 注册新 username/email。
2. 使用 username/password 登录。
3. 刷新页面并通过 Session 恢复。
4. 修改密码，确认旧 Session 失效并使用新密码登录。
5. 请求找回密码，读取 fake 邮件链接。
6. 使用一次性链接设置新密码，确认旧 Session 失效并重新登录。
7. 登出，确认 Cookie 过期、Redis Session 删除并回到匿名页面。

### 验证命令

```sh
npm run lint
npm run test:db
npm run test:auth
npm test
npm run build
npm run test:e2e -- tests/e2e/auth.spec.ts
```

新增 `tests/e2e/auth.spec.ts`，复用现有 Playwright 配置；将现有认证测试 server 接到自建 PG/Redis 测试环境，邮件仍注入内存 fake。端口与数据库按测试配置隔离，不启动第二套浏览器框架。

### 通过标准

- PG18、Redis7 和邮件 fake 在隔离测试环境可运行。
- 七个接口均有 HTTP 层测试。
- 两条浏览器主流程通过。
- 改密、找回密码、登出后旧 Session 均不能继续使用。
- 没有把静态构建或单元测试表述为生产部署、真实 SMTP 投递或真实云环境验收。
- 实际 SMTP 凭据可用时补一次“发送 → 收信 → 打开链接 → 重置”人工验证；否则该项记为 NOT_RUN，交付明确标记真实邮件未验证，不冒称找回邮件可达。

## 4. 统一禁止扩展项

- 不增加账号迁移、旧本地馆藏导入、双认证兼容或自动数据清理。
- 不增加 MFA、OAuth、设备管理、记住我、独立的全设备登出入口或邮箱注册确认；改密/找回引起旧会话失效仍须实现。
- 不增加全局限流、审计、监控、请求取消中心、认证代次、队列、Worker、重试/熔断框架。
- 不修改与认证无关的页面、目录、收藏、播放器和音乐 Provider。

## 5. 执行回填记录

每个 BC 收尾时回填本表并更新对应状态；文件/命令填写真实路径与实际命令，不填“已测试”代替结果。文档创建不代表 BC-AUTH-00 已达标。

| BC | 实现文件/变更 | 验证命令与退出码 | 结果/证据 | 遗留限制 | 更新时间 |
| --- | --- | --- | --- | --- | --- |
| BC-AUTH-00 | `src/server/auth.ts`、`api/auth.ts`、`server.ts`、`src/platform/auth/WebAuthAdapter.ts`、`src/auth/*`（范围核对）；本任务文档 | `git status --short`（0）、`npm run lint`（0）、`npm test`（0）、`npm run build`（0） | 基线工作区干净；类型检查、现有单测、Vite 构建均通过。仅确认现状，不代表自建认证已实现 | 认证仍为 Supabase；后续 BC 待实现 | 2026-09-21 13:35 UTC |
| BC-AUTH-01 | `migrations/001_auth.sql`、`scripts/db-migrate.mjs`、`scripts/test-db.mjs`、`.env.example`、`package.json`/`package-lock.json` | `git diff --check`（0）；`npm run db:migrate`（1）；`npm run test:db`（1） | Migration、约束和脚本已实现；本机未提供 `DATABASE_URL`，PG18 空库前滚与约束测试按脚本明确失败，不能记为通过 | 需要隔离 PG18 实例后重跑两个 DB 命令 | 2026-09-21 13:55 UTC |
| BC-AUTH-02 | `src/server/auth.ts`、`server.ts`、`tests/integration/auth-http.test.ts`、`package.json`（`test:auth`） | `npm run test:auth`（0）；`npm run lint`（0）；`npm test`（0）；`npm run build`（0） | 新接口、opaque Cookie、CSRF/Origin、session_version、Argon2id/Redis/SMTP 适配和 fake HTTP 测试通过；真实 PG18/Redis7/SMTP 运行环境未提供，未达到集成验收 | 需要隔离 PG18/Redis7 与 SMTP fake/配置重跑 `npm run test:auth` | 2026-09-21 13:58 UTC |
| BC-AUTH-03 | `src/platform/auth/WebAuthAdapter.ts`、`src/auth/AuthContext.tsx`、`src/auth/AuthGate.tsx`、`src/auth/LoginView.tsx`、`src/views/SettingsView.tsx`、`src/views/ProfileView.tsx` | `npm run lint`（0）；`npm test`（0）；`npm run build`（0） | 七接口路径、四态门禁、内存 CSRF/找回 token、注册/登录/改密/找回表单和 username 身份展示已接入；针对性前端静态/构建验证通过 | Playwright 主流程留给 BC-AUTH-05；真实后端依赖未在本 BC 重复验证 | 2026-09-21 14:02 UTC |
| BC-AUTH-04 | 未开始 | NOT_RUN | NOT_MET | 旧认证尚未切换 | — |
| BC-AUTH-05 | 未开始 | NOT_RUN | NOT_MET | HTTP/E2E/真实收信均未验证 | — |
