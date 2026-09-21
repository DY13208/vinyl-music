# Vinyl Music 自建认证最小实施计划（含改密与找回）

日期：2026-09-21
状态：仅计划，尚未修改业务代码。
依据：当前仓库源码、`docs/design` 登录设计、聊天中的收缩意见，以及用户本轮新增的改密/找回需求。
执行入口：[BC 锚点任务](../task/2026-09-21-auth-anchor-tasks.md)。本计划替代此前四接口版本；旧设计中的“首版不做找回密码”不再适用。

## 1. 目标与边界

当前源码是 Supabase 邮箱认证；本计划按 `docs/design` 改为自建账号认证，并彻底移除 Supabase Auth 特有流程。

本次只完成：

1. 注册。
2. 登录。
3. 会话恢复。
4. 当前会话登出。
5. 已登录用户修改密码。
6. 未登录用户通过邮箱找回密码。
7. 前端认证状态接入。
8. Supabase Auth 清理。

保留现有 React 组织结构、登录页布局和账户本地存储隔离，不重写音乐业务。

## 2. 需要替换与可以复用的部分

### 必须替换

- `src/server/auth.ts` 中的 Supabase 请求、加密 access/refresh token Cookie、邮箱验证和 recovery 分支。
- `api/auth.ts` 与开发服务器中的旧 `/api/auth?action=...` 协议。
- `src/platform/auth/WebAuthAdapter.ts` 中的 Supabase action 调用、邮件链接消费和 recovery 类型。
- `LoginView` 中的 Supabase 邮箱登录、确认邮件和旧找回协议；通用输入框和找回表单可复用。
- Supabase 环境变量、认证文档和相关测试 fixture。

### 继续复用

- `AuthContext` 的 React 上下文组织方式。
- `AuthGate` 的应用门禁结构。
- `LoginView` 的现有布局、样式、移动端交互和可访问性结构。
- `accountScope` 的本地账户隔离。
- 不依赖 Supabase 的 `BroadcastChannel` 多标签页退出通知。

不建设通用认证框架、请求取消中心、认证代次、全局限流器或全站路由系统。

## 3. 最小后端设计

### PostgreSQL

新增一条前滚 Migration，最小表结构为：

```text
users
- id UUID PRIMARY KEY
- username
- email
- display_name
- status
- session_version
- created_at
- updated_at

user_credentials
- user_id UUID PRIMARY KEY REFERENCES users(id)
- password_hash
- created_at
- updated_at

password_reset_tokens
- id UUID PRIMARY KEY
- user_id UUID REFERENCES users(id)
- token_hash
- expires_at
- used_at
- created_at
```

规则：

- username 先 trim，再规范化为小写。
- email 同样规范化并建立唯一约束；注册同时要求 username、email、displayName 和 password。本期不提供邮箱修改，找回只发送到注册邮箱。
- username 规范化后为 3–32 位字母/数字/下划线；displayName 为 2–40 字符；注册与新密码为 12–128 字符，密码不 trim、不截断。
- 重复 username/email 直接依赖数据库唯一约束返回对应错误，不采用先查再插入。
- 注册写入 `users` 和 `user_credentials` 使用同一个事务。
- `status` 只使用默认 `active`，本次不建设账户锁定状态机。
- 密码使用 Argon2id；密码原文不写日志、不进入响应 DTO。
- `session_version` 用于改密和找回密码后使所有旧 Session 失效；本次不建设设备管理或单设备列表。
- 找回令牌使用 256 位随机值，只保存 SHA-256 摘要，15 分钟过期且只能使用一次；`user_id` 和 `token_hash` 分别唯一，每个用户至多保留一条找回记录，新申请替换旧令牌。
- 改密或找回密码时，密码 hash 在事务外计算；密码更新、`session_version + 1` 和所有尚可用找回令牌失效在同一事务内完成。
- 改密提交时再次比对之前验证的密码 hash；若期间已被其他请求修改，拒绝本次写入。找回确认通过带“未使用且未过期”条件的更新消费令牌，同一事务内更新密码；并发重复确认只能一个成功，不新增版本控制框架。

### Redis Session

```text
key: auth:session:<sha256(sid)>

value:
- userId
- csrfToken
- sessionVersion
- absoluteExpiresAt
```

规则：

- Cookie 保存 256 位随机 `sid`；Redis key 使用其摘要，value 不含原始 sid。
- 空闲过期 24 小时、绝对过期 7 天；Redis TTL 按两者较短者续期，只延长现存 key，不能把已登出的 Session 重新写回。
- `resolveSession()` 读取用户当前 `session_version`，不一致时拒绝旧 Session；有效时检查绝对过期、刷新 TTL，并返回用户和 CSRF token。
- 不保存 IP、User-Agent、设备、审计记录或 `lastActiveAt`。
- 登出只删除当前 Redis Session。
- 生产 Cookie 为 `__Host-vinyl_session; HttpOnly; Secure; SameSite=Lax; Path=/`，无 Domain；本地 HTTP 使用 `vinyl_session`。Cookie 最晚在绝对期限到期，实际授权始终以 Redis/PG 校验为准。

