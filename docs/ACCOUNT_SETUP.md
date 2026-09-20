# 邮箱账户与本机私人馆藏

## 当前边界

- Supabase Auth 保存邮箱、密码散列、验证状态和账户会话；本站不建用户馆藏表，也不使用 Supabase Storage 存私人图片。
- 浏览器只访问本站 `/api/auth`，后端再访问 Supabase。会话令牌加密后放在 HttpOnly、SameSite=Lax Cookie 中，正式 HTTPS 环境增加 Secure；前端不保存 access/refresh token。
- 登录后才加载馆藏模块。每个账户使用独立 IndexedDB、偏好键和本地音乐库；退出会重新加载页面，并通知其他标签页。此处是应用内账户隔离，不是设备磁盘加密。
- 电脑和手机各自保存馆藏，登录同一账户不会自动同步。清理浏览器站点数据会删除本机内容；可在新增唱片的 JSON 页导出馆藏。
- “我的 → 编辑资料”支持昵称与头像选择、预览、取消、保存及移除头像。资料存入当前账号的本机数据库，图片在设备上压缩，不上传 Supabase；昵称不改变登录邮箱，其他设备不会自动同步。
- 无账户版本的数据仍保留。登录后可在设置中明确选择“将原有本机馆藏归入此账户”。首次归属后，其他账户不能通过该入口读取；原始数据保留作恢复副本。

## 创建 Supabase 项目

1. 打开 https://supabase.com/dashboard ，登录后创建项目。选择实际可访问且靠近主要用户的区域，例如新加坡；区域选择不代表所有大陆运营商均可访问。
2. 在 Authentication 的 Sign In / Providers 中启用 Email，开启邮箱确认。生产环境配置自有 SMTP；默认测试邮件服务有收件人和发送限额，不适合正式用户注册。应实测 QQ、163 等常用邮箱收件。
3. 在 Authentication → URL Configuration 中把 Site URL 设为正式网站的 HTTPS origin（例如 `https://music.example.com`），并配置允许的回调地址。本地开发建议独立开发项目，Site URL 设为 `http://localhost:3000`。
4. 从项目 Connect / API 设置取得 Project URL 和 publishable key（或 legacy anon key）。这里不需要 service_role / secret key。

## 后端环境变量

在本机由你填写 `.env`，并在 Vercel → Project → Settings → Environment Variables 配置相同名称。不要加 `VITE_` 前缀，不要提交密钥。

| 名称 | 内容 |
| --- | --- |
| `SUPABASE_URL` | 项目的 `https://<project>.supabase.co` 地址 |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase 控制台显示的 Publishable key（可发布密钥） |
| `SUPABASE_ANON_KEY` | 旧项目的 legacy anon key；与上面二选一，推荐使用新变量名 |
| `AUTH_SESSION_SECRET` | 随机生成的至少 32 字符秘密，所有实例保持一致 |
| `AUTH_ORIGIN` | 浏览器访问本站的 origin；多个地址用英文逗号分隔，如 `http://localhost:3000,http://192.168.1.100:3000`。生产只填 HTTPS 正式域名 |

可在你自己的终端使用密码管理器或 `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` 生成会话秘密，再填入环境变量。更换此值会让现有 Cookie 失效。不要发送到聊天中。

`AUTH_ORIGIN` 必须和浏览器地址一致。手机通过电脑局域网 IP 调试时，可设为 `http://localhost:3000,http://电脑IP:3000`；正式发布必须使用 HTTPS。本地 `server.ts` 会读取 `.env.local`、`.env.development.local` 和 `.env`，Vercel 直接使用环境变量。保存变量后重启本地 API / 重新部署 Vercel。Vite 前端端口是 3000，API 的 3001 端口只供本机代理使用。

## 邮件模板（必须配置）

本应用使用后端交换 `token_hash`，不把令牌放入浏览器存储。把 Authentication → Email Templates 对应链接改为以下形式：

Confirm signup：

```html
<h2>确认你的 Vinyl Shelf 邮箱</h2>
<p><a href="{{ .SiteURL }}/?auth=confirm&amp;token_hash={{ .TokenHash }}&amp;type=signup">确认邮箱并登录</a></p>
```

Reset password：

```html
<h2>重设 Vinyl Shelf 密码</h2>
<p><a href="{{ .SiteURL }}/?auth=recovery&amp;token_hash={{ .TokenHash }}&amp;type=recovery">设置新密码</a></p>
```

不要继续使用默认隐式令牌跳转模板。本应用收到验证链接后移除地址栏中的 token_hash，再经本站接口完成验证。失效链接会显示错误，可重新注册确认或申请密码重置。Supabase 的密码长度规则至少设置为 10 位，与本应用保持一致；保留服务端邮件与认证限流。

## 公共封面与存储

- 同一已匹配专辑优先选网易云、QQ 音乐等国内 CDN 图片。首次读取经过本站 `/api/artwork`，请求只带公开图片 URL，不带馆藏记录、收藏关系或用户 Cookie。
- 接口只允许明确的图片 CDN 域名，每次重定向重新检查，拒绝私网/任意域名及非图片响应；8 秒上游超时，最多 3 MiB。Vercel 官方当前请求/响应上限为 4.5 MB，本接口保持在其下；图片函数配置 15 秒时限。
- 后端不落盘保存图片，仅返回公开图片并允许 CDN 缓存。客户端压缩至最长边 800 px、单张最多 512 KiB；成功写入后优先读本机。自行上传的图片在浏览器里压缩，不上传任何服务。
- 未收藏的浏览图片采用 32 MiB LRU 上限；收藏封面不自动淘汰，随收藏数量增长。设置显示估算占用和未保存数量，清理只删非收藏图片。
- 配额不足时仍可显示本次下载，但不会假装已经离线保存；设置中的未保存计数用于识别。收藏写入失败会报错且不更新成功状态。
- 国内网络仍需能够访问本站域名。使用 Vercel 默认域名不构成大陆可用性保证；部署后应使用真实大陆手机网络测试域名、API 和图片回源。

## 验收与当前状态

```sh
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

浏览器测试使用独立端口的 **Supabase 协议测试替身**，不连接真实账户服务、不发送邮件、不访问真实用户馆藏。它覆盖登录、错误密码、注册确认、找回密码、退出、多标签页退出、账户隔离、图片来源故障后刷新以及缓存清理。

首次正式接入还需验证：真实邮箱注册 → 收信确认 → 登录 → F5 会话恢复 → 找回密码 → 退出；手机在大陆网络打开公共封面；确认 Vercel `/api/auth` 与 `/api/artwork` 返回 JSON/图片而非 SPA HTML。未创建项目和配置上述变量前，页面会明确显示“账户服务尚未配置”，不会提供模拟登录。

参考：https://supabase.com/docs/guides/auth/auth-email-templates ，https://vercel.com/docs/functions/limitations 。
