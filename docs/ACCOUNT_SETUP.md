# 账户服务配置

Vinyl Shelf 使用自建认证接口，前端只调用 `/api/v1/auth/*`。账户、凭据摘要和密码找回令牌存储在 PostgreSQL；登录会话存储在 Redis；找回邮件通过 SMTP 发送。

## 服务端环境变量

| 变量 | 说明 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 连接串 |
| `REDIS_URL` | Redis 连接串 |
| `AUTH_ORIGIN` | 固定站点 origin，例如 `https://vinyl.example.com` |
| `SMTP_HOST` / `SMTP_PORT` | SMTP 主机和端口 |
| `SMTP_SECURE` | 使用 TLS 时填写 `true` |
| `SMTP_USER` / `SMTP_PASSWORD` | SMTP 凭据，仅服务端读取 |
| `SMTP_FROM` | 发件地址 |

运行 `npm run db:migrate` 应用 `migrations/001_auth.sql`。密码只以 Argon2id 摘要保存；Cookie 只包含随机 opaque session id。找回链接固定为 `AUTH_ORIGIN/#reset-password=<token>`，服务端只保存 token 的 SHA-256 摘要。

前端环境变量不能保存数据库、Redis、SMTP 或密码密钥。旧 Supabase Auth 会话不再兼容，旧账户需要重新注册；本地馆藏仍只保存在设备上。