### HTTP 接口

统一前缀为 `/api/v1/auth`：

| 方法 | 路径 | JSON 输入 | 成功结果 |
| --- | --- | --- | --- |
| POST | `/register` | `{username,email,displayName,password}` | `201 User`，不创建会话 |
| POST | `/login` | `{username,password}` | `200 Session` + Set-Cookie |
| GET | `/session` | 无 | `200 Session`；无会话返回 `401` |
| POST | `/logout` | 无 | `204`，删除当前 Session 并过期 Cookie |
| PUT | `/password` | `{currentPassword,newPassword}` | `204`，修改密码、使旧 Session 失效并过期当前 Cookie |
| POST | `/password/recovery/request` | `{email}` | `202 {message}`，邮箱存在与否均返回相同提示 |
| POST | `/password/recovery/confirm` | `{token,newPassword}` | `204`，消费令牌、修改密码、使旧 Session 失效并过期当前 Cookie |

`User = {id,username,displayName}`；`Session = {user,csrfToken,expiresAt}`，expiresAt 为本次有效期的 UTC ISO 字符串。确认密码只在前端比较，不重复传给服务端；前端正确处理无 body 的 204。

错误响应为 `{error:{code,message}}`：400 对应 `INVALID_INPUT` / `INVALID_RESET_TOKEN`；401 对应 `INVALID_CREDENTIALS` / `SESSION_REQUIRED`；403 对应 `ORIGIN_NOT_ALLOWED` / `CSRF_INVALID`；409 对应 `USERNAME_TAKEN` / `EMAIL_TAKEN`；503 对应 `SERVICE_UNAVAILABLE`。

- 所有 POST/PUT 校验允许的 Origin；认证响应使用 `Cache-Control: no-store`。
- 登出和改密校验 Origin 和内存中的 `X-CSRF-Token`。
- 找回密码请求对格式合法的邮箱返回同一 `202` 和“如果该邮箱已注册，将收到重置邮件”；状态码和正文不暴露邮箱存在性，不宣称同步 SMTP 的耗时完全一致。
- 找回密码确认只接受未过期、未使用的令牌；成功后立即消费令牌。
- Cookie 由服务端通过 `Set-Cookie` 设置和清除。
- 前端不读取或写入 HttpOnly Cookie；CSRF 和找回 token 仅暂存在内存，不持久化。
- 已有全局 request id 或限流能力时只复用；本次不新建这些基础设施。

### 改密与找回密码流程

- 改密：已登录用户输入当前密码和新密码 → 验证当前密码 → 事务更新凭据/会话版本并使旧找回链接失效 → 清 Cookie，返回登录。失败保持表单，不清 Session。
- 找回：输入注册邮箱 → 生成并存储 token 摘要 → 事务提交后同步 SMTP 发送链接 → 用户设置新密码 → 事务消费 token 并更新密码/会话版本 → 返回登录，不自动创建会话。
- 链接固定为配置的站点 origin 加 `/#reset-password=<token>`，不使用请求 Host 构造。打开链接和邮件扫描不消费 token，只有 POST 确认修改时才消费。
- 无效、过期、已使用或被新申请替换的链接统一提示“链接已失效，请重新申请”，不改变密码。改密和找回成功使所有旧会话在下次校验时失效，不做设备列表、会话扫描或推送下线。

邮件只用一个 `PasswordRecoveryMailer` 端口和 SMTP 实现；10 秒内完成发送或返回失败，不占数据库事务、不自动重试。SMTP 配置整体缺失时对所有找回请求返回 503；个别邮件发送失败仍返回统一 202，服务端仅记录脱敏错误，不记录链接/token。202 不等于投递成功，页面提供再次申请入口。

新增服务端配置为 `DATABASE_URL`、`REDIS_URL`、`AUTH_ORIGIN`、`SMTP_HOST`、`SMTP_PORT`、`SMTP_SECURE`、`SMTP_USER`、`SMTP_PASSWORD`、`SMTP_FROM`，只放服务端环境；邮件凭据由实施时配置。测试使用内存 fake 捕获邮件，不新增队列、Worker 或邮件重试系统。

依赖限于 PostgreSQL 客户端、Redis 客户端、Argon2id 和成熟 SMTP 客户端。认证路由继续由现有 server/Functions 入口挂载，hash、数据库事务、Session 和邮件按职责放入小模块，不全塞入 Handler，也不迁移整个工程。

## 4. 最小前端接入

### 认证状态

前端只维护四种状态：

```text
loading
authenticated
anonymous
error
```

- `GET /api/v1/auth/session` 返回 `200` → `authenticated`。
- 返回 `401` → `anonymous`。
- 网络错误或 `5xx` → `error`，显示重试入口，不伪装成匿名。
- 成功登录后将 Session DTO 中的 CSRF token 只保存在内存。

`WebAuthAdapter` 只负责同源 fetch、`credentials: include`、请求体、Session DTO 和错误解析；不负责处理 HttpOnly Cookie。

### 登录页面与退出

- 保留现有登录页视觉和布局。
- 登录字段改为 username/password。
- 注册增加 username、email、displayName、password、确认密码。
- 保留“忘记密码”入口：先提交邮箱，再通过邮件中的一次性链接进入设置新密码页面。
- 已登录用户在设置页提交当前密码、新密码和确认密码；成功后清除当前 Session，返回登录页。
- 找回链接由 Web adapter 在 Session 恢复前读取并立即从地址栏移除；无论是否已登录都先展示重置表单，不允许按当前登录用户替代 token 绑定的用户。刷新导致 token 丢失时提示重新打开邮件链接。
- 本次不建设邮箱注册确认；邮箱是用户填写的找回地址，不标记为“已验证”，使用邮件链接才能证明持有邮箱。此项不包含修改邮箱功能。
- 改密/找回成功复用退出通知并整页回到登录入口，确保旧账号页面和播放卸载；普通接口 5xx 不主动清除现有登录状态。
- 登出成功后清除内存认证状态、触发已有跨标签页通知并刷新页面；不新增请求取消中心或私有草稿清理逻辑。
- 账户本地馆藏保持原有账户隔离；本次不自动迁移或删除旧本地数据。

## 5. 文件级实施步骤与验证

### 步骤一：数据库与依赖

修改/新增：数据库 Migration、认证运行配置、最小迁移命令、Argon2/Redis/SMTP 依赖和邮件配置。

验证：PG18 空库执行成功；重复 username/email 被唯一约束拒绝；用户、凭据和找回令牌约束有效；注册和改密事务可提交或回滚。

### 步骤二：后端 Auth Handler

替换 `src/server/auth.ts`，新增 `/api/v1/auth` 入口并更新 `server.ts` 开发挂载。保留现有 Handler 入口形式，避免建设额外框架。

验证：认证集成测试覆盖注册、重复注册、错误登录、成功登录、会话恢复、改密、找回请求反枚举、无效/过期/重复令牌、Origin/CSRF 拒绝、登出后旧 Session 失效，以及 Cookie 不包含密码或 token。

### 步骤三：前端认证接入

更新 `src/platform/auth/WebAuthAdapter.ts`、`src/auth/AuthContext.tsx`、`src/auth/AuthGate.tsx`、`src/auth/LoginView.tsx`，在 `SettingsView` 接入改密表单，并把资料页的 email 展示改为 username。复用已有 CSS、表单和页面结构。

验证：前端状态四态转换正确；刷新可恢复登录；服务不可用显示错误和重试；改密后回到登录页；找回链接可设置新密码；登出回到匿名页面；多标签页仍能响应已有退出通知。

### 步骤四：清理旧认证

移除旧 `/api/auth?action=...` 路由、Supabase 配置读取及旧邮箱链接协议；替换旧 recovery 测试为自建找回测试。原有文档改写，保留可用表单而非删除所有 recovery 代码。旧会话不再兼容，现有 Supabase 账户需要重新注册。

验证：活动认证代码和接入说明不再依赖 Supabase Auth；认证请求只使用 `/api/v1/auth/*`。同步旧 OpenAPI 中的注册 email、改密和找回契约；历史对比说明及非认证请求不以“零字符串命中”验收。

### 步骤五：最小端到端验收

保留两个主流程：注册 → 登录 → 刷新恢复 → 改密 → 重新登录 → 登出；找回请求 → fake 邮件链接 → 设置新密码 → 重新登录。失效、并发重复 token、错误密码等分支由 HTTP/PG 测试覆盖，不复制为大量 E2E。

验证命令：

```sh
npm run lint
npm test
npm run build
npm run test:e2e -- tests/e2e/auth.spec.ts
```

`tests/e2e/auth.spec.ts` 是本次需新增的专用文件；复用现有 Playwright 配置，不安装另一套浏览器框架。PG18/Redis7 使用隔离测试实例；SMTP fake 只证明调用链，真实邮件是否收件单列验证，不能写成已投递。

## 6. 明确不做

- 旧本地馆藏预览、导入、合并或删除。
- Supabase 账户/密码迁移或双认证兼容层。
- 邮箱注册确认、修改邮箱、MFA、OAuth、设备管理和独立的全设备退出入口；改密/找回后的旧会话失效属于本次范围。
- 新建登录限流、request id、审计、监控、重试、熔断和降级框架。
- `returnTo` 跳转协议、全站 React Router、TanStack Query 和认证代次。
- RabbitMQ、认证后台 Worker、生产部署和云服务开通。

## 7. 完成标准与风险

完成标准：七个认证接口按契约工作；密码只保存为 Argon2id hash；改密和找回密码会增加 `session_version` 并使旧 Session 失效；找回令牌单次消费且请求接口不泄露账号存在性；Cookie 为 HttpOnly opaque sid；刷新可恢复；登出回到匿名；前端和测试不再依赖 Supabase。

兼容边界：本轮选择不导入旧 Supabase 账户及密码数据，旧用户需重新注册；旧本地馆藏保留但不自动绑定新账号。SMTP 未配置时找回不可用；真实邮件投递依赖实际凭据和收件验证。以上属于明确交付边界，不表述为已经完成迁移或真实投递。
